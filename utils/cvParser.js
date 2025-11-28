const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

function resolveCvPath(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }

  const trimmedPath = filePath.replace(/^[/\\]+/, '');
  const fallbackPath = path.join(__dirname, '..', trimmedPath);
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  throw new Error(`CV file not found at ${resolvedPath}`);
}

async function extractTextFromPdf(filePath) {
  const resolvedPath = resolveCvPath(filePath);
  const fileBuffer = await fs.promises.readFile(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === '.pdf') {
    const parsed = await pdfParse(fileBuffer);
    return parsed.text || '';
  }

  return fileBuffer.toString('utf8');
}

module.exports = { extractTextFromPdf, resolveCvPath };
