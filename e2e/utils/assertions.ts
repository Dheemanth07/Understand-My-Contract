import { expect } from "@playwright/test";
import mongoose from "mongoose";

interface AnalysisDocument {
    filename?: string;
    [key: string]: unknown;
}

interface SectionStructure {
    original: string;
    summary: string;
    legalTerms: unknown[];
}

export async function expectAnalysisInDB(
    id: string,
    expectedData: Record<string, unknown>,
) {
    const Analysis = mongoose.connection.collection("analyses");
    const doc = (await Analysis.findOne({
        _id: new mongoose.Types.ObjectId(id),
    })) as AnalysisDocument | null;
    if (!doc) throw new Error(`Analysis not found for id ${id}`);
    if (expectedData.filename) expect(doc.filename).toBe(expectedData.filename);
}

export async function expectHistoryCount(
    userId: string,
    expectedCount: number,
) {
    const Analysis = mongoose.connection.collection("analyses");
    const count = await Analysis.countDocuments({ userId });
    expect(count).toBe(expectedCount);
}

export function expectSectionStructure(
    section: SectionStructure | Record<string, unknown>,
) {
    expect(section).toHaveProperty("original");
    expect(section).toHaveProperty("summary");
    expect(section).toHaveProperty("legalTerms");
}

export function expectGlossaryEntry(
    glossary: Record<string, unknown>,
    term: string,
    definition: unknown,
) {
    expect((glossary as Record<string, unknown>)[term]).toBeDefined();
    expect((glossary as Record<string, unknown>)[term]).toBe(definition);
}
