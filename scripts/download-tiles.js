#!/usr/bin/env node

/**
 * 🗺️ OpenStreetMap Tile Downloader
 * 
 * Pre-download map tiles for offline use and faster loading
 * Usage: node scripts/download-tiles.js [region] [options]
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { promisify } = require('util');

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, '..', 'public', 'tiles'),
  tileServers: [
    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ],
  maxConcurrent: 5,
  delayBetweenRequests: 200, // ms
  userAgent: 'Trip-Tactician-Pro/2.1.0 (Tile Downloader)',
  maxRetries: 3
};

// Predefined regions
const REGIONS = {
  world: {
    name: 'World Overview',
    bounds: { north: 85, south: -85, east: 180, west: -180 },
    minZoom: 0,
    maxZoom: 6,
    description: 'Basic world map for overview'
  },
  europe: {
    name: 'Europe',
    bounds: { north: 71, south: 35, east: 40, west: -10 },
    minZoom: 4,
    maxZoom: 12,
    description: 'Complete European region'
  },
  usa: {
    name: 'United States',
    bounds: { north: 49, south: 25, east: -67, west: -125 },
    minZoom: 4,
    maxZoom: 12,
    description: 'Continental United States'
  },
  asia: {
    name: 'Asia',
    bounds: { north: 55, south: -10, east: 150, west: 60 },
    minZoom: 4,
    maxZoom: 10,
    description: 'Asian continent'
  },
  mediterranean: {
    name: 'Mediterranean',
    bounds: { north: 46, south: 30, east: 36, west: -6 },
    minZoom: 6,
    maxZoom: 14,
    description: 'Mediterranean region'
  },
  // City-specific regions
  paris: {
    name: 'Paris, France',
    bounds: { north: 48.9, south: 48.8, east: 2.4, west: 2.2 },
    minZoom: 10,
    maxZoom: 18,
    description: 'Paris metropolitan area'
  },
  london: {
    name: 'London, UK',
    bounds: { north: 51.7, south: 51.3, east: 0.3, west: -0.5 },
    minZoom: 10,
    maxZoom: 18,
    description: 'Greater London area'
  },
  newyork: {
    name: 'New York, USA',
    bounds: { north: 40.9, south: 40.5, east: -73.7, west: -74.3 },
    minZoom: 10,
    maxZoom: 18,
    description: 'New York metropolitan area'
  },
  tokyo: {
    name: 'Tokyo, Japan',
    bounds: { north: 35.8, south: 35.5, east: 139.9, west: 139.3 },
    minZoom: 10,
    maxZoom: 18,
    description: 'Tokyo metropolitan area'
  },
  rome: {
    name: 'Rome, Italy',
    bounds: { north: 41.97, south: 41.83, east: 12.56, west: 12.43 },
    minZoom: 10,
    maxZoom: 18,
    description: 'Rome city center'
  }
};

class TileDownloader {
  constructor() {
    this.stats = {
      downloaded: 0,
      failed: 0,
      skipped: 0,
      totalSize: 0,
      startTime: Date.now(),
      errors: []
    };
    this.activeDownloads = 0;
  }

  // Coordinate conversion utilities
  lon2tile(lon, zoom) {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  lat2tile(lat, zoom) {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }

  // Calculate tile bounds for a region
  getTileBounds(bounds, zoom) {
    const { north, south, east, west } = bounds;
    
    const minX = this.lon2tile(west, zoom);
    const maxX = this.lon2tile(east, zoom);
    const minY = this.lat2tile(north, zoom);
    const maxY = this.lat2tile(south, zoom);
    
    return { minX, maxX, minY, maxY };
  }

  // Calculate total number of tiles
  calculateTileCount(bounds, minZoom, maxZoom) {
    let total = 0;
    for (let z = minZoom; z <= maxZoom; z++) {
      const tileBounds = this.getTileBounds(bounds, z);
      const width = tileBounds.maxX - tileBounds.minX + 1;
      const height = tileBounds.maxY - tileBounds.minY + 1;
      total += width * height;
    }
    return total;
  }

  // Get tile file path
  getTilePath(z, x, y) {
    return path.join(CONFIG.outputDir, z.toString(), x.toString(), `${y}.png`);
  }

  // Download single tile
  async downloadTile(z, x, y, serverIndex = 0) {
    const tilePath = this.getTilePath(z, x, y);
    
    // Check if tile already exists
    try {
      await fs.access(tilePath);
      this.stats.skipped++;
      return true; // Already exists
    } catch {
      // File doesn't exist, continue with download
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(tilePath), { recursive: true });

    const url = CONFIG.tileServers[serverIndex % CONFIG.tileServers.length]
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);

    let retries = 0;
    while (retries < CONFIG.maxRetries) {
      try {
        await this.downloadFile(url, tilePath);
        this.stats.downloaded++;
        return true;
      } catch (error) {
        retries++;
        if (retries >= CONFIG.maxRetries) {
          this.stats.failed++;
          this.stats.errors.push({
            tile: `${z}/${x}/${y}`,
            error: error.message,
            url
          });
          console.error(`❌ Failed to download ${z}/${x}/${y}: ${error.message}`);
          return false;
        }
        
        // Try next server
        serverIndex = (serverIndex + 1) % CONFIG.tileServers.length;
        await this.sleep(CONFIG.delayBetweenRequests * retries);
      }
    }
    return false;
  }

  // Download file with proper headers
  downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': CONFIG.userAgent,
          'Accept': 'image/png,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = require('fs').createWriteStream(filePath);
        let totalSize = 0;

        response.on('data', (chunk) => {
          totalSize += chunk.length;
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          this.stats.totalSize += totalSize;
          resolve();
        });

        fileStream.on('error', (err) => {
          require('fs').unlink(filePath, () => {}); // Delete partial file
          reject(err);
        });
      });

      request.on('error', (err) => {
        reject(err);
      });

      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Download region with concurrency control
  async downloadRegion(regionConfig) {
    const { name, bounds, minZoom, maxZoom } = regionConfig;
    
    console.log(`\n🌍 Starting download: ${name}`);
    console.log(`📍 Bounds: N${bounds.north}° S${bounds.south}° E${bounds.east}° W${bounds.west}°`);
    console.log(`🔍 Zoom levels: ${minZoom} - ${maxZoom}`);
    
    const totalTiles = this.calculateTileCount(bounds, minZoom, maxZoom);
    console.log(`📊 Estimated tiles: ${totalTiles.toLocaleString()}`);
    
    if (totalTiles > 100000) {
      console.warn(`⚠️  Large download detected (${totalTiles.toLocaleString()} tiles)`);
      console.warn(`   This may take several hours and use significant bandwidth.`);
    }

    this.stats.startTime = Date.now();
    let processedTiles = 0;
    const downloadPromises = [];

    for (let z = minZoom; z <= maxZoom; z++) {
      const tileBounds = this.getTileBounds(bounds, z);
      
      console.log(`📥 Zoom ${z}: ${tileBounds.maxX - tileBounds.minX + 1} × ${tileBounds.maxY - tileBounds.minY + 1} tiles`);
      
      for (let x = tileBounds.minX; x <= tileBounds.maxX; x++) {
        for (let y = tileBounds.minY; y <= tileBounds.maxY; y++) {
          // Control concurrency
          while (this.activeDownloads >= CONFIG.maxConcurrent) {
            await this.sleep(10);
          }

          this.activeDownloads++;
          
          const downloadPromise = this.downloadTile(z, x, y)
            .finally(() => {
              this.activeDownloads--;
              processedTiles++;
              
              // Progress update
              if (processedTiles % 100 === 0) {
                const progress = ((processedTiles / totalTiles) * 100).toFixed(1);
                const sizeMB = (this.stats.totalSize / 1024 / 1024).toFixed(1);
                console.log(`📈 Progress: ${progress}% (${processedTiles}/${totalTiles}) - ${sizeMB}MB downloaded`);
              }
            });
          
          downloadPromises.push(downloadPromise);
          
          // Rate limiting
          await this.sleep(CONFIG.delayBetweenRequests / CONFIG.maxConcurrent);
        }
      }
    }

    // Wait for all downloads to complete
    console.log('⏳ Waiting for all downloads to complete...');
    await Promise.all(downloadPromises);
    
    this.printStats(regionConfig);
    await this.createTileMetadata(regionConfig);
  }

  // Print download statistics
  printStats(regionConfig) {
    const duration = Date.now() - this.stats.startTime;
    const durationMins = (duration / 1000 / 60).toFixed(1);
    const sizeMB = (this.stats.totalSize / 1024 / 1024).toFixed(2);
    const rate = this.stats.downloaded / (duration / 1000);
    
    console.log(`\n📊 Download Complete: ${regionConfig.name}`);
    console.log(`   ✅ Downloaded: ${this.stats.downloaded.toLocaleString()}`);
    console.log(`   ⏭️  Skipped: ${this.stats.skipped.toLocaleString()}`);
    console.log(`   ❌ Failed: ${this.stats.failed.toLocaleString()}`);
    console.log(`   📦 Total size: ${sizeMB}MB`);
    console.log(`   ⏱️  Duration: ${durationMins} minutes`);
    console.log(`   🚀 Rate: ${rate.toFixed(1)} tiles/second`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`   ${err.tile}: ${err.error}`);
      });
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }

  // Create metadata file for downloaded tiles
  async createTileMetadata(regionConfig) {
    const metadata = {
      region: regionConfig.name,
      bounds: regionConfig.bounds,
      minZoom: regionConfig.minZoom,
      maxZoom: regionConfig.maxZoom,
      downloadDate: new Date().toISOString(),
      stats: {
        downloaded: this.stats.downloaded,
        skipped: this.stats.skipped,
        failed: this.stats.failed,
        totalSizeMB: (this.stats.totalSize / 1024 / 1024).toFixed(2),
        durationMinutes: ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1)
      },
      tileServers: CONFIG.tileServers,
      version: '1.0'
    };

    const metadataPath = path.join(CONFIG.outputDir, `${regionConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`💾 Metadata saved: ${metadataPath}`);
  }

  // List available regions
  static listRegions() {
    console.log('\n🌍 Available Regions:');
    console.log('='.repeat(60));
    
    Object.entries(REGIONS).forEach(([key, region]) => {
      const tileCount = new TileDownloader().calculateTileCount(
        region.bounds, 
        region.minZoom, 
        region.maxZoom
      );
      
      console.log(`${key.padEnd(15)} | ${region.name.padEnd(20)} | ${tileCount.toLocaleString().padStart(8)} tiles`);
      console.log(`${' '.repeat(15)} | ${region.description}`);
      console.log(`${' '.repeat(15)} | Zoom: ${region.minZoom}-${region.maxZoom}`);
      console.log('');
    });
    
    console.log('Usage: node scripts/download-tiles.js [region]');
    console.log('Example: node scripts/download-tiles.js paris');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const regionKey = args[0];
  
  if (!regionKey || regionKey === '--help' || regionKey === '-h') {
    TileDownloader.listRegions();
    return;
  }
  
  if (!REGIONS[regionKey]) {
    console.error(`❌ Unknown region: ${regionKey}`);
    TileDownloader.listRegions();
    process.exit(1);
  }
  
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    const downloader = new TileDownloader();
    await downloader.downloadRegion(REGIONS[regionKey]);
    
    console.log('\n🎉 Download completed successfully!');
    console.log(`📁 Tiles saved to: ${CONFIG.outputDir}`);
    console.log('\n💡 To use offline tiles, update your map configuration to use local tiles first.');
    
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏹️  Download interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Download terminated');
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TileDownloader, REGIONS, CONFIG }; 