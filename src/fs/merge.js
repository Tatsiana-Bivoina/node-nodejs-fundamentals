// Run: npm run fs:merge [-- --files <name1,name2,...>]
// Examples: npm run fs:merge
//           npm run fs:merge -- --files part1.txt,part2.txt

import fs from 'node:fs/promises';
import path from 'node:path';

const WORKSPACE_DIR_NAME = 'workspace';
const PARTS_DIR_NAME = 'parts';
const OUTPUT_FILE_NAME = 'merged.txt';

const parseFilesArg = () => {
  const args = process.argv.slice(2);
  const filesFlagIndex = args.indexOf('--files');

  if (filesFlagIndex === -1) {
    return null;
  }

  const value = args[filesFlagIndex + 1];
  if (!value) {
    throw new Error('FS operation failed');
  }

  const files = value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (files.length === 0) {
    throw new Error('FS operation failed');
  }

  return files;
};

const merge = async () => {
  const cwd = process.cwd();
  const workspacePath = path.resolve(cwd, WORKSPACE_DIR_NAME);

  let workspaceStats;
  try {
    workspaceStats = await fs.stat(workspacePath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!workspaceStats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  const partsDirPath = path.join(workspacePath, PARTS_DIR_NAME);

  let partsStats;
  try {
    partsStats = await fs.stat(partsDirPath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!partsStats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  const requestedFiles = parseFilesArg();
  const filesToMerge = [];

  if (requestedFiles) {
    for (const fileName of requestedFiles) {
      const filePath = path.join(partsDirPath, fileName);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
          throw new Error('FS operation failed');
        }
      } catch {
        throw new Error('FS operation failed');
      }
      filesToMerge.push(filePath);
    }
  } else {
    const dirEntries = await fs.readdir(partsDirPath, { withFileTypes: true });
    const txtFiles = dirEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    if (txtFiles.length === 0) {
      throw new Error('FS operation failed');
    }

    for (const name of txtFiles) {
      filesToMerge.push(path.join(partsDirPath, name));
    }
  }

  let mergedContent = '';

  for (const filePath of filesToMerge) {
    const content = await fs.readFile(filePath, 'utf8');
    mergedContent += content;
  }

  const outputPath = path.join(workspacePath, OUTPUT_FILE_NAME);
  await fs.writeFile(outputPath, mergedContent, 'utf8');
};

await merge();
