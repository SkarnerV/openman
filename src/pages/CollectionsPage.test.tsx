import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CollectionsPage } from './CollectionsPage';
import { useCollectionStore } from '../stores/useCollectionStore';
import { useRequestStore } from '../stores/useRequestStore';

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

describe('CollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    useCollectionStore.setState({
      collections: [],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: true,
      loadCollections: vi.fn(),
      createCollection: vi.fn().mockResolvedValue({
        id: 'new-id',
        name: 'New Collection',
        variables: [],
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      setActiveCollection: vi.fn(),
      setSelectedRequest: vi.fn(),
      addRequestToCollection: vi.fn(),
    });

    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
    });
  });

  it('shows empty state when no collections exist', () => {
    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
  });

  it('shows create collection button in empty state', () => {
    renderWithRouter(<CollectionsPage />);
    expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useCollectionStore.setState({ isLoading: true });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText(/loading collections/i)).toBeInTheDocument();
  });

  it('renders collections page with title', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'Test Collection',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('renders collections in grid', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'API Collection',
          description: 'Main API endpoints',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'User Collection',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.getByText('User Collection')).toBeInTheDocument();
  });

  it('shows collection description', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'API Collection',
          description: 'Main API endpoints',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText('Main API endpoints')).toBeInTheDocument();
  });

  it('shows request count for collection', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'API Collection',
          variables: [],
          items: [
            {
              id: 'r1',
              name: 'Get Users',
              method: 'GET',
              url: 'https://api.example.com/users',
              headers: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText('1 request')).toBeInTheDocument();
  });

  it('shows plural "requests" for multiple items', () => {
    useCollectionStore.setState({
      collections: [
        {
          id: '1',
          name: 'API Collection',
          variables: [],
          items: [
            {
              id: 'r1',
              name: 'Get Users',
              method: 'GET',
              url: 'https://api.example.com/users',
              headers: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'r2',
              name: 'Create User',
              method: 'POST',
              url: 'https://api.example.com/users',
              headers: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByText('2 requests')).toBeInTheDocument();
  });

  it('renders search input', () => {
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
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByPlaceholderText(/search collections/i)).toBeInTheDocument();
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
    });

    renderWithRouter(<CollectionsPage />);

    // Both collections visible initially
    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.getByText('User Endpoints')).toBeInTheDocument();

    // Search for "API"
    const searchInput = screen.getByPlaceholderText(/search collections/i);
    await user.type(searchInput, 'API');

    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.queryByText('User Endpoints')).not.toBeInTheDocument();
  });

  it('shows "No collections found" message when search has no results', async () => {
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
      ],
    });

    renderWithRouter(<CollectionsPage />);

    const searchInput = screen.getByPlaceholderText(/search collections/i);
    await user.type(searchInput, 'NonExistent');

    expect(screen.getByText(/no collections found matching/i)).toBeInTheDocument();
  });

  it('renders New Request button', () => {
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
      ],
    });

    renderWithRouter(<CollectionsPage />);
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();
  });

  it('navigates to /request when clicking New Request', async () => {
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
      ],
    });
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
        responseTime: 20,
        responseSize: 2,
      },
      error: 'Previous error',
    });

    renderWithRouter(<CollectionsPage />);

    const newRequestButton = screen.getByRole('button', { name: /new request/i });
    fireEvent.click(newRequestButton);

    expect(useRequestStore.getState().currentRequest).toBeNull();
    expect(useRequestStore.getState().response).toBeNull();
    expect(useRequestStore.getState().error).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/request');
  });

  it('shows delete button on hover', () => {
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
      ],
    });

    renderWithRouter(<CollectionsPage />);

    // The delete button exists but is hidden until hover
    const deleteButton = screen.getByTitle('Delete');
    expect(deleteButton).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when clicking delete', async () => {
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
      ],
    });

    renderWithRouter(<CollectionsPage />);

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    // The confirm dialog should appear
    expect(screen.getByText('Delete Collection')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('calls deleteCollection when confirming delete in dialog', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
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
      ],
      deleteCollection: mockDelete,
    });

    renderWithRouter(<CollectionsPage />);

    // Click delete button to open dialog
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    // Click confirm button in dialog (the one with red background)
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    const confirmDialogButton = confirmButtons.find(btn =>
      btn.classList.contains('bg-delete-method')
    );
    fireEvent.click(confirmDialogButton!);

    expect(mockDelete).toHaveBeenCalledWith('1');
  });

  it('does not delete when canceling delete dialog', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
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
      ],
      deleteCollection: mockDelete,
    });

    renderWithRouter(<CollectionsPage />);

    // Click delete button to open dialog
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    // Click cancel button in dialog
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockDelete).not.toHaveBeenCalled();
  });
});
