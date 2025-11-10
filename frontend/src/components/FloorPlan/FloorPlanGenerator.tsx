import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Chip, Alert } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import WorkflowChoice from './WorkflowChoice';
import { useNotification } from '../../contexts/NotificationContext';

interface Room {
  type: string;
  count: number;
}

interface FloorPlanRoom {
  id: string;
  type: string;
  count: number;
  dimensions: {
    width: number;
    height: number;
    area: number;
  };
  position: {
    x: number;
    y: number;
  };
  color: string;
  walls: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>;
}

interface FloorPlanData {
  propertyDimensions: {
    width: number;
    height: number;
    totalArea: number;
  };
  rooms: FloorPlanRoom[];
  metadata: {
    generatedAt: string;
    totalRooms: number;
    efficiency: number;
    usedArea: number;
    wastedArea: number;
  };
}

const ROOM_TYPES = [
  'Bedroom',
  'Bathroom',
  'Kitchen',
  'Living Room',
  'Dining Room',
  'Store Room',
  'Drawing Room',
  'Hall',
  'Balcony',
  'Garage'
];

const FloorPlanGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [propertyWidth, setPropertyWidth] = useState<number>(50);
  const [propertyHeight, setPropertyHeight] = useState<number>(40);
  const [rooms, setRooms] = useState<Room[]>([
    { type: 'Bedroom', count: 3 },
    { type: 'Bathroom', count: 2 },
    { type: 'Kitchen', count: 1 },
    { type: 'Living Room', count: 1 }
  ]);
  const [floorPlan, setFloorPlan] = useState<FloorPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWorkflowChoice, setShowWorkflowChoice] = useState(false);
  const [currentRequirements, setCurrentRequirements] = useState<any>(null);

  const addRoom = () => {
    setRooms([...rooms, { type: 'Bedroom', count: 1 }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: keyof Room, value: string | number) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  };

  const generateFloorPlan = async () => {
    // Show workflow choice modal instead of directly generating
    setCurrentRequirements({
      propertyWidth,
      propertyHeight,
      rooms
    });
    setShowWorkflowChoice(true);
  };

  const handleChooseMap = async () => {
    setShowWorkflowChoice(false);
    setLoading(true);
    setError(null);

    try {
      // Call Gemini API to generate floor plan
      const response = await api.post('/gemini/generate-map', {
        requirements: {
          plotLength: propertyHeight,
          plotWidth: propertyWidth,
          bedrooms: rooms.find(r => r.type === 'Bedroom')?.count || 0,
          bathrooms: rooms.find(r => r.type === 'Bathroom')?.count || 0,
          kitchen: rooms.some(r => r.type === 'Kitchen'),
          livingRoom: rooms.some(r => r.type === 'Living Room'),
          diningRoom: rooms.some(r => r.type === 'Dining Room'),
          rooms: rooms
        }
      });

      // Create a new project with the generated map
      const projectResponse = await api.post('/projects', {
        name: `Floor Plan ${new Date().toLocaleDateString()}`,
        description: 'AI-generated floor plan',
        mapData: response.data.data
      });

      showNotification('Floor plan generated successfully!', 'success');
      
      // Navigate to map editor
      navigate(`/project/${projectResponse.data._id}/editor`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate floor plan');
      showNotification('Failed to generate floor plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePricing = () => {
    setShowWorkflowChoice(false);
    // Navigate to pricing with requirements
    navigate('/price-prediction', {
      state: {
        requirements: currentRequirements
      }
    });
  };

  const optimizeFloorPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/floorplan/optimize', {
        propertyWidth,
        propertyHeight,
        rooms
      });

      setFloorPlan(response.data.floorPlan);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to optimize floor plan');
    } finally {
      setLoading(false);
    }
  };

  const renderFloorPlan = () => {
    if (!floorPlan) return null;

    const scale = Math.min(600 / floorPlan.propertyDimensions.width, 400 / floorPlan.propertyDimensions.height);

    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generated Floor Plan
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* SVG Floor Plan */}
          <Box sx={{ flex: 1 }}>
            <svg
              width={floorPlan.propertyDimensions.width * scale}
              height={floorPlan.propertyDimensions.height * scale}
              style={{ border: '2px solid #333', background: '#f5f5f5' }}
            >
              {/* Property boundary */}
              <rect
                x="0"
                y="0"
                width={floorPlan.propertyDimensions.width * scale}
                height={floorPlan.propertyDimensions.height * scale}
                fill="none"
                stroke="#000"
                strokeWidth="3"
              />

              {/* Rooms */}
              {floorPlan.rooms.map((room) => (
                <g key={room.id}>
                  {/* Room rectangle */}
                  <rect
                    x={room.position.x * scale}
                    y={room.position.y * scale}
                    width={room.dimensions.width * scale}
                    height={room.dimensions.height * scale}
                    fill={room.color}
                    stroke="#333"
                    strokeWidth="2"
                    opacity="0.8"
                  />

                  {/* Room label */}
                  <text
                    x={(room.position.x + room.dimensions.width / 2) * scale}
                    y={(room.position.y + room.dimensions.height / 2) * scale}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000"
                  >
                    {room.type}
                  </text>
                  <text
                    x={(room.position.x + room.dimensions.width / 2) * scale}
                    y={(room.position.y + room.dimensions.height / 2 + 1.5) * scale}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#000"
                  >
                    {room.dimensions.area.toFixed(0)} sq ft
                  </text>
                </g>
              ))}
            </svg>
          </Box>

          {/* Metadata */}
          <Box sx={{ width: 250 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plan Details
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Property Size
                  </Typography>
                  <Typography variant="body1">
                    {floorPlan.propertyDimensions.width} × {floorPlan.propertyDimensions.height} ft
                  </Typography>
                  <Typography variant="body2">
                    ({floorPlan.propertyDimensions.totalArea} sq ft)
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Rooms
                  </Typography>
                  <Typography variant="body1">
                    {floorPlan.metadata.totalRooms}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Space Efficiency
                  </Typography>
                  <Typography variant="body1" color={floorPlan.metadata.efficiency > 75 ? 'success.main' : 'warning.main'}>
                    {floorPlan.metadata.efficiency}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used Area
                  </Typography>
                  <Typography variant="body1">
                    {floorPlan.metadata.usedArea} sq ft
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Available Space
                  </Typography>
                  <Typography variant="body1">
                    {floorPlan.metadata.wastedArea} sq ft
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Room Legend */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Room Legend
                </Typography>
                {floorPlan.rooms.map((room) => (
                  <Box key={room.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        bgcolor: room.color,
                        border: '1px solid #333',
                        mr: 1
                      }}
                    />
                    <Typography variant="body2">
                      {room.type} ({room.dimensions.area.toFixed(0)} sq ft)
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HomeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            2D Floor Plan Generator
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Property Dimensions */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Property Dimensions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Width (feet)"
            type="number"
            value={propertyWidth}
            onChange={(e) => setPropertyWidth(Number(e.target.value))}
            inputProps={{ min: 10, max: 200 }}
          />
          <TextField
            fullWidth
            label="Height (feet)"
            type="number"
            value={propertyHeight}
            onChange={(e) => setPropertyHeight(Number(e.target.value))}
            inputProps={{ min: 10, max: 200 }}
          />
        </Box>

        {/* Rooms */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Rooms
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addRoom}
            variant="outlined"
            size="small"
          >
            Add Room
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {rooms.map((room, index) => (
            <Card key={index} variant="outlined" sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label={`Room ${index + 1}`} size="small" />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeRoom(index)}
                    startIcon={<RemoveIcon />}
                  >
                    Remove
                  </Button>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={room.type}
                    label="Room Type"
                    onChange={(e) => updateRoom(index, 'type', e.target.value)}
                  >
                    {ROOM_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Count"
                  type="number"
                  value={room.count}
                  onChange={(e) => updateRoom(index, 'count', Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={generateFloorPlan}
            disabled={loading || rooms.length === 0}
            fullWidth
          >
            {loading ? 'Generating...' : 'Generate Floor Plan'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={optimizeFloorPlan}
            disabled={loading || rooms.length === 0}
            fullWidth
          >
            {loading ? 'Optimizing...' : 'Optimize Layout'}
          </Button>
        </Box>
      </Paper>

      {/* Render generated floor plan */}
      {renderFloorPlan()}

      {/* Workflow Choice Modal */}
      <WorkflowChoice
        open={showWorkflowChoice}
        onClose={() => setShowWorkflowChoice(false)}
        onChooseMap={handleChooseMap}
        onChoosePricing={handleChoosePricing}
        requirementsData={currentRequirements}
      />
    </Box>
  );
};

export default FloorPlanGenerator;
