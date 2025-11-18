import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import { LatLngTuple, Icon } from 'leaflet';
import { Box, Paper, Toolbar, IconButton, Typography, Tooltip } from '@mui/material';
import {
  LocationOn as MarkerIcon,
  CropDin as RectangleIcon,
  RadioButtonUnchecked as CircleIcon,
  Timeline as PolygonIcon,
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapLayer {
  id: string;
  name: string;
  type: 'marker' | 'polygon' | 'line' | 'circle';
  data: any;
  style?: any;
  visible: boolean;
}

interface InteractiveMapProps {
  center?: LatLngTuple;
  zoom?: number;
  layers: MapLayer[];
  onLayerAdd?: (layer: MapLayer) => void;
  onLayerUpdate?: (layer: MapLayer) => void;
  onLayerDelete?: (layerId: string) => void;
  onMapUpdate?: (center: LatLngTuple, zoom: number) => void;
  editable?: boolean;
  propertyBounds?: LatLngTuple[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  layers = [],
  onLayerAdd,
  onLayerUpdate,
  onLayerDelete,
  onMapUpdate,
  editable = true,
  propertyBounds,
}) => {
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef<any>(null);

  // Component to handle map events
  const MapEvents = () => {
    const map = useMapEvents({
      click: (e) => {
        if (!editable || !drawingMode) return;

        const { lat, lng } = e.latlng;
        
        if (drawingMode === 'marker') {
          const newLayer: MapLayer = {
            id: `marker_${Date.now()}`,
            name: `Marker ${layers.length + 1}`,
            type: 'marker',
            data: { position: [lat, lng] },
            visible: true,
          };
          onLayerAdd?.(newLayer);
        }
        
        setDrawingMode(null);
      },
      moveend: () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(zoom);
        onMapUpdate?.([center.lat, center.lng], zoom);
      },
    });
    return null;
  };

  const handleToolSelect = (tool: string) => {
    if (drawingMode === tool) {
      setDrawingMode(null);
    } else {
      setDrawingMode(tool);
    }
  };

  const renderLayer = (layer: MapLayer) => {
    if (!layer.visible) return null;

    switch (layer.type) {
      case 'marker':
        return (
          <Marker
            key={layer.id}
            position={layer.data.position}
            eventHandlers={{
              contextmenu: () => {
                if (editable) onLayerDelete?.(layer.id);
              },
            }}
          >
            <Popup>
              <Typography variant="body2">{layer.name}</Typography>
              {editable && (
                <Typography variant="caption" color="textSecondary">
                  Right-click to delete
                </Typography>
              )}
            </Popup>
          </Marker>
        );
      
      case 'polygon':
        return (
          <Polygon
            key={layer.id}
            positions={layer.data.positions}
            pathOptions={layer.style || { color: 'blue', fillOpacity: 0.2 }}
            eventHandlers={{
              contextmenu: () => {
                if (editable) onLayerDelete?.(layer.id);
              },
            }}
          >
            <Popup>
              <Typography variant="body2">{layer.name}</Typography>
            </Popup>
          </Polygon>
        );
      
      default:
        return null;
    }
  };

  // Create property boundary if provided
  const propertyBoundaryLayer = propertyBounds ? (
    <Polygon
      positions={propertyBounds}
      pathOptions={{ 
        color: 'red', 
        weight: 3, 
        fillOpacity: 0.1,
        dashArray: '10, 10'
      }}
    >
      <Popup>
        <Typography variant="body2">Property Boundary</Typography>
      </Popup>
    </Polygon>
  ) : null;

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {editable && (
        <Paper 
          elevation={2} 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1000,
            minWidth: 200
          }}
        >
          <Toolbar variant="dense">
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Drawing Tools
            </Typography>
          </Toolbar>
          <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Add Marker">
              <IconButton
                size="small"
                color={drawingMode === 'marker' ? 'primary' : 'default'}
                onClick={() => handleToolSelect('marker')}
              >
                <MarkerIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Draw Polygon">
              <IconButton
                size="small"
                color={drawingMode === 'polygon' ? 'primary' : 'default'}
                onClick={() => handleToolSelect('polygon')}
              >
                <PolygonIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Draw Rectangle">
              <IconButton
                size="small"
                color={drawingMode === 'rectangle' ? 'primary' : 'default'}
                onClick={() => handleToolSelect('rectangle')}
              >
                <RectangleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Draw Circle">
              <IconButton
                size="small"
                color={drawingMode === 'circle' ? 'primary' : 'default'}
                onClick={() => handleToolSelect('circle')}
              >
                <CircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {drawingMode && (
            <Box sx={{ p: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="primary">
                Click on map to place {drawingMode}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents />
        
        {propertyBoundaryLayer}
        
        {layers.map(renderLayer)}
      </MapContainer>
    </Box>
  );
};

export default InteractiveMap;