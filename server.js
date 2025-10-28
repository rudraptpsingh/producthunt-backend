const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// Get ProductHunt token from environment variable
const PH_TOKEN = process.env.PH_TOKEN || '83vHxl0Vm4u6ywIYuH7HttXg-HLx23ADuKnoY5rQX6k';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Homepage with test interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ProductHunt API Proxy</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #da552f; }
        .test-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        button { background: #da552f; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #c44d2a; }
        pre { background: white; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .status { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>🚀 ProductHunt API Proxy Server</h1>
      <p>This server proxies requests to the ProductHunt GraphQL API.</p>
      
      <div class="test-box">
        <h2>Test the API</h2>
        <p>Click the button below to fetch the latest ProductHunt posts:</p>
        <button onclick="testAPI()">Get Latest Posts</button>
        <div class="status" id="status"></div>
        <pre id="result" style="display:none;"></pre>
      </div>

      <div class="test-box">
        <h2>API Endpoint</h2>
        <p><strong>POST</strong> /api/producthunt</p>
        <p>Send GraphQL queries in the request body:</p>
        <pre>{
  "query": "{ posts(first: 5) { edges { node { name description votesCount } } } }"
}</pre>
      </div>

      <script>
        async function testAPI() {
          const statusEl = document.getElementById('status');
          const resultEl = document.getElementById('result');
          
          statusEl.innerHTML = '⏳ Loading...';
          resultEl.style.display = 'none';
          
          try {
            const response = await fetch('/api/producthunt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: \`{
                  posts(first: 5) {
                    edges {
                      node {
                        name
                        tagline
                        votesCount
                        createdAt
                      }
                    }
                  }
                }\`
              })
            });
            
            const data = await response.json();
            
            if (data.errors) {
              statusEl.innerHTML = '❌ Error: ' + JSON.stringify(data.errors);
            } else {
              statusEl.innerHTML = '✅ Success! Here are the latest posts:';
              resultEl.textContent = JSON.stringify(data, null, 2);
              resultEl.style.display = 'block';
            }
          } catch (error) {
            statusEl.innerHTML = '❌ Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Proxy endpoint for ProductHunt GraphQL
app.post('/api/producthunt', async (req, res) => {
  try {
    const { query } = req.body;
    
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'ProductHunt API error',
        details: data
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ProductHunt proxy server running on port ${PORT}`);
  console.log(`API endpoint: /api/producthunt`);
});