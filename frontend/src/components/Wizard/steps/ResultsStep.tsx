import React, { useEffect, useState } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Download,
  Edit,
  Refresh
} from '@mui/icons-material';
import { useFloorPlan } from '../../../hooks/useFloorPlan';
import { useNavigate } from 'react-router-dom';

interface Props {
  data: any;
  onReset: () => void;
}

/**
 * Step 4: Results Display
 * Shows generated floor plan and actions
 */
export default function ResultsStep({ data, onReset }: Props) {
  const { generateWithAI, generateBasic, loading, floorPlan, error } = useFloorPlan();
  const [generated, setGenerated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const generate = async () => {
      if (!generated) {
        const requirements = {
          plotLength: data.plotLength,
          plotWidth: data.plotWidth,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          floors: data.floors,
          kitchen: true,
          livingRoom: true,
          diningRoom: true
        };

        try {
          if (data.generationMethod === 'ai') {
            await generateWithAI(requirements);
          } else {
            await generateBasic(requirements);
          }
          setGenerated(true);
        } catch (err) {
          console.error('Generation failed:', err);
        }
      }
    };

    generate();
  }, [data, generateWithAI, generateBasic, generated]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Generating your floor plan...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">
            {error}
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => setGenerated(false)}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            onClick={onReset}
          >
            Start Over
          </Button>
        </Box>
      </Box>
    );
  }

  if (floorPlan) {
    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Floor Plan Generated Successfully!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your floor plan is ready to view and edit
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Plot Size:</strong> {data.plotLength} x {data.plotWidth} ft ({data.plotLength * data.plotWidth} sq ft)
            </Typography>
            <Typography variant="body2">
              <strong>Bedrooms:</strong> {data.bedrooms}
            </Typography>
            <Typography variant="body2">
              <strong>Bathrooms:</strong> {data.bathrooms}
            </Typography>
            <Typography variant="body2">
              <strong>Floors:</strong> {data.floors}
            </Typography>
            <Typography variant="body2">
              <strong>Rooms Generated:</strong> {floorPlan.rooms?.length || 0}
            </Typography>
            <Typography variant="body2">
              <strong>Method:</strong> {data.generationMethod === 'ai' ? 'AI-Powered (Gemini)' : 'Rule-Based'}
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Edit />}
            onClick={() => navigate('/editor', { state: { floorPlan } })}
          >
            Edit in MapEditor
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={() => {
              const dataStr = JSON.stringify(floorPlan, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
              const link = document.createElement('a');
              link.href = dataUri;
              link.download = 'floorplan.json';
              link.click();
            }}
          >
            Download JSON
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onReset}
          >
            Create Another
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}
