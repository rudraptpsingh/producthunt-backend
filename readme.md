# ProductHunt API Proxy Server

A Node.js Express server that proxies requests to the ProductHunt GraphQL API.

## Setup on Replit

1. **Add your ProductHunt token** as a secret:
   - The token `PH_TOKEN` should be added through the Replit Secrets interface

2. The server will automatically start on port 5000

## API Endpoint

**POST /api/producthunt**

Send GraphQL queries to ProductHunt API:

```bash
curl -X POST https://your-repl-url.replit.dev/api/producthunt \
  -H "Content-Type: application/json" \
  -d '{"query": "query { posts(first: 1) { edges { node { name } } } }"}'
```

## Deploy (Publish)

Click the "Deploy" button in Replit to publish your server with a public URL.

## Testing Locally

The server runs on port 5000 and accepts POST requests at `/api/producthunt` with GraphQL queries in the request body.
