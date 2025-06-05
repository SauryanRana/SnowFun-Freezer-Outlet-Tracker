'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiInfo } from 'react-icons/fi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Nepal's approximate center coordinates
const NEPAL_CENTER = [28.3949, 84.1240];
const DEFAULT_ZOOM = 7;

// Custom icon factory for shop markers
const createShopIcon = (status) => {
  // Different colors based on visit status
  const markerColor = status === 'visited' ? '#10b981' : // green for visited
                     status === 'not_visited' ? '#f59e0b' : // amber for not visited
                     status === 'needs_attention' ? '#ef4444' : // red for needs attention
                     '#3b82f6'; // blue default

  // SVG icon with ice cream shape
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${markerColor}" width="36" height="36">
        <path d="M18.5 8a5.5 5.5 0 10-11 0 3.5 3.5 0 00.97 6.91A3 3 0 0112 21a3 3 0 013.54-2.95 3.5 3.5 0 002.96-3.55A3.5 3.5 0 0018.5 8z"/>
      </svg>
    `,
    className: 'custom-shop-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Custom icon for dealer markers
const dealerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="40" height="40">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  `,
  className: 'custom-dealer-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

/**
 * Interactive Nepal Map component using Leaflet
 * 
 * @param {Object} props Component props
 * @param {Array} props.shops Array of shop objects with coordinates
 * @param {Array} props.dealers Array of dealer objects with coordinates
 * @param {Object} props.selectedShop Currently selected shop (if any)
 * @param {Object} props.selectedDealer Currently selected dealer (if any)
 * @param {Function} props.onShopSelect Callback when shop is clicked
 * @param {Function} props.onDealerSelect Callback when dealer is clicked
 * @param {number} props.height Map height in pixels (default: 500)
 * @param {boolean} props.showVisitStatus Whether to color markers by visit status
 * @param {boolean} props.isLoading Loading state
 */
export default function NepalMap({
  shops = [],
  dealers = [],
  selectedShop = null,
  selectedDealer = null,
  onShopSelect = () => {},
  onDealerSelect = () => {},
  height = 500,
  showVisitStatus = false,
  isLoading = false,
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const dealersLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: NEPAL_CENTER,
      zoom: DEFAULT_ZOOM,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
      ],
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Create layers for markers
    markersLayerRef.current = L.layerGroup().addTo(map);
    dealersLayerRef.current = L.layerGroup().addTo(map);

    // Store map reference
    leafletMapRef.current = map;
    setMapReady(true);

    // Cleanup on unmount
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
        dealersLayerRef.current = null;
      }
    };
  }, []);

  // Update shop markers when shops data changes
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || shops.length === 0) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add shop markers
    const bounds = L.latLngBounds();
    
    shops.forEach((shop) => {
      if (!shop.latitude || !shop.longitude) return;
      
      const position = [parseFloat(shop.latitude), parseFloat(shop.longitude)];
      bounds.extend(position);
      
      // Determine marker status for coloring
      let status = 'default';
      if (showVisitStatus) {
        status = shop.visitedToday ? 'visited' : 'not_visited';
        if (shop.needsAttention) status = 'needs_attention';
      }
      
      // Create marker with custom icon
      const marker = L.marker(position, {
        icon: createShopIcon(status),
        title: shop.name,
      });
      
      // Add popup with shop info
      marker.bindPopup(`
        <div class="shop-popup">
          <h3 class="font-bold">${shop.name}</h3>
          <p>${shop.addressText || ''}</p>
          ${shop.fridgeCount ? `<p>Freezers: ${shop.fridgeCount}</p>` : ''}
          <button class="view-shop-btn">View Details</button>
        </div>
      `);
      
      // Add click handler
      marker.on('click', () => {
        onShopSelect(shop.id);
      });
      
      // Add to layer
      markersLayerRef.current.addLayer(marker);
    });
    
    // Fit map to bounds if we have markers
    if (bounds.isValid() && shops.length > 1) {
      leafletMapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
      });
    }
  }, [shops, mapReady, showVisitStatus, onShopSelect]);

  // Update dealer markers when dealers data changes
  useEffect(() => {
    if (!mapReady || !dealersLayerRef.current) return;

    // Clear existing dealer markers
    dealersLayerRef.current.clearLayers();

    // Add dealer markers if we have coordinates
    dealers.forEach((dealer) => {
      if (!dealer.latitude || !dealer.longitude) return;
      
      const position = [parseFloat(dealer.latitude), parseFloat(dealer.longitude)];
      
      // Create marker with custom icon
      const marker = L.marker(position, {
        icon: dealerIcon,
        title: dealer.name,
      });
      
      // Add popup with dealer info
      marker.bindPopup(`
        <div class="dealer-popup">
          <h3 class="font-bold">${dealer.name}</h3>
          <p>District: ${dealer.district}</p>
          ${dealer.municipality ? `<p>Municipality: ${dealer.municipality}</p>` : ''}
          <button class="view-dealer-btn">View Shops</button>
        </div>
      `);
      
      // Add click handler
      marker.on('click', () => {
        onDealerSelect(dealer.id);
      });
      
      // Add to layer
      dealersLayerRef.current.addLayer(marker);
    });
  }, [dealers, mapReady, onDealerSelect]);

  // Update map when selected shop changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !selectedShop) return;
    
    // Pan to selected shop
    if (selectedShop.latitude && selectedShop.longitude) {
      const position = [parseFloat(selectedShop.latitude), parseFloat(selectedShop.longitude)];
      leafletMapRef.current.setView(position, 15);
    }
  }, [selectedShop, mapReady]);

  // Update map when selected dealer changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !selectedDealer) return;
    
    // Pan to selected dealer
    if (selectedDealer.latitude && selectedDealer.longitude) {
      const position = [parseFloat(selectedDealer.latitude), parseFloat(selectedDealer.longitude)];
      leafletMapRef.current.setView(position, 12);
    }
  }, [selectedDealer, mapReady]);

  // Resize handler for map
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    
    const handleResize = () => {
      leafletMapRef.current.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial invalidate size to ensure proper rendering
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapReady]);

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {isLoading && (
        <div className="absolute inset-0 bg-sky-50 bg-opacity-70 z-10 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading map data..." />
        </div>
      )}
      
      {shops.length === 0 && dealers.length === 0 && !isLoading && (
        <div className="absolute inset-0 bg-sky-50 flex flex-col items-center justify-center text-gray-500">
          <FiInfo size={24} className="mb-2" />
          <p>No locations to display</p>
        </div>
      )}
      
      <div 
        ref={mapRef}
        className="w-full h-full z-0 rounded-b-xl"
        style={{ height: '100%' }}
      />
      
      {/* Map Legend for small screens - shown at bottom on mobile */}
      <div className="absolute bottom-2 left-2 right-2 md:hidden bg-white bg-opacity-90 p-2 rounded-lg shadow-md text-xs flex justify-around">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
          <span>Visited</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
          <span>Not Visited</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
          <span>Dealer</span>
        </div>
      </div>
    </div>
  );
}
