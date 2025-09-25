import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project View
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Project ID: {id}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          This component will display the project details, interactive map, and cost estimation.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProjectView;