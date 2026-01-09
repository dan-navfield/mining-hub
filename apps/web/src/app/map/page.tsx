'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './map.css';
import Map, { Source, Layer, Popup, MapRef } from 'react-map-gl';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Filter, 
  Search, 
  MapPin, 
  Layers, 
  Share2, 
  X, 
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import MapFiltersComponent from '../../components/map/MapFilters';

// Types
interface Tenement {
  id: string;
  number: string;
  type: string;
  status: 'live' | 'pending' | 'expired';
  holder_name: string;
  jurisdiction: string;
  area_ha: number;
  expiry_date?: string;
  grant_date?: string;
  coordinates: [number, number]; // [lng, lat]
  geometry?: any; // GeoJSON geometry for boundaries
}

interface MapFilters {
  jurisdictions: string[];
  types: string[];
  statuses: string[];
  holders: string[];
  search: string;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGFubmF2ZmllbGQiLCJhIjoiY21ndnY4eWZuMDI3NDJsb24ybXh3azJ1bCJ9.9DuuUe0xzomsVYauBEh7Ig';

// Australian center coordinates
const INITIAL_VIEW_STATE: ViewState = {
  longitude: 133.7751,
  latitude: -25.2744,
  zoom: 4
};

// Status colors for tenements
const STATUS_COLORS = {
  live: '#10b981', // Green
  pending: '#f59e0b', // Amber
  expired: '#ef4444' // Red
};

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);

  // State
  const [tenements, setTenements] = useState<Tenement[]>([]);
  const [filteredTenements, setFilteredTenements] = useState<Tenement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{jurisdiction: string, count: number}[]>([]);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [selectedTenement, setSelectedTenement] = useState<Tenement | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  
  // State-level view management
  const [viewMode, setViewMode] = useState<'overview' | 'state'>('overview');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});

  // Filters
  const [filters, setFilters] = useState<MapFilters>({
    jurisdictions: [],
    types: [],
    statuses: [], // Don't filter by status by default - show all
    holders: [],
    search: ''
  });

  // Layer visibility
  const [layerVisibility, setLayerVisibility] = useState({
    clusters: true,
    boundaries: true,
    labels: true
  });

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'overview') {
      loadStateCounts();
    } else if (selectedState) {
      loadStateTenementsData(selectedState);
    }
  }, [viewMode, selectedState]);

  // Force refresh coordinates on mount to fix ocean issue
  useEffect(() => {
    // Clear any cached tenements and force reload
    setTenements([]);
  }, []);

  // Apply filters when they change
  useEffect(() => {
    console.log(`🔍 Applying filters to ${tenements.length} tenements`);
    applyFilters();
  }, [tenements, filters]);

  // Handle URL parameters for deep linking
  useEffect(() => {
    const urlFilters = parseUrlParams();
    if (urlFilters) {
      setFilters(urlFilters.filters);
      setViewState(urlFilters.viewState);
      
      // Highlight specific tenement if provided
      if (urlFilters.tenementId) {
        highlightTenement(urlFilters.tenementId);
      }
    }
  }, [searchParams]);

  // Load state counts for overview mode
  const loadStateCounts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading state counts...');
      
      const jurisdictions = ['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS'];
      const counts: Record<string, number> = {};
      
      for (const jurisdiction of jurisdictions) {
        try {
          // Just get count, not actual data
          const response = await fetch(`http://localhost:4000/api/tenements?jurisdiction=${jurisdiction}&limit=1`);
          if (response.ok) {
            const data = await response.json();
            // If pagination info is available, use total count
            if (data.pagination && data.pagination.total) {
              counts[jurisdiction] = data.pagination.total;
              console.log(`📊 ${jurisdiction}: ${data.pagination.total} tenements`);
            } else {
              // Fallback: make a request to get approximate count
              const countResponse = await fetch(`http://localhost:4000/api/tenements?jurisdiction=${jurisdiction}&limit=1000`);
              if (countResponse.ok) {
                const countData = await countResponse.json();
                const tenements = Array.isArray(countData) ? countData : countData.data || [];
                counts[jurisdiction] = tenements.length;
                console.log(`📊 ${jurisdiction}: ${tenements.length} tenements (fallback count)`);
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to get count for ${jurisdiction}:`, err);
          counts[jurisdiction] = 0;
        }
      }
      
      console.log('📊 State counts:', counts);
      setStateCounts(counts);
      setTenements([]); // Clear tenements in overview mode
    } catch (error) {
      console.error('Error loading state counts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load tenements for a specific state
  const loadStateTenementsData = async (jurisdiction: string) => {
    try {
      setLoading(true);
      console.log(`🔄 Loading tenements for ${jurisdiction}...`);
      
      let allTenements: Tenement[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 200;
      let totalLoaded = 0;
      
      while (hasMore) {
        const response = await fetch(`http://localhost:4000/api/tenements?jurisdiction=${jurisdiction}&limit=${limit}&page=${page}`);
        if (response.ok) {
          const data = await response.json();
          const tenements = Array.isArray(data) ? data : data.data || [];
          
          console.log(`📦 Page ${page}: received ${tenements.length} tenements for ${jurisdiction}`);
          
          if (tenements.length === 0) {
            hasMore = false;
            break;
          }
          
          // Transform tenements to include coordinates - force new coordinates each time
          const transformedTenements = tenements.map((t: any) => ({
            id: t.id,
            number: t.number,
            type: t.type,
            status: mapStatus(t.status),
            holder_name: t.holder_name || 'Unknown',
            jurisdiction: t.jurisdiction,
            area_ha: t.area_ha,
            expiry_date: t.expiry_date,
            grant_date: t.grant_date,
            coordinates: generateCoordinates(t.jurisdiction, `${t.id}-${Date.now()}`), // Add timestamp to force new coords
            geometry: null
          }));
          
          allTenements = [...allTenements, ...transformedTenements];
          totalLoaded += tenements.length;
          console.log(`📊 Total loaded so far for ${jurisdiction}: ${totalLoaded}`);
          
          // Check if there are more pages
          hasMore = data.pagination && data.pagination.hasNext;
          if (!hasMore && tenements.length === limit) {
            page++;
            hasMore = true;
          } else if (hasMore) {
            page++;
          }
          
          // Safety check
          if (page > 100) {
            console.warn(`⚠️ Stopping ${jurisdiction} load at page ${page} for safety`);
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Loaded ${allTenements.length} tenements for ${jurisdiction}`);
      console.log(`🎯 Sample coordinates:`, allTenements.slice(0, 3).map(t => `${t.number}: [${t.coordinates[0].toFixed(4)}, ${t.coordinates[1].toFixed(4)}]`));
      setTenements(allTenements);
    } catch (error) {
      console.error(`Error loading tenements for ${jurisdiction}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (status: string): 'live' | 'pending' | 'expired' => {
    const s = status?.toLowerCase() || '';
    if (s.includes('active') || s.includes('granted') || s.includes('live')) return 'live';
    if (s.includes('pending') || s.includes('application')) return 'pending';
    return 'expired';
  };

  // Load official Australian state boundaries from online source
  const [stateBoundaries, setStateBoundaries] = useState<Record<string, any>>({});

  const loadStateBoundaries = async () => {
    try {
      console.log('🗺️ Loading Australian state boundaries...');
      // Use official Australian state boundaries from GitHub
      const response = await fetch('https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format: missing features array');
      }
      
      const boundaries: Record<string, any> = {};
      
      data.features.forEach((feature: any) => {
        const stateName = feature.properties?.STATE_NAME || feature.properties?.name || '';
        let stateCode = '';
        
        // Map state names to our jurisdiction codes
        console.log('🗺️ Processing state:', stateName);
        if (stateName.includes('Western Australia')) stateCode = 'WA';
        else if (stateName.includes('New South Wales')) stateCode = 'NSW';
        else if (stateName.includes('Victoria')) stateCode = 'VIC';
        else if (stateName.includes('Northern Territory')) stateCode = 'NT';
        else if (stateName.includes('Queensland')) stateCode = 'QLD';
        else if (stateName.includes('Tasmania')) stateCode = 'TAS';
        
        if (stateCode && feature.geometry) {
          boundaries[stateCode] = feature.geometry;
          console.log(`✅ Loaded boundary for ${stateCode} (${stateName})`);
        }
      });
      
      setStateBoundaries(boundaries);
      console.log(`✅ Loaded ${Object.keys(boundaries).length} official state boundaries:`, Object.keys(boundaries));
    } catch (error) {
      console.error('❌ Failed to load state boundaries:', error);
      console.log('🔄 Using fallback bounding boxes...');
      // Fallback to conservative land-based boundaries
      setStateBoundaries({
        WA: { bbox: [113.155, -35.134, 129.001, -13.691] },
        NSW: { bbox: [140.999, -37.505, 153.639, -28.157] },
        VIC: { bbox: [140.962, -39.200, 149.977, -33.981] },
        NT: { bbox: [129.001, -26.000, 138.001, -10.962] },
        QLD: { bbox: [137.994, -29.178, 153.552, -9.142] },
        TAS: { bbox: [143.816, -43.648, 148.479, -39.573] }
      });
    }
  };

  // Load boundaries on component mount
  useEffect(() => {
    loadStateBoundaries();
  }, []);

  // Point-in-polygon check for complex state boundaries
  const isPointInPolygon = (point: [number, number], polygon: number[][][]): boolean => {
    const [lng, lat] = point;
    
    for (const ring of polygon) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        
        if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      if (inside) return true;
    }
    return false;
  };

  const generateCoordinates = (jurisdiction: string, id?: string): [number, number] => {
    // Use official state boundaries if available
    const boundary = stateBoundaries[jurisdiction];
    
    let bounds: [number, number, number, number]; // [west, south, east, north]
    
    if (boundary && boundary.bbox) {
      bounds = boundary.bbox;
    } else if (boundary && boundary.coordinates) {
      // Calculate bounding box from geometry
      bounds = calculateBoundingBox(boundary);
    } else {
      // Fallback conservative bounds
      const fallbackBounds = {
        WA: [115, -33, 126, -16] as [number, number, number, number],
        NSW: [142, -36, 151, -30] as [number, number, number, number],
        VIC: [142, -38, 148, -35] as [number, number, number, number],
        NT: [130, -24, 136, -13] as [number, number, number, number],
        QLD: [140, -28, 150, -12] as [number, number, number, number],
        TAS: [143.5, -43.5, 148.5, -39.5] as [number, number, number, number]
      };
      bounds = fallbackBounds[jurisdiction as keyof typeof fallbackBounds] || fallbackBounds.WA;
    }
    
    const [west, south, east, north] = bounds;
    
    // Use id for consistent positioning if provided
    let seedLng = Math.random();
    let seedLat = Math.random();
    
    if (id) {
      // Create a simple hash from the id for consistent coordinates
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      seedLng = Math.abs(hash % 1000) / 1000;
      seedLat = Math.abs((hash >> 10) % 1000) / 1000;
    }
    
    // Generate coordinates within the bounding box
    let lng: number, lat: number;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      lng = west + seedLng * (east - west);
      lat = south + seedLat * (north - south);
      
      // If we have polygon data, check if point is inside
      if (boundary && boundary.coordinates) {
        const polygons = boundary.type === 'MultiPolygon' ? boundary.coordinates : [boundary.coordinates];
        
        let isInside = false;
        for (const polygon of polygons) {
          if (isPointInPolygon([lng, lat], polygon)) {
            isInside = true;
            break;
          }
        }
        
        if (isInside) {
          break; // Found a valid point
        }
      } else {
        // No polygon data, use bounding box with margin
        const margin = 0.1;
        const marginLng = (east - west) * margin;
        const marginLat = (north - south) * margin;
        
        if (lng >= west + marginLng && lng <= east - marginLng && 
            lat >= south + marginLat && lat <= north - marginLat) {
          break; // Point is within margin bounds
        }
      }
      
      // Generate new random coordinates for next attempt
      attempts++;
      seedLng = Math.random();
      seedLat = Math.random();
      
    } while (attempts < maxAttempts);
    
    return [lng, lat];
  };

  // Helper function to calculate bounding box from geometry
  const calculateBoundingBox = (geometry: any): [number, number, number, number] => {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    
    const processCoordinates = (coords: any[]) => {
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoordinates(coord);
        } else {
          const [lng, lat] = coord;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      });
    };
    
    if (geometry.coordinates) {
      processCoordinates(geometry.coordinates);
    }
    
    return [minLng, minLat, maxLng, maxLat];
  };

  // Helper function to calculate polygon area (simplified)
  const calculatePolygonArea = (coordinates: number[][]): number => {
    if (!coordinates || coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    return Math.abs(area) / 2;
  };

  const applyFilters = () => {
    let filtered = tenements;
    console.log(`🔍 Starting with ${filtered.length} tenements`);
    console.log(`🔍 Current filters:`, filters);

    // Apply jurisdiction filter
    if (filters.jurisdictions.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => filters.jurisdictions.includes(t.jurisdiction));
      console.log(`🔍 After jurisdiction filter: ${beforeCount} → ${filtered.length}`);
    }

    // Apply type filter
    if (filters.types.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => filters.types.some(type => 
        t.type.toLowerCase().includes(type.toLowerCase())
      ));
      console.log(`🔍 After type filter: ${beforeCount} → ${filtered.length}`);
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => filters.statuses.includes(t.status));
      console.log(`🔍 After status filter: ${beforeCount} → ${filtered.length}`);
    }

    // Apply holder filter
    if (filters.holders.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => filters.holders.some(holder =>
        t.holder_name.toLowerCase().includes(holder.toLowerCase())
      ));
      console.log(`🔍 After holder filter: ${beforeCount} → ${filtered.length}`);
    }

    // Apply search filter
    if (filters.search) {
      const beforeCount = filtered.length;
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.number.toLowerCase().includes(search) ||
        t.holder_name.toLowerCase().includes(search) ||
        t.type.toLowerCase().includes(search)
      );
      console.log(`🔍 After search filter: ${beforeCount} → ${filtered.length}`);
    }

    console.log(`🎯 Final filtered count: ${filtered.length}`);
    setFilteredTenements(filtered);
  };

  const parseUrlParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Parse filters
    const jurisdictions = params.get('jurisdictions')?.split(',').filter(Boolean) || [];
    const types = params.get('types')?.split(',').filter(Boolean) || [];
    const statuses = params.get('statuses')?.split(',').filter(Boolean) || [];
    const holders = params.get('holders')?.split(',').filter(Boolean) || [];
    const search = params.get('search') || '';
    
    // Parse view state
    const lng = parseFloat(params.get('lng') || '133.7751');
    const lat = parseFloat(params.get('lat') || '-25.2744');
    const zoom = parseFloat(params.get('zoom') || '4');
    
    const tenementId = params.get('tenement');
    
    return {
      filters: { jurisdictions, types, statuses, holders, search },
      viewState: { longitude: lng, latitude: lat, zoom },
      tenementId
    };
  };

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add filters to URL
    if (filters.jurisdictions.length > 0) params.set('jurisdictions', filters.jurisdictions.join(','));
    if (filters.types.length > 0) params.set('types', filters.types.join(','));
    if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','));
    if (filters.holders.length > 0) params.set('holders', filters.holders.join(','));
    if (filters.search) params.set('search', filters.search);
    
    // Add view state to URL
    params.set('lng', viewState.longitude.toFixed(4));
    params.set('lat', viewState.latitude.toFixed(4));
    params.set('zoom', viewState.zoom.toFixed(2));
    
    // Add selected tenement
    if (selectedTenement) {
      params.set('tenement', selectedTenement.id);
    }
    
    // Update URL without triggering navigation
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters, viewState, selectedTenement]);

  const highlightTenement = (tenementId: string) => {
    const tenement = tenements.find(t => t.id === tenementId);
    if (tenement) {
      setSelectedTenement(tenement);
      setViewState({
        longitude: tenement.coordinates[0],
        latitude: tenement.coordinates[1],
        zoom: 10
      });
    }
  };

  const shareCurrentView = () => {
    updateUrl();
    navigator.clipboard.writeText(window.location.href);
    // TODO: Show toast notification
  };

  // Handle state selection from overview
  const handleStateClick = (jurisdiction: string) => {
    console.log(`🎯 Selecting state: ${jurisdiction}`);
    setSelectedState(jurisdiction);
    setViewMode('state');
    
    // Zoom to state bounds
    const stateBounds = getStateBounds(jurisdiction);
    setViewState({
      longitude: stateBounds.center[0],
      latitude: stateBounds.center[1],
      zoom: stateBounds.zoom
    });
  };

  // Go back to overview
  const handleBackToOverview = () => {
    console.log('🔙 Back to overview');
    setViewMode('overview');
    setSelectedState(null);
    setViewState(INITIAL_VIEW_STATE);
  };

  // Force refresh tenement coordinates
  const handleRefreshCoordinates = () => {
    if (selectedState) {
      console.log('🔄 Refreshing coordinates...');
      setTenements([]); // Clear current tenements
      loadStateTenementsData(selectedState); // Reload with new coordinates
    }
  };

  // Get bounds for each state
  const getStateBounds = (jurisdiction: string) => {
    const bounds = {
      WA: { center: [121, -25], zoom: 5 },
      NSW: { center: [147.5, -32.5], zoom: 6 },
      VIC: { center: [145.5, -36.5], zoom: 6 },
      NT: { center: [133.5, -19], zoom: 5 },
      QLD: { center: [146, -20], zoom: 5 },
      TAS: { center: [146.5, -42], zoom: 7 }
    };
    return bounds[jurisdiction as keyof typeof bounds] || bounds.WA;
  };

  // Helper function to calculate polygon centroid
  const calculateCentroid = (coordinates: number[][]): [number, number] => {
    let x = 0, y = 0;
    const n = coordinates.length;
    
    for (const [lng, lat] of coordinates) {
      x += lng;
      y += lat;
    }
    
    return [x / n, y / n];
  };

  // Create GeoJSON for state overlays (overview mode)
  const stateOverlaysGeoJSON = {
    type: 'FeatureCollection' as const,
    features: Object.entries(stateCounts).map(([jurisdiction, count]) => {
      // Use actual state boundaries if available, otherwise fallback to bounding boxes
      const boundary = stateBoundaries[jurisdiction];
      
      let geometry;
      let area = 1; // Default area for density calculation
      
      if (boundary && boundary.coordinates) {
        // Use the actual state boundary geometry
        geometry = boundary;
        
        // Calculate approximate area for density (simplified)
        if (boundary.type === 'Polygon') {
          const coords = boundary.coordinates[0];
          area = calculatePolygonArea(coords);
        } else if (boundary.type === 'MultiPolygon') {
          area = boundary.coordinates.reduce((total: number, polygon: number[][][]) => {
            return total + calculatePolygonArea(polygon[0]);
          }, 0);
        }
      } else {
        // Fallback to bounding box if no boundary data available
        const bounds = {
          WA: [115, -35, 129, -14],    // Avoid far western ocean
          NSW: [141, -37, 153, -29],   // Avoid far eastern ocean
          VIC: [141, -39, 149.5, -34], // Avoid Bass Strait
          NT: [129, -26, 138, -11],    // Central NT
          QLD: [138, -29, 153, -10],   // Avoid far eastern ocean
          TAS: [144.5, -43.5, 148.5, -40.5] // Main Tasmania island
        };
        
        const [west, south, east, north] = bounds[jurisdiction as keyof typeof bounds] || bounds.WA;
        area = (east - west) * (north - south);
        
        geometry = {
          type: 'Polygon' as const,
          coordinates: [[
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north]
          ]]
        };
      }
      
      return {
        type: 'Feature' as const,
        properties: {
          jurisdiction,
          count,
          name: jurisdiction,
          density: count / Math.abs(area) // Normalize density calculation
        },
        geometry
      };
    })
  };

  // Create separate GeoJSON for state labels (single point per state)
  const stateLabelGeoJSON = {
    type: 'FeatureCollection' as const,
    features: Object.entries(stateCounts).map(([jurisdiction, count]) => {
      // Define label positions manually for better placement
      const labelPositions = {
        WA: [121, -25],
        NSW: [147.5, -32.5],
        VIC: [145.5, -36.5],
        NT: [133.5, -19],
        QLD: [146, -20],
        TAS: [146.5, -42]
      };
      
      const position = labelPositions[jurisdiction as keyof typeof labelPositions] || [133, -25];
      
      return {
        type: 'Feature' as const,
        properties: {
          jurisdiction,
          count,
          name: jurisdiction
        },
        geometry: {
          type: 'Point' as const,
          coordinates: position
        }
      };
    })
  };

  // Create GeoJSON for tenements (state mode)
  const tenementsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: filteredTenements.map(tenement => ({
      type: 'Feature' as const,
      properties: {
        id: tenement.id,
        number: tenement.number,
        type: tenement.type,
        status: tenement.status,
        holder_name: tenement.holder_name,
        jurisdiction: tenement.jurisdiction,
        area_ha: tenement.area_ha,
        color: STATUS_COLORS[tenement.status]
      },
      geometry: {
        type: 'Point' as const,
        coordinates: tenement.coordinates
      }
    }))
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {viewMode === 'state' && (
            <button
              onClick={handleBackToOverview}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Back to Overview</span>
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {viewMode === 'overview' ? 'Australia Tenements Overview' : `${selectedState} Tenements`}
          </h1>
          <div className="text-sm text-gray-500">
            {loading ? 'Loading...' : 
             viewMode === 'overview' ? 
               `${Object.values(stateCounts).reduce((sum, count) => sum + count, 0).toLocaleString()} total tenements` :
               `${filteredTenements.length.toLocaleString()} tenements in ${selectedState}`
            }
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh button for state view */}
          {viewMode === 'state' && (
            <button
              onClick={handleRefreshCoordinates}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              title="Refresh coordinates (fix ocean tenements)"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          )}
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenements..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          {/* Layers Toggle */}
          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showLayers ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Layers</span>
          </button>
          
          {/* Share */}
          <button
            onClick={shareCurrentView}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Map */}
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onClick={(e) => {
            // Handle tenement clicks in state mode
            if (viewMode === 'state' && e.features && e.features.length > 0) {
              const feature = e.features[0];
              if (feature.layer?.id === 'unclustered-point') {
                const tenementId = feature.properties?.id;
                if (tenementId) {
                  const tenement = filteredTenements.find(t => t.id === tenementId);
                  if (tenement) {
                    setSelectedTenement(tenement);
                    return;
                  }
                }
              }
            }
            
            // Handle state clicks in overview mode
            if (viewMode === 'overview' && e.features && e.features.length > 0) {
              const feature = e.features[0];
              if (feature.layer?.id === 'state-fills') {
                const jurisdiction = feature.properties?.jurisdiction;
                if (jurisdiction) {
                  handleStateClick(jurisdiction);
                  return;
                }
              }
            }
            
            // Clear selected tenement
            setSelectedTenement(null);
          }}
          interactiveLayerIds={viewMode === 'overview' ? ['state-fills'] : ['unclustered-point', 'clusters']}
        >
          {/* State Overlays (Overview Mode) */}
          {viewMode === 'overview' && (
            <>
              <Source id="state-overlays" type="geojson" data={stateOverlaysGeoJSON}>
                <Layer
                  id="state-fills"
                  type="fill"
                  paint={{
                    'fill-color': [
                      'match',
                      ['get', 'jurisdiction'],
                      'WA', '#3b82f6',
                      'NSW', '#10b981',
                      'VIC', '#f59e0b',
                      'NT', '#ef4444',
                      'QLD', '#8b5cf6',
                      'TAS', '#06b6d4',
                      '#6b7280'
                    ],
                    'fill-opacity': 0.3
                  }}
                />
                <Layer
                  id="state-borders"
                  type="line"
                  paint={{
                    'line-color': [
                      'match',
                      ['get', 'jurisdiction'],
                      'WA', '#1d4ed8',
                      'NSW', '#047857',
                      'VIC', '#d97706',
                      'NT', '#dc2626',
                      'QLD', '#7c3aed',
                      'TAS', '#0891b2',
                      '#374151'
                    ],
                    'line-width': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      2, 2,
                      6, 3,
                      10, 4
                    ],
                    'line-opacity': 0.9
                  }}
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round'
                  }}
                />
              </Source>
              
              {/* Separate source for state labels */}
              <Source id="state-labels" type="geojson" data={stateLabelGeoJSON}>
                <Layer
                  id="state-labels"
                  type="symbol"
                  layout={{
                    'text-field': [
                      'format',
                      ['get', 'jurisdiction'],
                      { 'font-scale': 1.2 },
                      '\n',
                      {},
                      ['concat', ['get', 'count'], ' tenements'],
                      { 'font-scale': 0.8 }
                    ],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                    'text-anchor': 'center',
                    'text-allow-overlap': false,
                    'text-ignore-placement': false
                  }}
                  paint={{
                    'text-color': '#1e40af',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                  }}
                />
              </Source>
            </>
          )}

          {/* Tenement Layers (State Mode) */}
          {viewMode === 'state' && filteredTenements.length > 0 && (
            <Source
              id="tenements"
              type="geojson"
              data={tenementsGeoJSON}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              {/* Clustered points */}
              <Layer
                id="clusters"
                type="circle"
                source="tenements"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                  ],
                  'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                  ],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }}
              />

              {/* Cluster count labels */}
              <Layer
                id="cluster-count"
                type="symbol"
                source="tenements"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count_abbreviated}',
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 12
                }}
              />

              {/* Individual points */}
              <Layer
                id="unclustered-point"
                type="circle"
                source="tenements"
                filter={['!', ['has', 'point_count']]}
                paint={{
                  'circle-color': [
                    'match',
                    ['get', 'status'],
                    'live', '#10b981',
                    'pending', '#f59e0b',
                    'expired', '#ef4444',
                    '#6b7280'
                  ],
                  'circle-radius': 6,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }}
              />
            </Source>
          )}

          {/* Selected Tenement Popup */}
          {selectedTenement && (
            <Popup
              longitude={selectedTenement.coordinates[0]}
              latitude={selectedTenement.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedTenement(null)}
              className="tenement-popup"
              closeOnClick={false}
              maxWidth="400px"
            >
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-900 truncate">{selectedTenement.number}</h3>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{selectedTenement.type}</p>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap uppercase tracking-wide ${
                        selectedTenement.status === 'live' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        selectedTenement.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {selectedTenement.status}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {selectedTenement.jurisdiction}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    {/* Holder Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Holder Information
                      </h4>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedTenement.holder_name || 'Unknown Holder'}
                      </p>
                    </div>

                    {/* Tenement Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Area</p>
                        <p className="text-sm font-bold text-blue-900">
                          {selectedTenement.area_ha ? `${selectedTenement.area_ha.toLocaleString()} ha` : 'Not specified'}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Jurisdiction</p>
                        <p className="text-sm font-bold text-purple-900">{selectedTenement.jurisdiction}</p>
                      </div>
                    </div>

                    {/* Date Information */}
                    {(selectedTenement.grant_date || selectedTenement.expiry_date) && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Important Dates
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedTenement.grant_date && (
                            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium text-green-700">Granted</span>
                              <span className="text-sm font-bold text-green-900">
                                {new Date(selectedTenement.grant_date).toLocaleDateString('en-AU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {selectedTenement.expiry_date && (
                            <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg">
                              <span className="text-sm font-medium text-orange-700">Expires</span>
                              <span className="text-sm font-bold text-orange-900">
                                {new Date(selectedTenement.expiry_date).toLocaleDateString('en-AU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {selectedTenement.coordinates[1].toFixed(4)}°, {selectedTenement.coordinates[0].toFixed(4)}°
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {selectedTenement.id.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/tenements/details/${selectedTenement.id}`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Full Record</span>
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-4 left-4 z-10">
            <MapFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
              tenements={tenements}
            />
          </div>
        )}

        {/* Layers Panel */}
        {showLayers && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Map Layers</h3>
              <button
                onClick={() => setShowLayers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(layerVisibility).map(([key, visible]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setLayerVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center bg-white p-6 rounded-lg shadow-lg border">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">Loading Tenements</p>
              <p className="text-sm text-gray-600 mb-4">
                {loadingProgress.length > 0 
                  ? `Loading from ${loadingProgress.length} jurisdictions...`
                  : 'Initializing...'
                }
              </p>
              
              {loadingProgress.length > 0 && (
                <div className="space-y-2 text-left">
                  {loadingProgress.map(({jurisdiction, count}) => (
                    <div key={jurisdiction} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{jurisdiction}:</span>
                      <span className="text-emerald-600">
                        {count.toLocaleString()} tenements
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-emerald-600">
                        {loadingProgress.reduce((sum, p) => sum + p.count, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
