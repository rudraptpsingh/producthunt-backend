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
        
        .show-more-container {
          text-align: center;
          margin: 24px 0;
        }
        
        .show-more-btn {
          background: white;
          border: 2px solid #da552f;
          color: #da552f;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .show-more-btn:hover {
          background: #da552f;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.3);
        }
        
        .show-more-btn #showMoreIcon {
          transition: transform 0.3s ease;
        }
        
        .show-more-btn.expanded #showMoreIcon {
          transform: rotate(180deg);
        }
        
        .analyzer-card {
          background: white;
          border: 1px solid #e8e7e6;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 32px;
        }
        
        .analyzer-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .analyzer-header h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: #333;
          font-weight: 700;
        }
        
        .analyzer-header p {
          margin: 0;
          color: #828282;
          font-size: 14px;
        }
        
        .assets-results {
          display: none;
          margin-top: 32px;
          padding-top: 32px;
          border-top: 2px solid #e8e7e6;
        }
        
        .assets-results.show {
          display: block;
        }
        
        .asset-card {
          background: #f6f5f4;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .asset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .asset-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .copy-btn {
          background: #da552f;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .copy-btn:hover {
          background: #c44a2a;
          transform: translateY(-1px);
        }
        
        .copy-btn.copied {
          background: #2e7d32;
        }
        
        .asset-content {
          background: white;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e8e7e6;
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
          font-size: 14px;
        }
        
        .asset-meta {
          margin-top: 8px;
          font-size: 12px;
          color: #828282;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #e8e7e6;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #DA552F;
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .action-buttons {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }
        
        .analyze-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex: 1;
          max-width: 300px;
          margin: 0 auto;
          display: block;
        }
        
        .analyze-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .analyze-btn:active {
          transform: translateY(0);
        }
        
        .analyze-btn.secondary {
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
        }
        
        .analyze-btn.secondary:hover {
          box-shadow: 0 8px 24px rgba(218, 85, 47, 0.3);
        }
        
        .analysis-results {
          margin-top: 32px;
          padding: 24px;
          background: #f6f5f4;
          border-radius: 12px;
          display: none;
        }
        
        .analysis-results.show {
          display: block;
        }
        
        .result-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .result-score {
          font-size: 48px;
          font-weight: 800;
          margin: 16px 0;
        }
        
        .result-score.high { color: #10b981; }
        .result-score.medium { color: #f59e0b; }
        .result-score.low { color: #ef4444; }
        
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        
        .insight-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #DA552F;
        }
        
        .insight-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #828282;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .insight-value {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }
        
        .insight-recommendation {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }
        
        .insight-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        
        .insight-status.good { background: #d1fae5; color: #065f46; }
        .insight-status.warning { background: #fef3c7; color: #92400e; }
        .insight-status.bad { background: #fee2e2; color: #991b1b; }
        
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
          
          <div class="show-more-container" id="showMoreContainer" style="display: none;">
            <button class="show-more-btn" onclick="toggleProducts()">
              <span id="showMoreText">Show More Products</span>
              <span id="showMoreIcon">▼</span>
            </button>
          </div>
          
          <div class="analyzer-card">
            <div class="analyzer-header">
              <h2>🚀 Get Your Product Ready to Launch</h2>
              <p>Analyze your launch strategy or generate professional launch assets based on your product details</p>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="appName">App Name *</label>
                <input type="text" id="appName" placeholder="e.g., My Awesome App" required>
              </div>
              
              <div class="form-group">
                <label for="appCategory">Category *</label>
                <select id="appCategory" required>
                  <option value="">Select a category</option>
                </select>
              </div>
              
              <div class="form-group full-width">
                <label for="appTagline">Tagline / Key Features *</label>
                <textarea id="appTagline" placeholder="Describe your product in one compelling sentence, or list key features separated by commas..." rows="3" required></textarea>
                <small style="color: #666; font-size: 12px;">For analysis: brief tagline. For asset generation: list features and benefits.</small>
              </div>
              
              <div class="form-group">
                <label for="targetAudience">Target Audience (Optional)</label>
                <input type="text" id="targetAudience" placeholder="e.g., Developers, Marketers, Founders">
              </div>
              
              <div class="form-group">
                <label for="plannedDay">Planned Launch Day (Optional)</label>
                <select id="plannedDay">
                  <option value="">Not sure yet</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="plannedTime">Planned Launch Time (Optional)</label>
                <select id="plannedTime">
                  <option value="">Not sure yet</option>
                  <option value="0">12:00 AM</option>
                  <option value="1">1:00 AM</option>
                  <option value="2">2:00 AM</option>
                  <option value="3">3:00 AM</option>
                  <option value="4">4:00 AM</option>
                  <option value="5">5:00 AM</option>
                  <option value="6">6:00 AM</option>
                  <option value="7">7:00 AM</option>
                  <option value="8">8:00 AM</option>
                  <option value="9">9:00 AM</option>
                  <option value="10">10:00 AM</option>
                  <option value="11">11:00 AM</option>
                  <option value="12">12:00 PM</option>
                  <option value="13">1:00 PM</option>
                  <option value="14">2:00 PM</option>
                  <option value="15">3:00 PM</option>
                  <option value="16">4:00 PM</option>
                  <option value="17">5:00 PM</option>
                  <option value="18">6:00 PM</option>
                  <option value="19">7:00 PM</option>
                  <option value="20">8:00 PM</option>
                  <option value="21">9:00 PM</option>
                  <option value="22">10:00 PM</option>
                  <option value="23">11:00 PM</option>
                </select>
              </div>
            </div>
            
            <div class="action-buttons">
              <button class="analyze-btn" onclick="analyzeUserLaunch()">📊 Analyze My Launch</button>
              <button class="analyze-btn secondary" onclick="generateLaunchAssets()">✨ Generate Launch Assets</button>
            </div>
            
            <div class="analysis-results" id="analysisResults">
              <div class="result-header">
                <h3>Your Launch Analysis</h3>
                <div class="result-score" id="userScore">--</div>
                <div id="userScoreLabel">--</div>
              </div>
              
              <div class="insights-grid" id="userInsights">
              </div>
            </div>
            
            <div class="assets-results" id="assetsResults">
              <h3 style="margin-bottom: 20px; color: #1a1a1a;">📝 Your Launch Assets</h3>
              <div id="generatedAssets"></div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        let allProducts = [];
        let filteredProducts = [];
        let charts = {};
        let sortColumn = 'votesCount';
        let showAllProducts = false;
        const INITIAL_PRODUCTS_COUNT = 6;
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
        
        function calculateLaunchScore() {
          const targetCategory = document.getElementById('categoryFilter').value || null;
          
          // Use filtered products for analysis (respects search/filter)
          const analysisProducts = targetCategory 
            ? allProducts.filter(p => p.allCategories.includes(targetCategory))
            : allProducts;
          
          if (analysisProducts.length < 3) {
            // Low confidence - not enough data
            return {
              score: 0,
              category: targetCategory || 'All Categories',
              categoryHotness: 'Low Data',
              bestDay: '--',
              bestTime: '--',
              competition: 'Unknown',
              confidence: 'Low',
              impacts: {
                category: 'Need more data for accurate prediction',
                day: 'Need more data',
                time: 'Need more data',
                competition: 'Insufficient samples'
              }
            };
          }
          
          // 1. Category Hotness Score (35% weight)
          // Calculate based on recency and performance
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          let categoryScore = 0;
          
          if (analysisProducts.length > 0) {
            const avgUpvotes = analysisProducts.reduce((sum, p) => sum + p.votesCount, 0) / analysisProducts.length;
            const recentProducts = analysisProducts.filter(p => {
              const age = (now - new Date(p.createdAt).getTime()) / dayMs;
              return age <= 14; // Last 14 days
            });
            
            const recentRatio = recentProducts.length / analysisProducts.length;
            const performanceScore = Math.min(avgUpvotes / 100, 1); // Normalize to 0-1
            categoryScore = (recentRatio * 0.4 + performanceScore * 0.6) * 100;
          }
          
          // 2. Best Day Analysis (25% weight)
          const dayStats = {};
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          analysisProducts.forEach(p => {
            const dayNum = new Date(p.createdAt).getDay();
            const dayName = days[dayNum];
            if (!dayStats[dayName]) dayStats[dayName] = { total: 0, count: 0 };
            dayStats[dayName].total += p.votesCount;
            dayStats[dayName].count++;
          });
          
          let bestDay = 'Tuesday';
          let bestDayAvg = 0;
          Object.entries(dayStats).forEach(([day, stats]) => {
            const avg = stats.total / stats.count;
            if (avg > bestDayAvg) {
              bestDayAvg = avg;
              bestDay = day;
            }
          });
          
          const dayScore = dayStats[bestDay] ? Math.min((bestDayAvg / 100) * 100, 100) : 50;
          
          // 3. Best Time Analysis (20% weight)
          const timeStats = {};
          analysisProducts.forEach(p => {
            const hour = new Date(p.createdAt).getHours();
            if (!timeStats[hour]) timeStats[hour] = { total: 0, count: 0 };
            timeStats[hour].total += p.votesCount;
            timeStats[hour].count++;
          });
          
          let bestHour = 0;
          let bestTimeAvg = 0;
          Object.entries(timeStats).forEach(([hour, stats]) => {
            const avg = stats.total / stats.count;
            if (avg > bestTimeAvg) {
              bestTimeAvg = avg;
              bestHour = parseInt(hour);
            }
          });
          
          const formatTime = (hour) => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return \`\${displayHour}:00 \${period} PST\`;
          };
          
          const timeScore = Math.min((bestTimeAvg / 100) * 100, 100);
          
          // 4. Competition Level (20% weight - inverse)
          const avgUpvotes = analysisProducts.reduce((sum, p) => sum + p.votesCount, 0) / analysisProducts.length;
          const topQuartile = analysisProducts
            .map(p => p.votesCount)
            .sort((a, b) => b - a)
            .slice(0, Math.ceil(analysisProducts.length / 4));
          const topAvg = topQuartile.reduce((sum, v) => sum + v, 0) / topQuartile.length;
          
          const competitionRatio = avgUpvotes / topAvg;
          const competitionScore = competitionRatio * 100; // Higher ratio = less competitive
          
          let competitionLevel = 'High';
          let competitionImpact = 'Very competitive category';
          if (competitionRatio > 0.7) {
            competitionLevel = 'Low';
            competitionImpact = 'Great opportunity! 🎯';
          } else if (competitionRatio > 0.4) {
            competitionLevel = 'Medium';
            competitionImpact = 'Moderate competition';
          }
          
          // Calculate final weighted score
          const weights = { category: 0.35, day: 0.25, time: 0.20, competition: 0.20 };
          const finalScore = Math.round(
            categoryScore * weights.category +
            dayScore * weights.day +
            timeScore * weights.time +
            competitionScore * weights.competition
          );
          
          // Determine category hotness indicator
          let hotnessIndicator = '🔥 HOT';
          if (categoryScore < 50) hotnessIndicator = '❄️ COOL';
          else if (categoryScore < 70) hotnessIndicator = '🌤️ WARM';
          
          // Find hottest category if no specific category is selected
          let displayCategory = targetCategory;
          if (!displayCategory) {
            // Calculate hottest category based on avg upvotes and recency
            const categoryStats = {};
            allProducts.forEach(p => {
              p.allCategories.forEach(cat => {
                if (!categoryStats[cat]) {
                  categoryStats[cat] = { total: 0, count: 0, recent: 0 };
                }
                categoryStats[cat].total += p.votesCount;
                categoryStats[cat].count++;
                const age = (now - new Date(p.createdAt).getTime()) / dayMs;
                if (age <= 14) categoryStats[cat].recent++;
              });
            });
            
            let hottestCategory = 'Productivity';
            let hottestScore = 0;
            Object.entries(categoryStats).forEach(([cat, stats]) => {
              const avgUpvotes = stats.total / stats.count;
              const recentRatio = stats.recent / stats.count;
              const score = avgUpvotes * 0.6 + recentRatio * 40; // Weighted score
              if (score > hottestScore) {
                hottestScore = score;
                hottestCategory = cat;
              }
            });
            displayCategory = hottestCategory;
          }
          
          // Calculate impact predictions
          const dayImpact = \`+\${Math.round(dayScore / 10)}% better results\`;
          const timeImpact = bestHour === 0 ? 'Midnight launch (12:01 AM)' : 'Peak engagement time';
          
          return {
            score: Math.min(finalScore, 100),
            category: displayCategory,
            categoryHotness: hotnessIndicator,
            bestDay: bestDay,
            bestTime: formatTime(bestHour),
            competition: competitionLevel,
            confidence: analysisProducts.length >= 10 ? 'High' : analysisProducts.length >= 5 ? 'Medium' : 'Low',
            impacts: {
              category: hotnessIndicator,
              day: dayImpact,
              time: timeImpact,
              competition: competitionImpact
            }
          };
        }
        
        function updatePredictor() {
          const prediction = calculateLaunchScore();
          
          // Update score circle
          const scoreCircle = document.getElementById('scoreCircle');
          const scoreValue = document.getElementById('scoreValue');
          const scoreLabel = document.getElementById('scoreLabel');
          
          scoreValue.textContent = prediction.score;
          
          // Update card color based on score
          scoreCircle.classList.remove('score-high', 'score-medium', 'score-low');
          if (prediction.score >= 75) {
            scoreCircle.classList.add('score-high');
            scoreLabel.textContent = 'Excellent Launch Potential!';
          } else if (prediction.score >= 50) {
            scoreCircle.classList.add('score-medium');
            scoreLabel.textContent = 'Good Launch Opportunity';
          } else if (prediction.score > 0) {
            scoreCircle.classList.add('score-low');
            scoreLabel.textContent = 'Consider Optimizing';
          } else {
            scoreLabel.textContent = 'Not Enough Data';
          }
          
          // Update recommendations
          document.getElementById('recCategory').textContent = prediction.category;
          document.getElementById('recCategoryImpact').textContent = prediction.impacts.category;
          
          document.getElementById('recDay').textContent = prediction.bestDay;
          document.getElementById('recDayImpact').textContent = prediction.impacts.day;
          
          document.getElementById('recTime').textContent = prediction.bestTime;
          document.getElementById('recTimeImpact').textContent = prediction.impacts.time;
          
          document.getElementById('recCompetition').textContent = prediction.competition;
          document.getElementById('recCompetitionImpact').textContent = prediction.impacts.competition;
        }
        
        function updateDashboard() {
          updatePredictor();
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
          const appCategory = document.getElementById('appCategory');
          const currentValue = categoryFilter.value;
          const currentAppValue = appCategory.value;
          
          categoryFilter.innerHTML = '<option value="">All Categories</option>';
          appCategory.innerHTML = '<option value="">Select a category</option>';
          
          Array.from(categories).sort().forEach(cat => {
            const option1 = document.createElement('option');
            option1.value = cat;
            option1.textContent = cat;
            categoryFilter.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = cat;
            option2.textContent = cat;
            appCategory.appendChild(option2);
          });
          
          categoryFilter.value = currentValue;
          appCategory.value = currentAppValue;
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
        
        function updateLaunchActivityChart() {
          const ctx = document.getElementById('launchActivityChart');
          if (charts.launchActivity) charts.launchActivity.destroy();
          
          const dateCounts = {};
          filteredProducts.forEach(product => {
            // Use ISO date format (YYYY-MM-DD) for consistent sorting
            const date = product.createdAt.split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
          });
          
          const sortedDates = Object.entries(dateCounts)
            .sort((a, b) => a[0].localeCompare(b[0])); // Sort by date string
          
          // Format dates for display (e.g., "Jan 15")
          const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };
          
          charts.launchActivity = new Chart(ctx, {
            type: 'line',
            data: {
              labels: sortedDates.map(([date]) => formatDate(date)),
              datasets: [{
                label: 'Products Launched',
                data: sortedDates.map(([, count]) => count),
                borderColor: '#da552f',
                backgroundColor: 'rgba(218, 85, 47, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (context) => {
                      const index = context[0].dataIndex;
                      return sortedDates[index][0]; // Show full date on hover
                    }
                  }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1 // Show whole numbers only
                  }
                }
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
          
          // Determine how many products to show
          const productsToShow = showAllProducts ? filteredProducts : filteredProducts.slice(0, INITIAL_PRODUCTS_COUNT);
          
          productsToShow.forEach((product, index) => {
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
          
          // Show/hide the "Show More" button
          const showMoreContainer = document.getElementById('showMoreContainer');
          const showMoreBtn = document.querySelector('.show-more-btn');
          const showMoreText = document.getElementById('showMoreText');
          const showMoreIcon = document.getElementById('showMoreIcon');
          
          if (filteredProducts.length > INITIAL_PRODUCTS_COUNT) {
            showMoreContainer.style.display = 'block';
            if (showAllProducts) {
              showMoreText.textContent = 'Show Less Products';
              showMoreBtn.classList.add('expanded');
            } else {
              showMoreText.textContent = \`Show More Products (\${filteredProducts.length - INITIAL_PRODUCTS_COUNT} more)\`;
              showMoreBtn.classList.remove('expanded');
            }
          } else {
            showMoreContainer.style.display = 'none';
          }
        }
        
        function toggleProducts() {
          showAllProducts = !showAllProducts;
          updateTable();
          
          // Scroll to products section if collapsing
          if (!showAllProducts) {
            document.getElementById('productsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        
        document.getElementById('searchInput').addEventListener('input', () => {
          applyFilters();
          updateDashboard();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', () => {
          applyFilters();
          updateDashboard();
        });
        
        function analyzeUserLaunch() {
          // Get form values
          const appName = document.getElementById('appName').value.trim();
          const category = document.getElementById('appCategory').value;
          const tagline = document.getElementById('appTagline').value.trim();
          const plannedDay = document.getElementById('plannedDay').value;
          const plannedTime = document.getElementById('plannedTime').value;
          
          // Validation
          if (!appName || !category || !tagline) {
            alert('Please fill in all required fields (App Name, Category, and Tagline)');
            return;
          }
          
          // Calculate optimal tagline length from data
          const taglineLengths = allProducts
            .filter(p => p.tagline)
            .map(p => ({ length: p.tagline.length, votes: p.votesCount }));
          
          const avgTaglineLength = taglineLengths.reduce((sum, t) => sum + t.length, 0) / taglineLengths.length;
          const topPerformers = taglineLengths
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5);
          const optimalLength = topPerformers.reduce((sum, t) => sum + t.length, 0) / topPerformers.length;
          
          // Analyze category
          const categoryProducts = allProducts.filter(p => p.allCategories.includes(category));
          const categoryAvgUpvotes = categoryProducts.reduce((sum, p) => sum + p.votesCount, 0) / categoryProducts.length;
          
          // Analyze day (if specified)
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayStats = {};
          allProducts.forEach(p => {
            const dayNum = new Date(p.createdAt).getDay();
            const dayName = days[dayNum];
            if (!dayStats[dayName]) dayStats[dayName] = { total: 0, count: 0 };
            dayStats[dayName].total += p.votesCount;
            dayStats[dayName].count++;
          });
          
          let bestDay = 'Tuesday';
          let bestDayAvg = 0;
          Object.entries(dayStats).forEach(([day, stats]) => {
            const avg = stats.total / stats.count;
            if (avg > bestDayAvg) {
              bestDayAvg = avg;
              bestDay = day;
            }
          });
          
          // Analyze time (if specified)
          const timeStats = {};
          allProducts.forEach(p => {
            const hour = new Date(p.createdAt).getHours();
            if (!timeStats[hour]) timeStats[hour] = { total: 0, count: 0 };
            timeStats[hour].total += p.votesCount;
            timeStats[hour].count++;
          });
          
          let bestHour = 0;
          let bestTimeAvg = 0;
          Object.entries(timeStats).forEach(([hour, stats]) => {
            const avg = stats.total / stats.count;
            if (avg > bestTimeAvg) {
              bestTimeAvg = avg;
              bestHour = parseInt(hour);
            }
          });
          
          // Calculate scores for each factor
          const taglineLengthDiff = Math.abs(tagline.length - optimalLength);
          const taglineScore = Math.max(0, 100 - (taglineLengthDiff / optimalLength * 100));
          
          const categoryScore = Math.min(100, (categoryAvgUpvotes / 100) * 100);
          
          let dayScore = 50;
          if (plannedDay) {
            const plannedDayAvg = dayStats[plannedDay] ? dayStats[plannedDay].total / dayStats[plannedDay].count : 0;
            dayScore = Math.min(100, (plannedDayAvg / bestDayAvg) * 100);
          } else {
            dayScore = 75; // No penalty if not specified
          }
          
          let timeScore = 50;
          if (plannedTime) {
            const plannedHour = parseInt(plannedTime);
            const plannedTimeAvg = timeStats[plannedHour] ? timeStats[plannedHour].total / timeStats[plannedHour].count : 0;
            timeScore = Math.min(100, (plannedTimeAvg / bestTimeAvg) * 100);
          } else {
            timeScore = 75; // No penalty if not specified
          }
          
          // Final weighted score
          const finalScore = Math.round(
            taglineScore * 0.25 +
            categoryScore * 0.30 +
            dayScore * 0.25 +
            timeScore * 0.20
          );
          
          // Display results
          const resultsDiv = document.getElementById('analysisResults');
          const scoreDiv = document.getElementById('userScore');
          const labelDiv = document.getElementById('userScoreLabel');
          const insightsDiv = document.getElementById('userInsights');
          
          // Update score
          scoreDiv.textContent = finalScore;
          scoreDiv.className = 'result-score ' + 
            (finalScore >= 75 ? 'high' : finalScore >= 50 ? 'medium' : 'low');
          
          if (finalScore >= 75) {
            labelDiv.textContent = '🎉 Excellent! Your launch setup looks great!';
          } else if (finalScore >= 50) {
            labelDiv.textContent = '👍 Good setup! Consider our recommendations below.';
          } else {
            labelDiv.textContent = '⚠️ Several areas could be optimized for better results.';
          }
          
          // Generate insights
          const insights = [];
          
          // Tagline insight
          const taglineStatus = taglineLengthDiff < optimalLength * 0.2 ? 'good' : 
                                taglineLengthDiff < optimalLength * 0.5 ? 'warning' : 'bad';
          insights.push({
            label: 'Tagline Length',
            value: \`\${tagline.length} characters\`,
            recommendation: \`Optimal length is around \${Math.round(optimalLength)} characters. \${
              tagline.length < optimalLength * 0.8 ? 'Consider adding more detail.' :
              tagline.length > optimalLength * 1.3 ? 'Try to be more concise.' :
              'Great length!'
            }\`,
            status: taglineStatus,
            statusText: tagline.length >= optimalLength * 0.8 && tagline.length <= optimalLength * 1.3 ? 
                       'Optimal' : 'Needs improvement'
          });
          
          // Category insight
          const categoryPercentile = (categoryAvgUpvotes / 100) * 100;
          const categoryStatus = categoryPercentile >= 70 ? 'good' : categoryPercentile >= 40 ? 'warning' : 'bad';
          insights.push({
            label: 'Category Performance',
            value: category,
            recommendation: \`Avg upvotes in this category: \${Math.round(categoryAvgUpvotes)}. \${
              categoryPercentile >= 70 ? 'This is a hot category! 🔥' :
              categoryPercentile >= 40 ? 'Moderate competition expected.' :
              'Consider a different category or standout positioning.'
            }\`,
            status: categoryStatus,
            statusText: categoryPercentile >= 70 ? 'Hot category' : categoryPercentile >= 40 ? 'Moderate' : 'Competitive'
          });
          
          // Day insight
          if (plannedDay) {
            const isDayOptimal = plannedDay === bestDay;
            const dayDiff = ((dayStats[plannedDay]?.total / dayStats[plannedDay]?.count) / bestDayAvg * 100) || 0;
            insights.push({
              label: 'Launch Day',
              value: plannedDay,
              recommendation: \`Best day is \${bestDay}. \${
                isDayOptimal ? 'Perfect choice! 🎯' :
                dayDiff >= 80 ? 'Good choice, close to optimal.' :
                \`Consider switching to \${bestDay} for +\${Math.round(100 - dayDiff)}% better results.\`
              }\`,
              status: dayDiff >= 80 ? 'good' : dayDiff >= 60 ? 'warning' : 'bad',
              statusText: isDayOptimal ? 'Optimal' : dayDiff >= 80 ? 'Good' : 'Suboptimal'
            });
          } else {
            insights.push({
              label: 'Launch Day',
              value: 'Not specified',
              recommendation: \`We recommend \${bestDay} for best results based on historical data.\`,
              status: 'warning',
              statusText: 'Recommendation: ' + bestDay
            });
          }
          
          // Time insight
          if (plannedTime) {
            const formatTime = (hour) => {
              const h = parseInt(hour);
              const period = h >= 12 ? 'PM' : 'AM';
              const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
              return \`\${displayHour}:00 \${period}\`;
            };
            
            const isTimeOptimal = parseInt(plannedTime) === bestHour;
            const timeDiff = ((timeStats[plannedTime]?.total / timeStats[plannedTime]?.count) / bestTimeAvg * 100) || 0;
            insights.push({
              label: 'Launch Time',
              value: formatTime(plannedTime),
              recommendation: \`Best time is \${formatTime(bestHour)}. \${
                isTimeOptimal ? 'Perfect timing! ⏰' :
                timeDiff >= 80 ? 'Good timing, close to peak.' :
                \`Consider \${formatTime(bestHour)} for better visibility.\`
              }\`,
              status: timeDiff >= 80 ? 'good' : timeDiff >= 60 ? 'warning' : 'bad',
              statusText: isTimeOptimal ? 'Optimal' : timeDiff >= 80 ? 'Good' : 'Suboptimal'
            });
          } else {
            const formatTime = (hour) => {
              const period = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              return \`\${displayHour}:00 \${period}\`;
            };
            
            insights.push({
              label: 'Launch Time',
              value: 'Not specified',
              recommendation: \`We recommend \${formatTime(bestHour)} PST for maximum visibility.\`,
              status: 'warning',
              statusText: 'Recommendation: ' + formatTime(bestHour)
            });
          }
          
          // Render insights
          insightsDiv.innerHTML = insights.map(insight => \`
            <div class="insight-item">
              <div class="insight-label">\${insight.label}</div>
              <div class="insight-value">\${insight.value}</div>
              <div class="insight-recommendation">\${insight.recommendation}</div>
              <span class="insight-status \${insight.status}">\${insight.statusText}</span>
            </div>
          \`).join('');
          
          // Show results
          resultsDiv.classList.add('show');
          
          // Scroll to results
          resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        function generateLaunchAssets() {
          // Get form values (using same fields as analyze)
          const appName = document.getElementById('appName').value.trim();
          const category = document.getElementById('appCategory').value;
          const keyFeatures = document.getElementById('appTagline').value.trim(); // Using tagline field for features
          const targetAudience = document.getElementById('targetAudience').value.trim();
          
          // Validation
          if (!appName || !category || !keyFeatures) {
            alert('Please fill in all required fields (App Name, Category, and Tagline/Key Features)');
            return;
          }
          
          // Get category data for insights
          const categoryProducts = allProducts.filter(p => 
            p.allCategories && p.allCategories.includes(category)
          );
          
          const topProductsInCategory = categoryProducts
            .sort((a, b) => b.votesCount - a.votesCount)
            .slice(0, 5);
          
          // Calculate optimal tagline length from top products
          const taglineLengths = topProductsInCategory
            .filter(p => p.tagline)
            .map(p => p.tagline.length);
          const avgTaglineLength = taglineLengths.length > 0 
            ? Math.round(taglineLengths.reduce((sum, l) => sum + l, 0) / taglineLengths.length)
            : 50;
          
          // Generate assets based on data
          const assets = [];
          
          // 1. Optimized Tagline
          const taglineTemplate = generateTagline(appName, keyFeatures, targetAudience, avgTaglineLength);
          assets.push({
            title: '💡 Optimized Tagline (60 chars max)',
            content: taglineTemplate,
            meta: \`Based on top \${category} products with avg length of \${avgTaglineLength} characters\`
          });
          
          // 2. Product Description
          const description = generateDescription(appName, keyFeatures, targetAudience, category);
          assets.push({
            title: '📄 Product Description',
            content: description,
            meta: 'Compelling, benefit-driven description for your ProductHunt post'
          });
          
          // 3. First Comment (Maker Introduction)
          const firstComment = generateFirstComment(appName, keyFeatures, category);
          assets.push({
            title: '👋 First Comment (Maker Introduction)',
            content: firstComment,
            meta: '70% of top products include a personal first comment from the maker'
          });
          
          // 4. Social Media Post
          const socialPost = generateSocialPost(appName, keyFeatures);
          assets.push({
            title: '🐦 Social Media Post Template',
            content: socialPost,
            meta: 'Use this for Twitter/X, LinkedIn, and other social platforms'
          });
          
          // 5. Launch Day Tips
          const launchTips = generateLaunchTips(category, topProductsInCategory);
          assets.push({
            title: '🎯 Category-Specific Launch Tips',
            content: launchTips,
            meta: \`Based on successful \${category} launches\`
          });
          
          // Display assets
          const resultsDiv = document.getElementById('assetsResults');
          const assetsDiv = document.getElementById('generatedAssets');
          
          assetsDiv.innerHTML = assets.map((asset, index) => \`
            <div class="asset-card">
              <div class="asset-header">
                <div class="asset-title">\${asset.title}</div>
                <button class="copy-btn" onclick="copyToClipboard(\${index}, 'asset-content-\${index}')">
                  📋 Copy
                </button>
              </div>
              <div class="asset-content" id="asset-content-\${index}">\${asset.content}</div>
              <div class="asset-meta">\${asset.meta}</div>
            </div>
          \`).join('');
          
          resultsDiv.classList.add('show');
          resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        function generateTagline(appName, features, audience, targetLength) {
          // Extract first feature/benefit
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f);
          const mainFeature = featureList[0] || 'your productivity';
          
          // Create concise tagline
          const audienceText = audience ? \` for \${audience}\` : '';
          let tagline = \`\${mainFeature}\${audienceText}\`.trim();
          
          // Ensure it's under 60 characters
          if (tagline.length > 58) {
            tagline = tagline.substring(0, 55) + '...';
          }
          
          return tagline;
        }
        
        function generateDescription(appName, features, audience, category) {
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f);
          const audienceText = audience ? \` designed for \${audience}\` : '';
          
          let description = \`\${appName} is a \${category} product\${audienceText} that helps you:\\n\\n\`;
          
          featureList.slice(0, 4).forEach(feature => {
            description += \`✨ \${feature}\\n\`;
          });
          
          description += \`\\nPerfect for anyone looking to streamline their workflow and achieve better results.\`;
          
          return description;
        }
        
        function generateFirstComment(appName, features, category) {
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f).slice(0, 3).map(f => '• ' + f).join('\\n');
          
          return \`Hey Product Hunt! 👋

I'm excited to share \${appName} with you all today!

We built this because we saw a real need in the \${category} space. After months of development and testing, we're thrilled to finally launch here.

What makes \${appName} different:
\${featureList}

We'd love to hear your feedback and answer any questions you have. This community has been incredibly inspiring to us, and we're grateful to be here.

Try it out and let us know what you think! 🚀\`;
        }
        
        function generateSocialPost(appName, features) {
          const mainFeature = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f)[0];
          
          return \`🚀 We just launched on @ProductHunt!

\${appName} - \${mainFeature}

Check it out and let us know what you think! Your support means the world to us. 🙏

[Your ProductHunt Link Here]

#ProductHunt #Launch #NewProduct\`;
        }
        
        function generateLaunchTips(category, topProducts) {
          const avgUpvotes = topProducts.length > 0 
            ? Math.round(topProducts.reduce((sum, p) => sum + p.votesCount, 0) / topProducts.length)
            : 0;
          
          return \`Based on successful \${category} launches:

📊 Category Benchmarks:
• Average upvotes for top products: \${avgUpvotes}
• Total products in category: \${topProducts.length} in our dataset

⏰ Launch Timing:
• Best time: 12:01 AM PST (maximize 24-hour cycle)
• Be ready to respond to comments within minutes

🎯 Success Strategies:
• Respond to EVERY comment personally and quickly
• Have your "first comment" ready to post immediately
• Share with your network, but ask for comments (not upvotes)
• Use high-quality visuals (240×240px thumbnail minimum)
• Include a demo video if possible (53% of top products do)

📝 Pre-Launch Checklist:
• Complete your ProductHunt profile
• Engage with the community beforehand
• Prepare 2+ gallery images (1270×760px)
• Test all links thoroughly
• Brief your team on launch day responsibilities

Good luck with your launch! 🚀\`;
        }
        
        function copyToClipboard(index, elementId) {
          const content = document.getElementById(elementId).textContent;
          navigator.clipboard.writeText(content).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            btn.classList.add('copied');
            
            setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            alert('Failed to copy. Please copy manually.');
          });
        }
        
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