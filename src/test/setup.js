// Test setup file for Vitest
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value?.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// ==================== FETCH MOCK ====================
// Create a mock fetch that returns proper Response objects

// Default API responses for different actions
const mockApiResponses = {
  'blacklist.getAll': { entries: [], success: true },
  'blacklist.add': { success: true },
  'blacklist.remove': { success: true },
  'blacklist.check': { isBlacklisted: false },
  'blacklist.clear': { success: true },
  'blacklist.stats': { total: 0, byReason: {} },
  'blacklist.import': { success: true, imported: 0 },
  'campaigns.getAll': { campaigns: [] },
  'commLogs.getAll': { logs: [] },
  'contacts.getAll': { contacts: [] },
  default: { success: true }
};

// Helper to create a mock Response
function createMockResponse(data, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' })
  });
}

// Mock fetch implementation
global.fetch = vi.fn((url, options = {}) => {
  // Parse the action from the request body
  let action = 'default';

  if (options.body) {
    try {
      const body = JSON.parse(options.body);
      action = body.action || 'default';
    } catch (e) {
      // Not JSON body
    }
  }

  // Check URL params for GET requests
  if (typeof url === 'string' && url.includes('action=')) {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    action = urlParams.get('action') || action;
  }

  // Return appropriate mock response
  const responseData = mockApiResponses[action] || mockApiResponses.default;
  return createMockResponse(responseData);
});

// Export helpers for tests to customize responses
export function mockApiResponse(action, data, ok = true) {
  mockApiResponses[action] = data;
}

export function resetApiMocks() {
  mockApiResponses['blacklist.getAll'] = { entries: [], success: true };
  mockApiResponses['blacklist.add'] = { success: true };
  mockApiResponses['blacklist.remove'] = { success: true };
  mockApiResponses['blacklist.check'] = { isBlacklisted: false };
  mockApiResponses['blacklist.clear'] = { success: true };
  mockApiResponses['blacklist.stats'] = { total: 0, byReason: {} };
}

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  resetApiMocks();
});
