'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Filter, Search, X, RotateCcw, Layers } from 'lucide-react';
import MapFiltersComponent from '@/components/map/MapFilters';

// Mapbox access token - you'll need to set this in your environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example';

interface Tenement {
  id: string;
  number: string;
  type: string;
  status: string;
  jurisdiction: string;
  holder_name: string;
  expiry_date?: string;
  area_ha?: number;
  geometry?: any;
  coordinates?: [number, number];
}

interface MapFilters {
  jurisdictions: string[];
  types: string[];
  statuses: string[];
  holders: string[];
  search: string;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [tenements, setTenements] = useState<Tenement[]>([]);
  const [filteredTenements, setFilteredTenements] = useState<Tenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState<MapFilters>({
    jurisdictions: ['WA', 'NSW', 'VIC', 'QLD', 'NT', 'TAS'], // Default to all jurisdictions
    types: [],
    statuses: ['live', 'pending'], // Default to active statuses
    holders: [],
    search: ''
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [133.7751, -25.2744], // Center of Australia
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fetch tenements data
  useEffect(() => {
    const fetchTenements = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tenements?limit=1000');
        if (!response.ok) {
          throw new Error('Failed to fetch tenements');
        }
        const data = await response.json();
        setTenements(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching tenements:', err);
        setError('Failed to load tenements data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenements();
  }, []);

  // Filter tenements based on current filters
  useEffect(() => {
    let filtered = tenements;

    // Apply jurisdiction filter
    if (filters.jurisdictions.length > 0) {
      filtered = filtered.filter(t => filters.jurisdictions.includes(t.jurisdiction));
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(t => filters.statuses.includes(t.status?.toLowerCase()));
    }

    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(t => 
        filters.types.some(type => t.type?.toLowerCase().includes(type.toLowerCase()))
      );
    }

    // Apply holder filter
    if (filters.holders.length > 0) {
      filtered = filtered.filter(t =>
        filters.holders.some(holder =>
          t.holder_name?.toLowerCase().includes(holder.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.number?.toLowerCase().includes(search) ||
        t.holder_name?.toLowerCase().includes(search) ||
        t.type?.toLowerCase().includes(search)
      );
    }

    setFilteredTenements(filtered);
  }, [tenements, filters]);

  // Add Australian state boundaries
  useEffect(() => {
    if (!map.current) return;

    const addStateBoundaries = () => {
      if (!map.current || map.current.getSource('state-boundaries')) return;

      // Add state boundaries source and layer
      map.current.addSource('state-boundaries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // WA boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'Western Australia', code: 'WA' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [112.9, -35.1], [129.0, -35.1], [129.0, -13.7], [112.9, -13.7], [112.9, -35.1]
                ]]
              }
            },
            // NSW boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'New South Wales', code: 'NSW' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [140.9, -37.5], [153.6, -37.5], [153.6, -28.2], [140.9, -28.2], [140.9, -37.5]
                ]]
              }
            },
            // VIC boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'Victoria', code: 'VIC' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [140.9, -39.2], [149.9, -39.2], [149.9, -33.9], [140.9, -33.9], [140.9, -39.2]
                ]]
              }
            },
            // QLD boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'Queensland', code: 'QLD' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [137.9, -29.0], [153.6, -29.0], [153.6, -10.4], [137.9, -10.4], [137.9, -29.0]
                ]]
              }
            },
            // NT boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'Northern Territory', code: 'NT' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [129.0, -26.0], [138.0, -26.0], [138.0, -10.9], [129.0, -10.9], [129.0, -26.0]
                ]]
              }
            },
            // SA boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'South Australia', code: 'SA' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [129.0, -38.0], [141.0, -38.0], [141.0, -26.0], [129.0, -26.0], [129.0, -38.0]
                ]]
              }
            },
            // TAS boundary (simplified)
            {
              type: 'Feature',
              properties: { name: 'Tasmania', code: 'TAS' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [143.8, -43.6], [148.4, -43.6], [148.4, -39.6], [143.8, -39.6], [143.8, -43.6]
                ]]
              }
            }
          ]
        }
      });

      // Add state boundary lines
      map.current.addLayer({
        id: 'state-boundaries',
        type: 'line',
        source: 'state-boundaries',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Add state labels
      map.current.addLayer({
        id: 'state-labels',
        type: 'symbol',
        source: 'state-boundaries',
        layout: {
          'text-field': ['get', 'code'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      });
    };

    // Wait for map style to load before adding layers
    if (map.current.isStyleLoaded()) {
      addStateBoundaries();
    } else {
      map.current.on('styledata', addStateBoundaries);
    }

    // Cleanup event listener
    return () => {
      if (map.current) {
        map.current.off('styledata', addStateBoundaries);
      }
    };
  }, []);

  // Add tenements to map
  useEffect(() => {
    if (!map.current || !filteredTenements.length) return;

    const addTenements = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      // Remove existing tenement layers and sources
      if (map.current.getLayer('tenements-layer')) {
        map.current.removeLayer('tenements-layer');
      }
      if (map.current.getLayer('tenement-polygons')) {
        map.current.removeLayer('tenement-polygons');
      }
      if (map.current.getLayer('clusters')) {
        map.current.removeLayer('clusters');
      }
      if (map.current.getLayer('cluster-count')) {
        map.current.removeLayer('cluster-count');
      }
      if (map.current.getSource('tenements')) {
        map.current.removeSource('tenements');
      }
      if (map.current.getSource('tenement-polygons')) {
        map.current.removeSource('tenement-polygons');
      }

    // Create point features for clustering
    const pointFeatures = filteredTenements
      .filter(t => t.coordinates && Array.isArray(t.coordinates) && t.coordinates.length === 2)
      .map(tenement => ({
        type: 'Feature' as const,
        properties: {
          id: tenement.id,
          number: tenement.number,
          type: tenement.type,
          status: tenement.status,
          jurisdiction: tenement.jurisdiction,
          holder_name: tenement.holder_name,
          expiry_date: tenement.expiry_date,
          area_ha: tenement.area_ha
        },
        geometry: {
          type: 'Point' as const,
          coordinates: tenement.coordinates as [number, number]
        }
      }));

    // Create polygon features for tenement boundaries (simplified rectangles based on area)
    const polygonFeatures = filteredTenements
      .filter(t => t.coordinates && Array.isArray(t.coordinates) && t.coordinates.length === 2 && t.area_ha)
      .map(tenement => {
        const [lng, lat] = tenement.coordinates as [number, number];
        const area = tenement.area_ha || 100; // Default 100 hectares
        
        // Calculate approximate rectangle size based on area (very simplified)
        const sizeKm = Math.sqrt(area / 100) * 0.01; // Rough conversion
        const sizeDeg = sizeKm / 111; // Rough degrees conversion
        
        return {
          type: 'Feature' as const,
          properties: {
            id: tenement.id,
            number: tenement.number,
            type: tenement.type,
            status: tenement.status,
            jurisdiction: tenement.jurisdiction,
            holder_name: tenement.holder_name,
            expiry_date: tenement.expiry_date,
            area_ha: tenement.area_ha
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [lng - sizeDeg, lat - sizeDeg],
              [lng + sizeDeg, lat - sizeDeg],
              [lng + sizeDeg, lat + sizeDeg],
              [lng - sizeDeg, lat + sizeDeg],
              [lng - sizeDeg, lat - sizeDeg]
            ]]
          }
        };
      });

      if (pointFeatures.length === 0) return;

    // Add polygon source for tenement boundaries
    if (polygonFeatures.length > 0) {
      map.current.addSource('tenement-polygons', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: polygonFeatures
        }
      });

      // Add polygon layer for tenement boundaries
      map.current.addLayer({
        id: 'tenement-polygons',
        type: 'fill',
        source: 'tenement-polygons',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'live', '#10b981',
            'pending', '#f59e0b',
            'expired', '#ef4444',
            '#6b7280'
          ],
          'fill-opacity': 0.3,
          'fill-outline-color': [
            'match',
            ['get', 'status'],
            'live', '#059669',
            'pending', '#d97706',
            'expired', '#dc2626',
            '#4b5563'
          ]
        }
      });
    }

    // Add point source for clustering
    map.current.addSource('tenements', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: pointFeatures
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layer
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'tenements',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1c40f',
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
        ]
      }
    });

    // Add cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'tenements',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Add individual tenement points
    map.current.addLayer({
      id: 'tenements-layer',
      type: 'circle',
      source: 'tenements',
      filter: ['!', ['has', 'point_count']],
      paint: {
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
      }
    });

    // Add click handlers for polygons
    map.current.on('click', 'tenement-polygons', (e) => {
      const coordinates = (e.lngLat as any);
      const properties = e.features![0].properties!;

      // Create popup content
      const popupContent = `
        <div class="p-3">
          <h3 class="font-semibold text-lg mb-2">${properties.number}</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Type:</strong> ${properties.type}</p>
            <p><strong>Status:</strong> <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              properties.status === 'live' ? 'bg-green-100 text-green-800' :
              properties.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }">${properties.status}</span></p>
            <p><strong>Jurisdiction:</strong> ${properties.jurisdiction}</p>
            <p><strong>Holder:</strong> ${properties.holder_name}</p>
            ${properties.area_ha ? `<p><strong>Area:</strong> ${properties.area_ha} ha</p>` : ''}
            ${properties.expiry_date ? `<p><strong>Expires:</strong> ${new Date(properties.expiry_date).toLocaleDateString()}</p>` : ''}
          </div>
          <div class="mt-3 pt-2 border-t">
            <a href="/tenements/${properties.jurisdiction}/${encodeURIComponent(properties.number.replace(/\s+/g, '-'))}" class="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View Details →
            </a>
          </div>
        </div>
      `;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map.current!);
    });

    // Add click handlers for clusters
    map.current.on('click', 'clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties!.cluster_id;
      (map.current!.getSource('tenements') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        }
      );
    });

    map.current.on('click', 'tenements-layer', (e) => {
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const properties = e.features![0].properties!;

      // Create popup content
      const popupContent = `
        <div class="p-3">
          <h3 class="font-semibold text-lg mb-2">${properties.number}</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Type:</strong> ${properties.type}</p>
            <p><strong>Status:</strong> <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              properties.status === 'live' ? 'bg-green-100 text-green-800' :
              properties.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }">${properties.status}</span></p>
            <p><strong>Jurisdiction:</strong> ${properties.jurisdiction}</p>
            <p><strong>Holder:</strong> ${properties.holder_name}</p>
            ${properties.area_ha ? `<p><strong>Area:</strong> ${properties.area_ha} ha</p>` : ''}
            ${properties.expiry_date ? `<p><strong>Expires:</strong> ${new Date(properties.expiry_date).toLocaleDateString()}</p>` : ''}
          </div>
          <div class="mt-3 pt-2 border-t">
            <a href="/tenements/${properties.jurisdiction}/${encodeURIComponent(properties.number.replace(/\s+/g, '-'))}" class="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View Details →
            </a>
          </div>
        </div>
      `;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'clusters', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'clusters', () => {
      map.current!.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', 'tenements-layer', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'tenements-layer', () => {
      map.current!.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', 'tenement-polygons', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'tenement-polygons', () => {
      map.current!.getCanvas().style.cursor = '';
    });

    };

    // Wait for map style to load before adding layers
    if (map.current.isStyleLoaded()) {
      addTenements();
    } else {
      map.current.on('styledata', addTenements);
    }

    // Cleanup event listener
    return () => {
      if (map.current) {
        map.current.off('styledata', addTenements);
      }
    };

  }, [filteredTenements]);

  const handleFiltersChange = (newFilters: MapFilters) => {
    setFilters(newFilters);
  };

  const resetView = () => {
    if (map.current) {
      map.current.easeTo({
        center: [133.7751, -25.2744],
        zoom: 4
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters(prev => ({ ...prev, search: '' }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Map Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tenements...</p>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 bg-white rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-r-lg hover:bg-emerald-700"
          >
            Search
          </button>
        </form>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 hover:bg-gray-50 flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {(filters.jurisdictions.length < 6 || filters.statuses.length < 2 || filters.types.length > 0 || filters.holders.length > 0) && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Reset View */}
        <button
          onClick={resetView}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 hover:bg-gray-50 flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Results Counter */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">
              {filteredTenements.length.toLocaleString()} tenements
            </span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-4 left-80 z-20">
          <MapFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setShowFilters(false)}
            tenements={tenements}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Expired</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
