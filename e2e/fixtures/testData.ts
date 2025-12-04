export const TEST_USERS = [
  { email: 'e2e_user1@example.com', password: 'Password123!', userId: 'user-e2e-1' },
];

export const MOCK_ANALYSIS_RESPONSE = {
  sections: [
    { index: 1, original: 'Section one text', summary: 'Short summary one', legalTerms: ['Agreement'] },
    { index: 2, original: 'Section two text', summary: 'Short summary two', legalTerms: ['Liability'] },
  ],
  glossary: [{ term: 'Agreement', definition: 'An agreement between parties' }],
};

export const MOCK_SSE_CHUNKS = [
  { type: 'meta', totalSections: 2 },
  { type: 'section', index: 1, data: { original: 'Section one text', summary: 'Short summary one' } },
  { type: 'section', index: 2, data: { original: 'Section two text', summary: 'Short summary two' } },
  { done: true },
];
