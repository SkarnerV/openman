import { test, expect, Page } from '@playwright/test';

const NOW = new Date().toISOString();

const MOCK_WORKSPACE = {
  id: 'ws-test-1',
  name: 'Default Workspace',
  description: 'E2E test workspace',
  createdAt: NOW,
  updatedAt: NOW,
  settings: { theme: 'dark', fontSize: 14, tabSize: 2 },
};

const MOCK_COLLECTIONS = [
  {
    id: 'col-1',
    name: 'Users API',
    description: 'User management endpoints',
    variables: [],
    items: [
      {
        id: 'req-1',
        type: 'request',
        name: 'List Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
        params: [],
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: 'req-2',
        type: 'request',
        name: 'Create User',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        params: [],
        body: { mode: 'json', content: '{"name":"test"}' },
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'col-2',
    name: 'Auth API',
    description: 'Authentication endpoints',
    variables: [],
    items: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MOCK_ENVIRONMENTS = [
  {
    id: 'env-1',
    name: 'Development',
    isActive: true,
    variables: [
      { key: 'BASE_URL', value: 'http://localhost:3000', enabled: true },
      { key: 'API_KEY', value: 'dev-key-123', enabled: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MOCK_HTTP_RESPONSE = {
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json', 'x-request-id': 'abc-123' },
  body: JSON.stringify([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]),
  responseTime: 142,
  responseSize: 120,
};

function buildTauriMockScript(overrides: {
  collections?: unknown[];
  environments?: unknown[];
  httpResponse?: unknown;
} = {}) {
  const collections = JSON.stringify(overrides.collections ?? MOCK_COLLECTIONS);
  const environments = JSON.stringify(overrides.environments ?? MOCK_ENVIRONMENTS);
  const httpResponse = JSON.stringify(overrides.httpResponse ?? MOCK_HTTP_RESPONSE);

  return `
    const _collections = ${collections};
    const _environments = ${environments};
    const _httpResponse = ${httpResponse};
    const _workspace = ${JSON.stringify(MOCK_WORKSPACE)};

    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd, args) => {
        switch (cmd) {
          case 'get_default_workspace':
            return _workspace;
          case 'get_workspaces':
            return [_workspace];
          case 'get_collections':
            return _collections;
          case 'get_environments':
            return _environments;
          case 'create_collection':
            return {
              id: 'col-new-' + Date.now(),
              name: args?.name || 'Untitled',
              description: args?.description || '',
              variables: [],
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          case 'create_environment':
            return {
              id: 'env-new-' + Date.now(),
              name: args?.name || 'Untitled',
              isActive: false,
              variables: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          case 'update_collection':
          case 'delete_collection':
          case 'update_environment':
          case 'delete_environment':
          case 'set_active_environment':
            return null;
          case 'send_http_request':
            return _httpResponse;
          default:
            console.warn('[Tauri Mock] Unhandled command:', cmd);
            return null;
        }
      },
      metadata: () => ({
        currentWindow: { label: 'main' },
        currentWebview: { label: 'main', windowLabel: 'main' },
      }),
      convertFileSrc: (path) => path,
    };
  `;
}

async function loadApp(page: Page, overrides?: Parameters<typeof buildTauriMockScript>[0]) {
  await page.addInitScript({ content: buildTauriMockScript(overrides) });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('text=Loading OpenMan')).toBeHidden({ timeout: 10000 });
}

const sidebar = (page: Page) => page.locator('.w-\\[260px\\]');
const mainContent = (page: Page) => page.locator('main');

async function navigateToRequestBuilder(page: Page) {
  await page.keyboard.press('Control+n');
  await expect(page.locator('input[placeholder*="Enter request URL"]')).toBeVisible();
}

// ---------------------------------------------------------------------------
// App Layout & Initialization
// ---------------------------------------------------------------------------
test.describe('App Initialization', () => {
  test('loads past the loading screen and renders the main layout', async ({ page }) => {
    await loadApp(page);

    await expect(page.locator('button[title="Collections"]')).toBeVisible();
    await expect(page.locator('text=Openman')).toBeVisible();
    await expect(sidebar(page).getByRole('button', { name: 'New Request' })).toBeVisible();

    const heading = mainContent(page).locator('h1:has-text("Collections"), h2:has-text("No Collections Yet")');
    await expect(heading.first()).toBeVisible();
  });

  test('shows error state when workspace initialization fails', async ({ page }) => {
    await page.addInitScript({
      content: `
        window.__TAURI_INTERNALS__ = {
          invoke: async (cmd) => {
            if (cmd === 'get_default_workspace') throw new Error('Disk read failed');
            return null;
          },
          metadata: () => ({ currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }),
        };
      `,
    });
    await page.goto('/');
    await expect(page.locator('text=Failed to initialize')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation via Activity Bar
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('navigates to History page', async ({ page }) => {
    await page.locator('button[title="History"]').click();
    await expect(mainContent(page).locator('h2:has-text("No History Yet")')).toBeVisible();
    await expect(page.locator('text=Your request history will appear here')).toBeVisible();
  });

  test('navigates to Environments page', async ({ page }) => {
    await page.locator('button[title="Environments"]').click();
    await expect(mainContent(page).locator('h2:has-text("Environments")')).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Development' })).toBeVisible();
  });

  test('navigates to Settings page', async ({ page }) => {
    await page.locator('button[title="Settings"]').click();
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('button:has-text("Light")')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toBeVisible();
  });

  test('navigates back to Collections page', async ({ page }) => {
    await page.locator('button[title="Settings"]').click();
    await expect(page.locator('text=General Settings')).toBeVisible();

    await page.locator('button[title="Collections"]').click();
    await expect(mainContent(page).locator('h1:has-text("Collections")')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('toggles sidebar visibility', async ({ page }) => {
    const brand = page.locator('text=Openman');
    await expect(brand).toBeVisible();

    await page.locator('button[title="Hide sidebar"]').click();
    await expect(brand).toBeHidden();

    await page.locator('button[title="Show sidebar"]').click();
    await expect(brand).toBeVisible();
  });

  test('displays collections in the sidebar', async ({ page }) => {
    await expect(sidebar(page).locator('text=Users API')).toBeVisible();
    await expect(sidebar(page).locator('text=Auth API')).toBeVisible();
  });

  test('expands a collection to show requests', async ({ page }) => {
    await sidebar(page).locator('text=Users API').click();

    await expect(sidebar(page).locator('text=List Users')).toBeVisible();
    await expect(sidebar(page).locator('text=Create User')).toBeVisible();
  });

  test('filters collections with search', async ({ page }) => {
    const searchInput = sidebar(page).locator('input[placeholder="Search..."]');
    await searchInput.fill('Auth');

    await expect(sidebar(page).locator('text=Auth API')).toBeVisible();
    await expect(sidebar(page).locator('text=Users API')).toBeHidden();
  });

  test('"New Request" button navigates to request builder', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: 'New Request' }).click();

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// Request Builder
// ---------------------------------------------------------------------------
test.describe('Request Builder', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
  });

  test('Send button is disabled when URL is empty', async ({ page }) => {
    const sendButton = mainContent(page).getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeDisabled();
  });

  test('accepts URL input and enables Send button', async ({ page }) => {
    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/users');

    const sendButton = mainContent(page).getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeEnabled();
  });

  test('changes HTTP method via dropdown', async ({ page }) => {
    const methodButton = mainContent(page).locator('button:has-text("GET")').first();
    await expect(methodButton).toBeVisible();
    await methodButton.click();

    const dropdown = page.locator('.absolute.top-full');
    await expect(dropdown.locator('button:has-text("POST")')).toBeVisible();
    await expect(dropdown.locator('button:has-text("DELETE")')).toBeVisible();

    await dropdown.locator('button:has-text("POST")').click();
    await expect(mainContent(page).locator('button:has-text("POST")').first()).toBeVisible();
  });

  test('switches between request tabs (params, headers, body, auth)', async ({ page }) => {
    await expect(page.locator('text=Query Parameters')).toBeVisible();

    await mainContent(page).locator('button:has-text("headers")').first().click();
    await expect(page.locator('text=No headers added')).toBeVisible();

    await mainContent(page).locator('button:has-text("body")').first().click();
    await expect(mainContent(page).locator('text=None')).toBeVisible();

    await mainContent(page).locator('button:has-text("auth")').first().click();
    await expect(page.locator('text=Auth Type')).toBeVisible();
  });

  test('adds and removes query parameters', async ({ page }) => {
    await page.locator('text=+ Add Parameter').click();

    const keyInput = page.locator('input[placeholder="Parameter name"]');
    const valueInput = page.locator('input[placeholder="Value"]').first();
    await expect(keyInput).toBeVisible();

    await keyInput.fill('page');
    await valueInput.fill('1');

    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');

    await expect(page.locator('text=Preview')).toBeVisible();
    const preview = page.locator('code');
    await expect(preview).toContainText('page=1');

    await mainContent(page).locator('button:has-text("×")').first().click();
    await expect(keyInput).toBeHidden();
  });

  test('adds request headers', async ({ page }) => {
    await mainContent(page).locator('button:has-text("headers")').first().click();
    await page.locator('text=+ Add Header').click();

    const keyInput = page.locator('input[placeholder="Header name"]');
    const valueInput = page.locator('input[placeholder="Value"]').first();
    await expect(keyInput).toBeVisible();

    await keyInput.fill('Authorization');
    await valueInput.fill('Bearer test-token');

    await expect(keyInput).toHaveValue('Authorization');
    await expect(valueInput).toHaveValue('Bearer test-token');
  });

  test('selects body type and shows editor', async ({ page }) => {
    await mainContent(page).locator('button:has-text("body")').first().click();

    // RadioGroup renders options as buttons with text labels
    await mainContent(page).locator('button:has-text("JSON")').first().click();

    await expect(page.locator('.monaco-editor, [data-testid="monaco-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test('configures Bearer Token auth', async ({ page }) => {
    await mainContent(page).locator('button:has-text("auth")').first().click();

    // Custom Select component — click the trigger, then select from dropdown
    await mainContent(page).locator('button:has-text("No Auth")').click();
    await page.locator('button:has-text("Bearer Token")').click();

    const tokenInput = page.locator('input[placeholder="Enter bearer token"]');
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill('my-secret-token');
    await expect(tokenInput).toHaveValue('my-secret-token');
  });

  test('configures Basic Auth', async ({ page }) => {
    await mainContent(page).locator('button:has-text("auth")').first().click();

    await mainContent(page).locator('button:has-text("No Auth")').click();
    await page.locator('button:has-text("Basic Auth")').click();

    const usernameInput = page.locator('input[placeholder="Enter username"]');
    const passwordInput = page.locator('input[placeholder="Enter password"]');
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill('admin');
    await passwordInput.fill('secret');

    await expect(usernameInput).toHaveValue('admin');
  });

  test('sends a request and displays the response', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');

    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Time:')).toBeVisible();
    await expect(page.locator('text=Size:')).toBeVisible();
  });

  test('shows response headers tab after sending', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // The response panel has its own "headers" tab — it's the last one with that text
    const responseHeadersTab = mainContent(page).locator('button:has-text("headers")').last();
    await responseHeadersTab.click();

    await expect(page.locator('text=content-type')).toBeVisible();
    await expect(page.locator('text=application/json')).toBeVisible();
    await expect(page.locator('text=x-request-id')).toBeVisible();
  });

  test('opens Save Request modal', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/test');

    await page.locator('button[title="Save Request"]').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Save Request")')).toBeVisible();
    await expect(modal.locator('input[placeholder="Enter request name"]')).toBeVisible();

    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal.locator('input[placeholder="Enter request name"]')).toBeHidden();
  });

  test('shows no-response placeholder initially', async ({ page }) => {
    await expect(page.locator('text=No response yet. Send a request to see the response.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Loading a saved request from sidebar
// ---------------------------------------------------------------------------
test.describe('Saved Requests', () => {
  test('opens a saved request from the sidebar into the builder', async ({ page }) => {
    await loadApp(page);

    // Expand "Users API" collection in sidebar
    await sidebar(page).locator('text=Users API').click();

    // Click the "List Users" request name
    await sidebar(page).locator('text=List Users').click();

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue('https://api.example.com/users');

    await expect(mainContent(page).locator('button:has-text("GET")').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Collections Page
// ---------------------------------------------------------------------------
test.describe('Collections Page', () => {
  test('displays collection cards with names and request counts', async ({ page }) => {
    await loadApp(page);

    await expect(mainContent(page).locator('h1:has-text("Collections")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Users API")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Auth API")')).toBeVisible();
    await expect(mainContent(page).locator('text=2 requests')).toBeVisible();
    await expect(mainContent(page).locator('text=0 requests')).toBeVisible();
  });

  test('searches collections on the page', async ({ page }) => {
    await loadApp(page);

    const searchInput = mainContent(page).locator('input[placeholder="Search collections..."]');
    await searchInput.fill('Auth');

    await expect(mainContent(page).locator('h3:has-text("Auth API")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Users API")')).toBeHidden();
  });

  test('opens and fills the Create Collection modal', async ({ page }) => {
    await loadApp(page);

    await mainContent(page).locator('button:has-text("New Collection")').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Create Collection")')).toBeVisible();

    const nameInput = modal.locator('input[placeholder*="My API Collection"]');
    await nameInput.fill('Payment API');
    await modal.locator('textarea[placeholder*="Describe this collection"]').fill('Payment endpoints');
    await modal.locator('button:has-text("Create Collection")').click();

    await expect(modal.locator('h2:has-text("Create Collection")')).toBeHidden({ timeout: 5000 });
  });

  test('shows validation error for empty collection name', async ({ page }) => {
    await loadApp(page);

    await mainContent(page).locator('button:has-text("New Collection")').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Create Collection")')).toBeVisible();

    await modal.locator('button:has-text("Create Collection")').click();

    await expect(modal.locator('text=Please enter a collection name')).toBeVisible();
  });

  test('shows empty state when no collections exist', async ({ page }) => {
    await loadApp(page, { collections: [] });

    await expect(mainContent(page).locator('h2:has-text("No Collections Yet")')).toBeVisible();
    await expect(page.locator('text=Create your first collection')).toBeVisible();
    await expect(mainContent(page).locator('button:has-text("Create Collection")')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Environments Page
// ---------------------------------------------------------------------------
test.describe('Environments Page', () => {
  test('displays existing environments and their variables', async ({ page }) => {
    await loadApp(page);
    await page.locator('button[title="Environments"]').click();

    await expect(mainContent(page).locator('h2:has-text("Environments")')).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Development' })).toBeVisible();
    await expect(mainContent(page).locator('text=Active').first()).toBeVisible();

    await expect(mainContent(page).locator('text={{BASE_URL}}')).toBeVisible();
    await expect(mainContent(page).locator('text=http://localhost:3000')).toBeVisible();
    await expect(mainContent(page).locator('text={{API_KEY}}')).toBeVisible();
  });

  test('shows empty state when no environments exist', async ({ page }) => {
    await loadApp(page, { environments: [] });
    await page.locator('button[title="Environments"]').click();

    await expect(mainContent(page).locator('h2:has-text("No Environments Yet")')).toBeVisible();
    await expect(mainContent(page).locator('button:has-text("Create Environment")')).toBeVisible();
  });

  test('opens Create Environment modal and validates input', async ({ page }) => {
    await loadApp(page, { environments: [] });
    await page.locator('button[title="Environments"]').click();

    await mainContent(page).locator('button:has-text("Create Environment")').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Create Environment")')).toBeVisible();

    // Submit empty — click the modal's Create button specifically
    await modal.locator('button:has-text("Create")').last().click();
    await expect(modal.locator('text=Please enter an environment name')).toBeVisible();

    // Fill and submit
    await modal.locator('input[placeholder*="Development, Staging"]').fill('Staging');
    await modal.locator('button:has-text("Create")').last().click();
    await expect(modal.locator('h2:has-text("Create Environment")')).toBeHidden({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------
test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.locator('button[title="Settings"]').click();
    await expect(page.locator('text=General Settings')).toBeVisible();
  });

  test('displays theme options (Light, Dark, System)', async ({ page }) => {
    await expect(page.locator('button:has-text("Light")')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toBeVisible();
    await expect(page.locator('button:has-text("System")')).toBeVisible();
  });

  test('switches to Editor settings section', async ({ page }) => {
    await mainContent(page).locator('button:has-text("Editor")').click();
    await expect(mainContent(page).locator('text=Editor Settings')).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Font Size' })).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Tab Size' })).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Word Wrap' })).toBeVisible();
  });

  test('switches to Shortcuts settings section', async ({ page }) => {
    await mainContent(page).locator('button:has-text("Shortcuts")').click();
    await expect(mainContent(page).locator('text=Keyboard Shortcuts')).toBeVisible();
    await expect(mainContent(page).locator('text=Send Request')).toBeVisible();
    await expect(mainContent(page).locator('text=Ctrl + Enter')).toBeVisible();
    await expect(mainContent(page).locator('text=Toggle Sidebar')).toBeVisible();
    await expect(mainContent(page).locator('kbd:has-text("Ctrl + N")')).toBeVisible();
  });

  test('toggles theme between Light and Dark', async ({ page }) => {
    await page.locator('button:has-text("Light")').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.locator('button:has-text("Dark")').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------
test.describe('Keyboard Shortcuts', () => {
  test('Ctrl+N opens a new request', async ({ page }) => {
    await loadApp(page);

    await page.keyboard.press('Control+n');

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue('');
  });

  test('Ctrl+B toggles the sidebar', async ({ page }) => {
    await loadApp(page);

    const brand = page.locator('text=Openman');
    await expect(brand).toBeVisible();

    await page.keyboard.press('Control+b');
    await expect(brand).toBeHidden();

    await page.keyboard.press('Control+b');
    await expect(brand).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// End-to-End Workflow: Create request, send, view response, save
// ---------------------------------------------------------------------------
test.describe('Full Workflow', () => {
  test('creates a POST request with JSON body, sends it, and verifies response', async ({ page }) => {
    await loadApp(page);

    // Use Ctrl+N to open new request (avoids duplicate "New Request" buttons)
    await page.keyboard.press('Control+n');
    await expect(page.locator('input[placeholder*="Enter request URL"]')).toBeVisible();

    // Change method to POST
    await mainContent(page).locator('button:has-text("GET")').first().click();
    const dropdown = page.locator('.absolute.top-full');
    await dropdown.locator('button:has-text("POST")').click();

    // Enter URL
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');

    // Switch to body tab and set JSON
    await mainContent(page).locator('button:has-text("body")').first().click();
    await mainContent(page).locator('button:has-text("JSON")').first().click();
    await expect(page.locator('.monaco-editor, [data-testid="monaco-editor"]')).toBeVisible({ timeout: 10000 });

    // Switch to headers and add one
    await mainContent(page).locator('button:has-text("headers")').first().click();
    await page.locator('text=+ Add Header').click();
    await page.locator('input[placeholder="Header name"]').fill('Content-Type');
    await page.locator('input[placeholder="Value"]').first().fill('application/json');

    // Send the request
    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    // Verify response
    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // Open save modal
    await page.locator('button[title="Save Request"]').click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Save Request")')).toBeVisible();

    await modal.locator('input[placeholder="Enter request name"]').fill('Create User E2E');
    await expect(modal.locator('text=POST').first()).toBeVisible();
  });
});
