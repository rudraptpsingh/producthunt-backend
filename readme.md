# ProductHunt Backend

## Quick Setup

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

Server runs on http://localhost:3001

## Deploy to Railway

1. Push to GitHub
2. Go to https://railway.app
3. Deploy from GitHub repo
4. Get your public URL
5. Use URL in frontend: https://your-app.up.railway.app/api/producthunt

## Test

```bash
curl -X POST http://localhost:3001/api/producthunt \
  -H "Content-Type: application/json" \
  -d '{"query": "query { posts(first: 1) { edges { node { name } } } }"}'
```