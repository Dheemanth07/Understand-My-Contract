import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { renderHook as rtlRenderHook } from '@testing-library/react';

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
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
  },
  ...overrides,
});

export const createMockToast = (overrides = {}) => ({
  id: 'toast-1',
  title: 'Test Toast',
  description: 'Test description',
  open: true,
  ...overrides,
});

// Wait utilities
export async function waitForAsync(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cleanup utilities
export function clearAllTimers() {
  jest.clearAllTimers();
}

export function resetAllMocks() {
  jest.clearAllMocks();
}
