import '@testing-library/jest-dom';

// Set up environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_BACKEND_URL = 'http://localhost:5000';

// Expose import.meta.env for modules that read it at runtime
// Note: modules that read import.meta.env at module-eval time won't see this.
// Prefer designing code for process.env when possible.
// Provide a global stub for tests
// @ts-ignore
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      VITE_BACKEND_URL: process.env.VITE_BACKEND_URL,
    },
  },
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Set environment variables BEFORE importing any modules that use import.meta.env
// ts-jest transforms import.meta.env.VITE_* to process.env.VITE_*
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.VITE_BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Suppress console warnings during tests if needed
const originalConsoleError = console.error;

// Store original fetch implementation so tests can restore it
const originalFetch = global.fetch;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  // Top-level Jest.mock for axios (ensure this happens once at module load)
  // This allows tests to call jest.mocked(axios) and configure mocks per test
  jest.mock('axios');

  // Provide basic FormData/File/Blob mocks for JSDOM
  if (typeof (global as any).FormData === 'undefined') {
    // @ts-ignore
    global.FormData = class {
      _entries: any[] = [];
      append(key: string, value: any) {
        this._entries.push([key, value]);
      }
    } as any;
  }

  if (typeof (global as any).Blob === 'undefined') {
    // @ts-ignore
    global.Blob = class {
      parts: any;
      opts: any;
      constructor(parts: any[], opts: any) {
        this.parts = parts;
        this.opts = opts;
      }
    };
  }

  if (typeof (global as any).File === 'undefined') {
    // Minimal File polyfill
    // @ts-ignore
    global.File = class MockFile extends (global as any).Blob {
      name: string;
      lastModified: number;
      constructor(parts: any[], name: string, opts: any) {
        super(parts, opts);
        this.name = name;
        this.lastModified = opts?.lastModified || Date.now();
      }
    } as any;
  }

  // Mock window.confirm, scrollIntoView and document.querySelector safe defaults
  window.confirm = jest.fn(() => true);
  Element.prototype.scrollIntoView = jest.fn();
  const originalQuery = document.querySelector.bind(document);
  document.querySelector = (selector: string) => originalQuery(selector);

  // Ensure fetch is a Jest mock so tests can call mockReset, mockImplementation, etc.
  if (typeof global.fetch === 'undefined') {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
  }
});

afterAll(() => {
  console.error = originalConsoleError;
  // Restore original fetch if needed by tests
  global.fetch = originalFetch;
});

// Helper to restore original fetch
export const restoreOriginalFetch = () => {
  global.fetch = originalFetch;
};

// Helper to get environment variables (guarantees values are strings at runtime)
export const getTestEnv = (key: string, defaultValue = ''): string => {
  return process.env[key] || defaultValue;
};
