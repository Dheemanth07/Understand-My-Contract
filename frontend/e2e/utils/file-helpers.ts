import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const tmpDir = path.resolve(process.cwd(), 'e2e', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export async function createTestPDF(content: string, filename = 'test.pdf') {
  const filePath = path.join(tmpDir, filename);
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(12).text(content);
    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}

export async function createTestDOCX(content: string, filename = 'test.docx') {
  const filePath = path.join(tmpDir, filename);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph({ children: [new TextRun(content)] })],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

export async function createTestTXT(content: string, filename = 'test.txt') {
  const filePath = path.join(tmpDir, filename);
  await fs.promises.writeFile(filePath, content, 'utf8');
  return filePath;
}

export async function cleanupTestFiles() {
  if (fs.existsSync(tmpDir)) {
    const files = await fs.promises.readdir(tmpDir);
    for (const f of files) {
      await fs.promises.unlink(path.join(tmpDir, f));
    }
  }
}
