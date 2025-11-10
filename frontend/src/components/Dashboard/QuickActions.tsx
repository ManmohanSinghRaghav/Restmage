import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  Map as MapIcon,
  Assessment as PricingIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Quick Actions Dashboard
 * One-click access to common tasks for better UX
 */
export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'New Floor Plan',
      description: 'Create a floor plan in 4 simple steps with our guided wizard',
      icon: <AddIcon />,
      color: 'primary',
      path: '/wizard'
    },
    {
      title: 'My Projects',
      description: 'View and edit your existing floor plan projects',
      icon: <MapIcon />,
      color: 'secondary',
      path: '/projects'
    },
    {
      title: 'Price Estimate',
      description: 'Get instant property valuation using ML model',
      icon: <PricingIcon />,
      color: 'success',
      path: '/price-prediction'
    },
    {
      title: 'AI Assistant',
      description: 'Ask questions about design, pricing, and more',
      icon: <ChatIcon />,
      color: 'info',
      path: '/chatbot'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Restmage
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Choose an action to get started
        </Typography>

        <Box 
          sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {actions.map((action, index) => (
            <Card
              key={index}
              sx={{
                width: { xs: '100%', sm: '45%', md: '22%' },
                minWidth: 250,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    color: `${action.color}.main`, 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  {React.cloneElement(action.icon, { sx: { fontSize: 60 } })}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color={action.color as any}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.path);
                  }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            🚀 <strong>New to Restmage?</strong> Start with the "New Floor Plan" wizard for a guided experience
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
