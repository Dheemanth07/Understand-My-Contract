import React from 'react';
import { render as rtlRender, RenderOptions, waitFor } from '@testing-library/react';
import { renderHook as rtlRenderHook } from '@testing-library/react';
import { AuthContextProvider } from '@/context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { createMockSession as createSessionFromMock } from './supabaseMock';
import { mockFetchSSE } from './apiMocks';

interface RenderHookOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: any;
}

export function renderHook<T>(
  callback: (props?: any) => T,
  options?: RenderHookOptions
) {
  return rtlRenderHook(callback, options);
}

export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, options);
}

// Mock data factories
export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
  },
  ...overrides,
});

export const createMockToast = (overrides: any = {}) => ({
  id: 'toast-1',
  title: 'Test Toast',
  description: 'Test description',
  open: true,
  ...overrides,
});

// File & document factories
export const createMockFile = (name = 'document.pdf', size = 1024, type = 'application/pdf') => {
  // Use the browser File API where available
  try {
    return new File([new ArrayBuffer(size)], name, { type });
  } catch (e) {
    // Fallback for Node/JSDOM: simple object
    return { name, size, type } as any;
  }
};

export const createMockHistoryItem = (overrides: any = {}) => ({
  id: overrides.id || 'hist-1',
  filename: overrides.filename || 'document.pdf',
  createdAt: overrides.createdAt || new Date().toISOString(),
  ...overrides,
});

export const createMockSectionResult = (i = 1, overrides: any = {}) => ({
  section: i,
  original: overrides.original || `Original text for section ${i}`,
  summary: overrides.summary || `Summary for section ${i}`,
  legalTerms: overrides.legalTerms || [],
  ...overrides,
});

export const createMockGlossary = (entries: Record<string, string> = {}) => {
  return entries;
};

export const createMockDocument = (overrides: any = {}) => ({
  id: overrides.id || 'doc-1',
  filename: overrides.filename || 'document.pdf',
  sections: overrides.sections || [createMockSectionResult(1), createMockSectionResult(2)],
  glossary: overrides.glossary || createMockGlossary({ 'Term': 'Definition' }),
  createdAt: overrides.createdAt || new Date().toISOString(),
  ...overrides,
});

// Wait utilities
export async function waitForAsync(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const waitForLoadingToFinish = async (conditionFn: () => any, timeout = 2000) => {
  return await waitFor(conditionFn, { timeout });
};

// Cleanup utilities
export function clearAllTimers() {
  jest.clearAllTimers();
}

export function resetAllMocks() {
  jest.clearAllMocks();
}

// --- Authentication-specific test helpers ---
export const createMockSession = (overrides: any = {}) => {
  return createSessionFromMock(overrides);
};

export const createMockAuthResponse = (session: any = null, error: any = null) => {
  if (error) return { data: null, error };
  return { data: { session }, error: null };
};

export const createAuthContextWrapper = ({ children }: { children?: React.ReactNode }) => (
  <AuthContextProvider>{children}</AuthContextProvider>
);

export const createRouterWrapper = (initialEntries: string[] = ['/']) => {
  return ({ children }: { children?: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
};

export const createRouterWrapperWithAuth = (initialEntries: string[] = ['/']) => {
  return ({ children }: { children?: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </MemoryRouter>
  );
};

// API mocking helpers (wrappers around apiMocks)
export const mockFetchSSEHelper = (chunks: string[], delay = 0) => {
  mockFetchSSE(chunks, delay);
};

// Drag & drop helpers
export const triggerDragEvent = (node: Element, type: string, files: any[] = []) => {
  const dataTransfer = {
    files,
    items: files.map((f: any) => ({ kind: 'file', getAsFile: () => f })),
    types: ['Files'],
  } as any;

  // Use DragEvent if available; otherwise create a custom event with dataTransfer property
  let event: any;
  if (typeof (window as any).DragEvent === 'function') {
    try {
      event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    } catch (e) {
      // Fallback if DragEvent constructor fails
      event = new (window as any).Event(type, { bubbles: true, cancelable: true });
      event.dataTransfer = dataTransfer;
    }
  } else {
    // Fallback for JSDOM or environments without DragEvent
    event = new (window as any).Event(type, { bubbles: true, cancelable: true });
    event.dataTransfer = dataTransfer;
  }

  node.dispatchEvent(event);
};

// FormData/File/Blob helpers for tests
export const mockFormData = () => {
  class MockFormData {
    _entries: any[] = [];
    append(key: string, value: any) {
      this._entries.push([key, value]);
    }
    getEntries() {
      return this._entries;
    }
  }
  // @ts-ignore
  global.FormData = MockFormData;
  return MockFormData;
};

export const mockBlob = () => {
  // Minimal Blob polyfill for tests
  // @ts-ignore
  global.Blob = class {
    parts: any;
    opts: any;
    constructor(parts: any[], opts: any) {
      this.parts = parts;
      this.opts = opts;
    }
  };
};

export const mockFileConstructor = () => {
  try {
    // If File exists, do nothing
    // @ts-ignore
    if (typeof File !== 'undefined') return;
  } catch (e) {}

  // Minimal File polyfill
  // @ts-ignore
  global.File = class MockFile extends Blob {
    name: string;
    lastModified: number;
    constructor(parts: any[], name: string, opts: any) {
      super(parts, opts);
      this.name = name;
      this.lastModified = opts?.lastModified || Date.now();
    }
  } as any;
};

// Router & Auth wrappers
export const createRouterWrapperWithAuthOnly = createRouterWrapperWithAuth;

// Export everything relevant
export default {
  createMockFile,
  createMockUser,
  createMockSession,
  createMockDocument,
  createMockHistoryItem,
  createMockSectionResult,
  createMockGlossary,
  triggerDragEvent,
  mockFormData,
  mockBlob,
  mockFileConstructor,
  createRouterWrapperWithAuth,
  createRouterWrapper,
  createAuthContextWrapper,
  waitForAsync,
  waitForLoadingToFinish,
  mockFetchSSEHelper,
};