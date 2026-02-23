# Node.js Fundamentals

## Description

This repository contains solutions for Node.js Fundamentals assignment. The assignment covers various Node.js core APIs including File System, CLI, Modules, Hash, Streams, Zlib, Worker Threads, and Child Processes.

## Requirements

- Node.js version: >=24.10.0
- npm version: >=10.9.2
- No external libraries allowed

## Usage

### File System (src/fs)

- `npm run fs:snapshot` - Create snapshot of workspace directory
- `npm run fs:restore` - Restore directory structure from snapshot
- `npm run fs:findByExt` - Find files by extension in workspace
- `npm run fs:merge` - Merge .txt files from workspace/parts

### CLI (src/cli)

- `npm run cli:interactive` - Interactive command-line interface
- `npm run cli:progress` - Display progress bar

### Modules (src/modules)

- `npm run modules:dynamic` - Dynamic plugin loading

### Hash (src/hash)

- `npm run hash:verify` - Verify file checksums using SHA256

### Streams (src/streams)

- `npm run streams:lineNumberer` - Add line numbers to stdin input
- `npm run streams:filter` - Filter stdin lines by pattern
- `npm run streams:split` - Split file into chunks

### Zlib (src/zip)

- `npm run zip:compressDir` - Compress directory to .br archive
- `npm run zip:decompressDir` - Decompress .br archive

### Worker Threads (src/wt)

- `npm run wt:main` - Parallel sorting with worker threads

### Child Processes (src/cp)

- `npm run cp:execCommand` - Execute command in child process

## !!! Please don't submit Pull Requests to this repository !!!
