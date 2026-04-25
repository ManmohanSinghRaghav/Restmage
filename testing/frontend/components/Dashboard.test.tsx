/**
 * Example Component Test - Dashboard
 * Template for testing React components using Testing Library
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../../client/src/components/Dashboard/Dashboard';
import { AuthContext } from '../../../client/src/contexts/AuthContext';

// Mock API calls
jest.mock('../../../client/src/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock user data
const mockUser = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  token: 'mock-jwt-token',
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
};

/**
 * Wrapper component with required providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders dashboard heading', () => {
    renderWithProviders(<Dashboard />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  test('displays user information', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  test('renders project list section', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/projects/i)).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    const loadingAuthContext = { ...mockAuthContext, loading: true };
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={loadingAuthContext}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Check for loading indicator
    expect(screen.queryByRole('progressbar')).toBeInTheDocument();
  });

  test('handles user interaction - create new project button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    const createButton = screen.getByRole('button', { name: /create project/i });
    await user.click(createButton);
    
    // Add assertions for expected behavior after click
  });
});

/**
 * TESTING BEST PRACTICES:
 * 
 * 1. Use semantic queries (getByRole, getByLabelText) over test IDs
 * 2. Test user behavior, not implementation details
 * 3. Use userEvent instead of fireEvent for realistic interactions
 * 4. Always cleanup mocks in beforeEach/afterEach
 * 5. Use waitFor for async operations
 * 6. Test error states and edge cases
 * 7. Keep tests focused and independent
 */
