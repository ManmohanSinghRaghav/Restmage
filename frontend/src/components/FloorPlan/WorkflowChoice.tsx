import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Paper
} from '@mui/material';
import {
  Map as MapIcon,
  AttachMoney as PricingIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';

interface WorkflowChoiceProps {
  open: boolean;
  onClose: () => void;
  onChooseMap: () => void;
  onChoosePricing: () => void;
  requirementsData?: any;
}

const WorkflowChoice: React.FC<WorkflowChoiceProps> = ({
  open,
  onClose,
  onChooseMap,
  onChoosePricing,
  requirementsData
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 2
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <AIIcon color="primary" fontSize="large" />
          <Typography variant="h5" component="span">
            What would you like to do next?
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Based on your requirements, choose your next step
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Generate Floor Plan Option */}
          <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  cursor: 'pointer'
                }
              }}
              onClick={onChooseMap}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white'
                  }}
                >
                  <MapIcon sx={{ fontSize: 40 }} />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Generate Floor Plan
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  Use AI to generate an interactive floor plan based on your requirements. 
                  Edit rooms, walls, doors, and windows in our advanced editor.
                </Typography>

                <Paper sx={{ p: 1.5, backgroundColor: 'grey.100', mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <strong>Features:</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ AI-powered layout generation
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ Drag-and-drop editing
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ Export as Image/PDF
                  </Typography>
                </Paper>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<MapIcon />}
                  onClick={onChooseMap}
                  fullWidth
                  sx={{ mx: 2 }}
                >
                  Generate Map
                </Button>
              </CardActions>
            </Card>
          </Box>

          {/* Get Price Prediction Option */}
          <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  cursor: 'pointer'
                }
              }}
              onClick={onChoosePricing}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white'
                  }}
                >
                  <PricingIcon sx={{ fontSize: 40 }} />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Get Price Prediction
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  Get an instant price estimate for your property based on area, 
                  location, amenities, and market trends.
                </Typography>

                <Paper sx={{ p: 1.5, backgroundColor: 'grey.100', mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <strong>Features:</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ ML-based prediction
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ Detailed cost breakdown
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✓ Export pricing report
                  </Typography>
                </Paper>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  startIcon={<PricingIcon />}
                  onClick={onChoosePricing}
                  fullWidth
                  sx={{ mx: 2 }}
                >
                  Get Pricing
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Box>

        {requirementsData && (
          <Paper sx={{ p: 2, mt: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="caption" display="block">
              <strong>Your Requirements:</strong>
            </Typography>
            <Typography variant="caption">
              {Object.keys(requirementsData).length} parameters configured
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Go Back
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowChoice;
