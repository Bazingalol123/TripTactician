import localforage from 'localforage';

// Tile Cache Configuration
const CACHE_CONFIG = {
  name: 'OSMTileCache',
  version: 1.0,
  description: 'OpenStreetMap Tile Cache',
  maxCacheSize: 500 * 1024 * 1024, // 500MB default
  maxTiles: 10000, // Maximum number of cached tiles
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  tileServers: [
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    'https://tiles.wmflabs.org/osm/{z}/{x}/{y}.png'
  ],
  subdomains: ['a', 'b', 'c']
};

// Initialize IndexedDB storage
const tileStore = localforage.createInstance({
  name: CACHE_CONFIG.name,
  version: CACHE_CONFIG.version,
  description: CACHE_CONFIG.description
});

const metadataStore = localforage.createInstance({
  name: `${CACHE_CONFIG.name}_metadata`,
  version: CACHE_CONFIG.version,
  description: 'Tile cache metadata'
});

class TileCacheManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.downloadQueue = [];
    this.isDownloading = false;
    this.downloadStats = {
      downloaded: 0,
      failed: 0,
      totalSize: 0,
      startTime: null,
      regions: []
    };
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processDownloadQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.init();
  }

  async init() {
    try {
      // Initialize metadata if not exists
      const metadata = await metadataStore.getItem('cache_info');
      if (!metadata) {
        await metadataStore.setItem('cache_info', {
          totalTiles: 0,
          totalSize: 0,
          lastCleanup: Date.now(),
          regions: [],
          created: Date.now()
        });
      }
      
      console.log('🗺️ Tile cache initialized');
    } catch (error) {
      console.error('Failed to initialize tile cache:', error);
    }
  }

  // Generate tile key for storage
  getTileKey(z, x, y) {
    return `tile_${z}_${x}_${y}`;
  }

  // Get tile URL with load balancing
  getTileUrl(z, x, y, serverIndex = 0) {
    const server = CACHE_CONFIG.tileServers[serverIndex % CACHE_CONFIG.tileServers.length];
    const subdomain = CACHE_CONFIG.subdomains[
      (x + y) % CACHE_CONFIG.subdomains.length
    ];
    
    return server
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
      .replace('{s}', subdomain);
  }

  // Check if tile exists in cache
  async hasTile(z, x, y) {
    try {
      const key = this.getTileKey(z, x, y);
      const tile = await tileStore.getItem(key);
      
      if (tile) {
        // Check if tile is expired
        const now = Date.now();
        if (now - tile.timestamp > CACHE_CONFIG.defaultTTL) {
          await this.removeTile(z, x, y);
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking tile cache:', error);
      return false;
    }
  }

  // Get tile from cache
  async getTile(z, x, y) {
    try {
      const key = this.getTileKey(z, x, y);
      const tile = await tileStore.getItem(key);
      
      if (tile) {
        // Update access time for LRU
        tile.lastAccess = Date.now();
        await tileStore.setItem(key, tile);
        
        return `data:image/png;base64,${tile.data}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting tile from cache:', error);
      return null;
    }
  }

  // Download and cache tile
  async downloadTile(z, x, y, serverIndex = 0) {
    try {
      const url = this.getTileUrl(z, x, y, serverIndex);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Trip-Tactician-Pro/2.1.0 (Tile Cache)'
        }
      });

      if (!response.ok) {
        // Try next server if available
        if (serverIndex < CACHE_CONFIG.tileServers.length - 1) {
          return await this.downloadTile(z, x, y, serverIndex + 1);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte), ''
        )
      );

      const tileData = {
        data: base64,
        timestamp: Date.now(),
        lastAccess: Date.now(),
        size: arrayBuffer.byteLength,
        z, x, y
      };

      const key = this.getTileKey(z, x, y);
      await tileStore.setItem(key, tileData);
      
      // Update metadata
      await this.updateMetadata(arrayBuffer.byteLength);
      
      this.downloadStats.downloaded++;
      this.downloadStats.totalSize += arrayBuffer.byteLength;
      
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error(`Failed to download tile ${z}/${x}/${y}:`, error);
      this.downloadStats.failed++;
      throw error;
    }
  }

  // Get tile with caching
  async getTileWithCache(z, x, y) {
    // First try cache
    const cachedTile = await this.getTile(z, x, y);
    if (cachedTile) {
      return cachedTile;
    }

    // If online, download and cache
    if (this.isOnline) {
      try {
        return await this.downloadTile(z, x, y);
      } catch (error) {
        console.warn('Failed to download tile, using fallback');
        return null;
      }
    }

    // Offline and no cache
    return null;
  }

  // Pre-download tiles for a bounding box
  async predownloadRegion(bounds, minZoom = 10, maxZoom = 16, name = 'Region') {
    const { north, south, east, west } = bounds;
    
    console.log(`🚀 Starting pre-download: ${name}`);
    console.log(`📍 Bounds: ${north}, ${south}, ${east}, ${west}`);
    console.log(`🔍 Zoom levels: ${minZoom} - ${maxZoom}`);
    
    this.downloadStats = {
      downloaded: 0,
      failed: 0,
      totalSize: 0,
      startTime: Date.now(),
      currentRegion: name,
      regions: [...this.downloadStats.regions, name]
    };

    const totalTiles = this.calculateTileCount(bounds, minZoom, maxZoom);
    console.log(`📊 Estimated tiles: ${totalTiles.toLocaleString()}`);

    this.isDownloading = true;
    
    try {
      for (let z = minZoom; z <= maxZoom; z++) {
        const tileBounds = this.getTileBounds(bounds, z);
        
        for (let x = tileBounds.minX; x <= tileBounds.maxX; x++) {
          for (let y = tileBounds.minY; y <= tileBounds.maxY; y++) {
            // Check if already cached
            if (await this.hasTile(z, x, y)) {
              continue;
            }
            
            // Add to download queue
            this.downloadQueue.push({ z, x, y, region: name });
          }
        }
      }
      
      console.log(`📥 Added ${this.downloadQueue.length} tiles to download queue`);
      await this.processDownloadQueue();
      
    } catch (error) {
      console.error('Error in pre-download:', error);
    } finally {
      this.isDownloading = false;
      this.logDownloadStats();
    }
  }

  // Process download queue with rate limiting
  async processDownloadQueue() {
    if (!this.isOnline || this.downloadQueue.length === 0) {
      return;
    }

    const batchSize = 5; // Download 5 tiles concurrently
    const delay = 100; // 100ms delay between batches
    
    while (this.downloadQueue.length > 0 && this.isOnline) {
      const batch = this.downloadQueue.splice(0, batchSize);
      
      const promises = batch.map(async ({ z, x, y }) => {
        try {
          await this.downloadTile(z, x, y);
        } catch (error) {
          // Error already logged in downloadTile
        }
      });

      await Promise.all(promises);
      
      // Rate limiting delay
      if (this.downloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Progress update
      if (this.downloadStats.downloaded % 50 === 0) {
        console.log(`📥 Downloaded: ${this.downloadStats.downloaded}, Failed: ${this.downloadStats.failed}, Queue: ${this.downloadQueue.length}`);
      }
    }
  }

  // Calculate tile bounds for zoom level
  getTileBounds(bounds, zoom) {
    const { north, south, east, west } = bounds;
    
    const minX = Math.floor(this.lon2tile(west, zoom));
    const maxX = Math.floor(this.lon2tile(east, zoom));
    const minY = Math.floor(this.lat2tile(north, zoom));
    const maxY = Math.floor(this.lat2tile(south, zoom));
    
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

  // Coordinate conversion utilities
  lon2tile(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
  }

  lat2tile(lat, zoom) {
    return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
  }

  tile2lon(x, zoom) {
    return (x / Math.pow(2, zoom) * 360 - 180);
  }

  tile2lat(y, zoom) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }

  // Update cache metadata
  async updateMetadata(sizeIncrease) {
    try {
      const metadata = await metadataStore.getItem('cache_info');
      metadata.totalTiles++;
      metadata.totalSize += sizeIncrease;
      await metadataStore.setItem('cache_info', metadata);
      
      // Check if cache cleanup is needed
      if (metadata.totalSize > CACHE_CONFIG.maxCacheSize || 
          metadata.totalTiles > CACHE_CONFIG.maxTiles) {
        await this.cleanupCache();
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }

  // Clean up old tiles using LRU strategy
  async cleanupCache() {
    try {
      console.log('🧹 Starting cache cleanup...');
      
      const keys = await tileStore.keys();
      const tiles = [];
      
      // Get all tiles with access times
      for (const key of keys) {
        const tile = await tileStore.getItem(key);
        if (tile) {
          tiles.push({ key, lastAccess: tile.lastAccess, size: tile.size });
        }
      }
      
      // Sort by last access (oldest first)
      tiles.sort((a, b) => a.lastAccess - b.lastAccess);
      
      // Remove oldest 25% of tiles
      const tilesToRemove = Math.floor(tiles.length * 0.25);
      let removedSize = 0;
      
      for (let i = 0; i < tilesToRemove; i++) {
        await tileStore.removeItem(tiles[i].key);
        removedSize += tiles[i].size;
      }
      
      // Update metadata
      const metadata = await metadataStore.getItem('cache_info');
      metadata.totalTiles -= tilesToRemove;
      metadata.totalSize -= removedSize;
      metadata.lastCleanup = Date.now();
      await metadataStore.setItem('cache_info', metadata);
      
      console.log(`🧹 Cleaned up ${tilesToRemove} tiles, freed ${(removedSize / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  // Remove specific tile
  async removeTile(z, x, y) {
    try {
      const key = this.getTileKey(z, x, y);
      const tile = await tileStore.getItem(key);
      
      if (tile) {
        await tileStore.removeItem(key);
        
        // Update metadata
        const metadata = await metadataStore.getItem('cache_info');
        metadata.totalTiles--;
        metadata.totalSize -= tile.size;
        await metadataStore.setItem('cache_info', metadata);
      }
    } catch (error) {
      console.error('Error removing tile:', error);
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const metadata = await metadataStore.getItem('cache_info');
      return {
        ...metadata,
        totalSizeMB: (metadata.totalSize / 1024 / 1024).toFixed(2),
        maxSizeMB: (CACHE_CONFIG.maxCacheSize / 1024 / 1024).toFixed(2),
        fillPercentage: ((metadata.totalSize / CACHE_CONFIG.maxCacheSize) * 100).toFixed(1),
        downloadStats: this.downloadStats
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Clear entire cache
  async clearCache() {
    try {
      await tileStore.clear();
      await metadataStore.setItem('cache_info', {
        totalTiles: 0,
        totalSize: 0,
        lastCleanup: Date.now(),
        regions: [],
        created: Date.now()
      });
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Log download statistics
  logDownloadStats() {
    const duration = Date.now() - this.downloadStats.startTime;
    const durationMins = (duration / 1000 / 60).toFixed(1);
    const sizeMB = (this.downloadStats.totalSize / 1024 / 1024).toFixed(2);
    const rate = this.downloadStats.downloaded / (duration / 1000);
    
    console.log('📊 Download Statistics:');
    console.log(`   ✅ Downloaded: ${this.downloadStats.downloaded}`);
    console.log(`   ❌ Failed: ${this.downloadStats.failed}`);
    console.log(`   📦 Total size: ${sizeMB}MB`);
    console.log(`   ⏱️ Duration: ${durationMins} minutes`);
    console.log(`   🚀 Rate: ${rate.toFixed(1)} tiles/second`);
  }
}

// Export singleton instance
export const tileCache = new TileCacheManager();
export default tileCache; 