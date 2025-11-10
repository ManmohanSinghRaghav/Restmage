import React, { useState } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  Paper,
  Container
} from '@mui/material';
import PropertyDetailsStep from './steps/PropertyDetailsStep';
import RoomConfigurationStep from './steps/RoomConfigurationStep';
import GenerateOptionsStep from './steps/GenerateOptionsStep';
import ResultsStep from './steps/ResultsStep';

const steps = [
  'Property Details',
  'Room Configuration',
  'Generation Options',
  'Results'
];

interface ProjectData {
  plotLength?: number;
  plotWidth?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  rooms?: Array<{ type: string; count: number }>;
  generationMethod?: 'ai' | 'basic';
  floorPlan?: any;
}

/**
 * Step-by-step guided wizard for creating floor plans
 * Provides better UX with clear progression
 */
export default function ProjectWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({});

  const handleNext = (stepData: Partial<ProjectData>) => {
    setProjectData((prev) => ({ ...prev, ...stepData }));
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setProjectData({});
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PropertyDetailsStep 
            onNext={handleNext} 
            data={projectData} 
          />
        );
      case 1:
        return (
          <RoomConfigurationStep 
            onNext={handleNext} 
            onBack={handleBack} 
            data={projectData} 
          />
        );
      case 2:
        return (
          <GenerateOptionsStep 
            onNext={handleNext} 
            onBack={handleBack} 
            data={projectData} 
          />
        );
      case 3:
        return (
          <ResultsStep 
            data={projectData} 
            onReset={handleReset} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
            🏠 Create Your Floor Plan
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Follow the simple 4-step process to generate your perfect floor plan
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: '400px' }}>
            {renderStepContent(activeStep)}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
