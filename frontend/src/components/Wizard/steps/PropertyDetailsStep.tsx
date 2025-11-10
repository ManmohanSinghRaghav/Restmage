import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  Paper,
  Alert
} from '@mui/material';
import { SquareFoot, Home } from '@mui/icons-material';

interface Props {
  onNext: (data: any) => void;
  data: any;
}

/**
 * Step 1: Property Dimensions Input
 * User-friendly form with helpful tips and validation
 */
export default function PropertyDetailsStep({ onNext, data }: Props) {
  const [plotLength, setPlotLength] = useState(data.plotLength || 50);
  const [plotWidth, setPlotWidth] = useState(data.plotWidth || 40);
  const [errors, setErrors] = useState<{ length?: string; width?: string }>({});

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!plotLength || plotLength < 10) {
      newErrors.length = 'Length must be at least 10 feet';
    }
    if (!plotWidth || plotWidth < 10) {
      newErrors.width = 'Width must be at least 10 feet';
    }
    if (plotLength > 200) {
      newErrors.length = 'Length cannot exceed 200 feet';
    }
    if (plotWidth > 200) {
      newErrors.width = 'Width cannot exceed 200 feet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext({ plotLength, plotWidth });
    }
  };

  const totalArea = plotLength * plotWidth;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Home sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h6">
          Enter Property Dimensions
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          💡 <strong>Tip:</strong> Standard residential plots range from 1,500 to 3,000 sq ft (e.g., 50x40 ft)
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <TextField
            fullWidth
            label="Plot Length"
            type="number"
            value={plotLength}
            onChange={(e) => {
              setPlotLength(Number(e.target.value));
              setErrors({ ...errors, length: undefined });
            }}
            error={!!errors.length}
            helperText={errors.length || 'Length of your property'}
            InputProps={{
              endAdornment: <InputAdornment position="end">ft</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <SquareFoot color="primary" />
                </InputAdornment>
              )
            }}
            inputProps={{
              min: 10,
              max: 200,
              step: 1
            }}
          />

          <TextField
            fullWidth
            label="Plot Width"
            type="number"
            value={plotWidth}
            onChange={(e) => {
              setPlotWidth(Number(e.target.value));
              setErrors({ ...errors, width: undefined });
            }}
            error={!!errors.width}
            helperText={errors.width || 'Width of your property'}
            InputProps={{
              endAdornment: <InputAdornment position="end">ft</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <SquareFoot color="primary" />
                </InputAdornment>
              )
            }}
            inputProps={{
              min: 10,
              max: 200,
              step: 1
            }}
          />
        </Box>

        <Paper 
            sx={{ 
              p: 3, 
              bgcolor: totalArea >= 1500 && totalArea <= 3000 ? 'success.light' : 'warning.light',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              📐 Total Plot Area
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {totalArea.toLocaleString()} sq ft
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {totalArea < 1500 && 'Small plot - suitable for compact homes'}
              {totalArea >= 1500 && totalArea <= 3000 && 'Perfect size for standard residential homes'}
              {totalArea > 3000 && 'Large plot - great for spacious layouts'}
            </Typography>
          </Paper>
        </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!plotLength || !plotWidth}
        >
          Next: Configure Rooms →
        </Button>
      </Box>
    </Box>
  );
}
