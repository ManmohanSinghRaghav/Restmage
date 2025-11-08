import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import EditorMap from "./pages/EditorMap";

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import SimpleProjectView from './components/Project/SimpleProjectView';
import SimpleProjectEditor from './components/Project/SimpleProjectEditor';
import FloorPlanGenerator from './components/FloorPlan/FloorPlanGenerator';
import PricePrediction from './components/PricePrediction/PricePrediction';
import Chatbot from './components/Chatbot/Chatbot';
import MapView from './components/Map/MapView';

const APPLICATION_THEME = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const LOADING_MESSAGE = 'Loading...';
const MAIN_CONTENT_TOP_MARGIN = 8;
const MAIN_CONTENT_PADDING = 3;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>{LOADING_MESSAGE}</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

const AuthenticatedRoutes: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: MAIN_CONTENT_TOP_MARGIN,
          p: MAIN_CONTENT_PADDING,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/floorplan"
            element={<Navigate to="/editor" replace />}
          />
          <Route 
            path="/price-prediction" 
            element={
              <ProtectedRoute>
                <PricePrediction />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chatbot" 
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/project/:id" 
            element={
              <ProtectedRoute>
                <SimpleProjectView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/editor"
            element={
              <ProtectedRoute>
                <EditorMap />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/maps"
            element={
              <ProtectedRoute>
                <MapView />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/project/:id/edit" 
            element={
              <ProtectedRoute>
                <SimpleProjectEditor />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Box>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <AuthenticatedRoutes /> : <PublicRoutes />;
};

function App() {
  return (
    <ThemeProvider theme={APPLICATION_THEME}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <Router>
              <AppContent />
            </Router>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
