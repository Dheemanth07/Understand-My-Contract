import { Page } from '@playwright/test';

export async function mockUploadEndpoint(page: Page, mockSSEChunks: any[]) {
  // Intercepts the fetch POST to /upload and returns a streaming-like response using a simple completed body
  await page.route('**/upload', async (route) => {
    // Build SSE stream body
    const body = mockSSEChunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('');
    route.fulfill({ status: 200, contentType: 'text/event-stream', body });
  });
}

export async function mockHistoryEndpoint(page: Page, mockHistory: any[]) {
  await page.route('**/history', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory) });
  });
}

export async function mockHistoryDetailEndpoint(page: Page, id: string, mockDoc: any) {
  await page.route(new RegExp(`.*/history/${id}`), (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDoc) });
  });
}

export async function mockDeleteEndpoint(page: Page, id: string) {
  await page.route(new RegExp(`.*/history/${id}`), (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Document deleted successfully' }) });
    } else {
      route.continue();
    }
  });
}
