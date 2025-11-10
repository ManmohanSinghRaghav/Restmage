import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import {
  Bed,
  Bathtub,
  Layers,
  Add,
  Remove
} from '@mui/icons-material';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  data: any;
}

/**
 * Step 2: Room Configuration
 * Simple counter-based room selection
 */
export default function RoomConfigurationStep({ onNext, onBack, data }: Props) {
  const [bedrooms, setBedrooms] = useState(data.bedrooms || 3);
  const [bathrooms, setBathrooms] = useState(data.bathrooms || 2);
  const [floors, setFloors] = useState(data.floors || 1);

  const handleSubmit = () => {
    onNext({ bedrooms, bathrooms, floors });
  };

  const RoomCounter = ({ 
    label, 
    value, 
    onChange, 
    icon, 
    min = 1, 
    max = 10 
  }: any) => (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
        <IconButton 
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          color="primary"
        >
          <Remove />
        </IconButton>
        <Chip 
          label={value} 
          color="primary" 
          sx={{ fontSize: '1.5rem', px: 2, py: 3 }}
        />
        <IconButton 
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          color="primary"
        >
          <Add />
        </IconButton>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Rooms
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the number of bedrooms, bathrooms, and floors
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <RoomCounter
          label="Bedrooms"
          value={bedrooms}
          onChange={setBedrooms}
          icon={<Bed sx={{ fontSize: 40 }} />}
          min={1}
          max={8}
        />
        <RoomCounter
          label="Bathrooms"
          value={bathrooms}
          onChange={setBathrooms}
          icon={<Bathtub sx={{ fontSize: 40 }} />}
          min={1}
          max={6}
        />
        <RoomCounter
          label="Floors"
          value={floors}
          onChange={setFloors}
          icon={<Layers sx={{ fontSize: 40 }} />}
          min={1}
          max={3}
        />
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="large"
          onClick={onBack}
        >
          ← Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
        >
          Next: Generation Options →
        </Button>
      </Box>
    </Box>
  );
}
