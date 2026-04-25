import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InteractiveMapProps {
  center: [number, number];
  zoom: number;
  layers?: any[];
  onLayerAdd?: (layer: any) => void;
  onLayerDelete?: (layerId: string) => void;
  onMapUpdate?: (center: [number, number], zoom: number) => void;
  editable?: boolean;
}

const MapUpdater = ({ center, zoom, onUpdate }: { center: [number, number], zoom: number, onUpdate: (center: [number, number], zoom: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    map.on('moveend', () => {
      const newCenter = map.getCenter();
      onUpdate([newCenter.lat, newCenter.lng], map.getZoom());
    });
  }, [map, onUpdate]);

  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  center, 
  zoom, 
  layers = [], 
  onLayerAdd, 
  onLayerDelete, 
  onMapUpdate,
  editable = false 
}) => {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {onMapUpdate && <MapUpdater center={center} zoom={zoom} onUpdate={onMapUpdate} />}
      
      {layers.map((layer) => {
        if (layer.type === 'marker' && layer.coordinates) {
          return (
            <Marker key={layer.id} position={[layer.coordinates.lat, layer.coordinates.lng]}>
              <Popup>Marker: {layer.id}</Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
};

export default InteractiveMap;
