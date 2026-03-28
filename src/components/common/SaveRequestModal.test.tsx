import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveRequestModal } from './SaveRequestModal';
import { useCollectionStore } from '../../stores/useCollectionStore';

const mockOnClose = vi.fn();

describe('SaveRequestModal', () => {
  const mockRequest = {
    id: '1',
    name: 'Test Request',
    method: 'GET' as const,
    url: 'https://api.example.com/users',
    headers: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useCollectionStore.setState({
      collections: [],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: true,
      loadCollections: vi.fn(),
      createCollection: vi.fn().mockResolvedValue({
        id: 'new-collection-id',
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
  });

  it('does not render when isOpen is false', () => {
    render(
      <SaveRequestModal
        isOpen={false}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.queryByText('Save Request')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    // Check for the heading specifically
    expect(screen.getByRole('heading', { name: 'Save Request' })).toBeInTheDocument();
  });

  it('renders request name input', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    // Find input by its value since label isn't properly associated
    const nameInput = screen.getByDisplayValue('Test Request');
    expect(nameInput).toBeInTheDocument();
  });

  it('renders collection selector', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    // Check for the collection label
    expect(screen.getByText('Collection')).toBeInTheDocument();
  });

  it('shows "No collections" when no collections exist', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.getByText('No collections')).toBeInTheDocument();
  });

  it('shows collections in dropdown', () => {
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
          name: 'User Collection',
          variables: [],
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      initialized: true,
    });

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.getByText('API Collection')).toBeInTheDocument();
    expect(screen.getByText('User Collection')).toBeInTheDocument();
  });

  it('shows new collection form when clicking + New', async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    const newButton = screen.getByRole('button', { name: /\+ new/i });
    await user.click(newButton);

    expect(screen.getByPlaceholderText(/enter collection name/i)).toBeInTheDocument();
  });

  it('renders request preview with method and URL', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/users')).toBeInTheDocument();
  });

  it('shows correct color for GET method', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    const methodElement = screen.getByText('GET');
    expect(methodElement.className).toContain('text-get-method');
  });

  it('shows correct color for POST method', () => {
    const postRequest = { ...mockRequest, method: 'POST' as const };

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={postRequest}
      />
    );

    const methodElement = screen.getByText('POST');
    expect(methodElement.className).toContain('text-post-method');
  });

  it('shows correct color for DELETE method', () => {
    const deleteRequest = { ...mockRequest, method: 'DELETE' as const };

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={deleteRequest}
      />
    );

    const methodElement = screen.getByText('DELETE');
    expect(methodElement.className).toContain('text-delete-method');
  });

  it('renders Cancel button', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders Save Request button', () => {
    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    expect(screen.getByRole('button', { name: /save request/i })).toBeInTheDocument();
  });

  it('calls onClose when clicking Cancel', async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking X button', async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={mockRequest}
      />
    );

    // Find the close button by its aria-label or use the X icon button
    const closeButton = screen.getByRole('button', { name: '' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows alert when saving without request name', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={{ ...mockRequest, name: '' }}
      />
    );

    // Clear the name input
    const nameInput = screen.getByDisplayValue('');
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /save request/i });
    await user.click(saveButton);

    expect(alertSpy).toHaveBeenCalledWith('Please enter a request name');
    alertSpy.mockRestore();
  });
});
