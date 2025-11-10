import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkflowChoice from './WorkflowChoice';

describe('WorkflowChoice Component', () => {
  const mockOnClose = jest.fn();
  const mockOnChooseMap = jest.fn();
  const mockOnChoosePricing = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onChooseMap: mockOnChooseMap,
    onChoosePricing: mockOnChoosePricing
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<WorkflowChoice {...defaultProps} />);
    
    expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
    expect(screen.getByText('Generate Floor Plan')).toBeInTheDocument();
    expect(screen.getByText('Get Price Prediction')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<WorkflowChoice {...defaultProps} open={false} />);
    
    expect(screen.queryByText('What would you like to do next?')).not.toBeInTheDocument();
  });

  it('should call onChooseMap when Generate Map button is clicked', () => {
    render(<WorkflowChoice {...defaultProps} />);
    
    const generateMapButton = screen.getByRole('button', { name: /generate map/i });
    fireEvent.click(generateMapButton);
    
    expect(mockOnChooseMap).toHaveBeenCalledTimes(1);
  });

  it('should call onChoosePricing when Get Pricing button is clicked', () => {
    render(<WorkflowChoice {...defaultProps} />);
    
    const getPricingButton = screen.getByRole('button', { name: /get pricing/i });
    fireEvent.click(getPricingButton);
    
    expect(mockOnChoosePricing).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Go Back button is clicked', () => {
    render(<WorkflowChoice {...defaultProps} />);
    
    const goBackButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(goBackButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display requirements data when provided', () => {
    const requirementsData = {
      plotLength: 10,
      plotWidth: 10,
      bedrooms: 3
    };

    render(<WorkflowChoice {...defaultProps} requirementsData={requirementsData} />);
    
    expect(screen.getByText(/Your Requirements:/i)).toBeInTheDocument();
    expect(screen.getByText(/3 parameters configured/i)).toBeInTheDocument();
  });

  it('should have correct feature descriptions', () => {
    render(<WorkflowChoice {...defaultProps} />);
    
    expect(screen.getByText(/AI-powered layout generation/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag-and-drop editing/i)).toBeInTheDocument();
    expect(screen.getByText(/ML-based prediction/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed cost breakdown/i)).toBeInTheDocument();
  });
});
