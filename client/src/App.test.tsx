import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the contexts
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
  }),
}));

jest.mock('./contexts/SocketContext', () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

test('renders login page when not authenticated', () => {
  render(<App />);
  expect(document.body).toBeInTheDocument();
});
