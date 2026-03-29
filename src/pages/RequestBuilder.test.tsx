import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RequestBuilder } from './RequestBuilder';
import { useRequestStore } from '../stores/useRequestStore';

// Mock the sendHttpRequest function
vi.mock('../services/httpService', () => ({
  sendHttpRequest: vi.fn().mockResolvedValue({
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: '{"success": true}',
    responseTime: 100,
    responseSize: 50,
  }),
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RequestBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store
    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
    });
  });

  it('renders the URL input for a new request', () => {
    renderWithRouter(<RequestBuilder />);
    expect(screen.getByPlaceholderText(/enter request url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('shows URL input after initializing with a URL', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    expect(screen.getByPlaceholderText(/enter request url/i)).toBeInTheDocument();
  });

  it('renders the method selector with GET as default', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    // MethodSelect is now a button with the method name
    expect(screen.getByRole('button', { name: /GET/i })).toBeInTheDocument();
  });

  it('renders the Send button', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('enables Send button when URL is entered', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('renders request tabs', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    // Use getAllByText since there are request and response tabs
    expect(screen.getAllByText('params').length).toBeGreaterThan(0);
    expect(screen.getAllByText('headers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('body').length).toBeGreaterThan(0);
    expect(screen.getAllByText('auth').length).toBeGreaterThan(0);
  });

  it('changes method when selecting different method', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);

    // Click on the method button to open the dropdown
    const methodButton = screen.getByRole('button', { name: /GET/i });
    await user.click(methodButton);

    // Click on POST option in the dropdown
    const postOption = screen.getByRole('button', { name: /POST/i });
    await user.click(postOption);

    // Now the button should show POST
    expect(screen.getByRole('button', { name: /POST/i })).toBeInTheDocument();
  });

  it('shows params tab content when clicking params', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    // Click the first params button (request tab)
    const paramsTabs = screen.getAllByText('params');
    await user.click(paramsTabs[0]);
    expect(screen.getByText(/query parameters/i)).toBeInTheDocument();
  });

  it('can add query parameters', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);

    // Click the first params button (request tab)
    const paramsTabs = screen.getAllByText('params');
    await user.click(paramsTabs[0]);

    // Click add parameter button
    const addButton = screen.getByText(/\+ add parameter/i);
    await user.click(addButton);

    // Check that parameter inputs appear
    expect(screen.getByPlaceholderText(/parameter name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/value/i)).toBeInTheDocument();
  });

  it('shows auth tab with auth type selector', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    // Click the first auth button (request tab)
    const authTabs = screen.getAllByText('auth');
    await user.click(authTabs[0]);
    expect(screen.getByText(/auth type/i)).toBeInTheDocument();
  });

  it('shows bearer token input when selecting bearer auth', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);

    // Click the first auth button (request tab)
    const authTabs = screen.getAllByText('auth');
    await user.click(authTabs[0]);

    // Click on the auth type dropdown (shows "No Auth" by default)
    const noAuthButton = screen.getByRole('button', { name: /No Auth/i });
    await user.click(noAuthButton);

    // Select Bearer Token
    const bearerOption = screen.getByRole('button', { name: /Bearer Token/i });
    await user.click(bearerOption);

    expect(screen.getByPlaceholderText(/enter bearer token/i)).toBeInTheDocument();
  });

  it('shows body editor when selecting JSON body type', async () => {
    const user = userEvent.setup();
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);

    // Click the first body button (request tab)
    const bodyTabs = screen.getAllByText('body');
    await user.click(bodyTabs[0]);

    // Click on JSON option in RadioGroup
    const jsonOption = screen.getByText('JSON');
    await user.click(jsonOption);

    // Verify Monaco Editor loading state is shown
    expect(screen.getByText(/Loading editor/i)).toBeInTheDocument();
  });

  it('disables Send button when URL is empty', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'GET',
        url: '',
        headers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('resets the editor when the current request is cleared', async () => {
    useRequestStore.setState({
      currentRequest: {
        id: 'test',
        name: 'Test',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    renderWithRouter(<RequestBuilder />);

    expect(screen.getByPlaceholderText(/enter request url/i)).toHaveValue(
      'https://api.example.com/users'
    );

    act(() => {
      useRequestStore.getState().setCurrentRequest(null);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter request url/i)).toHaveValue('');
    });
    // Method resets to GET
    expect(screen.getByRole('button', { name: /GET/i })).toBeInTheDocument();
  });
});