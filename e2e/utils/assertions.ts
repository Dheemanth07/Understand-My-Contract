import { expect } from '@playwright/test';
import mongoose from 'mongoose';

export async function expectAnalysisInDB(id: string, expectedData: any) {
  const Analysis = mongoose.connection.collection('analyses');
  const doc = await Analysis.findOne({ _id: new mongoose.Types.ObjectId(id) });
  expect(doc).toBeTruthy();
  if (expectedData.filename) expect(doc.filename).toBe(expectedData.filename);
}

export async function expectHistoryCount(userId: string, expectedCount: number) {
  const Analysis = mongoose.connection.collection('analyses');
  const count = await Analysis.countDocuments({ userId });
  expect(count).toBe(expectedCount);
}

export function expectSectionStructure(section) {
  expect(section).toHaveProperty('original');
  expect(section).toHaveProperty('summary');
  expect(section).toHaveProperty('legalTerms');
}

export function expectGlossaryEntry(glossary, term, definition) {
  expect(glossary[term]).toBeDefined();
  expect(glossary[term]).toBe(definition);
}
