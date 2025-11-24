/**
 * Example Component Test - FloorPlanGenerator
 * Template for testing form components with API interactions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloorPlanGenerator from '../../../client/src/components/FloorPlan/FloorPlanGenerator';
import * as api from '../../../client/src/services/api';

// Mock the API module
jest.mock('../../../client/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('FloorPlanGenerator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all required fields', () => {
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/floors/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);
    
    // Check for validation errors
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        id: 'floor-plan-123',
        rooms: [],
        dimensions: { width: 40, height: 30 }
      }
    };
    
    mockedApi.post.mockResolvedValueOnce(mockResponse);
    
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    // Fill form
    await user.type(screen.getByLabelText(/total area/i), '1500');
    await user.type(screen.getByLabelText(/bedrooms/i), '3');
    await user.type(screen.getByLabelText(/bathrooms/i), '2');
    
    // Submit
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/floorplan'),
        expect.objectContaining({
          totalArea: 1500,
          bedrooms: 3,
          bathrooms: 2
        })
      );
    });
  });

  test('displays loading state during generation', async () => {
    const user = userEvent.setup();
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/total area/i), '1500');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to generate floor plan';
    mockedApi.post.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    // Submit form
    await user.type(screen.getByLabelText(/total area/i), '1500');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('disables submit button when loading', async () => {
    const user = userEvent.setup();
    mockedApi.post.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FloorPlanGenerator projectId="test-project-id" />);
    
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.type(screen.getByLabelText(/total area/i), '1500');
    await user.click(generateButton);
    
    expect(generateButton).toBeDisabled();
  });
});
