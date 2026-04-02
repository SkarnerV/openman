/**
 * Shared E2E Test Fixtures
 *
 * Provides mock utilities for Tauri API calls and common test helpers.
 */

import { Page, expect } from '@playwright/test';

const NOW = new Date().toISOString();

export const MOCK_WORKSPACE = {
  id: 'ws-test-1',
  name: 'Default Workspace',
  description: 'E2E test workspace',
  createdAt: NOW,
  updatedAt: NOW,
  settings: { theme: 'dark', fontSize: 14, tabSize: 2 },
};

export const MOCK_COLLECTIONS = [
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

export const MOCK_ENVIRONMENTS = [
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
  {
    id: 'env-2',
    name: 'Production',
    isActive: false,
    variables: [
      { key: 'BASE_URL', value: 'https://api.production.com', enabled: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_HTTP_RESPONSE = {
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

export const MOCK_ERROR_RESPONSE = {
  status: 404,
  statusText: 'Not Found',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ error: 'Resource not found' }),
  responseTime: 50,
  responseSize: 35,
};

interface MockOverrides {
  collections?: unknown[];
  environments?: unknown[];
  httpResponse?: unknown;
  shouldFailWorkspace?: boolean;
  shouldFailRequest?: boolean;
}

export function buildTauriMockScript(overrides: MockOverrides = {}) {
  const collections = JSON.stringify(overrides.collections ?? MOCK_COLLECTIONS);
  const environments = JSON.stringify(overrides.environments ?? MOCK_ENVIRONMENTS);
  const httpResponse = JSON.stringify(overrides.httpResponse ?? MOCK_HTTP_RESPONSE);
  const workspace = JSON.stringify(MOCK_WORKSPACE);

  return `
    const _collections = ${collections};
    const _environments = ${environments};
    const _httpResponse = ${httpResponse};
    const _workspace = ${workspace};
    const _shouldFailWorkspace = ${overrides.shouldFailWorkspace ?? false};
    const _shouldFailRequest = ${overrides.shouldFailRequest ?? false};

    // Track operations for testing
    window.__tauriOperations = {
      moveRequestCalls: [],
      deleteCollectionCalls: [],
      deleteRequestCalls: [],
      updateCollectionCalls: [],
      updateEnvironmentCalls: [],
      logCalls: [],
    };

    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd, args) => {
        switch (cmd) {
          case 'get_default_workspace':
            if (_shouldFailWorkspace) throw new Error('Disk read failed');
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
            window.__tauriOperations.updateCollectionCalls.push(args);
            return null;
          case 'delete_collection':
            window.__tauriOperations.deleteCollectionCalls.push(args);
            return null;
          case 'update_environment':
            window.__tauriOperations.updateEnvironmentCalls.push(args);
            return null;
          case 'delete_environment':
            return null;
          case 'set_active_environment':
            return null;
          case 'move_request':
            window.__tauriOperations.moveRequestCalls.push(args);
            return null;
          case 'delete_request':
            window.__tauriOperations.deleteRequestCalls.push(args);
            return null;
          case 'send_http_request':
            if (_shouldFailRequest) throw new Error('Network error');
            return _httpResponse;
          // Import/Export commands
          case 'import_postman_collection':
            return {
              id: 'col-imported-' + Date.now(),
              name: JSON.parse(args?.json || '{}')?.info?.name || 'Imported Collection',
              description: '',
              variables: [],
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          case 'export_postman_collection':
            return JSON.stringify({
              info: { name: 'Exported Collection', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
              item: [],
            });
          case 'export_environment':
            return JSON.stringify({
              id: args?.environmentId,
              name: 'Exported Environment',
              isActive: false,
              variables: [],
            });
          case 'import_environment':
            return {
              id: 'env-imported-' + Date.now(),
              name: JSON.parse(args?.json || '{}')?.name || 'Imported Environment',
              isActive: false,
              variables: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          // Logging commands
          case 'log_user_action':
            window.__tauriOperations.logCalls.push({
              version: args?.version,
              category: args?.category,
              action: args?.action,
              label: args?.label,
              value: args?.value,
              metadata: args?.metadata,
              timestamp: new Date().toISOString(),
            });
            return null;
          case 'get_logs':
            return [
              '[2026-04-02T10:00:00Z] v0.1.0 | request | send_request | label: GET https://api.example.com | value: 200 | metadata: none',
              '[2026-04-02T10:01:00Z] v0.1.0 | collection | create_collection | label: Test Collection | value: none | metadata: none',
            ];
          case 'get_log_dates_list':
            return ['2026-04-02', '2026-04-01'];
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

export async function loadApp(page: Page, overrides?: MockOverrides) {
  await page.addInitScript({ content: buildTauriMockScript(overrides) });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('text=Loading OpenMan')).toBeHidden({ timeout: 10000 });
}

export const sidebar = (page: Page) => page.locator('.w-\\[260px\\]');
export const mainContent = (page: Page) => page.locator('main');

export async function navigateToRequestBuilder(page: Page) {
  await page.keyboard.press('Control+n');
  await expect(page.locator('input[placeholder*="Enter request URL"]')).toBeVisible();
}

export async function expandCollection(page: Page, collectionName: string) {
  await sidebar(page).locator(`text="${collectionName}"`).click();
}