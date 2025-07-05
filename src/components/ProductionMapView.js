import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CachedTileLayer } from './CachedTileLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Route, 
  ExternalLink, 
  Clock, 
  DollarSign,
  Star,
  Info,
  Phone,
  Globe,
  Car,
  Footprints,
  Bike,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Search,
  Crosshair,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Zap,
  Activity,
  Target
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { calculateDayRoute, getOptimalTravelMode } from '../services/routingService';

// Production-ready Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Performance metrics tracking
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTime: [],
      markerCount: [],
      clusterCount: [],
      routeCalculationTime: []
    };
  }

  startTimer(operation) {
    return performance.now();
  }

  endTimer(operation, startTime) {
    const duration = performance.now() - startTime;
    if (this.metrics[operation]) {
      this.metrics[operation].push(duration);
      // Keep only last 100 measurements
      if (this.metrics[operation].length > 100) {
        this.metrics[operation].shift();
      }
    }
    return duration;
  }

  getAverageTime(operation) {
    const times = this.metrics[operation];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMetrics() {
    return {
      avgRenderTime: this.getAverageTime('renderTime').toFixed(2),
      avgRouteTime: this.getAverageTime('routeCalculationTime').toFixed(2),
      lastMarkerCount: this.metrics.markerCount[this.metrics.markerCount.length - 1] || 0,
      lastClusterCount: this.metrics.clusterCount[this.metrics.clusterCount.length - 1] || 0
    };
  }
}

// Advanced clustering algorithm
class AdvancedClusterer {
  constructor(options = {}) {
    this.radius = options.radius || 80;
    this.maxZoom = options.maxZoom || 16;
    this.minZoom = options.minZoom || 0;
    this.extent = options.extent || 512;
  }

  cluster(points, zoom) {
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;

      const point = points[i];
      const cluster = {
        id: `cluster_${i}_${zoom}`,
        latitude: point.latitude,
        longitude: point.longitude,
        points: [point],
        size: 1
      };

      visited.add(i);

      // Find nearby points within radius
      for (let j = i + 1; j < points.length; j++) {
        if (visited.has(j)) continue;

        const otherPoint = points[j];
        const distance = this.getDistance(point, otherPoint, zoom);

        if (distance < this.radius) {
          cluster.points.push(otherPoint);
          cluster.size++;
          visited.add(j);

          // Update cluster center (weighted average)
          cluster.latitude = (cluster.latitude * (cluster.size - 1) + otherPoint.latitude) / cluster.size;
          cluster.longitude = (cluster.longitude * (cluster.size - 1) + otherPoint.longitude) / cluster.size;
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  getDistance(point1, point2, zoom) {
    const factor = Math.pow(2, Math.max(0, Math.min(zoom, this.maxZoom)));
    const dx = (point2.longitude - point1.longitude) * factor;
    const dy = (point2.latitude - point1.latitude) * factor;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Viewport optimization component
const ViewportOptimizer = ({ activities, map, zoom, onVisibleActivitiesChange }) => {
  const [visibleActivities, setVisibleActivities] = useState([]);
  const lastBounds = useRef(null);

  const updateVisibleActivities = useCallback(() => {
    if (!map || !activities.length) return;

    const bounds = map.getBounds();
    
    // Check if bounds changed significantly
    if (lastBounds.current && 
        Math.abs(bounds.getNorth() - lastBounds.current.getNorth()) < 0.001 &&
        Math.abs(bounds.getSouth() - lastBounds.current.getSouth()) < 0.001 &&
        Math.abs(bounds.getEast() - lastBounds.current.getEast()) < 0.001 &&
        Math.abs(bounds.getWest() - lastBounds.current.getWest()) < 0.001) {
      return; // No significant change
    }

    lastBounds.current = bounds;

    // Add padding to bounds for better UX
    const paddedBounds = bounds.pad(0.2);

    const visible = activities.filter(activity => {
      if (!activity.latitude || !activity.longitude) return false;
      return paddedBounds.contains([activity.latitude, activity.longitude]);
    });

    setVisibleActivities(visible);
    onVisibleActivitiesChange(visible);
  }, [activities, map, onVisibleActivitiesChange]);

  useEffect(() => {
    if (!map) return;

    updateVisibleActivities();

    map.on('moveend', updateVisibleActivities);
    map.on('zoomend', updateVisibleActivities);

    return () => {
      map.off('moveend', updateVisibleActivities);
      map.off('zoomend', updateVisibleActivities);
    };
  }, [map, updateVisibleActivities]);

  return null;
};

// Advanced custom marker icons with clustering support
const createClusterIcon = (cluster, dayColors, isSelected = false) => {
  const size = Math.min(60, Math.max(30, 30 + cluster.size * 2));
  const color = dayColors[0]; // Use first day color for clusters
  
  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        <div style="
          background: linear-gradient(135deg, ${color}, ${color}aa);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: bold;
          color: white;
          font-size: ${Math.min(16, size * 0.3)}px;
        ">
          ${cluster.size}
        </div>
        <div style="
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: #ff6b6b;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid white;
        ">
          📍
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

const createAdvancedIcon = (category, dayIndex, isSelected = false) => {
  const categoryIcons = {
    restaurant: '🍽️',
    sightseeing: '🏛️',
    culture: '🎭',
    entertainment: '🎪',
    shopping: '🛍️',
    nature: '🌲',
    hotel: '🏨',
    transport: '🚌',
    default: '📍'
  };

  const dayColors = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', 
    '#ef4444', '#3b82f6', '#f97316', '#84cc16'
  ];

  const color = dayColors[dayIndex % dayColors.length];
  const icon = categoryIcons[category] || categoryIcons.default;
  const size = isSelected ? 36 : 28;

  return L.divIcon({
    className: 'custom-advanced-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        <div style="
          background: linear-gradient(135deg, ${color}, ${color}dd);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        ">
          <div style="
            transform: rotate(45deg);
            font-size: ${size * 0.4}px;
            line-height: 1;
          ">
            ${icon}
          </div>
        </div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -4px;
            left: -4px;
            width: ${size + 8}px;
            height: ${size + 8}px;
            border: 2px solid ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            animation: ping 1.5s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

// Map bounds fitting component
const FitMapBounds = ({ activities, selectedActivity }) => {
  const map = useMap();
  
  useEffect(() => {
    if (activities && activities.length > 0) {
      const validActivities = activities.filter(a => a.latitude && a.longitude);
      if (validActivities.length > 0) {
        const bounds = L.latLngBounds(
          validActivities.map(activity => [activity.latitude, activity.longitude])
        );
        
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: selectedActivity ? 16 : 14
        });
      }
    }
  }, [activities, map, selectedActivity]);

  return null;
};

// Geolocation component
const GeolocationControl = () => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const locateUser = useCallback(() => {
    setIsTracking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = [latitude, longitude];
        setUserLocation(location);
        map.setView(location, 16);
        setIsTracking(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map]);

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ top: '70px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={locateUser}
            disabled={isTracking}
            className="bg-white hover:bg-gray-50 p-2 disabled:opacity-50"
            title="Find my location"
          >
            {isTracking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {userLocation && (
        <Marker
          position={userLocation}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Your Location</p>
              <p className="text-sm text-gray-600">Current position</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

// Map click handler
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
};

// Performance stats display
const PerformanceStats = ({ performanceMonitor, visible = false }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setStats(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [performanceMonitor, visible]);

  if (!visible) return null;

  return (
    <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div className="flex items-center mb-2">
        <Activity className="w-3 h-3 mr-1" />
        Performance Stats
      </div>
      <div className="space-y-1">
        <div>Render: {stats.avgRenderTime}ms</div>
        <div>Route: {stats.avgRouteTime}ms</div>
        <div>Markers: {stats.lastMarkerCount}</div>
        <div>Clusters: {stats.lastClusterCount}</div>
      </div>
    </div>
  );
};

// Advanced map controls
const AdvancedMapControls = ({ 
  travelMode, 
  onTravelModeChange, 
  isPlaying, 
  onPlayPause, 
  onReset,
  showRoutes,
  onToggleRoutes,
  routeInfo,
  isFullscreen,
  onToggleFullscreen,
  onlineStatus,
  showPerformanceStats,
  onTogglePerformanceStats,
  enableClustering,
  onToggleClustering
}) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-4 left-4 z-[1000] space-y-3"
  >
    {/* Connection Status */}
    <div className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium ${
      onlineStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {onlineStatus ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
      {onlineStatus ? 'Online' : 'Offline'}
    </div>

    {/* Performance & Settings */}
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-2">
      <div className="text-xs font-semibold text-gray-700 mb-2">Master Controls</div>
      <div className="flex space-x-1">
        <button
          onClick={onTogglePerformanceStats}
          className={`p-2 rounded-md transition-colors ${
            showPerformanceStats ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Performance Stats"
        >
          <Activity className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleClustering}
          className={`p-2 rounded-md transition-colors ${
            enableClustering ? 'bg-purple-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Toggle Clustering"
        >
          <Target className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded-md"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>

    {/* Travel Mode Controls */}
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-2">
      <div className="text-xs font-semibold text-gray-700 mb-2">Travel Mode</div>
      <div className="flex space-x-1">
        <button
          onClick={() => onTravelModeChange('driving')}
          className={`p-2 rounded-md transition-colors ${
            travelMode === 'driving' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Driving"
        >
          <Car className="w-4 h-4" />
        </button>
        <button
          onClick={() => onTravelModeChange('walking')}
          className={`p-2 rounded-md transition-colors ${
            travelMode === 'walking' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Walking"
        >
          <Footprints className="w-4 h-4" />
        </button>
        <button
          onClick={() => onTravelModeChange('cycling')}
          className={`p-2 rounded-md transition-colors ${
            travelMode === 'cycling' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Cycling"
        >
          <Bike className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Route Controls */}
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-700">Route Info</div>
        <Zap className="w-3 h-3 text-yellow-500" title="High Performance Mode" />
      </div>
      
      {routeInfo && (
        <div className="text-xs text-gray-600 mb-3 space-y-1">
          <div className="flex items-center">
            <Route className="w-3 h-3 mr-1" />
            {(routeInfo.distance / 1000).toFixed(1)} km
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {Math.round(routeInfo.duration / 60)} min
          </div>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button
          onClick={onPlayPause}
          className={`flex-1 p-2 rounded-md text-white transition-colors ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
          title={isPlaying ? 'Pause route' : 'Play route'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={onReset}
          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          title="Reset route"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleRoutes}
          className={`p-2 rounded-md transition-colors ${
            showRoutes ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="Toggle routes"
        >
          <Route className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

// Main Production Map Component
const ProductionMapView = ({
  activities = [],
  selectedActivity = null,
  onMarkerClick = () => {},
  onMapClick = () => {},
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 13,
  height = '500px',
  className = '',
  showControls = true,
  enableRouting = true,
  enableGeolocation = true
}) => {
  // State management
  const [mapReady, setMapReady] = useState(false);
  const [routes, setRoutes] = useState({});
  const [routingProgress, setRoutingProgress] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(selectedActivity);
  const [travelMode, setTravelMode] = useState('driving');
  const [isPlaying, setIsPlaying] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [error, setError] = useState(null);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [enableClustering, setEnableClustering] = useState(true);
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  
  const mapRef = useRef(null);
  const playInterval = useRef(null);
  const performanceMonitor = useRef(new PerformanceMonitor());
  const clusterer = useRef(new AdvancedClusterer({ radius: 80, maxZoom: 16 }));

  // Filter activities with valid coordinates
  const validActivities = activities.filter(activity => 
    activity.latitude && activity.longitude &&
    !isNaN(activity.latitude) && !isNaN(activity.longitude) &&
    activity.latitude !== 0 && activity.longitude !== 0
  );

  // Show message if no valid coordinates
  if (validActivities.length === 0) {
    return (
      <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <MapPin className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Map Data Available</h3>
          <p className="text-gray-500 text-center max-w-md">
            The activities in this trip don't have location coordinates yet. 
            The map will appear once locations are geocoded.
          </p>
          <div className="mt-4 text-xs text-gray-400">
            {activities.length > 0 ? `${activities.length} activities found, but none have coordinates` : 'No activities available'}
          </div>
        </div>
      </div>
    );
  }

  // Clustering logic
  useEffect(() => {
    if (!enableClustering || visibleActivities.length === 0) {
      setClusters(visibleActivities.map(activity => ({
        id: `single_${activity.name}`,
        latitude: activity.latitude,
        longitude: activity.longitude,
        points: [activity],
        size: 1,
        isCluster: false
      })));
      return;
    }

    const startTime = performanceMonitor.current.startTimer('renderTime');
    
    const newClusters = clusterer.current.cluster(visibleActivities, currentZoom);
    setClusters(newClusters.map(cluster => ({
      ...cluster,
      isCluster: cluster.size > 1
    })));

    performanceMonitor.current.endTimer('renderTime', startTime);
    performanceMonitor.current.metrics.markerCount.push(visibleActivities.length);
    performanceMonitor.current.metrics.clusterCount.push(newClusters.length);
  }, [visibleActivities, enableClustering, currentZoom]);

  // Group activities by day for routing
  const activitiesByDay = useMemo(() => {
    return validActivities.reduce((acc, activity) => {
      const day = activity.dayIndex || 0;
      if (!acc[day]) acc[day] = [];
      acc[day].push(activity);
      return acc;
    }, {});
  }, [validActivities]);

  // Day colors for routes
  const dayColors = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', 
    '#ef4444', '#3b82f6', '#f97316', '#84cc16'
  ];

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate routes for each day
  useEffect(() => {
    if (!enableRouting || Object.keys(activitiesByDay).length === 0) return;

    const calculateAllRoutes = async () => {
      setRoutingProgress('Calculating optimal routes...');
      setError(null);
      
      const startTime = performanceMonitor.current.startTimer('routeCalculationTime');
      const newRoutes = {};

      try {
        for (const [day, dayActivities] of Object.entries(activitiesByDay)) {
          if (dayActivities.length < 2) continue;

          const sortedActivities = dayActivities.sort((a, b) => 
            (a.activityIndex || 0) - (b.activityIndex || 0)
          );

          const optimalTravelMode = getOptimalTravelMode(sortedActivities);
          
          try {
            const route = await calculateDayRoute(sortedActivities, travelMode || optimalTravelMode);
            
            if (route && route.coordinates && route.coordinates.length > 0) {
              newRoutes[day] = {
                ...route,
                color: dayColors[parseInt(day) % dayColors.length],
                dayNumber: parseInt(day) + 1
              };
            }
          } catch (routeError) {
            console.warn(`Route calculation failed for day ${day}, using fallback:`, routeError);
            // Fallback to straight lines
            newRoutes[day] = {
              coordinates: sortedActivities.map(a => [a.latitude, a.longitude]),
              color: dayColors[parseInt(day) % dayColors.length],
              dayNumber: parseInt(day) + 1,
              fallback: true
            };
          }
        }

        setRoutes(newRoutes);
      } catch (error) {
        console.error('Failed to calculate routes:', error);
        setError('Failed to calculate routes. Using straight line connections.');
      } finally {
        performanceMonitor.current.endTimer('routeCalculationTime', startTime);
        setRoutingProgress(null);
      }
    };

    calculateAllRoutes();
  }, [activitiesByDay, travelMode, enableRouting]);

  // Route playback controls
  const startRoutePlayback = useCallback(() => {
    setIsPlaying(true);
    playInterval.current = setInterval(() => {
      setRouteProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          clearInterval(playInterval.current);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  }, []);

  const pauseRoutePlayback = useCallback(() => {
    setIsPlaying(false);
    if (playInterval.current) {
      clearInterval(playInterval.current);
      playInterval.current = null;
    }
  }, []);

  const resetRoutePlayback = useCallback(() => {
    pauseRoutePlayback();
    setRouteProgress(0);
  }, [pauseRoutePlayback]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playInterval.current) {
        clearInterval(playInterval.current);
      }
    };
  }, []);

  // Handle marker clicks
  const handleMarkerClick = useCallback((activity, cluster = null) => {
    if (cluster && cluster.isCluster) {
      // Handle cluster click - zoom in
      if (mapRef.current) {
        mapRef.current.setView([cluster.latitude, cluster.longitude], Math.min(currentZoom + 2, 18));
      }
      return;
    }
    
    setSelectedMarker(activity);
    onMarkerClick(activity);
  }, [onMarkerClick, currentZoom]);

  // Calculate route info for display
  const routeInfo = useMemo(() => {
    const allRoutes = Object.values(routes);
    if (allRoutes.length === 0) return null;
    
    const totalDistance = allRoutes.reduce((sum, route) => sum + (route.distance || 0), 0);
    const totalDuration = allRoutes.reduce((sum, route) => sum + (route.duration || 0), 0);
    
    return { distance: totalDistance, duration: totalDuration };
  }, [routes]);

  // Handle visible activities change from viewport optimizer
  const handleVisibleActivitiesChange = useCallback((visible) => {
    setVisibleActivities(visible);
  }, []);

  // Map zoom change handler
  const MapZoomHandler = () => {
    const map = useMap();
    
    useMapEvents({
      zoomend: () => {
        setCurrentZoom(map.getZoom());
      }
    });
    
    return null;
  };

  // Error boundary
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg ${className}`} style={{ height }}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-700 font-semibold mb-2">Map Error</p>
        <p className="text-red-600 text-sm text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Reload Map
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      {/* Loading State */}
      <AnimatePresence>
        {!mapReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Master Level Map...</p>
            {routingProgress && (
              <p className="text-sm text-gray-500 mt-2">{routingProgress}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={() => setMapReady(true)}
        zoomControl={false}
        attributionControl={true}
        className="production-map"
      >
        {/* Custom CSS for animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2) rotate(-45deg);
              opacity: 0;
            }
          }
          .production-map .leaflet-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .custom-cluster-marker {
            border: none !important;
            background: none !important;
          }
          .custom-advanced-marker {
            border: none !important;
            background: none !important;
          }
        `}</style>

        {/* Cached tile layer with offline support */}
        <CachedTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          minZoom={1}
          enableOfflineMode={true}
        />

        {/* Viewport optimizer */}
        <ViewportOptimizer 
          activities={validActivities}
          map={mapRef.current}
          zoom={currentZoom}
          onVisibleActivitiesChange={handleVisibleActivitiesChange}
        />

        {/* Zoom handler */}
        <MapZoomHandler />

        {/* Advanced map controls */}
        {showControls && (
          <AdvancedMapControls
            travelMode={travelMode}
            onTravelModeChange={setTravelMode}
            isPlaying={isPlaying}
            onPlayPause={isPlaying ? pauseRoutePlayback : startRoutePlayback}
            onReset={resetRoutePlayback}
            showRoutes={showRoutes}
            onToggleRoutes={() => setShowRoutes(!showRoutes)}
            routeInfo={routeInfo}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onlineStatus={onlineStatus}
            showPerformanceStats={showPerformanceStats}
            onTogglePerformanceStats={() => setShowPerformanceStats(!showPerformanceStats)}
            enableClustering={enableClustering}
            onToggleClustering={() => setEnableClustering(!enableClustering)}
          />
        )}

        {/* Performance stats */}
        <PerformanceStats 
          performanceMonitor={performanceMonitor.current}
          visible={showPerformanceStats}
        />

        {/* Fit map bounds */}
        <FitMapBounds activities={validActivities} selectedActivity={selectedMarker} />

        {/* Geolocation control */}
        {enableGeolocation && <GeolocationControl />}

        {/* Map click handler */}
        <MapClickHandler onMapClick={onMapClick} />

        {/* Optimized markers/clusters */}
        {clusters.map((cluster, index) => (
          <Marker
            key={cluster.id || `cluster-${index}`}
            position={[cluster.latitude, cluster.longitude]}
            icon={cluster.isCluster 
              ? createClusterIcon(cluster, dayColors, false)
              : createAdvancedIcon(
                  cluster.points[0]?.category || 'default',
                  cluster.points[0]?.dayIndex || 0,
                  selectedMarker?.name === cluster.points[0]?.name
                )
            }
            eventHandlers={{ 
              click: () => handleMarkerClick(cluster.points[0], cluster)
            }}
          >
            <Popup maxWidth={300} className="production-popup">
              {cluster.isCluster ? (
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">
                    {cluster.size} Activities in this Area
                  </h3>
                  <div className="space-y-2 text-sm">
                    {cluster.points.slice(0, 3).map((activity, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded">
                        <div className="font-semibold">{activity.name}</div>
                        <div className="text-gray-600 text-xs">{activity.location}</div>
                      </div>
                    ))}
                    {cluster.size > 3 && (
                      <div className="text-center text-gray-500 text-xs">
                        +{cluster.size - 3} more activities
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <button className="px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">
                      Zoom to View All
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{cluster.points[0].name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {cluster.points[0].time} ({cluster.points[0].duration} min)
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {cluster.points[0].location}
                    </div>
                    <p className="text-gray-700">{cluster.points[0].description}</p>
                    {cluster.points[0].cost && (
                      <div className="flex items-center text-green-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ${cluster.points[0].cost}
                      </div>
                    )}
                    {cluster.points[0].rating && (
                      <div className="flex items-center text-yellow-600">
                        <Star className="w-4 h-4 mr-2" />
                        {cluster.points[0].rating}/5
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${cluster.points[0].latitude}&mlon=${cluster.points[0].longitude}&zoom=16`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View on Map
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${cluster.points[0].latitude},${cluster.points[0].longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </a>
                  </div>
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {/* Route visualization */}
        {showRoutes && Object.entries(routes).map(([day, route]) => {
          if (!route.coordinates || route.coordinates.length < 2) return null;
          
          const animatedCoords = isPlaying 
            ? route.coordinates.slice(0, Math.floor((route.coordinates.length * routeProgress) / 100))
            : route.coordinates;

          return (
            <Polyline
              key={`route-${day}`}
              positions={animatedCoords}
              color={route.color}
              weight={4}
              opacity={0.8}
              dashArray={route.fallback ? "10, 10" : null}
            />
          );
        })}
      </MapContainer>

      {/* Activity count and status */}
      <div className="absolute bottom-4 right-4 space-y-2">
        {validActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border"
          >
            <div className="flex items-center space-x-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{visibleActivities.length}/{validActivities.length} visible</span>
            </div>
          </motion.div>
        )}
        
        {clusters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border"
          >
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Target className="w-4 h-4 text-purple-500" />
              <span>{clusters.filter(c => c.isCluster).length} clusters</span>
            </div>
          </motion.div>
        )}
        
        {Object.keys(routes).length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border"
          >
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Route className="w-4 h-4 text-green-500" />
              <span>{Object.keys(routes).length} day routes</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductionMapView; 