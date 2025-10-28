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
      <title>ProductHunter - AI-Powered ProductHunt Launch Analytics</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
          min-height: 100vh;
        }
        
        .top-bar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          padding: 20px 24px;
          margin-bottom: 0;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
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
        
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 48px 24px 40px;
          margin-bottom: 48px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .hero-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        
        .features-slider {
          max-width: 800px;
          margin: 32px auto 0;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .features-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .feature-slide {
          min-width: 100%;
          padding: 24px 24px;
          text-align: center;
        }
        
        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }
        
        .feature-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 12px;
          color: white;
        }
        
        .feature-description {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .slider-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }
        
        .slider-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          padding: 0;
        }
        
        .slider-dot.active {
          background: white;
          width: 32px;
          border-radius: 5px;
        }
        
        .slider-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }
        
        .ph-badges {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .ph-badge {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          padding: 10px 18px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
        }
        
        .ph-badge:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        }
        
        .ph-badge-icon {
          font-size: 18px;
        }
        
        .hero-motto {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 24px 0 16px;
          position: relative;
          z-index: 1;
        }
        
        .hero-motto h2 {
          font-size: 48px;
          font-weight: 900;
          margin: 0;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        
        .win-badge {
          font-size: 42px;
          animation: bounceWin 2s ease-in-out infinite;
        }
        
        @keyframes bounceWin {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        
        .hero-tagline {
          font-size: 14px;
          opacity: 0.85;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
          font-weight: 500;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .ph-badges {
            gap: 8px;
          }
          
          .ph-badge {
            font-size: 10px;
            padding: 6px 12px;
          }
          
          .ph-badge-icon {
            font-size: 14px;
          }
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(218, 85, 47, 0.15);
          border-color: rgba(218, 85, 47, 0.3);
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
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
          padding: 12px 16px;
          border: 2px solid #e8e7e6;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', sans-serif;
          background: white;
        }
        
        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #da552f;
          box-shadow: 0 0 0 4px rgba(218, 85, 47, 0.1);
          transform: translateY(-1px);
        }
        
        .refresh-btn {
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.25);
        }
        
        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(218, 85, 47, 0.35);
        }
        
        .refresh-btn:active {
          transform: translateY(0);
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .chart-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }
        
        .chart-card h3 {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        
        .chart-container {
          position: relative;
          height: 220px;
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
          gap: 10px;
        }
        
        .product-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(218, 85, 47, 0.15);
          border-color: rgba(218, 85, 47, 0.3);
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
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          margin-right: 10px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.3);
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
          background: linear-gradient(135deg, #fff7f5 0%, #ffe8e0 100%);
          border: 2px solid #da552f;
          color: #da552f;
          padding: 6px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.15);
        }
        
        .category-badge {
          display: inline-block;
          background: rgba(246, 245, 244, 0.8);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          color: #828282;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(130, 130, 130, 0.1);
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          margin: 40px 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        
        .loading div {
          color: #828282;
          font-size: 16px;
        }
        
        .predictor-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          color: white;
          margin-bottom: 40px;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .predictor-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        
        .predictor-header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }
        
        .predictor-header h2 {
          font-size: 28px;
          margin: 0 0 12px 0;
          font-weight: 800;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .predictor-header p {
          margin: 0;
          opacity: 0.95;
          font-size: 15px;
        }
        
        .score-display {
          text-align: center;
          margin: 32px 0;
        }
        
        .score-circle {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          font-weight: 900;
          border: 8px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .score-circle:hover {
          transform: scale(1.05);
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
        
        .launch-timers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .timer-item {
          text-align: center;
        }
        
        .timer-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
          margin-bottom: 8px;
        }
        
        .timer-value {
          font-size: 20px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        
        .timer-subtitle {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }
        
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        
        .recommendation-item {
          background: rgba(255, 255, 255, 0.2);
          padding: 20px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
        }
        
        .recommendation-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid #da552f;
          color: #da552f;
          padding: 14px 36px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.15);
        }
        
        .show-more-btn:hover {
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(218, 85, 47, 0.35);
        }
        
        .show-more-btn #showMoreIcon {
          transition: transform 0.3s ease;
        }
        
        .show-more-btn.expanded #showMoreIcon {
          transform: rotate(180deg);
        }
        
        .analyzer-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        }
        
        .analyzer-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .analyzer-header h2 {
          font-size: 28px;
          margin: 0 0 12px 0;
          color: #1a1a1a;
          font-weight: 800;
        }
        
        .analyzer-header p {
          margin: 0;
          color: #828282;
          font-size: 16px;
          line-height: 1.6;
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
          background: rgba(246, 245, 244, 0.6);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .asset-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.25);
        }
        
        .copy-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.35);
        }
        
        .copy-btn.copied {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
        }
        
        .asset-content {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(232, 231, 230, 0.5);
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
          padding: 14px 18px;
          border: 2px solid #e8e7e6;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #DA552F;
          box-shadow: 0 0 0 4px rgba(218, 85, 47, 0.1);
          transform: translateY(-1px);
          background: white;
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
          padding: 18px 40px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex: 1;
          max-width: 300px;
          margin: 0 auto;
          display: block;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .analyze-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }
        
        .analyze-btn:active {
          transform: translateY(-1px);
        }
        
        .analyze-btn.secondary {
          background: linear-gradient(135deg, #da552f 0%, #ff6b47 100%);
          box-shadow: 0 8px 24px rgba(218, 85, 47, 0.3);
        }
        
        .analyze-btn.secondary:hover {
          box-shadow: 0 12px 32px rgba(218, 85, 47, 0.4);
        }
        
        .analysis-results {
          margin-top: 40px;
          padding: 32px;
          background: rgba(246, 245, 244, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          display: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 16px;
          border-left: 4px solid #DA552F;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }
        
        .insight-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(218, 85, 47, 0.15);
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
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          margin-top: 8px;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }
        
        .insight-status.good { 
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
          color: #065f46; 
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }
        .insight-status.warning { 
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
          color: #92400e; 
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }
        .insight-status.bad { 
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
          color: #991b1b; 
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
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
          
          .hero-motto h2 {
            font-size: 28px;
          }
          
          .win-badge {
            font-size: 32px;
          }
          
          .hero-title-row {
            gap: 12px;
          }
          
          .ph-badge {
            font-size: 11px;
            padding: 8px 14px;
          }
          
          .ph-badge-icon {
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        <div class="top-bar-content">
          <div class="logo">
            <div class="logo-icon">🚀</div>
            <h1>Product<span>Hunter</span></h1>
          </div>
        </div>
      </div>
      
      <div class="hero">
        <div class="hero-content">
          <div class="hero-title-row">
            <div class="ph-badges">
              <div class="ph-badge">
                <span class="ph-badge-icon">🏆</span>
                <span>Product of the Day</span>
              </div>
              <div class="ph-badge">
                <span class="ph-badge-icon">⭐</span>
                <span>Product of the Week</span>
              </div>
              <div class="ph-badge">
                <span class="ph-badge-icon">💎</span>
                <span>Product of the Month</span>
              </div>
              <div class="ph-badge">
                <span class="ph-badge-icon">🐱</span>
                <span>Golden Kitty</span>
              </div>
            </div>
          </div>
          
          <div class="hero-motto">
            <h2>Analyze. Hunt. Win.</h2>
            <div class="win-badge">🏆</div>
          </div>
          
          <p class="hero-tagline">Data-driven insights to help Makers win on ProductHunt</p>
          
          <div class="features-slider">
            <div class="features-track" id="featuresTrack">
              <div class="feature-slide">
                <span class="feature-icon">⛅</span>
                <h3 class="feature-title">Hunt Weather</h3>
                <p class="feature-description">AI-powered scoring system analyzing category trends, optimal timing, and competition levels to predict your hunt success potential</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">📊</span>
                <h3 class="feature-title">Analyze Your Hunt</h3>
                <p class="feature-description">Get personalized insights on your tagline, category choice, and hunt timing with data-driven recommendations for Makers</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">✨</span>
                <h3 class="feature-title">Generate Hunt Assets</h3>
                <p class="feature-description">Create professional taglines, descriptions, first comments, and social posts based on proven patterns from top Makers and Golden Kitty winners</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">📈</span>
                <h3 class="feature-title">Analytics Dashboard</h3>
                <p class="feature-description">Real-time ProductHunt trends, category insights, and hunt activity visualization to help you make informed decisions</p>
              </div>
            </div>
            <div class="slider-dots" id="sliderDots">
              <button class="slider-dot active" onclick="goToSlide(0)"></button>
              <button class="slider-dot" onclick="goToSlide(1)"></button>
              <button class="slider-dot" onclick="goToSlide(2)"></button>
              <button class="slider-dot" onclick="goToSlide(3)"></button>
            </div>
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
              <h2>⛅ Hunt Weather</h2>
              <p>Real-time insights to maximize your hunt success as a Maker</p>
            </div>
            
            <div class="launch-timers">
              <div class="timer-item">
                <div class="timer-label">🌎 Your Time</div>
                <div class="timer-value" id="userTime">--:--:--</div>
                <div class="timer-subtitle" id="userTimezone">--</div>
              </div>
              <div class="timer-item">
                <div class="timer-label">🕐 PST Time</div>
                <div class="timer-value" id="pstTime">--:--:--</div>
                <div class="timer-subtitle">Pacific Time</div>
              </div>
              <div class="timer-item">
                <div class="timer-label">⏳ Today's Hunt Ends</div>
                <div class="timer-value" id="todayEnds">--:--:--</div>
                <div class="timer-subtitle">Time Remaining</div>
              </div>
              <div class="timer-item">
                <div class="timer-label">🚀 Next Hunt Starts</div>
                <div class="timer-value" id="nextLaunch">--:--:--</div>
                <div class="timer-subtitle">12:01 AM PST Tomorrow</div>
              </div>
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
              <h3>📈 Hunt Activity Over Time</h3>
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
                <label for="plannedDay">Planned Hunt Day (Optional)</label>
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
                <label for="plannedTime">Planned Hunt Time (Optional)</label>
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
              <button class="analyze-btn" onclick="analyzeUserLaunch()">📊 Analyze My Hunt</button>
              <button class="analyze-btn secondary" onclick="generateLaunchAssets()">✨ Generate Hunt Assets</button>
            </div>
            
            <div class="analysis-results" id="analysisResults">
              <div class="result-header">
                <h3>Your Hunt Analysis</h3>
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
        // Features slider functionality
        let currentSlide = 0;
        let sliderInterval;
        
        function goToSlide(index) {
          currentSlide = index;
          const track = document.getElementById('featuresTrack');
          const dots = document.querySelectorAll('.slider-dot');
          
          track.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
          
          dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
          });
          
          // Reset auto-rotation
          clearInterval(sliderInterval);
          startSliderAutoRotation();
        }
        
        function nextSlide() {
          currentSlide = (currentSlide + 1) % 4;
          goToSlide(currentSlide);
        }
        
        function startSliderAutoRotation() {
          sliderInterval = setInterval(nextSlide, 4000);
        }
        
        // Start slider when page loads
        startSliderAutoRotation();
        
        // Launch Timers
        function updateLaunchTimers() {
          const now = new Date();
          
          // User's local time
          const userTimeStr = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          document.getElementById('userTime').textContent = userTimeStr;
          document.getElementById('userTimezone').textContent = userTimezone;
          
          // PST Time (UTC-8 or UTC-7 depending on DST)
          const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
          const pstTimeStr = pstTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          document.getElementById('pstTime').textContent = pstTimeStr;
          
          // Today's launch ends at 11:59:59 PM PST
          const todayEndPST = new Date(pstTime);
          todayEndPST.setHours(23, 59, 59, 999);
          const timeToEnd = todayEndPST - pstTime;
          
          if (timeToEnd > 0) {
            const hoursToEnd = Math.floor(timeToEnd / (1000 * 60 * 60));
            const minutesToEnd = Math.floor((timeToEnd % (1000 * 60 * 60)) / (1000 * 60));
            const secondsToEnd = Math.floor((timeToEnd % (1000 * 60)) / 1000);
            document.getElementById('todayEnds').textContent = 
              \`\${String(hoursToEnd).padStart(2, '0')}:\${String(minutesToEnd).padStart(2, '0')}:\${String(secondsToEnd).padStart(2, '0')}\`;
          } else {
            document.getElementById('todayEnds').textContent = '00:00:00';
          }
          
          // Next launch starts at 12:01 AM PST tomorrow
          const nextLaunchPST = new Date(pstTime);
          nextLaunchPST.setDate(nextLaunchPST.getDate() + 1);
          nextLaunchPST.setHours(0, 1, 0, 0);
          const timeToNext = nextLaunchPST - pstTime;
          
          if (timeToNext > 0) {
            const hoursToNext = Math.floor(timeToNext / (1000 * 60 * 60));
            const minutesToNext = Math.floor((timeToNext % (1000 * 60 * 60)) / (1000 * 60));
            const secondsToNext = Math.floor((timeToNext % (1000 * 60)) / 1000);
            document.getElementById('nextLaunch').textContent = 
              \`\${String(hoursToNext).padStart(2, '0')}:\${String(minutesToNext).padStart(2, '0')}:\${String(secondsToNext).padStart(2, '0')}\`;
          } else {
            document.getElementById('nextLaunch').textContent = '00:00:00';
          }
        }
        
        // Update timers every second
        setInterval(updateLaunchTimers, 1000);
        updateLaunchTimers(); // Initial call
        
        // Dashboard data
        let allProducts = [];
        let filteredProducts = [];
        let charts = {};
        let sortColumn = 'votesCount';
        let showAllProducts = false;
        const INITIAL_PRODUCTS_COUNT = 3;
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
          if (!ctx) {
            console.error('Launch Activity chart canvas not found');
            return;
          }
          
          if (charts.launchActivity) charts.launchActivity.destroy();
          
          const dateCounts = {};
          filteredProducts.forEach(product => {
            if (!product.createdAt) return;
            
            // Parse date more robustly
            let dateStr;
            if (product.createdAt.includes('T')) {
              dateStr = product.createdAt.split('T')[0];
            } else {
              // Handle case where createdAt is already just a date
              dateStr = product.createdAt.substring(0, 10);
            }
            
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          });
          
          const sortedDates = Object.entries(dateCounts)
            .sort((a, b) => a[0].localeCompare(b[0])); // Sort by date string
          
          // Format dates for display (e.g., "Jan 15")
          const formatDate = (dateStr) => {
            try {
              const date = new Date(dateStr + 'T00:00:00'); // Add time to ensure consistent parsing
              if (isNaN(date.getTime())) return dateStr; // Fallback to original string
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch (e) {
              return dateStr;
            }
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
                    stepSize: 1,
                    precision: 0
                  }
                },
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
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
              label: 'Hunt Day',
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
              label: 'Hunt Day',
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
              label: 'Hunt Time',
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
              label: 'Hunt Time',
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
          
          // 5. Hunt Day Tips
          const launchTips = generateLaunchTips(category, topProductsInCategory);
          assets.push({
            title: '🎯 Category-Specific Hunt Tips',
            content: launchTips,
            meta: \`Based on successful \${category} hunts by top Makers\`
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
          // Extract key features/benefits
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f);
          const mainFeature = featureList[0] || 'achieve better results';
          
          // Use proven ProductHunt tagline patterns from top performers
          const patterns = [
            // Pattern 1: Action + Outcome (e.g., "Build stunning AI Apps with ease")
            () => {
              const action = mainFeature.toLowerCase().includes('build') || mainFeature.toLowerCase().includes('create') 
                ? mainFeature : \`Create \${mainFeature}\`;
              return audience ? \`\${action} for \${audience}\` : \`\${action} with ease\`;
            },
            // Pattern 2: Identity Statement (e.g., "The AI code editor built for...")
            () => {
              return audience ? \`The \${mainFeature} built for \${audience}\` : \`The smart way to \${mainFeature}\`;
            },
            // Pattern 3: Smart Assistant (e.g., "Your smart X for Y success")
            () => {
              return audience ? \`Your smart \${mainFeature} for \${audience}\` : \`Smart \${mainFeature} for better results\`;
            }
          ];
          
          // Try each pattern and pick the best fit
          let tagline = patterns[0]();
          for (const pattern of patterns) {
            const candidate = pattern();
            if (candidate.length <= 60 && candidate.length >= 30) {
              tagline = candidate;
              break;
            }
          }
          
          // Ensure it's under 60 characters (ProductHunt limit)
          if (tagline.length > 60) {
            tagline = tagline.substring(0, 57) + '...';
          }
          
          return tagline;
        }
        
        function generateDescription(appName, features, audience, category) {
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f);
          const audienceText = audience ? \`\${audience}\` : 'teams and individuals';
          
          // Use problem-first approach (top performer pattern)
          // Format: What it is + Who it's for + How it works + Key benefits
          // Keep under 260 characters for ProductHunt best practices
          
          const mainFeatures = featureList.slice(0, 3);
          const featureText = mainFeatures.length > 1 
            ? mainFeatures.slice(0, -1).join(', ') + ', and ' + mainFeatures[mainFeatures.length - 1]
            : mainFeatures[0];
          
          let description = \`\${appName} helps \${audienceText} \${featureText}. \\n\\nBuilt for the modern \${category} workflow, it combines power and simplicity to deliver results faster. \\n\\nKey benefits:\\n\`;
          
          featureList.slice(0, 3).forEach(feature => {
            description += \`• \${feature}\\n\`;
          });
          
          description += \`\\nGet started in minutes—no complex setup required.\`;
          
          return description;
        }
        
        function generateFirstComment(appName, features, category) {
          const featureList = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f);
          const keyBenefits = featureList.slice(0, 4).map(f => '✅ ' + f).join('\\n');
          
          // Use proven maker comment template from top performers
          // Include: Introduction, Problem, Solution, Benefits, Offer, CTA
          return \`👋 Hey Product Hunt!

[Your Name] here, founder of \${appName}. 

**The Problem:**
We noticed that many \${category} users struggle with [describe the pain point your features solve]. This was costing time, money, and frustration.

**Why we built \${appName}:**
After talking to 100+ users, we realized existing solutions were either too complex, too expensive, or simply didn't work. So we built something different.

**What we do:**
\${appName} is designed to solve this with:

\${keyBenefits}

**Who it's for:**
Perfect for anyone in the \${category} space who wants better results without the hassle.

**Product Hunt Exclusive:**
🎁 Use code "PRODUCTHUNT" for 30% off your first month (limited to first 100 users!)

We're here all day to answer questions and would love your feedback. What features would you want to see next? 

Thanks for checking us out! 🚀\`;
        }
        
        function generateSocialPost(appName, features) {
          const mainFeature = features.split(/[,.\\n]/).map(f => f.trim()).filter(f => f)[0];
          
          // Use proven social post format from top Makers
          // Keep it compelling, 1-2 sentences, minimal hashtags, direct link
          return \`🚀 We just hunted \${appName} on Product Hunt!

\${mainFeature} - would love your feedback and support!

[Add your Product Hunt link here]

Your upvote and comments mean the world to us 🙏\`;
        }
        
        function generateLaunchTips(category, topProducts) {
          const avgUpvotes = topProducts.length > 0 
            ? Math.round(topProducts.reduce((sum, p) => sum + p.votesCount, 0) / topProducts.length)
            : 0;
          
          // Use insights from top ProductHunt performers 2024-2025
          return \`📊 **Category Benchmarks (\${category}):**
• Top 5 products average: \${avgUpvotes} upvotes
• Target for Product of the Day: 200+ upvotes
• Expected traffic (#1 spot): 10,000+ visitors

⏰ **Hunt Timing (Critical!):**
• **Hunt at 12:01 AM PST** (Pacific Time) - gives you full 24 hours
• **Win the first 4 hours** = dominate the entire day
• Best days: Tuesday-Thursday (high traffic) OR Sunday (less competition)
• Avoid Mondays (everyone hunts) and major tech event days

🎯 **Proven Success Strategies:**

**Pre-Hunt (4 weeks before):**
• Create ProductHunt "Coming Soon" teaser page to collect supporters
• Engage with PH community (upvote/comment on other products daily)
• Build support list: customers, email subscribers, social followers
• Prepare all assets: gallery images (1270×760px), demo video (<90sec), first comment

**Hunt Day Execution:**
• Post your first comment IMMEDIATELY when product goes live
• Reply to EVERY comment within minutes (engagement = visibility)
• DM supporters personally (not mass email) with direct link
• Send outreach in waves (avoid sudden vote spikes)
• Monitor real-time with Hunted.Space or Product Wars
• Final push in last 2-4 hours

**What Top Makers Do:**
✅ 70% of top products have Maker first comment
✅ Personal DMs > mass social posts (more effective)
✅ Long-time PH users have more voting weight
✅ Respond to comments with personality (not corporate speak)
✅ Ask for feedback and comments (not just upvotes)

**What to Avoid:**
❌ No fake upvotes (penalty/disqualification)
❌ Don't hunt without existing community
❌ Don't ignore comments or respond slowly
❌ Don't use shortened links or UTM parameters
❌ Don't treat PH as primary growth channel (it's a PR event)

**Expected Results:**
• 50% see registration increases
• 42% see sales increase
• Primary benefits: exposure, early adopters, social proof, feedback
• PH badge for homepage credibility

🔥 **2024-2025 Trending Categories:**
AI Agents, AI Coding Tools, AI Video, No-Code, Productivity, Developer Tools

Good luck! Win those first 4 hours! 🚀\`;
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