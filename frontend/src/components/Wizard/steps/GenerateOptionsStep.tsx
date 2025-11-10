import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Alert
} from '@mui/material';
import { AutoAwesome, Build } from '@mui/icons-material';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  data: any;
}

/**
 * Step 3: Choose Generation Method
 * AI-powered or rule-based generation
 */
export default function GenerateOptionsStep({ onNext, onBack, data }: Props) {
  const [selected, setSelected] = useState<'ai' | 'basic' | null>(null);

  const handleSelect = (method: 'ai' | 'basic') => {
    setSelected(method);
  };

  const handleSubmit = () => {
    if (selected) {
      onNext({ generationMethod: selected });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Generation Method
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select how you want to generate your floor plan
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        💡 AI-powered generation uses Google Gemini for intelligent layouts
      </Alert>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card 
          sx={{ 
            flex: 1,
            border: selected === 'ai' ? 3 : 1,
            borderColor: selected === 'ai' ? 'primary.main' : 'divider',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-4px)'
            }
          }}
          onClick={() => handleSelect('ai')}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <AutoAwesome sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                AI-Powered
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uses Google Gemini AI to create intelligent, optimized layouts based on your requirements
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" display="block">
                  ✓ Smart room placement
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Natural flow optimization
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Professional results
                </Typography>
              </Box>
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button 
              variant={selected === 'ai' ? 'contained' : 'outlined'}
              size="large"
              fullWidth
              onClick={() => handleSelect('ai')}
            >
              {selected === 'ai' ? 'Selected ✓' : 'Choose AI'}
            </Button>
          </CardActions>
        </Card>

        <Card 
          sx={{ 
            flex: 1,
            border: selected === 'basic' ? 3 : 1,
            borderColor: selected === 'basic' ? 'secondary.main' : 'divider',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-4px)'
            }
          }}
          onClick={() => handleSelect('basic')}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Build sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Rule-Based
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quick generation using predefined templates and basic layout rules
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" display="block">
                  ✓ Fast generation
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Simple layouts
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Good starting point
                </Typography>
              </Box>
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button 
              variant={selected === 'basic' ? 'contained' : 'outlined'}
              size="large"
              fullWidth
              color="secondary"
              onClick={() => handleSelect('basic')}
            >
              {selected === 'basic' ? 'Selected ✓' : 'Choose Basic'}
            </Button>
          </CardActions>
        </Card>
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
          disabled={!selected}
        >
          Generate Floor Plan →
        </Button>
      </Box>
    </Box>
  );
}
