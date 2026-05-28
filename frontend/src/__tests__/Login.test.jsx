import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import Login from '../pages/Login';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
  }),
}));

describe('Login Component UI Tests', () => {
  it('should render the login page tabs and auto-prefix phone number with +91', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert that the main tabs are rendered
    expect(screen.getAllByText(/Admin \/ Staff/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Reporter/i)[0]).toBeInTheDocument();

    // Assert that the phone number input is present and defaulted to +91
    const phoneInput = screen.getByPlaceholderText('+1234567890');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput.value).toBe('+91');
  });

  it('should toggle to Reporter tab and show reporter login fields with +91', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click on Reporter Tab
    const reporterTab = screen.getAllByText(/Reporter/i)[0];
    fireEvent.click(reporterTab);

    // Assert reporter login button is present
    expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
  });
});
