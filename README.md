# doc2code

A hub of developer tools with AI integration, featuring doc2service for converting documentation into SDKs.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)

## Features

- **doc2service**: Convert API documentation into ready-to-use SDKs with AI integration
  - Support for multiple programming languages
  - Integration with OpenAI, OpenRouter, and Groq
  - File upload for JSON/TXT files
  - Download generated SDKs
  - Token count preview
  - Text minification option
  - Chunked processing for large documents with progress tracking
  - Free model indicators

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your API keys:

```
# API Keys
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROQ_API_KEY=your_groq_api_key

# Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Debugging and Logging

The application includes a comprehensive logging system that saves logs to the `logs` directory. This is useful for debugging issues, especially with AI provider integrations.

### Client-Server Logging Architecture

The application uses a dual-logging approach:

1. **Server-side logging**: Direct file logging on the server for API routes and server components
2. **Client-side logging**: Browser-based logging that sends logs to the server via API

This ensures that both client and server events are captured in the same log files.

### Log Files

Log files are named by date (YYYY-MM-DD.log) and contain detailed information about requests, responses, and errors from both client and server.

### Viewing Logs

Use the included log viewer script to easily view and filter logs:

```bash
# View the most recent log file
node scripts/view-logs.js

# List all available log files
node scripts/view-logs.js --list

# View a specific log file
node scripts/view-logs.js --file 2023-04-20.log

# Filter by log level
node scripts/view-logs.js --level ERROR

# Search for specific terms
node scripts/view-logs.js --search "OpenAI"

# Show only the last N lines
node scripts/view-logs.js --tail 50

# Combine options
node scripts/view-logs.js --level ERROR --search "API key" --tail 20

# Find client-side logs
node scripts/view-logs.js --search "[CLIENT]"
```

### Log Levels

The logging system uses the following levels:

- **INFO**: General information about application operation
- **WARN**: Warning conditions that should be addressed
- **ERROR**: Error conditions that prevent normal operation
- **DEBUG**: Detailed debugging information

### Client-Side Logging

Client-side logs are buffered and sent to the server in batches to minimize network requests. They are automatically flushed:

- Every 5 seconds if there are pending logs
- When the buffer reaches 50% capacity
- When the user navigates away from a page
- When explicitly called via `clientLogger.flush()`

## Troubleshooting

If you encounter issues with the application, check the logs for detailed error information:

1. Run the log viewer script to see recent errors:

   ```bash
   node scripts/view-logs.js --level ERROR
   ```

2. Common issues:
   - Missing API keys in `.env.local`
   - Rate limiting issues with AI providers
   - Network connectivity problems

## Contributing

Contributions are welcome and appreciated! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the code style of the project.

### Recent Contributors

A special thanks to our recent contributors who have helped improve this project:

- Added token count preview
- Implemented text minification option
- Added chunked processing for large documents
- Added progress tracking for chunked processing
- Improved SDK generation quality
- Added free model indicators

## Support the Project

If you find this project helpful and would like to support its development, you can make a donation via PIX:

**PIX Key (Brazil):** `92ac9ad6-9ba5-48e6-8bb9-f5a9f64e09c6`

Your support helps maintain and improve this open-source project!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
