import tileCache from './tileCache';

class LocalTileServer {
  constructor() {
    this.enabled = true;
    this.useLocalFirst = true;
    this.fallbackToRemote = true;
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      remoteRequests: 0,
      errors: 0
    };
  }

  // Configure tile server behavior
  configure(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : this.enabled;
    this.useLocalFirst = options.useLocalFirst !== undefined ? options.useLocalFirst : this.useLocalFirst;
    this.fallbackToRemote = options.fallbackToRemote !== undefined ? options.fallbackToRemote : this.fallbackToRemote;
  }

  // Get tile URL with local-first strategy
  async getTileUrl(z, x, y) {
    if (!this.enabled) {
      return this.getRemoteTileUrl(z, x, y);
    }

    try {
      // First try local cache
      if (this.useLocalFirst) {
        const cachedTile = await tileCache.getTile(z, x, y);
        if (cachedTile) {
          this.stats.cacheHits++;
          return cachedTile;
        }
        this.stats.cacheMisses++;
      }

      // Fallback to remote with caching
      if (this.fallbackToRemote) {
        this.stats.remoteRequests++;
        return await tileCache.getTileWithCache(z, x, y);
      }

      // No fallback - return placeholder
      return this.getPlaceholderTile();
      
    } catch (error) {
      console.error('Error getting tile:', error);
      this.stats.errors++;
      
      // Return remote URL as last resort
      return this.getRemoteTileUrl(z, x, y);
    }
  }

  // Get remote tile URL (standard OSM)
  getRemoteTileUrl(z, x, y) {
    const subdomains = ['a', 'b', 'c'];
    const subdomain = subdomains[(x + y) % subdomains.length];
    return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  // Generate placeholder tile for missing tiles
  getPlaceholderTile() {
    // Create a simple gray placeholder tile as data URL
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Gray background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 256, 256);
    
    // Border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 256, 256);
    
    // "Offline" text
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Offline', 128, 128);
    
    return canvas.toDataURL('image/png');
  }

  // Get cache statistics
  getStats() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    const hitRate = total > 0 ? (this.stats.cacheHits / total * 100).toFixed(1) : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`,
      enabled: this.enabled,
      useLocalFirst: this.useLocalFirst,
      fallbackToRemote: this.fallbackToRemote
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      remoteRequests: 0,
      errors: 0
    };
  }

  // Pre-download region for offline use
  async predownloadRegion(bounds, minZoom = 10, maxZoom = 16, name = 'Custom Region') {
    return await tileCache.predownloadRegion(bounds, minZoom, maxZoom, name);
  }

  // Get cache info
  async getCacheInfo() {
    return await tileCache.getCacheStats();
  }

  // Clear cache
  async clearCache() {
    await tileCache.clearCache();
    this.resetStats();
  }
}

// Export singleton instance
export const localTileServer = new LocalTileServer();
export default localTileServer; 