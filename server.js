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
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ProductHunt API Proxy</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
          animation: fadeInDown 0.6s ease-out;
        }
        
        .header h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 12px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.2);
        }
        
        .header p {
          font-size: 18px;
          opacity: 0.95;
        }
        
        .card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          animation: fadeInUp 0.6s ease-out;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        
        .card h2 {
          font-size: 24px;
          color: #1a1a1a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .icon {
          font-size: 28px;
        }
        
        .card p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        button {
          background: linear-gradient(135deg, #da552f 0%, #e8744f 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(218, 85, 47, 0.3);
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(218, 85, 47, 0.4);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .status {
          margin-top: 24px;
          padding: 16px;
          border-radius: 8px;
          font-weight: 500;
          display: none;
        }
        
        .status.show {
          display: block;
          animation: slideIn 0.3s ease-out;
        }
        
        .status.loading {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .status.success {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .status.error {
          background: #ffebee;
          color: #c62828;
        }
        
        .posts-container {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }
        
        .post-item {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #da552f;
          animation: slideIn 0.4s ease-out;
        }
        
        .post-item h3 {
          color: #1a1a1a;
          font-size: 18px;
          margin-bottom: 8px;
        }
        
        .post-item .tagline {
          color: #555;
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .post-meta {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #777;
        }
        
        .votes {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          color: #da552f;
        }
        
        .code-block {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .endpoint {
          background: #f8f9fa;
          padding: 12px 16px;
          border-radius: 6px;
          font-family: monospace;
          color: #da552f;
          font-weight: 600;
          margin: 16px 0;
          border-left: 3px solid #da552f;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: #da552f;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 ProductHunt API Proxy</h1>
          <p>Seamlessly access ProductHunt's GraphQL API</p>
        </div>
        
        <div class="card">
          <h2><span class="icon">🎯</span> Test Live Data</h2>
          <p>Click the button below to fetch the latest trending products from ProductHunt:</p>
          <button onclick="testAPI()" id="testBtn">Get Latest Posts</button>
          <div class="status" id="status"></div>
          <div id="postsContainer" class="posts-container"></div>
        </div>

        <div class="card">
          <h2><span class="icon">📡</span> API Documentation</h2>
          <p>Send POST requests to this endpoint with GraphQL queries:</p>
          <div class="endpoint">POST /api/producthunt</div>
          <p><strong>Example Request Body:</strong></p>
          <div class="code-block">{
  "query": "{ posts(first: 5) { edges { node { name tagline votesCount } } } }"
}</div>
        </div>
      </div>

      <script>
        async function testAPI() {
          const statusEl = document.getElementById('status');
          const postsContainer = document.getElementById('postsContainer');
          const btn = document.getElementById('testBtn');
          
          statusEl.className = 'status loading show';
          statusEl.innerHTML = '⏳ Fetching latest products...';
          postsContainer.innerHTML = '';
          btn.disabled = true;
          
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
              statusEl.className = 'status error show';
              statusEl.innerHTML = '❌ Error: ' + JSON.stringify(data.errors);
            } else if (data.data && data.data.posts) {
              statusEl.className = 'status success show';
              statusEl.innerHTML = '✅ Successfully fetched products!';
              
              const posts = data.data.posts.edges;
              posts.forEach((edge, index) => {
                const post = edge.node;
                const postEl = document.createElement('div');
                postEl.className = 'post-item';
                postEl.style.animationDelay = (index * 0.1) + 's';
                postEl.innerHTML = \`
                  <h3>\${post.name}</h3>
                  <div class="tagline">\${post.tagline || 'No tagline available'}</div>
                  <div class="post-meta">
                    <div class="votes">▲ \${post.votesCount} upvotes</div>
                    <div>📅 \${new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                \`;
                postsContainer.appendChild(postEl);
              });
            }
          } catch (error) {
            statusEl.className = 'status error show';
            statusEl.innerHTML = '❌ Error: ' + error.message;
          } finally {
            btn.disabled = false;
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