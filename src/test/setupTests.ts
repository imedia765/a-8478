import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

// Setup a basic DOM environment for tests
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Properly type the window object
const customWindow = dom.window as unknown as Window & typeof globalThis;
global.window = customWindow;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window.matchMedia
global.window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Create a wrapper with providers for testing
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});