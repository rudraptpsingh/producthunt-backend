const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Your ProductHunt token
const PH_TOKEN = '83vHxl0Vm4u6ywIYuH7HttXg-HLx23ADuKnoY5rQX6k';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`ProductHunt proxy server running on http://localhost:${PORT}`);
  console.log(`Frontend should use: http://localhost:${PORT}/api/producthunt`);
});