import { ReadableStream } from 'web-streams-polyfill/ponyfill';

export const mockBackendURL = 'http://localhost:5000';

export const createSSEChunk = (data: any) => `data: ${JSON.stringify(data)}\n\n`;

/**
 * Configure axios mocks for a test.
 * Must be called after jest.mock('axios') in setup.ts.
 * Accepts the mocked axios instance and sets up mock implementations.
 *
 * Example usage:
 *   const mockedAxios = jest.mocked(axios);
 *   configureAxiosMocks(mockedAxios, {
 *     get: { 'http://localhost:5000/history': { data: [] } },
 *   });
 */
export const configureAxiosMocks = (
  mockedAxios: any,
  config: {
    get?: Record<string, any>;
    post?: Record<string, any>;
    delete?: Record<string, any>;
  } = {}
) => {
  if (config.get) {
    mockedAxios.get.mockImplementation(async (url: string, axiosConfig?: any) => {
      const response = config.get?.[url];
      if (response) return response;
      return { data: null };
    });
  }
  if (config.post) {
    mockedAxios.post.mockImplementation(async (url: string, data?: any, axiosConfig?: any) => {
      const response = config.post?.[url];
      if (response) return response;
      return { data: null };
    });
  }
  if (config.delete) {
    mockedAxios.delete.mockImplementation(async (url: string, axiosConfig?: any) => {
      const response = config.delete?.[url];
      if (response) return response;
      return { data: null };
    });
  }
};

/**
 * Mock global.fetch to simulate SSE stream behavior.
 * Replaces the global fetch with a Jest mock that returns a ReadableStream.
 * 
 * Example usage:
 *   mockFetchSSE([
 *     createSSEChunk({ section: 1, summary: 'test' }),
 *     createSSEChunk({ done: true }),
 *   ]);
 */
export const mockFetchSSE = (chunks: string[], delay = 0) => {
  // Create a ReadableStream from chunks
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          if (delay) await new Promise((r) => setTimeout(r, delay));
        }
        controller.close();
      })();
    },
  });

  global.fetch = jest.fn(async (input: any, init?: any) => {
    return {
      ok: true,
      status: 200,
      body: stream,
      text: async () => chunks.join(''),
    } as any;
  });
};

/**
 * Reset API mocks for the next test.
 * Clears Jest spies on fetch without removing the function entirely.
 * Does NOT reset axios mocks; do that in afterEach via jest.mocked(axios).mockClear().
 */
export const resetApiMocks = () => {
  // Reset fetch spy (do not set to undefined)
  if (typeof (global.fetch as any)?.mockReset === 'function') {
    (global.fetch as jest.Mock).mockReset();
  }
  if (typeof (global.fetch as any)?.mockClear === 'function') {
    (global.fetch as jest.Mock).mockClear();
  }
};

