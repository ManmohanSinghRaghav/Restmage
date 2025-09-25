import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Editor
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Project ID: {id === 'new' ? 'Creating New Project' : id}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          This component will include the project creation/editing form with map integration.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProjectEditor;