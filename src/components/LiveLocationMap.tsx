import React, { useEffect, useRef } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface LiveLocationMapProps {
  location: Location | null;
  isActive?: boolean;
}

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({ location, isActive = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !location) return;

    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      // Add Leaflet CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L) return;

      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        // Disable default attribution control for a cleaner UI
        mapInstanceRef.current = L.map(mapRef.current, { attributionControl: false }).setView(
          [location.latitude, location.longitude],
          16
        );

        // Add tile layer (attribution handled by our custom overlay below)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Add pulsing animation CSS
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse-marker {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes ripple {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(3);
              opacity: 0;
            }
          }
          
          .pulsing-marker {
            animation: pulse-marker 2s ease-in-out infinite;
          }
          
          .location-ripple {
            animation: ripple 2s ease-out infinite;
          }
        `;
        document.head.appendChild(style);
      }

      // Update marker position
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      if (accuracyCircleRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
      }

      // Create custom pulsing marker
      const pulsingIcon = L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
          <div style="
            position: relative;
            width: 24px;
            height: 24px;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 12px;
              height: 12px;
              background: #dc2626;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 2px #dc2626;
              z-index: 2;
              animation: pulse-marker 2s ease-in-out infinite;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 12px;
              height: 12px;
              background: #dc2626;
              border-radius: 50%;
              opacity: 0.3;
              animation: ripple 2s ease-out infinite;
              z-index: 1;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add marker
      markerRef.current = L.marker([location.latitude, location.longitude], {
        icon: pulsingIcon,
      }).addTo(mapInstanceRef.current);

      // Add accuracy circle
      accuracyCircleRef.current = L.circle([location.latitude, location.longitude], {
        radius: 50, // 50 meters accuracy
        fillColor: '#dc2626',
        fillOpacity: 0.1,
        color: '#dc2626',
        weight: 2,
        opacity: 0.3,
      }).addTo(mapInstanceRef.current);

      // Pan to new location
      mapInstanceRef.current.setView([location.latitude, location.longitude], 16);
    };

    loadLeaflet();

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location]);

  // Enhanced pulsing animation when active
  useEffect(() => {
    if (isActive && markerRef.current) {
      const markerElement = markerRef.current.getElement();
      if (markerElement) {
        markerElement.style.animation = 'pulse-marker 1s ease-in-out infinite';
      }
    }
  }, [isActive]);

  if (!location) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Getting location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Location info overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {location.address}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Live indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      )}

      {/* Subtle attribution overlay to remain compliant */}
      <div className="absolute bottom-1 right-2 text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 shadow-sm">
        Map data © OpenStreetMap contributors
      </div>
    </div>
  );
};

export default LiveLocationMap;