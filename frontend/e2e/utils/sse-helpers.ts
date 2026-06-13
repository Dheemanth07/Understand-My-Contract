import { Page } from '@playwright/test';

export async function captureSSEEvents(page: Page, uploadEndpoint = '/upload') {
  const events: any[] = [];

  // Intercept the response body for the SSE upload request
  await page.route('**' + uploadEndpoint + '**', async (route) => {
    const request = route.request();
    const response = await route.fetch();
    const body = await response.text();

    // Simple parse: split by `\n\n` and extract data: lines
    const chunks = body.split(/\n\n/).filter(Boolean);
    for (const chunk of chunks) {
      const lines = chunk.split(/\n/).map((l) => l.replace(/^data:\s*/, ''));
      for (const l of lines) {
        try {
          const json = JSON.parse(l);
          events.push(json);
        } catch (e) {
          // ignore non-json
        }
      }
    }

    // fulfill with original response so UI still receives it
    route.fulfill({ response, body });
  });

  return events;
}

export function parseSSEChunks(rawText: string) {
  const events: any[] = [];
  const chunks = rawText.split(/\n\n/).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split(/\n/).map((l) => l.replace(/^data:\s*/, ''));
    for (const l of lines) {
      try {
        events.push(JSON.parse(l));
      } catch (e) {
        // ignore
      }
    }
  }
  return events;
}

export function waitForSSEComplete(events: any[], expectedSections = 0) {
  const done = events.find((e) => e.done === true);
  if (!done) return false;
  if (expectedSections > 0) {
    const sections = events.filter((e) => e.type === 'section');
    return sections.length === expectedSections;
  }
  return true;
}
