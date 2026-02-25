import { existsSync, readFileSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

/**
 * Resolves contract path from various input formats
 * Supports: relative paths, absolute paths, and contract names
 */
export function resolveContractPath(contractInput: string): string {
  // If it's already an absolute path and exists, use it
  if (isAbsolute(contractInput) && existsSync(contractInput)) {
    return contractInput;
  }

  // Check if it's a relative path from current working directory
  const cwdPath = resolve(process.cwd(), contractInput);
  if (existsSync(cwdPath)) {
    return cwdPath;
  }

  // Check if it's just a contract name (e.g., "Token.sol")
  // Look in common contract directories
  const possiblePaths = [
    join(process.cwd(), 'contracts', contractInput),
    join(process.cwd(), 'contracts/examples', contractInput),
    join(process.cwd(), 'src', contractInput),
    join(__dirname, '../contracts/examples', contractInput),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // If file has .sol extension, try to find it recursively
  if (contractInput.endsWith('.sol')) {
    const foundPath = findContractFile(contractInput);
    if (foundPath) {
      return foundPath;
    }
  }

  throw new Error(
    `Contract "${contractInput}" not found. Searched in:\n` +
    `  - ${contractInput} (absolute)\n` +
    `  - ${cwdPath} (relative to cwd)\n` +
    `  - ${join(process.cwd(), 'contracts', contractInput)}\n` +
    `  - ${join(process.cwd(), 'contracts/examples', contractInput)}\n` +
    `  - ${join(__dirname, '../contracts/examples', contractInput)}`
  );
}

/**
 * Recursively finds a contract file in the given directory
 */
function findContractFile(filename: string, baseDir: string = process.cwd()): string | null {
  try {
    const { readdirSync, statSync } = require('fs');
    const { join } = require('path');

    const entries = readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(baseDir, entry.name);

      // Skip common directories
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }

      if (entry.isDirectory()) {
        const found = findContractFile(filename, fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name === filename) {
        return fullPath;
      }
    }
  } catch {
    // Ignore errors during directory traversal
  }

  return null;
}

/**
 * Resolves import paths in Solidity files
 */
export function resolveImportPath(importPath: string, currentFile: string): string {
  if (importPath.startsWith('@')) {
    // Handle npm/node_modules imports
    const packageName = importPath.split('/')[0];
    const packagePath = join(process.cwd(), 'node_modules', importPath);
    if (existsSync(packagePath)) {
      return packagePath;
    }
  }

  if (isAbsolute(importPath)) {
    return importPath;
  }

  // Relative import
  const dir = join(currentFile, '..');
  return resolve(dir, importPath);
}

/**
 * Validates that a contract file contains valid Solidity code
 */
export function validateContractFile(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = readFileSync(filePath, 'utf8');

    // Basic validation
    if (!content.includes('pragma solidity')) {
      return { valid: false, error: 'Missing pragma solidity declaration' };
    }

    if (!content.includes('contract ') && !content.includes('interface ') && !content.includes('library ')) {
      return { valid: false, error: 'No contract/interface/library found' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}
