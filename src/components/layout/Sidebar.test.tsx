import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useRequestStore } from '../../stores/useRequestStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Reset stores
    useCollectionStore.setState({
      collections: [],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: true,
    });

    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
    });
  });

  it('renders the sidebar with app title', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Openman')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders the New Request button', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();
  });

  it('navigates to /request when clicking New Request', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'request-1',
        name: 'Saved Request',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      response: {
        status: 200,
        statusText: 'OK',
        headers: {},
        body: '{}',
        responseTime: 10,
        responseSize: 2,
      },
      error: 'Previous error',
      requestHistory: [],
    });

    renderWithRouter(<Sidebar />);

    const newRequestButton = screen.getByRole('button', { name: /new request/i });
    fireEvent.click(newRequestButton);

    expect(useRequestStore.getState().currentRequest).toBeNull();
    expect(useRequestStore.getState().response).toBeNull();
    expect(useRequestStore.getState().error).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/request');
  });

  it('renders Collections section', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('shows empty collections message when no collections', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
  });

  it('renders collections when they exist', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'Test Collection',
          description: 'Test description',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      initialized: true,
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
  });

  it('filters collections by search query', async () => {
    const user = userEvent.setup();

    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'API Collection',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'User Endpoints',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      initialized: true,
    });

    renderWithRouter(<Sidebar />);

    // Both collections should be visible
    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.getByText('User Endpoints')).toBeInTheDocument();

    // Search for "API"
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'API');

    // Only API Collection should be visible
    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.queryByText('User Endpoints')).not.toBeInTheDocument();
  });
});