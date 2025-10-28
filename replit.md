# ProductHunt API Proxy Server

## Overview
A Node.js Express server that acts as a proxy for the ProductHunt GraphQL API. This backend service allows frontend applications to make requests to ProductHunt without exposing API tokens.

## Project Architecture
- **Language**: Node.js (CommonJS)
- **Framework**: Express.js
- **Port**: 5000 (Replit standard)
- **Host**: 0.0.0.0 (to allow Replit proxy access)

## Dependencies
- express: Web server framework
- cors: Enable CORS for frontend access
- node-fetch: HTTP client for API requests

## API Endpoint
**POST /api/producthunt**
- Accepts GraphQL queries in request body
- Proxies requests to ProductHunt API
- Returns GraphQL response data

## Environment Variables
- `PH_TOKEN`: ProductHunt API token (required)
- `PORT`: Server port (defaults to 5000)

## Recent Changes
- **2025-10-28**: Initial Replit setup
  - Moved hardcoded API token to environment variable
  - Changed port from 3001 to 5000
  - Configured server to bind to 0.0.0.0 for Replit compatibility
  - Installed Node.js 20 and dependencies
