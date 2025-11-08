import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { Snackbar, Alert } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// import leaflet-draw JS so L.Control.Draw is registered on the global Leaflet object
import 'leaflet-draw';
// geometry util for geodesic area calculation
import 'leaflet-geometryutil';

// Extend leaflet types
declare module 'leaflet' {
  namespace Control {
    interface DrawConstructor {
      new(options?: Control.DrawOptions): Control.Draw;
    }
    interface Draw extends Control {
      setOptions(options: Control.DrawOptions): void;
    }
  }
  interface GeometryUtil {
    geodesicArea(latLngs: { lat: number; lng: number }[]): number;
  }
}

// Fix for default marker icons
L.Icon.Default.imagePath = 'leaflet/dist/images/';

// Custom North Arrow component
const NorthArrow = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '10px',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <div style={{ 
        transform: 'rotate(0deg)',
        fontSize: '24px'
      }}>
        ⬆️
      </div>
      <div style={{ textAlign: 'center', fontSize: '12px' }}>N</div>
    </div>
  );
};

// Map controller component to handle draw controls
const MapController: React.FC<{
  onAreaUpdate: (area: number) => void;
  featureGroupRef: React.RefObject<L.FeatureGroup | null>;
}> = ({ onAreaUpdate, featureGroupRef }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          showArea: true
        },
      },
      edit: {
        featureGroup: featureGroupRef.current,
      }
    });

    map.addControl(drawControl);

    // Handle created shapes
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer as L.Polygon;
      featureGroupRef.current?.clearLayers();
      featureGroupRef.current?.addLayer(layer);
      
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      const latLngLiterals = latLngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
      const areaInSqMeters = L.GeometryUtil.geodesicArea(latLngLiterals);
      const areaInSqKm = (areaInSqMeters / 1000000);
      onAreaUpdate(parseFloat(areaInSqKm.toFixed(4)));
    });

    return () => {
      map.removeControl(drawControl);
    };
  }, [map, onAreaUpdate, featureGroupRef]);

  return null;
};

const MapView: React.FC = () => {
  const [area, setArea] = useState<number>(0);
  // allow null initial value so the ref type matches runtime
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India
  const defaultZoom = 5;

  const handleSaveLayout = async () => {
    if (!featureGroupRef.current || featureGroupRef.current.getLayers().length === 0) {
      alert('Please draw a plot boundary first');
      return;
    }

    const layer = featureGroupRef.current.getLayers()[0] as L.Polygon;
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    const coordinates = latLngs.map(ll => ({
      lat: ll.lat,
      lng: ll.lng
    }));

    try {
      // Use central api instance (handles baseURL + auth)
      const resp = await api.post('/maps/save-layout', { coordinates, area });
      console.log('Save layout response', resp.data);
      setSnack({ open: true, message: 'Layout saved successfully', severity: 'success' });
    } catch (err: any) {
      console.error('Error saving layout:', err);
      const message = err?.response?.data?.message || err?.message || 'Unknown error';
      setSnack({ open: true, message: `Error saving layout: ${message}`, severity: 'error' });
    }
  };

  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const handleSnackClose = (_: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnack(s => ({ ...s, open: false }));
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Use an English-labeled basemap (Carto Voyager) to show names in English */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
        />
        <FeatureGroup ref={featureGroupRef}>
          {/* always render controller; it will no-op until featureGroupRef.current is available */}
          <MapController onAreaUpdate={setArea} featureGroupRef={featureGroupRef} />
        </FeatureGroup>
        <NorthArrow />
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'white',
        padding: '15px',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <div><strong>Plot Area:</strong> {area} km²</div>
        <button 
          onClick={handleSaveLayout}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Layout
        </button>
      </div>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleSnackClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MapView;