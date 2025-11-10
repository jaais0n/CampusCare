import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SOSAlert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved: boolean;
  profiles: { full_name: string | null; roll_number: string | null } | null;
}

interface LiveLocationMapProps {
  location?: { latitude: number; longitude: number };
  isActive?: boolean;
  sosAlerts?: SOSAlert[];
}

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({ location, isActive, sosAlerts = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!leafletMapRef.current && mapContainerRef.current) {
      leafletMapRef.current = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '',
        className: 'map-tiles' // Add class for dark mode
      }).addTo(leafletMapRef.current);

      markerLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
      console.log("LiveLocationMap - Map initialized."); // Debugging line
    }

    // Define custom SOS icon
    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: `<div class="w-4 h-4 rounded-full ${isActive ? 'bg-red-600 animate-pulse shadow-[0_0_15px_3px_rgba(220,38,38,0.7)]' : 'bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.5)]'} border-2 border-white"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const sosIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:#e74c3c; width:1.5rem; height:1.5rem; display:flex; align-items:center; justify-content:center; border-radius:50%; color:white; font-weight:bold;">!</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });

    markerLayerRef.current?.clearLayers();
    const latLngs: L.LatLngExpression[] = [];

    if (location) {
      const { latitude, longitude } = location;
      const userLatLng: L.LatLngExpression = [latitude, longitude];
      const marker = L.marker(userLatLng, { icon: userIcon });
      markerLayerRef.current?.addLayer(marker);
      leafletMapRef.current?.flyTo(userLatLng, 18, { duration: 1.2 });
    }

    const validAlerts = (sosAlerts || []).filter(
      (a) => typeof a.latitude === 'number' && isFinite(a.latitude) && typeof a.longitude === 'number' && isFinite(a.longitude)
    );

    if (validAlerts.length > 0) {
      validAlerts.forEach((alert) => {
        const { latitude, longitude, profiles } = alert;
        const userName = profiles?.full_name || profiles?.roll_number || "Unknown User";
        const marker = L.marker([latitude, longitude], { icon: sosIcon }).bindPopup(
          `<b>${userName}</b><br>Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
        );
        markerLayerRef.current?.addLayer(marker);
        latLngs.push([latitude, longitude]);
      });
    }

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      leafletMapRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else if (!location && leafletMapRef.current) {
      leafletMapRef.current.setView([20.5937, 78.9629], 5);
    }

    // Ensure Leaflet recalculates size after React paints
    setTimeout(() => {
      try { leafletMapRef.current?.invalidateSize(); } catch {}
    }, 0);

    // Recalculate on window resize
    const onWindowResize = () => {
      try { leafletMapRef.current?.invalidateSize(); } catch {}
    };
    window.addEventListener('resize', onWindowResize);

    // Recalculate when container size changes (e.g., left column grows)
    let ro: ResizeObserver | null = null;
    const container = mapContainerRef.current;
    if (container && 'ResizeObserver' in window) {
      let raf: number | null = null;
      ro = new ResizeObserver(() => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          try { leafletMapRef.current?.invalidateSize(); } catch {}
        });
      });
      ro.observe(container);
    }

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (ro && container) ro.unobserve(container);
    };
  }, [location, isActive, sosAlerts]);

  return <div ref={mapContainerRef} id="map" className="w-full h-full rounded-lg" />;
};

export default LiveLocationMap;