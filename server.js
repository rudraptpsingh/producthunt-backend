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

// Dashboard analytics page
app.get('/dashboard', (req, res) => {
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.2);
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.95;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
        }
        
        .stat-card .icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .stat-card .label {
          color: #666;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .stat-card .value {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .filters-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 15px;
          align-items: end;
        }
        
        .filter-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        
        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }
        
        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #da552f;
        }
        
        .refresh-btn {
          background: linear-gradient(135deg, #da552f 0%, #e8744f 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(218, 85, 47, 0.3);
        }
        
        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(218, 85, 47, 0.4);
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .chart-card h3 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1a1a1a;
        }
        
        .chart-container {
          position: relative;
          height: 300px;
        }
        
        .table-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow-x: auto;
        }
        
        .table-card h3 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #1a1a1a;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: #f8f9fa;
        }
        
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #1a1a1a;
          border-bottom: 2px solid #e0e0e0;
          cursor: pointer;
          user-select: none;
        }
        
        th:hover {
          background: #e9ecef;
        }
        
        th.sortable::after {
          content: ' ⇅';
          opacity: 0.3;
        }
        
        th.sort-asc::after {
          content: ' ↑';
          opacity: 1;
        }
        
        th.sort-desc::after {
          content: ' ↓';
          opacity: 1;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        tr:hover {
          background: #f8f9fa;
        }
        
        .product-link {
          color: #da552f;
          text-decoration: none;
          font-weight: 600;
        }
        
        .product-link:hover {
          text-decoration: underline;
        }
        
        .rank {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .category-badge {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: white;
          font-size: 18px;
        }
        
        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 ProductHunt Analytics Dashboard</h1>
          <p>Real-time insights and trends from ProductHunt</p>
        </div>
        
        <div id="loading" class="loading">
          <div>⏳ Loading dashboard data...</div>
        </div>
        
        <div id="dashboard" style="display: none;">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="icon">📦</div>
              <div class="label">Total Products</div>
              <div class="value" id="totalProducts">0</div>
            </div>
            <div class="stat-card">
              <div class="icon">⬆️</div>
              <div class="label">Total Upvotes</div>
              <div class="value" id="totalUpvotes">0</div>
            </div>
            <div class="stat-card">
              <div class="icon">📁</div>
              <div class="label">Categories</div>
              <div class="value" id="totalCategories">0</div>
            </div>
          </div>
          
          <div class="filters-section">
            <div class="filters-grid">
              <div class="filter-group">
                <label for="searchInput">🔍 Search Products</label>
                <input type="text" id="searchInput" placeholder="Search by name or tagline...">
              </div>
              <div class="filter-group">
                <label for="categoryFilter">📁 Filter by Category</label>
                <select id="categoryFilter">
                  <option value="">All Categories</option>
                </select>
              </div>
              <div class="filter-group">
                <button class="refresh-btn" onclick="loadDashboardData()">🔄 Refresh</button>
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
          
          <div class="table-card">
            <h3>📋 Product Rankings</h3>
            <table>
              <thead>
                <tr>
                  <th class="sortable" data-column="rank">Rank</th>
                  <th class="sortable" data-column="name">Product Name</th>
                  <th class="sortable" data-column="tagline">Tagline</th>
                  <th class="sortable" data-column="category">Category</th>
                  <th class="sortable" data-column="votesCount">Upvotes</th>
                  <th class="sortable" data-column="commentsCount">Comments</th>
                  <th class="sortable" data-column="createdAt">Launch Date</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody id="productsTable">
              </tbody>
            </table>
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
            const data = await response.json();
            
            if (data.errors) {
              alert('Error loading data: ' + JSON.stringify(data.errors));
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
            alert('Failed to load dashboard data');
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
          const tbody = document.getElementById('productsTable');
          tbody.innerHTML = '';
          
          filteredProducts.forEach((product, index) => {
            const row = tbody.insertRow();
            row.innerHTML = \`
              <td><span class="rank">#\${index + 1}</span></td>
              <td><strong>\${product.name}</strong></td>
              <td>\${product.tagline || 'No tagline'}</td>
              <td><span class="category-badge">\${product.category}</span></td>
              <td><strong>\${product.votesCount}</strong></td>
              <td>\${product.commentsCount}</td>
              <td>\${new Date(product.createdAt).toLocaleDateString()}</td>
              <td><a href="\${product.url}" target="_blank" class="product-link">View →</a></td>
            \`;
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
        
        document.querySelectorAll('th.sortable').forEach(th => {
          th.addEventListener('click', () => {
            const column = th.dataset.column;
            if (sortColumn === column) {
              sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
              sortColumn = column;
              sortDirection = 'desc';
            }
            
            document.querySelectorAll('th').forEach(h => {
              h.classList.remove('sort-asc', 'sort-desc');
            });
            th.classList.add('sort-' + sortDirection);
            
            applyFilters();
            updateTable();
          });
        });
        
        loadDashboardData();
      </script>
    </body>
    </html>
  `);
});

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
          <a href="/dashboard" style="display: inline-block; margin-top: 20px; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease;">📊 View Analytics Dashboard</a>
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

// Dashboard data endpoint - fetches comprehensive ProductHunt data
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const query = `{
      posts(first: 50, order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            slug
            votesCount
            commentsCount
            createdAt
            featuredAt
            url
            topics {
              edges {
                node {
                  id
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