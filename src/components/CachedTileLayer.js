import React, { useEffect, useRef } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import localTileServer from '../services/localTileServer';

// Custom tile layer that uses local cache
export const CachedTileLayer = ({ 
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom = 19,
  minZoom = 1,
  enableOfflineMode = true,
  ...props 
}) => {
  const map = useMap();
  const tileLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !enableOfflineMode) return;

    // Create custom tile layer with cache support
    const CachedTileLayerClass = L.TileLayer.extend({
      initialize: function(url, options) {
        L.TileLayer.prototype.initialize.call(this, url, options);
        this.on('tileload', this._onTileLoad.bind(this));
        this.on('tileerror', this._onTileError.bind(this));
      },

      createTile: function(coords, done) {
        const tile = document.createElement('img');
        
        // Set up tile properties
        L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
        L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile));
        
        if (this.options.crossOrigin || this.options.crossOrigin === '') {
          tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
        }
        
        tile.alt = '';
        tile.setAttribute('role', 'presentation');
        
        // Use cached tile URL
        this._loadCachedTile(tile, coords);
        
        return tile;
      },

      _loadCachedTile: async function(tile, coords) {
        try {
          const tileUrl = await localTileServer.getTileUrl(coords.z, coords.x, coords.y);
          tile.src = tileUrl;
        } catch (error) {
          console.error('Error loading cached tile:', error);
          // Fallback to standard tile URL
          tile.src = this.getTileUrl(coords);
        }
      },

      _onTileLoad: function(e) {
        // Track successful tile loads
        console.debug('Tile loaded:', e.target.src);
      },

      _onTileError: function(e) {
        // Handle tile load errors
        console.warn('Tile load error:', e.target.src);
        
        // Try fallback URL
        if (!e.target.src.includes('openstreetmap.org')) {
          const coords = this._tileCoordsToNwSe(e.coords);
          e.target.src = localTileServer.getRemoteTileUrl(e.coords.z, e.coords.x, e.coords.y);
        }
      }
    });

    // Create and add the cached tile layer
    const cachedLayer = new CachedTileLayerClass('', {
      attribution,
      maxZoom,
      minZoom,
      ...props
    });

    map.addLayer(cachedLayer);
    tileLayerRef.current = cachedLayer;

    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
    };
  }, [map, enableOfflineMode, attribution, maxZoom, minZoom]);

  // If offline mode is disabled, use standard TileLayer
  if (!enableOfflineMode) {
    return (
      <TileLayer
        attribution={attribution}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={maxZoom}
        minZoom={minZoom}
        {...props}
      />
    );
  }

  // Return null as the layer is added manually in useEffect
  return null;
};

// Cache management component
export const CacheControls = ({ 
  onCacheStats, 
  onPredownload, 
  onClearCache,
  className = '' 
}) => {
  const [stats, setStats] = React.useState(null);
  const [cacheInfo, setCacheInfo] = React.useState(null);
  const [isPredownloading, setIsPredownloading] = React.useState(false);

  const updateStats = async () => {
    try {
      const tileStats = localTileServer.getStats();
      const cacheStats = await localTileServer.getCacheInfo();
      
      setStats(tileStats);
      setCacheInfo(cacheStats);
      
      if (onCacheStats) {
        onCacheStats({ tileStats, cacheStats });
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
  };

  React.useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handlePredownload = async (bounds) => {
    if (isPredownloading) return;
    
    setIsPredownloading(true);
    try {
      await localTileServer.predownloadRegion(bounds);
      await updateStats();
      if (onPredownload) onPredownload();
    } catch (error) {
      console.error('Predownload failed:', error);
    } finally {
      setIsPredownloading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await localTileServer.clearCache();
      await updateStats();
      if (onClearCache) onClearCache();
    } catch (error) {
      console.error('Clear cache failed:', error);
    }
  };

  return (
    <div className={`cache-controls ${className}`}>
      <div className="cache-stats">
        {stats && (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Cache Hit Rate</span>
              <span className="stat-value">{stats.hitRate}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Cache Hits</span>
              <span className="stat-value">{stats.cacheHits}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remote Requests</span>
              <span className="stat-value">{stats.remoteRequests}</span>
            </div>
          </div>
        )}
        
        {cacheInfo && (
          <div className="cache-info">
            <div className="info-item">
              <span>Total Tiles: {cacheInfo.totalTiles.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span>Cache Size: {cacheInfo.totalSizeMB}MB / {cacheInfo.maxSizeMB}MB</span>
            </div>
            <div className="info-item">
              <span>Fill: {cacheInfo.fillPercentage}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="cache-actions">
        <button 
          onClick={handleClearCache}
          className="btn btn-secondary"
          title="Clear all cached tiles"
        >
          Clear Cache
        </button>
      </div>
      
      <style jsx>{`
        .cache-controls {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 14px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .stat-item {
          text-align: center;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .stat-label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .stat-value {
          display: block;
          font-weight: bold;
          color: #333;
        }
        
        .cache-info {
          margin-bottom: 16px;
        }
        
        .info-item {
          margin-bottom: 4px;
          color: #666;
          font-size: 12px;
        }
        
        .cache-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #5a6268;
        }
      `}</style>
    </div>
  );
};

export default CachedTileLayer; 