#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Check if logs directory exists
if (!fs.existsSync(logsDir)) {
  console.error('Logs directory does not exist. No logs have been generated yet.');
  process.exit(1);
}

// Get all log files
const logFiles = fs.readdirSync(logsDir)
  .filter(file => file.endsWith('.log'))
  .sort((a, b) => {
    // Sort by date (newest first)
    const dateA = a.replace('.log', '');
    const dateB = b.replace('.log', '');
    return dateB.localeCompare(dateA);
  });

if (logFiles.length === 0) {
  console.error('No log files found.');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
let selectedFile = logFiles[0]; // Default to most recent log file
let filterLevel = null;
let searchTerm = null;
let tailLines = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && i + 1 < args.length) {
    selectedFile = args[i + 1];
    i++;
  } else if (args[i] === '--level' && i + 1 < args.length) {
    filterLevel = args[i + 1].toUpperCase();
    i++;
  } else if (args[i] === '--search' && i + 1 < args.length) {
    searchTerm = args[i + 1];
    i++;
  } else if (args[i] === '--tail' && i + 1 < args.length) {
    tailLines = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--list') {
    console.log('Available log files:');
    logFiles.forEach(file => {
      console.log(`  ${file}`);
    });
    process.exit(0);
  } else if (args[i] === '--help') {
    console.log(`
Usage: node view-logs.js [options]

Options:
  --file <filename>    Specify log file to view (default: most recent)
  --level <level>      Filter by log level (INFO, WARN, ERROR, DEBUG)
  --search <term>      Search for specific term in logs
  --tail <n>           Show only the last n lines
  --list               List available log files
  --help               Show this help message
    `);
    process.exit(0);
  }
}

// Ensure the selected file exists
if (!logFiles.includes(selectedFile)) {
  console.error(`Log file "${selectedFile}" not found.`);
  console.log('Available log files:');
  logFiles.forEach(file => {
    console.log(`  ${file}`);
  });
  process.exit(1);
}

const logFilePath = path.join(logsDir, selectedFile);

// Read and process the log file
const processLogFile = async () => {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines = [];
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    
    // Apply filters
    if (filterLevel && !line.includes(`[${filterLevel}]`)) {
      continue;
    }
    
    if (searchTerm && !line.toLowerCase().includes(searchTerm.toLowerCase())) {
      continue;
    }
    
    lines.push(line);
  }
  
  // Apply tail if specified
  const outputLines = tailLines ? lines.slice(-tailLines) : lines;
  
  // Print results
  console.log(`=== Log file: ${selectedFile} ===`);
  if (filterLevel) console.log(`Filtering by level: ${filterLevel}`);
  if (searchTerm) console.log(`Searching for: "${searchTerm}"`);
  if (tailLines) console.log(`Showing last ${tailLines} matching lines`);
  console.log('');
  
  if (outputLines.length === 0) {
    console.log('No matching log entries found.');
  } else {
    outputLines.forEach(line => {
      // Colorize output based on log level
      if (line.includes('[ERROR]')) {
        console.log('\x1b[31m%s\x1b[0m', line); // Red
      } else if (line.includes('[WARN]')) {
        console.log('\x1b[33m%s\x1b[0m', line); // Yellow
      } else if (line.includes('[INFO]')) {
        console.log('\x1b[32m%s\x1b[0m', line); // Green
      } else if (line.includes('[DEBUG]')) {
        console.log('\x1b[36m%s\x1b[0m', line); // Cyan
      } else {
        console.log(line);
      }
    });
    
    console.log('');
    console.log(`Displayed ${outputLines.length} of ${lineCount} total log entries.`);
  }
};

processLogFile().catch(err => {
  console.error('Error processing log file:', err);
  process.exit(1);
});
