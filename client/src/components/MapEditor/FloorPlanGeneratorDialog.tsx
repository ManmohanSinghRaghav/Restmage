import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AutoAwesome as AIIcon } from '@mui/icons-material';
import { generateFloorPlan } from '../../services/geminiFloorPlan';
import { useNotification } from '../../contexts/NotificationContext';

interface FloorPlanGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (floorPlanData: any) => void;
}

const FloorPlanGeneratorDialog: React.FC<FloorPlanGeneratorDialogProps> = ({
  open,
  onClose,
  onGenerated,
}) => {
  const { showNotification } = useNotification();
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    plot_width_ft: 60,
    plot_length_ft: 40,
    entrance_facing: 'west',
    setback_front_ft: 3,
    setback_rear_ft: 3,
    setback_side_left_ft: 3,
    setback_side_right_ft: 3,
    rooms: '2 Bedrooms, 2 Bathrooms, 1 Living Room, 1 Kitchen',
    floors: 1,
    location: 'Mathura, India',
    vastu_compliance: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      showNotification('Generating floor plan with AI...', 'info');
      
      const floorPlan = await generateFloorPlan(formData);
      
      showNotification('Floor plan generated successfully!', 'success');
      onGenerated(floorPlan);
      onClose();
    } catch (error: any) {
      console.error('Generation error:', error);
      showNotification(`Failed to generate floor plan: ${error.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          AI Floor Plan Generator
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info">
            Powered by Google Gemini AI. Provide your requirements and we'll generate a complete architectural floor plan.
          </Alert>

          {/* Plot Dimensions */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Plot Dimensions</InputLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Width (feet)"
                type="number"
                value={formData.plot_width_ft}
                onChange={(e) => handleChange('plot_width_ft', parseFloat(e.target.value))}
              />
              <TextField
                fullWidth
                label="Length (feet)"
                type="number"
                value={formData.plot_length_ft}
                onChange={(e) => handleChange('plot_length_ft', parseFloat(e.target.value))}
              />
            </Box>
          </Box>

          {/* Setbacks */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Setbacks (feet)</InputLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Front"
                type="number"
                size="small"
                value={formData.setback_front_ft}
                onChange={(e) => handleChange('setback_front_ft', parseFloat(e.target.value))}
              />
              <TextField
                fullWidth
                label="Rear"
                type="number"
                size="small"
                value={formData.setback_rear_ft}
                onChange={(e) => handleChange('setback_rear_ft', parseFloat(e.target.value))}
              />
              <TextField
                fullWidth
                label="Left"
                type="number"
                size="small"
                value={formData.setback_side_left_ft}
                onChange={(e) => handleChange('setback_side_left_ft', parseFloat(e.target.value))}
              />
              <TextField
                fullWidth
                label="Right"
                type="number"
                size="small"
                value={formData.setback_side_right_ft}
                onChange={(e) => handleChange('setback_side_right_ft', parseFloat(e.target.value))}
              />
            </Box>
          </Box>

          {/* Entrance and Floors */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Entrance Facing</InputLabel>
              <Select
                value={formData.entrance_facing}
                onChange={(e) => handleChange('entrance_facing', e.target.value)}
                label="Entrance Facing"
              >
                <MenuItem value="north">North</MenuItem>
                <MenuItem value="south">South</MenuItem>
                <MenuItem value="east">East</MenuItem>
                <MenuItem value="west">West</MenuItem>
                <MenuItem value="northeast">Northeast</MenuItem>
                <MenuItem value="northwest">Northwest</MenuItem>
                <MenuItem value="southeast">Southeast</MenuItem>
                <MenuItem value="southwest">Southwest</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Number of Floors"
              type="number"
              value={formData.floors}
              onChange={(e) => handleChange('floors', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 3 }}
            />
          </Box>

          {/* Rooms */}
          <TextField
            fullWidth
            label="Required Rooms"
            multiline
            rows={2}
            value={formData.rooms}
            onChange={(e) => handleChange('rooms', e.target.value)}
            placeholder="e.g., 3 Bedrooms, 2 Bathrooms, 1 Living Room, 1 Kitchen, 1 Dining"
            helperText="Describe all rooms you need separated by commas"
          />

          {/* Location */}
          <TextField
            fullWidth
            label="Location/City"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., Mathura, India"
            helperText="Location context for architectural considerations"
          />

          {/* Vastu Compliance */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.vastu_compliance}
                onChange={(e) => handleChange('vastu_compliance', e.target.checked)}
              />
            }
            label="Apply Vastu Shastra Compliance (Indian Traditional Architecture)"
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={20} /> : <AIIcon />}
        >
          {generating ? 'Generating...' : 'Generate Floor Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FloorPlanGeneratorDialog;
