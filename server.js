const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// Get ProductHunt token from environment variable
const PH_TOKEN = process.env.PH_TOKEN;

if (!PH_TOKEN) {
  console.error('ERROR: PH_TOKEN environment variable is not set!');
  console.error('Please set your ProductHunt API token in the Secrets tab');
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Analytics Dashboard - Home Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ProductHunt Analytics Dashboard</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f6f5f4;
          min-height: 100vh;
        }
        
        .top-bar {
          background: white;
          border-bottom: 1px solid #e8e7e6;
          padding: 16px 24px;
          margin-bottom: 32px;
        }
        
        .top-bar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          font-size: 32px;
        }
        
        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .logo span {
          color: #da552f;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 40px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          padding: 20px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .stat-card:hover {
          border-color: #da552f;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.1);
        }
        
        .stat-card .label {
          color: #828282;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-card .value {
          font-size: 32px;
          font-weight: 700;
          color: #da552f;
        }
        
        .filters-section {
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }
        
        .filter-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #1a1a1a;
          font-size: 14px;
        }
        
        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e8e7e6;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #da552f;
        }
        
        .refresh-btn {
          background: #da552f;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s ease;
        }
        
        .refresh-btn:hover {
          background: #c14a29;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .chart-card {
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          padding: 20px;
        }
        
        .chart-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        
        .chart-container {
          position: relative;
          height: 280px;
        }
        
        .section-header {
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .products-grid {
          display: grid;
          gap: 12px;
        }
        
        .product-card {
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          padding: 16px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        
        .product-card:hover {
          border-color: #da552f;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.08);
        }
        
        .product-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .product-info {
          flex: 1;
        }
        
        .product-rank {
          background: #da552f;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          margin-right: 10px;
          display: inline-block;
        }
        
        .product-name {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        
        .product-tagline {
          font-size: 14px;
          color: #828282;
          line-height: 1.4;
          margin-bottom: 12px;
        }
        
        .product-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #828282;
        }
        
        .upvote-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fff7f5;
          border: 1px solid #da552f;
          color: #da552f;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
        }
        
        .category-badge {
          display: inline-block;
          background: #f6f5f4;
          color: #828282;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .product-link {
          color: #da552f;
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
        }
        
        .product-link:hover {
          text-decoration: underline;
        }
        
        .loading {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          margin: 40px 0;
        }
        
        .loading div {
          color: #828282;
          font-size: 16px;
        }
        
        .predictor-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 32px;
          color: white;
          margin-bottom: 32px;
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }
        
        .predictor-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .predictor-header h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 700;
        }
        
        .predictor-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
        
        .score-display {
          text-align: center;
          margin: 32px 0;
        }
        
        .score-circle {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          font-weight: 800;
          border: 6px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .score-label {
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.9;
          font-weight: 600;
        }
        
        .score-high { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .score-medium { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .score-low { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        
        .recommendation-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 16px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
        
        .recommendation-item .rec-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        
        .recommendation-item .rec-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .recommendation-item .rec-impact {
          font-size: 13px;
          opacity: 0.9;
        }
        
        .confidence-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 8px;
        }
        
        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .recommendations-grid {
            grid-template-columns: 1fr;
          }
          
          .score-circle {
            width: 120px;
            height: 120px;
            font-size: 42px;
          }
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        <div class="top-bar-content">
          <div class="logo">
            <div class="logo-icon">🚀</div>
            <h1>Product<span>Hunt</span> Analytics</h1>
          </div>
        </div>
      </div>
      
      <div class="container">
        <div id="loading" class="loading">
          <div>Loading dashboard data...</div>
        </div>
        
        <div id="dashboard" style="display: none;">
          <div class="predictor-card" id="predictorCard">
            <div class="predictor-header">
              <h2>🎯 Launch Score Predictor</h2>
              <p>AI-powered insights to maximize your ProductHunt launch success</p>
            </div>
            
            <div class="score-display">
              <div class="score-circle" id="scoreCircle">
                <span id="scoreValue">--</span>
              </div>
              <div class="score-label" id="scoreLabel">Calculating...</div>
            </div>
            
            <div class="recommendations-grid" id="recommendationsGrid">
              <div class="recommendation-item">
                <div class="rec-label">📁 Category</div>
                <div class="rec-value" id="recCategory">--</div>
                <div class="rec-impact" id="recCategoryImpact">--</div>
              </div>
              <div class="recommendation-item">
                <div class="rec-label">📅 Best Day</div>
                <div class="rec-value" id="recDay">--</div>
                <div class="rec-impact" id="recDayImpact">--</div>
              </div>
              <div class="recommendation-item">
                <div class="rec-label">⏰ Best Time</div>
                <div class="rec-value" id="recTime">--</div>
                <div class="rec-impact" id="recTimeImpact">--</div>
              </div>
              <div class="recommendation-item">
                <div class="rec-label">🏆 Competition</div>
                <div class="rec-value" id="recCompetition">--</div>
                <div class="rec-impact" id="recCompetitionImpact">--</div>
              </div>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="label">Products</div>
              <div class="value" id="totalProducts">0</div>
            </div>
            <div class="stat-card">
              <div class="label">Total Upvotes</div>
              <div class="value" id="totalUpvotes">0</div>
            </div>
            <div class="stat-card">
              <div class="label">Categories</div>
              <div class="value" id="totalCategories">0</div>
            </div>
          </div>
          
          <div class="filters-section">
            <div class="filters-grid">
              <div class="filter-group">
                <label for="searchInput">Search Products</label>
                <input type="text" id="searchInput" placeholder="Search by name or tagline...">
              </div>
              <div class="filter-group">
                <label for="categoryFilter">Category</label>
                <select id="categoryFilter">
                  <option value="">All Categories</option>
                </select>
              </div>
              <div class="filter-group">
                <button class="refresh-btn" onclick="loadDashboardData()">Refresh</button>
              </div>
            </div>
          </div>
          
          <div class="charts-grid">
            <div class="chart-card">
              <h3>📊 Top Categories by Product Count</h3>
              <div class="chart-container">
                <canvas id="topCategoriesChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>🥧 Category Distribution</h3>
              <div class="chart-container">
                <canvas id="categoryPieChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>📈 Launch Activity Over Time</h3>
              <div class="chart-container">
                <canvas id="launchActivityChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>⭐ Average Upvotes by Category</h3>
              <div class="chart-container">
                <canvas id="avgUpvotesChart"></canvas>
              </div>
            </div>
          </div>
          
          <div class="section-header">
            <div class="section-title">Top Products</div>
          </div>
          
          <div class="products-grid" id="productsGrid">
          </div>
        </div>
      </div>
      
      <script>
        let allProducts = [];
        let filteredProducts = [];
        let charts = {};
        let sortColumn = 'votesCount';
        let sortDirection = 'desc';
        
        async function loadDashboardData() {
          try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            
            const response = await fetch('/api/dashboard-data');
            
            if (!response.ok) {
              const errorData = await response.json();
              const errorMsg = errorData.error || 'Failed to fetch data from server';
              document.getElementById('loading').innerHTML = '❌ Error: ' + errorMsg + '<br><small>Please check if PH_TOKEN is set correctly</small>';
              return;
            }
            
            const data = await response.json();
            
            if (data.error) {
              document.getElementById('loading').innerHTML = '❌ Server Error: ' + data.error + '<br><small>Please check if PH_TOKEN is set correctly</small>';
              return;
            }
            
            if (data.errors) {
              document.getElementById('loading').innerHTML = '❌ API Error: ' + JSON.stringify(data.errors);
              return;
            }
            
            if (!data.data?.posts?.edges) {
              document.getElementById('loading').innerHTML = '❌ No product data available<br><small>The API did not return expected data</small>';
              return;
            }
            
            allProducts = data.data.posts.edges.map((edge, index) => ({
              rank: index + 1,
              ...edge.node,
              category: edge.node.topics?.edges?.[0]?.node?.name || 'Uncategorized',
              allCategories: edge.node.topics?.edges?.map(t => t.node.name) || ['Uncategorized']
            }));
            
            applyFilters();
            updateDashboard();
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
          } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('loading').innerHTML = '❌ Failed to load dashboard data<br><small>' + error.message + '</small>';
          }
        }
        
        function applyFilters() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const categoryFilter = document.getElementById('categoryFilter').value;
          
          filteredProducts = allProducts.filter(product => {
            const matchesSearch = !searchTerm || 
              product.name.toLowerCase().includes(searchTerm) ||
              (product.tagline && product.tagline.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || product.allCategories.includes(categoryFilter);
            
            return matchesSearch && matchesCategory;
          });
          
          sortProducts();
        }
        
        function sortProducts() {
          filteredProducts.sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            
            if (sortColumn === 'createdAt') {
              aVal = new Date(aVal);
              bVal = new Date(bVal);
            }
            
            if (sortDirection === 'asc') {
              return aVal > bVal ? 1 : -1;
            } else {
              return aVal < bVal ? 1 : -1;
            }
          });
        }
        
        function updateDashboard() {
          updateStats();
          updateCategoryFilter();
          updateCharts();
          updateTable();
        }
        
        function updateStats() {
          const totalProducts = filteredProducts.length;
          const totalUpvotes = filteredProducts.reduce((sum, p) => sum + p.votesCount, 0);
          const categories = new Set(filteredProducts.flatMap(p => p.allCategories));
          
          document.getElementById('totalProducts').textContent = totalProducts;
          document.getElementById('totalUpvotes').textContent = totalUpvotes.toLocaleString();
          document.getElementById('totalCategories').textContent = categories.size;
        }
        
        function updateCategoryFilter() {
          const categories = new Set(allProducts.flatMap(p => p.allCategories));
          const categoryFilter = document.getElementById('categoryFilter');
          const currentValue = categoryFilter.value;
          
          categoryFilter.innerHTML = '<option value="">All Categories</option>';
          Array.from(categories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
          });
          
          categoryFilter.value = currentValue;
        }
        
        function updateCharts() {
          const categoryData = {};
          filteredProducts.forEach(product => {
            product.allCategories.forEach(cat => {
              if (!categoryData[cat]) {
                categoryData[cat] = { count: 0, totalVotes: 0 };
              }
              categoryData[cat].count++;
              categoryData[cat].totalVotes += product.votesCount;
            });
          });
          
          const sortedCategories = Object.entries(categoryData)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
          
          updateTopCategoriesChart(sortedCategories);
          updateCategoryPieChart(sortedCategories);
          updateLaunchActivityChart();
          updateAvgUpvotesChart(sortedCategories);
        }
        
        function updateTopCategoriesChart(categoryData) {
          const ctx = document.getElementById('topCategoriesChart');
          if (charts.topCategories) charts.topCategories.destroy();
          
          charts.topCategories = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: categoryData.map(([cat]) => cat),
              datasets: [{
                label: 'Number of Products',
                data: categoryData.map(([, data]) => data.count),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
        }
        
        function updateCategoryPieChart(categoryData) {
          const ctx = document.getElementById('categoryPieChart');
          if (charts.categoryPie) charts.categoryPie.destroy();
          
          const colors = [
            '#667eea', '#da552f', '#2e7d32', '#1976d2', '#f57c00',
            '#c62828', '#7b1fa2', '#0097a7', '#689f38', '#f06292'
          ];
          
          charts.categoryPie = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: categoryData.map(([cat]) => cat),
              datasets: [{
                data: categoryData.map(([, data]) => data.count),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }
          });
        }
        
        function updateLaunchActivityChart() {
          const ctx = document.getElementById('launchActivityChart');
          if (charts.launchActivity) charts.launchActivity.destroy();
          
          const dateCounts = {};
          filteredProducts.forEach(product => {
            const date = new Date(product.createdAt).toLocaleDateString();
            dateCounts[date] = (dateCounts[date] || 0) + 1;
          });
          
          const sortedDates = Object.entries(dateCounts)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]));
          
          charts.launchActivity = new Chart(ctx, {
            type: 'line',
            data: {
              labels: sortedDates.map(([date]) => date),
              datasets: [{
                label: 'Products Launched',
                data: sortedDates.map(([, count]) => count),
                borderColor: '#da552f',
                backgroundColor: 'rgba(218, 85, 47, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
        }
        
        function updateAvgUpvotesChart(categoryData) {
          const ctx = document.getElementById('avgUpvotesChart');
          if (charts.avgUpvotes) charts.avgUpvotes.destroy();
          
          const avgData = categoryData.map(([cat, data]) => ({
            category: cat,
            avg: Math.round(data.totalVotes / data.count)
          })).sort((a, b) => b.avg - a.avg);
          
          charts.avgUpvotes = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: avgData.map(d => d.category),
              datasets: [{
                label: 'Average Upvotes',
                data: avgData.map(d => d.avg),
                backgroundColor: 'rgba(46, 125, 50, 0.8)',
                borderColor: 'rgba(46, 125, 50, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { beginAtZero: true }
              }
            }
          });
        }
        
        function updateTable() {
          const grid = document.getElementById('productsGrid');
          grid.innerHTML = '';
          
          filteredProducts.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => window.open(product.url, '_blank');
            
            card.innerHTML = \`
              <div class="product-header">
                <div class="product-info">
                  <div>
                    <span class="product-rank">#\${index + 1}</span>
                    <span class="product-name">\${product.name}</span>
                  </div>
                  <div class="product-tagline">\${product.tagline || 'No description available'}</div>
                </div>
              </div>
              <div class="product-meta">
                <span class="upvote-badge">▲ \${product.votesCount}</span>
                <span>\${product.commentsCount} comments</span>
                <span class="category-badge">\${product.category}</span>
                <span>\${new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            \`;
            
            grid.appendChild(card);
          });
        }
        
        document.getElementById('searchInput').addEventListener('input', () => {
          applyFilters();
          updateDashboard();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', () => {
          applyFilters();
          updateDashboard();
        });
        
        loadDashboardData();
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

// Dashboard data endpoint - fetches comprehensive ProductHunt data
app.get('/api/dashboard-data', async (req, res) => {
  try {
    if (!PH_TOKEN) {
      return res.status(401).json({
        error: 'ProductHunt API token not configured',
        message: 'Please set PH_TOKEN in environment variables'
      });
    }
    
    const query = `{
      posts(first: 50) {
        edges {
          node {
            name
            tagline
            votesCount
            commentsCount
            createdAt
            url
            topics(first: 1) {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      }
    }`;
    
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
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ProductHunt proxy server running on port ${PORT}`);
  console.log(`API endpoint: /api/producthunt`);
  console.log(`Dashboard endpoint: /api/dashboard-data`);
});