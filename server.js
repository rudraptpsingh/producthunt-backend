const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool, initializeDatabase, trackedHunts, savedAnalyses, huntSnapshots } = require('./db');
const { register, login, requireAuth, attachUser } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Get ProductHunt token from environment variable
const PH_TOKEN = process.env.PH_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!PH_TOKEN) {
  console.error('ERROR: PH_TOKEN environment variable is not set!');
  console.error('Please set your ProductHunt API token in the Secrets tab');
}

if (!OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY not set. AI features will not work.');
}

// Initialize OpenAI client only if API key is available
let openai = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: OPENAI_API_KEY,
    fetch: fetch // Pass node-fetch to OpenAI client
  });
}

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is not set!');
  console.error('Please set SESSION_SECRET in Secrets to a random string (at least 32 characters)');
  process.exit(1);
}

// Enable CORS - restrict to same origin only for security
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    // In production, only allow same origin
    if (!origin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // In production, only allow same origin
      callback(null, false);
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Session middleware with secure configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' // CSRF protection
  }
}));

// Attach user to request if logged in
app.use(attachUser);

// Analytics Dashboard - Home Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HuntProductHunt - AI-Powered ProductHunt Launch Analytics</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      
      <!-- Google Analytics 4 -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      </script>
      
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #F8F8F8;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .top-bar {
          background: #FFFFFF;
          border-bottom: 1px solid #E5E5E5;
          padding: 16px 24px;
          margin-bottom: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #DA552F 0%, #ff6b47 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.25);
          transition: all 0.3s ease;
          position: relative;
        }
        
        .logo-icon:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.35);
        }
        
        .logo-icon::before {
          content: '';
          width: 0;
          height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-bottom: 15px solid white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .logo-icon::after {
          content: '';
          width: 2px;
          height: 8px;
          background: white;
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .logo span.hunt {
          color: #da552f;
        }
        
        .logo span.ph {
          color: #da552f;
        }
        
        .hero {
          background: #FFFFFF;
          padding: 40px 24px 32px;
          margin-bottom: 32px;
          text-align: center;
          border-bottom: 1px solid #E5E5E5;
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
          max-width: 700px;
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
          padding: 20px;
          text-align: center;
        }
        
        .feature-icon {
          font-size: 40px;
          margin-bottom: 12px;
          display: block;
        }
        
        .feature-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1A1A1A;
        }
        
        .feature-description {
          font-size: 14px;
          color: #666666;
          line-height: 1.6;
          max-width: 550px;
          margin: 0 auto;
        }
        
        .slider-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 24px;
        }
        
        .slider-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #D1D5DB;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        
        .slider-dot.active {
          background: #DA552F;
          width: 20px;
          border-radius: 4px;
        }
        
        .slider-dot:hover {
          background: #9CA3AF;
        }
        
        .hero-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #DA552F;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }
        
        .hero-title {
          font-size: 48px;
          font-weight: 800;
          color: #1A1A1A;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        
        .hero-title-highlight {
          background: linear-gradient(135deg, #DA552F 0%, #F97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-description {
          font-size: 18px;
          color: #666;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto 32px;
        }
        
        .hero-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        
        .cta-primary {
          background: linear-gradient(135deg, #DA552F 0%, #F97316 100%);
          color: white;
          font-size: 18px;
          font-weight: 700;
          padding: 18px 40px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(218, 85, 47, 0.3);
        }
        
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(218, 85, 47, 0.4);
        }
        
        .cta-primary:active {
          transform: translateY(0);
        }
        
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
          font-weight: 600;
        }
        
        .stat-icon {
          font-size: 20px;
        }
        
        @media (max-width: 768px) {
          .hero-subtitle {
            font-size: 12px;
            letter-spacing: 1px;
          }
          
          .hero-title {
            font-size: 32px;
          }
          
          .hero-description {
            font-size: 16px;
          }
          
          .cta-primary {
            font-size: 16px;
            padding: 16px 32px;
          }
          
          .hero-stats {
            gap: 16px;
          }
          
          .stat-item {
            font-size: 12px;
          }
          
          .stat-icon {
            font-size: 18px;
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
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          max-width: 100%;
          overflow: hidden;
        }
        
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .chart-card {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        .chart-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        
        .chart-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #1A1A1A;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .chart-container {
          position: relative;
          height: 220px;
          max-width: 100%;
          overflow: hidden;
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
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .product-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-color: #DA552F;
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
          background: #DA552F;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
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
          background: #FFFFFF;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #E5E5E5;
        }
        
        .predictor-header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .predictor-header h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 700;
          color: #1A1A1A;
        }
        
        .predictor-header p {
          margin: 0;
          color: #666666;
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
          border: 6px solid #E5E5E5;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        /* Score color states - Red/Amber/Green */
        .score-circle.score-low {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          border-color: #FCA5A5;
        }
        
        .score-circle.score-medium {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          border-color: #FCD34D;
        }
        
        .score-circle.score-high {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border-color: #6EE7B7;
        }
        
        .score-circle:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .score-label {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666666;
          font-weight: 600;
        }
        
        .momentum-indicator {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: help;
          position: relative;
        }
        
        .momentum-indicator:hover {
          opacity: 0.8;
        }
        
        .momentum-arrow {
          font-size: 16px;
          font-weight: 700;
        }
        
        .momentum-building {
          color: #10B981;
          font-weight: 700;
        }
        
        .momentum-building .momentum-arrow {
          animation: pulse-green 2s ease-in-out infinite;
        }
        
        .momentum-peak {
          color: #F59E0B;
          font-weight: 700;
        }
        
        .momentum-peak .momentum-arrow {
          animation: pulse-orange 1.5s ease-in-out infinite;
        }
        
        .momentum-declining {
          color: #EF4444;
          font-weight: 700;
        }
        
        .momentum-declining .momentum-arrow {
          animation: pulse-red 2s ease-in-out infinite;
        }
        
        .momentum-stable {
          color: #6B7280;
          font-weight: 600;
        }
        
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes pulse-orange {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
        
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .launch-timers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
          padding: 20px;
          background: #F8F8F8;
          border-radius: 8px;
          border: 1px solid #E5E5E5;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        
        .timer-item {
          text-align: center;
        }
        
        .timer-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666666;
          margin-bottom: 6px;
          font-weight: 600;
        }
        
        .timer-value {
          font-size: 18px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: #1A1A1A;
        }
        
        .timer-subtitle {
          font-size: 10px;
          color: #999999;
          margin-top: 4px;
        }
        
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        
        .recommendation-item {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          padding: 16px;
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
        
        /* Impact color coding */
        .impact-positive {
          color: #10B981;
          font-weight: 600;
        }
        
        .impact-neutral {
          color: #F59E0B;
          font-weight: 600;
        }
        
        .impact-negative {
          color: #EF4444;
          font-weight: 600;
        }
        
        /* Category hotness indicators */
        .hotness-hot {
          color: #10B981;
          font-weight: 700;
        }
        
        .hotness-warm {
          color: #F59E0B;
          font-weight: 700;
        }
        
        .hotness-cool {
          color: #EF4444;
          font-weight: 700;
        }
        
        /* Command Center Styles */
        .command-center-card {
          background: #FFFFFF;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #E5E5E5;
          overflow-x: hidden;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .command-center-header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        .command-center-header h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 700;
          color: #1A1A1A;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .command-center-header p {
          color: #666;
          margin: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .auto-refresh-badge {
          display: inline-block;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 12px;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .command-center-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
          max-width: 100%;
          overflow: hidden;
        }
        
        .cc-section {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 20px;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        
        .cc-section h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 16px 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .leaderboard-table {
          max-height: 600px;
          overflow-y: auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .leaderboard-item {
          margin-bottom: 8px;
        }
        
        .leaderboard-row {
          display: grid;
          grid-template-columns: 30px 45px 2fr 110px 70px 70px 100px 85px;
          gap: 10px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          align-items: center;
          transition: all 0.2s;
          min-width: 650px;
          cursor: pointer;
        }
        
        .leaderboard-row:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.1);
          border-color: #DA552F;
        }
        
        .leaderboard-item.expanded .leaderboard-row {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom: none;
        }
        
        .lb-expand {
          font-size: 12px;
          color: #DA552F;
          font-weight: 700;
          transition: transform 0.2s;
          user-select: none;
        }
        
        .leaderboard-item.expanded .lb-expand {
          transform: rotate(0deg);
        }
        
        .leaderboard-details {
          background: #FAFAFA;
          border: 1px solid #E5E5E5;
          border-top: none;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          padding: 0 16px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.3s ease;
        }
        
        .leaderboard-item.expanded .leaderboard-details {
          padding: 20px 16px;
          overflow: visible;
        }
        
        .detail-section {
          margin-bottom: 16px;
        }
        
        .detail-section:last-child {
          margin-bottom: 0;
        }
        
        .detail-section h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 12px;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .detail-item {
          background: white;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #E5E5E5;
        }
        
        .detail-label {
          display: block;
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
          font-weight: 600;
        }
        
        .detail-value {
          display: block;
          font-size: 14px;
          color: #1A1A1A;
          font-weight: 700;
        }
        
        .detail-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .detail-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          color: #DA552F;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .detail-link:hover {
          background: #DA552F;
          color: white;
          border-color: #DA552F;
        }
        
        .detail-analysis {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .analysis-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .badge-icon {
          font-size: 16px;
          line-height: 1;
        }
        
        .badge-text {
          line-height: 1;
        }
        
        .badge-top {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #1A1A1A;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }
        
        .badge-good {
          background: linear-gradient(135deg, #DA552F 0%, #F97316 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.3);
        }
        
        .badge-neutral {
          background: #F3F4F6;
          color: #6B7280;
          border: 1px solid #E5E5E5;
        }
        
        .badge-hot {
          background: linear-gradient(135deg, #9333EA 0%, #C026D3 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        }
        
        .badge-rising {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
        }
        
        .badge-slow {
          background: #F3F4F6;
          color: #6B7280;
          border: 1px solid #E5E5E5;
        }
        
        .badge-engaged {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .badge-moderate {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .badge-quiet {
          background: #F3F4F6;
          color: #6B7280;
          border: 1px solid #E5E5E5;
        }
        
        .lb-rank {
          font-size: 16px;
          font-weight: 700;
          color: #DA552F;
          text-align: center;
        }
        
        .lb-rank.top-3 {
          font-size: 20px;
        }
        
        .lb-product {
          font-weight: 600;
          font-size: 14px;
          color: #1A1A1A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .lb-product .product-link {
          color: #1A1A1A;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s;
        }
        
        .lb-product .product-link:hover {
          color: #DA552F;
          border-bottom-color: #DA552F;
        }
        
        .lb-category {
          font-size: 11px;
          color: #666;
          background: #F0F0F0;
          padding: 3px 8px;
          border-radius: 4px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .lb-upvotes {
          font-size: 14px;
          font-weight: 700;
          color: #DA552F;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }
        
        .lb-comments {
          font-size: 13px;
          color: #666;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }
        
        .lb-velocity {
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          padding: 4px 6px;
          border-radius: 4px;
        }
        
        .velocity-high {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }
        
        .velocity-medium {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);
        }
        
        .velocity-low {
          background: #F3F4F6;
          color: #6B7280;
          font-weight: 600;
        }
        
        .engagement-windows {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 100%;
          overflow: hidden;
        }
        
        .engagement-window {
          background: #F8FAFC;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        
        .engagement-window.optimal {
          border-color: #10B981;
          background: #ECFDF5;
          border-left: 3px solid #10B981;
        }
        
        .ew-time {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 4px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        
        .ew-label {
          font-size: 12px;
          color: #666;
          word-break: break-word;
          line-height: 1.4;
        }
        
        .ew-status {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          margin-top: 6px;
          background: #10B981;
          color: white;
          word-break: break-word;
        }
        
        .action-suggestions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        .action-item {
          background: white;
          border-left: 4px solid #DA552F;
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .action-item.urgent {
          border-left-color: #EF4444;
          background: #FEF2F2;
        }
        
        .action-item.opportunity {
          border-left-color: #10B981;
          background: #F0FDF4;
        }
        
        .templates-section {
          margin-bottom: 32px;
        }
        
        .templates-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 20px 0;
        }
        
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .template-card {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 20px;
        }
        
        .template-card h4 {
          font-size: 15px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 12px 0;
        }
        
        .template-card textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
          background: white;
          color: #1A1A1A;
        }
        
        .copy-btn {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          background: #DA552F;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .copy-btn:hover {
          background: #c44a28;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.3);
        }
        
        .copy-btn:active {
          transform: translateY(0);
        }
        
        .copy-btn.copied {
          background: #10B981;
        }
        
        .competitor-analysis h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 20px 0;
        }
        
        .competitor-insights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .competitor-card {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 16px;
        }
        
        .competitor-card.catchable {
          border-color: #10B981;
          background: #ECFDF5;
        }
        
        .competitor-card.out-of-reach {
          border-color: #EF4444;
          background: #FEF2F2;
        }
        
        .comp-rank {
          font-size: 24px;
          font-weight: 700;
          color: #DA552F;
          margin-bottom: 8px;
        }
        
        .comp-name {
          font-size: 15px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 8px;
        }
        
        .comp-gap {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .comp-action {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .comp-action.can-catch {
          background: #10B981;
          color: white;
        }
        
        .comp-action.monitor {
          background: #F59E0B;
          color: white;
        }
        
        .loading-placeholder {
          text-align: center;
          padding: 40px;
          color: #999;
          font-style: italic;
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
        
        .track-hunt-card {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .track-hunt-header h2 {
          color: #1A1A1A;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .track-hunt-header p {
          color: #666;
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .url-input-section {
          margin-bottom: 24px;
          padding: 24px;
          background: #F9FAFB;
          border-radius: 6px;
          border: 1px solid #E5E5E5;
        }
        
        .track-btn {
          background: #DA552F;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        
        .track-btn:hover {
          background: #C44A27;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.3);
        }
        
        .track-btn:active {
          transform: translateY(0);
        }
        
        .track-btn:disabled {
          background: #10B981;
          cursor: not-allowed;
          transform: none;
        }
        
        .save-hunt-btn {
          background: linear-gradient(135deg, #DA552F 0%, #ff6b47 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.25);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          width: auto;
          min-width: 200px;
        }
        
        .save-hunt-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(218, 85, 47, 0.4);
        }
        
        .save-hunt-btn:disabled {
          background: #10B981;
          cursor: not-allowed;
          transform: none;
        }
        
        .save-hunt-btn.saving {
          background: #F59E0B;
          cursor: wait;
        }
        
        .save-analysis-btn {
          background: linear-gradient(135deg, #DA552F 0%, #ff6b47 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.25);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }
        
        .save-analysis-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(218, 85, 47, 0.4);
        }
        
        .save-analysis-btn:disabled {
          background: #10B981;
          cursor: not-allowed;
          transform: none;
        }
        
        .save-analysis-btn.saving {
          background: #F59E0B;
          cursor: wait;
        }
        
        .track-product-btn {
          background: transparent;
          border: 1px solid #DA552F;
          color: #DA552F;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .track-product-btn:hover:not(:disabled) {
          background: #DA552F;
          color: white;
          transform: scale(1.05);
        }
        
        .track-product-btn:disabled {
          background: #ECFDF5;
          border-color: #10B981;
          color: #10B981;
          cursor: not-allowed;
        }
        
        .track-product-btn.saving {
          border-color: #F59E0B;
          color: #F59E0B;
          cursor: wait;
        }
        
        .save-btn-container {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E5E5;
        }
        
        .product-summary {
          padding: 24px;
          background: #F9FAFB;
          border-radius: 6px;
          border: 1px solid #E5E5E5;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .summary-item {
          padding: 16px;
          background: white;
          border-radius: 4px;
          border: 1px solid #E5E5E5;
        }
        
        .summary-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #1A1A1A;
        }
        
        .analyzer-card {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .analyzer-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .analyzer-header h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: #1A1A1A;
          font-weight: 700;
        }
        
        .analyzer-header p {
          margin: 0;
          color: #666666;
          font-size: 14px;
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
          background: #DA552F;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          max-width: 300px;
          margin: 0 auto;
          display: block;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .analyze-btn:hover {
          background: #C44A28;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.3);
        }
        
        .analyze-btn:active {
          transform: scale(0.98);
        }
        
        .analyze-btn.secondary {
          background: #FFFFFF;
          color: #DA552F;
          border: 2px solid #DA552F;
        }
        
        .analyze-btn.secondary:hover {
          background: #FFF4F0;
        }
        
        /* Save/Track Button Styles */
        .save-btn-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        
        .save-hunt-btn,
        .save-analysis-btn {
          background: #DA552F;
          color: white;
          border: none;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(218, 85, 47, 0.2);
        }
        
        .save-hunt-btn:hover,
        .save-analysis-btn:hover {
          background: #C44A27;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.3);
        }
        
        .save-hunt-btn:active,
        .save-analysis-btn:active {
          transform: translateY(0);
        }
        
        .save-hunt-btn.saving,
        .save-analysis-btn.saving {
          background: #F59E0B;
          cursor: wait;
          pointer-events: none;
        }
        
        .save-hunt-btn:disabled,
        .save-analysis-btn:disabled {
          background: #10B981;
          cursor: not-allowed;
          transform: none;
        }
        
        .track-product-btn {
          background: #DA552F;
          color: white;
          border: none;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(218, 85, 47, 0.2);
        }
        
        .track-product-btn:hover {
          background: #C44A27;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(218, 85, 47, 0.3);
        }
        
        .track-product-btn:active {
          transform: translateY(0);
        }
        
        .track-product-btn.saving {
          background: #F59E0B;
          cursor: wait;
          pointer-events: none;
        }
        
        .track-product-btn:disabled {
          background: #10B981;
          cursor: not-allowed;
          transform: none;
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
        
        /* Mobile Navigation Toggle */
        .mobile-menu-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          z-index: 1001;
          position: relative;
        }
        
        .mobile-menu-toggle span {
          display: block;
          width: 24px;
          height: 3px;
          background: #1a1a1a;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
          opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }
        
        /* Mobile Menu Backdrop */
        .mobile-menu-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .mobile-menu-backdrop.active {
          display: block;
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
          
          .container {
            padding: 0 8px 32px;
          }
          
          .top-bar {
            padding: 12px 16px;
          }
          
          .logo h1 {
            font-size: 18px;
          }
          
          .logo-icon {
            width: 36px;
            height: 36px;
          }
          
          .logo-icon::before {
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 13px solid white;
          }
          
          .logo-icon::after {
            height: 7px;
          }
          
          /* Mobile Navigation */
          .mobile-menu-toggle {
            display: flex !important;
            margin-left: auto;
          }
          
          .desktop-nav-links {
            display: none !important;
          }
          
          .top-bar-content {
            position: relative;
          }
          
          /* Hide desktop user menu elements on mobile */
          .user-menu > .auth-buttons {
            display: none !important;
          }
          
          .user-menu > .user-info {
            display: none !important;
          }
          
          /* Mobile slide-out menu */
          .user-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 280px;
            height: 100vh;
            background: #FFFFFF;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            padding: 80px 20px 20px;
            transition: right 0.3s ease;
            z-index: 1000;
            overflow-y: auto;
            display: flex !important;
            flex-direction: column;
          }
          
          .user-menu.mobile-open {
            right: 0;
          }
          
          .mobile-nav-links {
            display: flex !important;
            flex-direction: column;
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 2px solid #F0F0F0;
          }
          
          /* Show auth buttons inside mobile menu */
          .user-menu.mobile-open > .auth-buttons {
            display: flex !important;
            flex-direction: column;
            gap: 12px;
          }
          
          .user-menu.mobile-open > .user-info {
            display: flex !important;
            flex-direction: column;
            gap: 12px;
          }
          
          .auth-buttons,
          .user-info {
            flex-direction: column;
            align-items: stretch !important;
            width: 100%;
          }
          
          .auth-btn,
          .user-action-btn {
            width: 100%;
            justify-content: center;
            min-height: 48px;
            font-size: 16px;
          }
          
          .hero {
            padding: 32px 16px 40px;
          }
          
          .cc-section {
            padding: 12px 8px;
          }
          
          .feature-slide {
            padding: 20px 16px;
          }
          
          .feature-icon {
            font-size: 36px;
          }
          
          .feature-title {
            font-size: 16px;
          }
          
          .feature-description {
            font-size: 13px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .chart-card {
            padding: 16px;
          }
          
          .chart-card h3 {
            font-size: 16px;
          }
          
          .recommendations-grid {
            grid-template-columns: 1fr;
          }
          
          .predictor-card {
            padding: 20px;
          }
          
          .predictor-header h2 {
            font-size: 22px;
          }
          
          .score-circle {
            width: 160px;
            height: 160px;
            font-size: 52px;
          }
          
          .launch-timers {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 12px;
            margin-left: 0;
            margin-right: 0;
            width: 100%;
          }
          
          .timer-item {
            min-width: auto;
            max-width: 100%;
            overflow-wrap: break-word;
          }
          
          .timer-value {
            font-size: 20px;
          }
          
          .timer-label {
            font-size: 13px;
          }
          
          .timer-subtitle {
            font-size: 12px;
          }
          
          .command-center-card {
            padding: 20px 16px;
          }
          
          .command-center-header h2 {
            font-size: 20px;
          }
          
          .command-center-header p {
            font-size: 14px;
          }
          
          .command-center-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .engagement-windows {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .window-item {
            padding: 12px;
          }
          
          .engagement-window {
            padding: 14px;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .ew-time {
            font-size: 14px;
            word-break: break-word;
          }
          
          .ew-status {
            font-size: 12px;
            word-break: break-word;
          }
          
          .ew-label {
            font-size: 11px;
            word-break: break-word;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 12px;
          }
          
          .analyze-btn,
          button,
          .btn {
            max-width: 100%;
            font-size: 16px;
            padding: 14px 24px;
            min-height: 48px;
          }
          
          .product-card {
            padding: 16px;
          }
          
          .product-name {
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          
          .product-tagline {
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          
          .footer {
            padding: 20px 16px;
          }
          
          .product-tagline {
            font-size: 14px;
          }
          
          .analyzer-card {
            padding: 24px 16px;
          }
          
          .analyzer-header h2 {
            font-size: 22px;
          }
          
          .analyzer-header p {
            font-size: 14px;
            line-height: 1.6;
          }
          
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 16px;
          }
          
          .form-group label {
            font-size: 14px;
          }
          
          .form-group input,
          .form-group select,
          .form-group textarea {
            font-size: 16px;
            padding: 14px 16px;
            min-height: 48px;
          }
          
          .feedback-modal {
            padding: 24px;
            margin: 20px;
            max-width: calc(100% - 40px);
          }
          
          .feedback-content h3 {
            font-size: 20px;
          }
          
          .feedback-options {
            gap: 12px;
          }
          
          .feedback-btn {
            font-size: 14px;
            padding: 12px 20px;
            min-height: 48px;
          }
          
          /* Mobile-optimized leaderboard - Compact 2-Row Layout */
          .leaderboard-table {
            overflow-x: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .leaderboard-row {
            display: grid;
            grid-template-columns: 20px 35px 1fr 58px 58px 60px;
            grid-template-rows: auto auto;
            padding: 8px 6px;
            gap: 3px;
            min-width: auto;
            width: 100%;
            align-items: center;
          }
          
          .lb-expand {
            grid-row: 1 / 3;
            grid-column: 1;
            font-size: 10px;
            align-self: center;
            text-align: center;
          }
          
          .lb-rank {
            grid-row: 1 / 3;
            grid-column: 2;
            font-size: 14px;
            font-weight: 700;
            align-self: center;
            text-align: center;
          }
          
          .lb-product {
            grid-row: 1;
            grid-column: 3 / 7;
            font-size: 13px;
            font-weight: 600;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.3;
            padding-bottom: 2px;
          }
          
          .lb-product a {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .lb-category {
            grid-row: 2;
            grid-column: 3;
            font-size: 9px;
            background: #F3F4F6;
            padding: 2px 4px;
            border-radius: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          
          .lb-upvotes {
            grid-row: 2;
            grid-column: 4;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            text-align: center;
          }
          
          .lb-comments {
            grid-row: 2;
            grid-column: 5;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            text-align: center;
          }
          
          .lb-velocity {
            grid-row: 2;
            grid-column: 6;
            font-size: 8px;
            padding: 2px 3px;
            border-radius: 3px;
            white-space: nowrap;
            text-align: center;
          }
          
          .track-product-btn {
            grid-row: 1;
            grid-column: 6;
            font-size: 9px;
            padding: 4px 6px;
            min-height: 28px;
            white-space: nowrap;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .detail-section h4 {
            font-size: 13px;
          }
          
          .detail-links {
            flex-direction: column;
          }
          
          .detail-link {
            width: 100%;
            justify-content: center;
          }
          
          .detail-analysis {
            gap: 6px;
          }
          
          .analysis-badge {
            font-size: 11px;
            padding: 6px 10px;
          }
          
          .badge-icon {
            font-size: 14px;
          }
          
          /* Modal optimization for mobile */
          .modal-content {
            width: 95%;
            max-width: 400px;
            margin: 20px auto;
            padding: 24px;
          }
          
          .modal-header h2 {
            font-size: 20px;
          }
          
          .modal-close {
            width: 36px;
            height: 36px;
            font-size: 24px;
          }
          
          /* Stats grid mobile */
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .stat-card {
            padding: 20px;
          }
          
          .stat-card .value {
            font-size: 28px;
          }
          
          /* Touch-friendly product links */
          .product-link {
            padding: 4px 0;
            display: inline-block;
          }
          
          /* AI Analysis Results Mobile */
          .analysis-section {
            padding: 16px;
          }
          
          .analysis-header h3 {
            font-size: 18px;
          }
          
          .competitive-analysis-table {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Tracked Hunts Mobile */
          .tracked-hunt-card {
            padding: 16px;
          }
          
          .hunt-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .hunt-actions {
            width: 100%;
          }
          
          .hunt-actions button {
            min-height: 44px;
          }
        }
        
        /* Footer Styles */
        .footer {
          background: #FFFFFF;
          border-top: 1px solid #E5E5E5;
          padding: 24px;
          margin-top: 40px;
          text-align: center;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .footer-text {
          color: #666;
          font-size: 14px;
        }
        
        .feedback-trigger {
          background: #DA552F;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .feedback-trigger:hover {
          background: #c24a28;
          transform: translateY(-1px);
        }
        
        /* Feedback Modal */
        .feedback-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }
        
        .feedback-modal.show {
          display: flex;
        }
        
        .feedback-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          position: relative;
        }
        
        .feedback-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .feedback-close:hover {
          background: #F0F0F0;
          color: #333;
        }
        
        .feedback-content h3 {
          margin-bottom: 8px;
          color: #1a1a1a;
          font-size: 24px;
        }
        
        .feedback-content p {
          color: #666;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .feedback-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .feedback-btn {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          color: #1a1a1a;
        }
        
        .feedback-btn:hover {
          background: #DA552F;
          color: white;
          border-color: #DA552F;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.2);
        }
        
        .feedback-icon {
          font-size: 20px;
        }
        
        /* Authentication UI Styles */
        .user-menu {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        /* Desktop Navigation Links */
        .desktop-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-left: auto;
          margin-right: 24px;
        }
        
        .nav-link {
          color: #1A1A1A;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          position: relative;
          padding: 4px 0;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #DA552F;
          transition: width 0.2s;
        }
        
        .nav-link:hover {
          color: #DA552F;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        /* Mobile Navigation Links */
        .mobile-nav-links {
          display: none;
        }
        
        .mobile-nav-link {
          display: block;
          padding: 12px 16px;
          color: #1A1A1A;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          border-radius: 6px;
          transition: all 0.2s;
          margin-bottom: 8px;
        }
        
        .mobile-nav-link:hover {
          background: #F8F8F8;
          color: #DA552F;
        }
        
        .mobile-nav-link:active {
          background: #F0F0F0;
        }
        
        .auth-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }
        
        .btn-login {
          background: transparent;
          color: #1A1A1A;
          border: 1px solid #E5E5E5;
        }
        
        .btn-login:hover {
          background: #F8F8F8;
          border-color: #DA552F;
          color: #DA552F;
        }
        
        .btn-register {
          background: #DA552F;
          color: white;
          border: 1px solid #DA552F;
        }
        
        .btn-register:hover {
          background: #C44A27;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.3);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-email {
          font-size: 14px;
          color: #1A1A1A;
          font-weight: 500;
        }
        
        .btn-logout {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #666;
          border: 1px solid #E5E5E5;
        }
        
        .btn-logout:hover {
          background: #FEF2F2;
          border-color: #EF4444;
          color: #EF4444;
        }
        
        /* Modal Styles */
        .modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }
        
        .modal-overlay.show {
          display: flex;
        }
        
        .modal {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 450px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 8px;
        }
        
        .modal-header p {
          font-size: 14px;
          color: #666;
        }
        
        .modal-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #E5E5E5;
        }
        
        .modal-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          font-size: 15px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
        }
        
        .modal-tab.active {
          color: #DA552F;
          border-bottom-color: #DA552F;
        }
        
        .modal-tab:hover {
          color: #DA552F;
        }
        
        .modal-content {
          display: none;
        }
        
        .modal-content.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 8px;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #DA552F;
          box-shadow: 0 0 0 3px rgba(218, 85, 47, 0.1);
        }
        
        .modal-btn {
          width: 100%;
          padding: 14px;
          background: #DA552F;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .modal-btn:hover {
          background: #C44A27;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(218, 85, 47, 0.3);
        }
        
        .modal-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          font-size: 28px;
          color: #666;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .modal-close:hover {
          background: #F8F8F8;
          color: #1A1A1A;
        }
        
        .error-message {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
          display: none;
        }
        
        .error-message.show {
          display: block;
        }
        
        .success-message {
          background: #ECFDF5;
          border: 1px solid #6EE7B7;
          color: #059669;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
          display: none;
        }
        
        .success-message.show {
          display: block;
        }
        
        /* Tracked Hunts Dashboard Styles */
        .tracked-hunts-card {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: none;
        }
        
        .tracked-hunts-card.show {
          display: block;
        }
        
        .tracked-hunts-header h2 {
          color: #1A1A1A;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .tracked-hunts-header p {
          color: #666;
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .tracked-hunts-list {
          display: grid;
          gap: 12px;
        }
        
        .tracked-hunt-item {
          background: #F8F8F8;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
          transition: all 0.2s;
        }
        
        .tracked-hunt-item:hover {
          border-color: #DA552F;
          box-shadow: 0 2px 8px rgba(218, 85, 47, 0.1);
        }
        
        .tracked-hunt-info {
          display: grid;
          gap: 8px;
        }
        
        .tracked-hunt-name {
          font-size: 16px;
          font-weight: 700;
          color: #1A1A1A;
        }
        
        .tracked-hunt-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #666;
        }
        
        .tracked-hunt-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .tracked-hunt-stat strong {
          color: #DA552F;
          font-weight: 700;
        }
        
        .btn-remove {
          padding: 8px 16px;
          background: transparent;
          color: #EF4444;
          border: 1px solid #EF4444;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-remove:hover {
          background: #EF4444;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .empty-state-text {
          font-size: 16px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <!-- Mobile Menu Backdrop -->
      <div class="mobile-menu-backdrop" id="mobileMenuBackdrop"></div>
      
      <div class="top-bar">
        <div class="top-bar-content">
          <div class="logo">
            <div class="logo-icon"></div>
            <h1><span class="hunt">Hunt</span>Product<span class="ph">Hunt</span></h1>
          </div>
          
          <!-- Desktop Navigation Links -->
          <div class="desktop-nav-links">
            <a href="#huntWeather" class="nav-link">Hunt Weather</a>
            <a href="#commandCenter" class="nav-link">Leaderboard</a>
            <a href="#trackHuntCard" class="nav-link">Track Hunt</a>
            <a href="#myTrackedHunts" class="nav-link nav-link-auth" style="display: none;">My Hunts</a>
            <a href="#getReady" class="nav-link">Get Ready</a>
          </div>
          
          <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="user-menu" id="userMenu">
            <div class="mobile-nav-links" id="mobileNavLinks">
              <a href="#huntWeather" class="mobile-nav-link">🌤️ Hunt Weather</a>
              <a href="#commandCenter" class="mobile-nav-link">📊 Leaderboard</a>
              <a href="#trackHuntCard" class="mobile-nav-link">📍 Track Hunt</a>
              <a href="#myTrackedHunts" class="mobile-nav-link mobile-nav-link-auth" style="display: none;">💾 My Hunts</a>
              <a href="#getReady" class="mobile-nav-link">🚀 Get Ready</a>
            </div>
            <div class="auth-buttons" id="authButtons">
              <button class="auth-btn btn-login" onclick="openAuthModal('login')">Login</button>
              <button class="auth-btn btn-register" onclick="openAuthModal('register')">Sign Up</button>
            </div>
            <div class="user-info" id="userInfo" style="display: none;">
              <span class="user-email" id="userEmail"></span>
              <button class="btn-logout" onclick="handleLogout()">Logout</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hero">
        <div class="hero-content">
          <div class="hero-subtitle">Analyze. Hunt. Dominate.</div>
          
          <h1 class="hero-title">
            Master Your ProductHunt Launch with<br/>
            <span class="hero-title-highlight">AI-Powered Hunt Intelligence</span>
          </h1>
          
          <p class="hero-description">
            Real-time leaderboard tracking, AI-driven launch timing optimization, and professional asset generation. 
            Everything you need to maximize upvotes and win Product of the Day.
          </p>
          
          <div class="hero-cta">
            <button class="cta-primary" onclick="document.getElementById('huntWeather').scrollIntoView({ behavior: 'smooth' })">
              🚀 Start Tracking Now - Free
            </button>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-icon">🏆</span>
                <span class="stat-text">Win Product Awards</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📊</span>
                <span class="stat-text">Live Hunt Analytics</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🤖</span>
                <span class="stat-text">AI Launch Assistant</span>
              </div>
            </div>
          </div>
          
          <div class="features-slider">
            <div class="features-track" id="featuresTrack">
              <div class="feature-slide">
                <span class="feature-icon">🌤️</span>
                <h3 class="feature-title">Hunt Weather</h3>
                <p class="feature-description">AI-powered scoring analyzing category trends, optimal timing, and competition to predict your success</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">📊</span>
                <h3 class="feature-title">Live Leaderboard</h3>
                <p class="feature-description">Track top 20 products in real-time with velocity indicators and competitor analysis</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">🔍</span>
                <h3 class="feature-title">Hunt Analysis</h3>
                <p class="feature-description">Get AI-driven insights on your tagline, category, and timing with personalized recommendations</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">✨</span>
                <h3 class="feature-title">Asset Generator</h3>
                <p class="feature-description">Create professional taglines, descriptions, and social posts based on top-performing hunts</p>
              </div>
              <div class="feature-slide">
                <span class="feature-icon">📍</span>
                <h3 class="feature-title">Track Your Hunt</h3>
                <p class="feature-description">Monitor your product's performance with real-time rank tracking and social share templates</p>
              </div>
            </div>
            <div class="slider-dots" id="sliderDots">
              <button class="slider-dot active" onclick="goToSlide(0)"></button>
              <button class="slider-dot" onclick="goToSlide(1)"></button>
              <button class="slider-dot" onclick="goToSlide(2)"></button>
              <button class="slider-dot" onclick="goToSlide(3)"></button>
              <button class="slider-dot" onclick="goToSlide(4)"></button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="container">
        <div id="loading" class="loading">
          <div>Loading dashboard data...</div>
        </div>
        
        <div id="dashboard" style="display: none;">
          <div class="command-center-card" id="commandCenterCard">
            <div class="command-center-header" id="huntWeather">
              <h2>🌤️ Hunt Weather</h2>
              <p>AI-powered hunt scoring, optimal timing insights, and live leaderboard tracking</p>
            </div>
            
            <!-- Hunt Weather Section -->
            <div class="predictor-section" id="predictorCard">
              <div class="launch-timers">
                <div class="timer-item">
                  <div class="timer-label">● Your Time</div>
                  <div class="timer-value" id="userTime">--:--:--</div>
                  <div class="timer-subtitle" id="userTimezone">--</div>
                </div>
                <div class="timer-item">
                  <div class="timer-label">◷ PST Time</div>
                  <div class="timer-value" id="pstTime">--:--:--</div>
                  <div class="timer-subtitle">Pacific Time</div>
                </div>
                <div class="timer-item">
                  <div class="timer-label">◐ Today's Hunt Ends</div>
                  <div class="timer-value" id="todayEnds">--:--:--</div>
                  <div class="timer-subtitle">Time Remaining</div>
                </div>
                <div class="timer-item">
                  <div class="timer-label">▲ Next Hunt Starts</div>
                  <div class="timer-value" id="nextLaunch">--:--:--</div>
                  <div class="timer-subtitle">12:01 AM PST Tomorrow</div>
                </div>
              </div>
              
              <div class="score-display">
                <div class="score-circle" id="scoreCircle">
                  <span id="scoreValue">--</span>
                </div>
                <div class="score-label" id="scoreLabel">Calculating...</div>
                <div class="momentum-indicator" id="momentumIndicator"></div>
              </div>
              
              <div class="recommendations-grid" id="recommendationsGrid">
                <div class="recommendation-item">
                  <div class="rec-label">◆ Category</div>
                  <div class="rec-value" id="recCategory">--</div>
                  <div class="rec-impact" id="recCategoryImpact">--</div>
                </div>
                <div class="recommendation-item">
                  <div class="rec-label">◷ Best Day</div>
                  <div class="rec-value" id="recDay">--</div>
                  <div class="rec-impact" id="recDayImpact">--</div>
                </div>
                <div class="recommendation-item">
                  <div class="rec-label">◐ Best Time</div>
                  <div class="rec-value" id="recTime">--</div>
                  <div class="rec-impact" id="recTimeImpact">--</div>
                </div>
                <div class="recommendation-item">
                  <div class="rec-label">● Competition</div>
                  <div class="rec-value" id="recCompetition">--</div>
                  <div class="rec-impact" id="recCompetitionImpact">--</div>
                </div>
              </div>
              
              <div class="charts-grid" style="margin-top: 24px;">
                <div class="chart-card">
                  <h3>▦ Top Categories by Product Count</h3>
                  <div class="chart-container">
                    <canvas id="topCategoriesChart"></canvas>
                  </div>
                </div>
                <div class="chart-card">
                  <h3>★ Average Upvotes by Category</h3>
                  <div class="chart-container">
                    <canvas id="avgUpvotesChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Live Leaderboard Section (Full Width) -->
            <div class="cc-section leaderboard-section" id="commandCenter" style="margin-top: 24px;">
              <h3>📊 Live Leaderboard - <a href="https://www.producthunt.com" target="_blank" style="color: #DA552F; text-decoration: none; border-bottom: 1px solid #DA552F;">Top 20 Hunts Today</a></h3>
              <p style="font-size: 13px; color: #666; margin: 8px 0 16px 0;">Real-time ranking of today's featured products with velocity tracking</p>
              <div class="leaderboard-table" id="leaderboardTable">
                <div class="loading-placeholder">Loading leaderboard...</div>
              </div>
            </div>
          </div>
          
          <!-- Track My Hunt Section -->
          <div class="track-hunt-card" id="trackHuntCard">
            <div class="track-hunt-header">
              <h2>📍 Track My Hunt</h2>
              <p>Monitor your hunt in real-time with live stats, social templates, and actionable recommendations</p>
            </div>
            
            <div class="url-input-section">
              <div class="form-group">
                <label for="productHuntUrl">ProductHunt URL *</label>
                <input 
                  type="text" 
                  id="productHuntUrl" 
                  placeholder="https://www.producthunt.com/posts/your-product" 
                  required
                  style="width: 100%; padding: 12px; border: 1px solid #E5E5E5; border-radius: 6px; font-size: 14px;"
                >
                <small style="color: #666; font-size: 12px; display: block; margin-top: 8px;">
                  Paste your ProductHunt product page URL to track performance and get personalized templates
                </small>
              </div>
              <button class="track-btn" onclick="trackProductHunt()" style="margin-top: 16px;">
                🔍 Track This Hunt
              </button>
            </div>
            
            <!-- Product Summary Section -->
            <div class="product-summary" id="productSummary" style="display: none; margin-top: 32px;">
              <h3 style="color: #1a1a1a; margin-bottom: 16px;">📊 Product Summary</h3>
              <div class="summary-grid" id="summaryGrid">
                <!-- Will be populated dynamically -->
              </div>
              <div class="save-btn-container">
                <button class="save-hunt-btn" id="saveHuntTrackerBtn" onclick="saveHuntFromTracker()">
                  🔖 Save to My Hunts
                </button>
              </div>
            </div>
            
            <!-- AI Analysis Section -->
            <div id="aiAnalysisSection" style="display: none; margin-top: 32px;">
              <h3 style="color: #1a1a1a; margin-bottom: 16px;">🤖 AI Performance Analysis</h3>
              <div id="aiAnalysisContent"></div>
            </div>
            
            <!-- Social Templates Section -->
            <div class="templates-section" id="trackTemplates" style="display: none; margin-top: 40px;">
              <h3 style="color: #1a1a1a; margin-bottom: 8px; font-size: 20px; font-weight: 700;">📝 One-Click Templates</h3>
              <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Customized templates for your product's hunt</p>
              
              <!-- Templates Slider -->
              <div style="position: relative; background: white; border: 1px solid #E5E5E5; border-radius: 12px; padding: 24px; overflow: hidden;">
                
                <!-- Slider Container -->
                <div class="templates-slider" id="templatesSlider">
                  
                  <!-- Twitter Template Slide -->
                  <div class="template-slide" data-platform="twitter" style="display: block;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                      <div style="background: linear-gradient(135deg, #1DA1F2 0%, #0C85D0 100%); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        🐦
                      </div>
                      <h4 style="color: #1A1A1A; margin: 0; font-size: 20px; font-weight: 700;">Twitter Post</h4>
                    </div>
                    <textarea id="trackTwitterTemplate" readonly style="width: 100%; min-height: 180px; padding: 16px; border: 1px solid #E5E5E5; border-radius: 8px; font-size: 14px; line-height: 1.6; font-family: inherit; resize: vertical; background: #F9FAFB;"></textarea>
                    <button class="copy-btn" onclick="copyTrackTemplate('twitter')" style="width: 100%; margin-top: 16px; background: linear-gradient(135deg, #DA552F 0%, #F97316 100%); color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      📋 Copy to Clipboard
                    </button>
                  </div>
                  
                  <!-- LinkedIn Template Slide -->
                  <div class="template-slide" data-platform="linkedin" style="display: none;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                      <div style="background: linear-gradient(135deg, #0077B5 0%, #005885 100%); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        💼
                      </div>
                      <h4 style="color: #1A1A1A; margin: 0; font-size: 20px; font-weight: 700;">LinkedIn Post</h4>
                    </div>
                    <textarea id="trackLinkedinTemplate" readonly style="width: 100%; min-height: 180px; padding: 16px; border: 1px solid #E5E5E5; border-radius: 8px; font-size: 14px; line-height: 1.6; font-family: inherit; resize: vertical; background: #F9FAFB;"></textarea>
                    <button class="copy-btn" onclick="copyTrackTemplate('linkedin')" style="width: 100%; margin-top: 16px; background: linear-gradient(135deg, #DA552F 0%, #F97316 100%); color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      📋 Copy to Clipboard
                    </button>
                  </div>
                  
                  <!-- Email Template Slide -->
                  <div class="template-slide" data-platform="email" style="display: none;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                      <div style="background: linear-gradient(135deg, #EA4335 0%, #C5221F 100%); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        📧
                      </div>
                      <h4 style="color: #1A1A1A; margin: 0; font-size: 20px; font-weight: 700;">Email Outreach</h4>
                    </div>
                    <textarea id="trackEmailTemplate" readonly style="width: 100%; min-height: 180px; padding: 16px; border: 1px solid #E5E5E5; border-radius: 8px; font-size: 14px; line-height: 1.6; font-family: inherit; resize: vertical; background: #F9FAFB;"></textarea>
                    <button class="copy-btn" onclick="copyTrackTemplate('email')" style="width: 100%; margin-top: 16px; background: linear-gradient(135deg, #DA552F 0%, #F97316 100%); color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      📋 Copy to Clipboard
                    </button>
                  </div>
                  
                </div>
                
                <!-- Slider Navigation Dots -->
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #E5E5E5;">
                  <button onclick="switchTemplateSlide(0)" class="template-dot" data-index="0" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #DA552F; background: #DA552F; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    🐦
                  </button>
                  <button onclick="switchTemplateSlide(1)" class="template-dot" data-index="1" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #E5E5E5; background: white; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    💼
                  </button>
                  <button onclick="switchTemplateSlide(2)" class="template-dot" data-index="2" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #E5E5E5; background: white; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    📧
                  </button>
                </div>
                
              </div>
            </div>
            
            <!-- Competitor Analysis Section -->
            <div class="competitor-analysis" id="trackCompetitorAnalysis" style="display: none; margin-top: 40px;">
              <h3>🎯 Competitor Analysis</h3>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Compare your ranking with nearby products</p>
              <div id="trackCompetitorInsights">
                <!-- Will be populated dynamically -->
              </div>
            </div>
            
            <!-- Action Suggestions Section -->
            <div id="trackActionSuggestions" style="display: none; margin-top: 32px;">
              <h3>💡 Action Suggestions</h3>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">Smart recommendations to boost your hunt performance</p>
              <div class="action-suggestions" id="actionSuggestions">
                <div class="loading-placeholder">Analyzing...</div>
              </div>
            </div>
          </div>
          
          <!-- My Tracked Hunts Dashboard -->
          <div class="tracked-hunts-card" id="trackedHuntsCard">
            <div class="tracked-hunts-header">
              <h2>📊 My Tracked Hunts</h2>
              <p>Monitor your tracked products in real-time</p>
            </div>
            
            <div class="tracked-hunts-list" id="trackedHuntsList">
              <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div class="empty-state-text">No hunts tracked yet. Use "Track My Hunt" above to start tracking!</div>
              </div>
            </div>
          </div>
          
          <div class="analyzer-card" id="getReady">
            <div class="analyzer-header">
              <h2>▲ Get Your Product Ready to Hunt</h2>
              <p>Analyze your hunt strategy or generate professional assets based on your product details</p>
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
              <button class="analyze-btn" onclick="analyzeUserLaunch()">▣ Analyze My Hunt</button>
              <button class="analyze-btn secondary" onclick="generateLaunchAssets()">✦ Generate Hunt Assets</button>
            </div>
            
            <div class="analysis-results" id="analysisResults">
              <div class="result-header">
                <h3>Your Hunt Analysis</h3>
                <div class="result-score" id="userScore">--</div>
                <div id="userScoreLabel">--</div>
              </div>
              
              <div class="insights-grid" id="userInsights">
              </div>
              
              <div class="save-btn-container" style="margin-top: 24px;">
                <button class="save-analysis-btn" id="saveAnalysisBtn" onclick="saveAnalysis()">
                  💾 Save This Analysis
                </button>
              </div>
            </div>
            
            <div class="assets-results" id="assetsResults">
              <h3 style="margin-bottom: 20px; color: #1a1a1a;">✦ Your Launch Assets</h3>
              <div id="generatedAssets"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-content">
          <span class="footer-text">Made for Makers by Makers</span>
          <button class="feedback-trigger" onclick="openFeedbackModal()">▸ Feedback</button>
        </div>
      </div>
      
      <!-- Feedback Modal -->
      <div class="feedback-modal" id="feedbackModal" onclick="if(event.target === this) closeFeedbackModal()">
        <div class="feedback-content">
          <button class="feedback-close" onclick="closeFeedbackModal()">×</button>
          <h3>We&apos;d Love Your Feedback!</h3>
          <p>Help us improve HuntProductHunt for the Maker community</p>
          <div class="feedback-options">
            <a href="mailto:cosmorudyrp@gmail.com?subject=HuntProductHunt Feedback&body=Hi! I&apos;d like to share my feedback about HuntProductHunt:%0D%0A%0D%0A" class="feedback-btn">
              <span class="feedback-icon">✉</span>
              <span>Send Email Feedback</span>
            </a>
            <a href="https://twitter.com/intent/tweet?text=Just tried HuntProductHunt - an amazing tool for optimizing ProductHunt launches! Check it out:" target="_blank" rel="noopener" class="feedback-btn">
              <span class="feedback-icon">⤴</span>
              <span>Share on Twitter</span>
            </a>
            <a href="https://www.producthunt.com" target="_blank" rel="noopener" class="feedback-btn">
              <span class="feedback-icon">▲</span>
              <span>Hunt Us on ProductHunt</span>
            </a>
          </div>
        </div>
      </div>
      
      <!-- Auth Modal -->
      <div class="modal-overlay" id="authModal" onclick="if(event.target === this) closeAuthModal()">
        <div class="modal" style="position: relative;">
          <button class="modal-close" onclick="closeAuthModal()">×</button>
          <div class="modal-header">
            <h2>Welcome to HuntProductHunt</h2>
            <p>Track your hunts and get personalized insights</p>
          </div>
          
          <div class="modal-tabs">
            <button class="modal-tab active" id="loginTab" onclick="switchAuthTab('login')">Login</button>
            <button class="modal-tab" id="registerTab" onclick="switchAuthTab('register')">Sign Up</button>
          </div>
          
          <!-- Login Form -->
          <div class="modal-content active" id="loginContent">
            <div class="error-message" id="loginError"></div>
            <div class="success-message" id="loginSuccess"></div>
            
            <form onsubmit="handleLogin(event)">
              <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" placeholder="your@email.com" required>
              </div>
              
              <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" placeholder="Enter your password" required minlength="6">
              </div>
              
              <button type="submit" class="modal-btn" id="loginBtn">Login</button>
            </form>
          </div>
          
          <!-- Register Form -->
          <div class="modal-content" id="registerContent">
            <div class="error-message" id="registerError"></div>
            <div class="success-message" id="registerSuccess"></div>
            
            <form onsubmit="handleRegister(event)">
              <div class="form-group">
                <label for="registerName">Name</label>
                <input type="text" id="registerName" placeholder="Your name" required>
              </div>
              
              <div class="form-group">
                <label for="registerEmail">Email</label>
                <input type="email" id="registerEmail" placeholder="your@email.com" required>
              </div>
              
              <div class="form-group">
                <label for="registerPassword">Password</label>
                <input type="password" id="registerPassword" placeholder="At least 6 characters" required minlength="6">
              </div>
              
              <button type="submit" class="modal-btn" id="registerBtn">Create Account</button>
            </form>
          </div>
        </div>
      </div>
      
      <script>
        // Mobile Menu Toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const userMenu = document.getElementById('userMenu');
        const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
        
        if (mobileMenuToggle) {
          mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            userMenu.classList.toggle('mobile-open');
            mobileMenuBackdrop.classList.toggle('active');
          });
          
          // Close menu when clicking backdrop
          mobileMenuBackdrop.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            userMenu.classList.remove('mobile-open');
            mobileMenuBackdrop.classList.remove('active');
          });
          
          // Close menu when clicking outside
          document.addEventListener('click', function(event) {
            if (!userMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
              mobileMenuToggle.classList.remove('active');
              userMenu.classList.remove('mobile-open');
              mobileMenuBackdrop.classList.remove('active');
            }
          });
          
          // Close menu when clicking a menu item or link
          userMenu.addEventListener('click', function(event) {
            if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
              mobileMenuToggle.classList.remove('active');
              userMenu.classList.remove('mobile-open');
              mobileMenuBackdrop.classList.remove('active');
            }
          });
          
          // Smooth scroll for all navigation links (mobile and desktop)
          document.querySelectorAll('.mobile-nav-link, .nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              const targetId = this.getAttribute('href').substring(1);
              const targetElement = document.getElementById(targetId);
              if (targetElement) {
                const headerHeight = 80; // Top bar height + padding
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight;
                
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            });
          });
        }
        
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
          
          // Track feature view
          const features = ['Hunt Weather', 'Analyze Your Hunt', 'Generate Hunt Assets', 'Analytics Dashboard', 'Launch Day Command Center'];
          if (typeof gtag === 'function') {
            gtag('event', 'view_feature', {
              'feature_name': features[index],
              'slide_index': index
            });
          }
          
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
        
        // Auto-refresh Hunt Weather every minute
        setInterval(() => {
          if (allProducts.length > 0) {
            updatePredictor();
          }
        }, 60000); // 60 seconds
        
        // Auto-refresh Command Center every 30 seconds
        setInterval(() => {
          if (allProducts.length > 0) {
            updateCommandCenter();
          }
        }, 30000); // 30 seconds
        
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
              document.getElementById('loading').innerHTML = '✕ Error: ' + errorMsg + '<br><small>Please check if PH_TOKEN is set correctly</small>';
              return;
            }
            
            const data = await response.json();
            
            if (data.error) {
              document.getElementById('loading').innerHTML = '✕ Server Error: ' + data.error + '<br><small>Please check if PH_TOKEN is set correctly</small>';
              return;
            }
            
            if (data.errors) {
              document.getElementById('loading').innerHTML = '✕ API Error: ' + JSON.stringify(data.errors);
              return;
            }
            
            if (!data.data?.posts?.edges) {
              document.getElementById('loading').innerHTML = '✕ No product data available<br><small>The API did not return expected data</small>';
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
            
            // Track successful dashboard load
            if (typeof gtag === 'function') {
              gtag('event', 'dashboard_loaded', {
                'products_count': allProducts.length
              });
            }
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
          } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('loading').innerHTML = '✕ Failed to load dashboard data<br><small>' + (error.message || 'Unknown error') + '</small>';
          }
        }
        
        function applyFilters() {
          // No filtering - just use all products
          filteredProducts = [...allProducts];
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
          // Use all products for analysis
          const analysisProducts = allProducts;
          
          if (analysisProducts.length < 3) {
            // Low confidence - not enough data
            return {
              score: 0,
              category: 'All Categories',
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
          
          // Determine category hotness indicator with color class
          let hotnessIndicator = '<span class="hotness-hot">▲ HOT</span>';
          if (categoryScore < 50) hotnessIndicator = '<span class="hotness-cool">▼ COOL</span>';
          else if (categoryScore < 70) hotnessIndicator = '<span class="hotness-warm">— WARM</span>';
          
          // Find hottest category based on avg upvotes and recency
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
          const displayCategory = hottestCategory;
          
          // Calculate impact predictions
          const dayImpact = \`+\${Math.round(dayScore / 10)}% better results\`;
          const timeImpact = bestHour === 0 ? 'Midnight launch (12:01 AM)' : 'Peak engagement time';
          
          return {
            score: Math.min(finalScore, 100),
            category: displayCategory,
            categoryHotness: hotnessIndicator,
            bestDay: bestDay,
            bestTime: formatTime(bestHour),
            bestHour: bestHour,
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
        
        function calculateMomentum(prediction) {
          const now = new Date();
          const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
          const currentHour = pstTime.getHours();
          const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pstTime.getDay()];
          const hoursUntilEndOfDay = 24 - currentHour;
          
          // Calculate time momentum (approaching or leaving optimal time)
          const optimalHour = prediction.bestHour || 0;
          let hourDistance = Math.abs(currentHour - optimalHour);
          if (hourDistance > 12) hourDistance = 24 - hourDistance; // Wrap around midnight
          
          // Check if we're in peak window (within 2 hours of optimal)
          const inPeakWindow = hourDistance <= 2;
          
          // Check if approaching or leaving peak
          const nextHour = (currentHour + 1) % 24;
          let nextDistance = Math.abs(nextHour - optimalHour);
          if (nextDistance > 12) nextDistance = 24 - nextDistance;
          const approaching = nextDistance < hourDistance;
          
          // Day alignment
          const onOptimalDay = currentDay === prediction.bestDay;
          
          // Determine momentum
          let momentum = {
            class: '',
            text: '',
            icon: ''
          };
          
          // Peak window - in optimal time
          if (inPeakWindow && onOptimalDay) {
            momentum = {
              class: 'momentum-peak',
              text: 'PEAK WINDOW',
              arrow: '▲',
              tooltip: "You're in the optimal time window right now - ideal conditions for launching!"
            };
          }
          // Building momentum - approaching optimal time
          else if (approaching && hourDistance <= 6) {
            momentum = {
              class: 'momentum-building',
              text: 'TRENDING UP',
              arrow: '▲',
              tooltip: 'Conditions are improving - approaching optimal launch time'
            };
          }
          // Late in the day - window closing
          else if (hoursUntilEndOfDay <= 4 && currentHour >= 20) {
            momentum = {
              class: 'momentum-declining',
              text: 'CLOSING SOON',
              arrow: '▼',
              tooltip: "Late in the day - today's hunt window is closing soon"
            };
          }
          // Moving away from optimal
          else if (!approaching && hourDistance >= 4) {
            momentum = {
              class: 'momentum-declining',
              text: 'TRENDING DOWN',
              arrow: '▼',
              tooltip: 'Moving away from optimal launch conditions'
            };
          }
          // Stable conditions
          else {
            momentum = {
              class: 'momentum-stable',
              text: 'STABLE',
              arrow: '—',
              tooltip: 'Conditions are steady - no significant changes expected soon'
            };
          }
          
          return momentum;
        }
        
        // Helper function to determine impact color class
        function getImpactClass(impactText) {
          const text = impactText.toLowerCase();
          if (text.includes('excellent') || text.includes('perfect') || text.includes('ideal') || 
              text.includes('strong') || text.includes('low competition')) {
            return 'impact-positive';
          } else if (text.includes('fierce') || text.includes('high') || text.includes('very competitive') ||
                     text.includes('crowded') || text.includes('avoid')) {
            return 'impact-negative';
          } else {
            return 'impact-neutral';
          }
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
          
          // Update recommendations with color coding
          const categoryEl = document.getElementById('recCategory');
          const categoryImpactEl = document.getElementById('recCategoryImpact');
          categoryEl.textContent = prediction.category;
          categoryImpactEl.innerHTML = prediction.impacts.category;
          categoryImpactEl.className = 'rec-impact';
          
          const dayEl = document.getElementById('recDay');
          const dayImpactEl = document.getElementById('recDayImpact');
          dayEl.textContent = prediction.bestDay;
          dayImpactEl.textContent = prediction.impacts.day;
          dayImpactEl.className = getImpactClass(prediction.impacts.day);
          
          const timeEl = document.getElementById('recTime');
          const timeImpactEl = document.getElementById('recTimeImpact');
          timeEl.textContent = prediction.bestTime;
          timeImpactEl.textContent = prediction.impacts.time;
          timeImpactEl.className = getImpactClass(prediction.impacts.time);
          
          const competitionEl = document.getElementById('recCompetition');
          const competitionImpactEl = document.getElementById('recCompetitionImpact');
          competitionEl.textContent = prediction.competition;
          competitionImpactEl.textContent = prediction.impacts.competition;
          competitionImpactEl.className = getImpactClass(prediction.impacts.competition);
          
          // Update momentum indicator
          const momentum = calculateMomentum(prediction);
          const momentumIndicator = document.getElementById('momentumIndicator');
          if (prediction.score > 0) {
            momentumIndicator.innerHTML = \`<span class="momentum-arrow">\${momentum.arrow}</span><span>\${momentum.text}</span>\`;
            momentumIndicator.className = 'momentum-indicator ' + momentum.class;
            momentumIndicator.title = momentum.tooltip;
          } else {
            momentumIndicator.innerHTML = '';
            momentumIndicator.className = 'momentum-indicator';
            momentumIndicator.title = '';
          }
        }
        
        function updateDashboard() {
          updatePredictor();
          updateCommandCenter();
          updateCategoryFilter();
          updateCharts();
        }
        
        function updateCommandCenter() {
          const top20 = allProducts.slice(0, 20);
          
          // Update leaderboard
          updateLeaderboard(top20);
          
          // Update engagement windows
          updateEngagementWindows();
          
          // Update action suggestions
          updateActionSuggestions(top20);
          
          // Update social templates
          updateSocialTemplates(top20);
          
          // Update competitor analysis
          updateCompetitorAnalysis(top20);
        }
        
        // Store leaderboard products for saving
        let leaderboardProducts = [];
        
        function updateLeaderboard(top20) {
          const leaderboardTable = document.getElementById('leaderboardTable');
          if (!leaderboardTable) return;
          
          if (top20.length === 0) {
            leaderboardTable.innerHTML = '<div class="loading-placeholder">No products available</div>';
            return;
          }
          
          // Store products globally for access by save function
          leaderboardProducts = top20;
          
          let html = '';
          top20.forEach((product, index) => {
            const rank = index + 1;
            const velocity = calculateVelocity(product, index) || { class: 'velocity-low', label: '💤 Slow' };
            const velocityClass = velocity.class || 'velocity-low';
            const velocityLabel = velocity.label || '💤 Slow';
            const rankClass = rank <= 3 ? 'top-3' : '';
            
            const productUrl = product.url || 'https://www.producthunt.com';
            
            // Calculate additional metrics
            const createdAt = product.createdAt ? new Date(product.createdAt) : null;
            const hoursLive = createdAt ? Math.max((new Date() - createdAt) / (1000 * 60 * 60), 0.1) : null;
            const upvotesPerHour = hoursLive ? Math.round(product.votesCount / hoursLive) : null;
            const commentsPerUpvote = product.votesCount > 0 ? (product.commentsCount / product.votesCount).toFixed(2) : '0.00';
            
            html += '<div class="leaderboard-item" data-product-index="' + index + '">' +
              '<div class="leaderboard-row">' +
              '<div class="lb-expand">▶</div>' +
              '<div class="lb-rank ' + rankClass + '">#' + rank + '</div>' +
              '<div class="lb-product"><a href="' + productUrl + '" target="_blank" class="product-link" onclick="event.stopPropagation()">' + product.name + '</a></div>' +
              '<div class="lb-category">' + (product.category || 'General') + '</div>' +
              '<div class="lb-upvotes">▲ ' + (product.votesCount || 0) + '</div>' +
              '<div class="lb-comments">💬 ' + (product.commentsCount || 0) + '</div>' +
              '<div class="lb-velocity ' + velocityClass + '">' + velocityLabel + '</div>' +
              '<button class="track-product-btn" data-product-index="' + index + '" data-rank="' + rank + '" onclick="event.stopPropagation()">' +
              '🔖 Track' +
              '</button>' +
              '</div>' +
              '<div class="leaderboard-details">' +
              '<div class="detail-section">' +
              '<h4>📊 Performance Metrics</h4>' +
              '<div class="detail-grid">' +
              '<div class="detail-item">' +
              '<span class="detail-label">Total Upvotes</span>' +
              '<span class="detail-value">▲ ' + (product.votesCount || 0) + '</span>' +
              '</div>' +
              '<div class="detail-item">' +
              '<span class="detail-label">Total Comments</span>' +
              '<span class="detail-value">💬 ' + (product.commentsCount || 0) + '</span>' +
              '</div>' +
              '<div class="detail-item">' +
              '<span class="detail-label">Velocity</span>' +
              '<span class="detail-value">' + (upvotesPerHour !== null ? upvotesPerHour + ' upvotes/hr' : 'N/A') + '</span>' +
              '</div>' +
              '<div class="detail-item">' +
              '<span class="detail-label">Engagement Rate</span>' +
              '<span class="detail-value">' + commentsPerUpvote + ' comments/upvote</span>' +
              '</div>' +
              '<div class="detail-item">' +
              '<span class="detail-label">Hours Live</span>' +
              '<span class="detail-value">' + (hoursLive !== null ? Math.round(hoursLive * 10) / 10 + ' hrs' : 'N/A') + '</span>' +
              '</div>' +
              '<div class="detail-item">' +
              '<span class="detail-label">Rank</span>' +
              '<span class="detail-value">#' + rank + ' of ' + top20.length + '</span>' +
              '</div>' +
              '</div>' +
              '</div>' +
              '<div class="detail-section">' +
              '<h4>💡 Quick Analysis</h4>' +
              '<div class="detail-analysis">' +
              getQuickAnalysis(rank, velocity, upvotesPerHour, commentsPerUpvote) +
              '</div>' +
              '</div>' +
              '</div>' +
              '</div>';
          });
          
          leaderboardTable.innerHTML = html;
          
          // Add event listeners to all track buttons
          document.querySelectorAll('.track-product-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const productIndex = parseInt(this.getAttribute('data-product-index'));
              saveHuntFromLeaderboard(productIndex);
            });
          });
          
          // Add click handlers to expand/collapse rows
          document.querySelectorAll('.leaderboard-item').forEach(item => {
            const row = item.querySelector('.leaderboard-row');
            const details = item.querySelector('.leaderboard-details');
            const expandIcon = item.querySelector('.lb-expand');
            
            row.addEventListener('click', function(e) {
              // Don't expand if clicking on a link or button
              if (e.target.closest('a') || e.target.closest('button')) return;
              
              const isExpanded = item.classList.contains('expanded');
              
              if (isExpanded) {
                item.classList.remove('expanded');
                details.style.maxHeight = '0px';
                expandIcon.textContent = '▶';
              } else {
                item.classList.add('expanded');
                // Use a large max-height to ensure all content is visible
                details.style.maxHeight = '800px';
                expandIcon.textContent = '▼';
              }
            });
          });
        }
        
        function getQuickAnalysis(rank, velocity, upvotesPerHour, commentsPerUpvote) {
          let badges = '';
          
          // Rank Badge
          if (rank <= 3) {
            badges += '<div class="analysis-badge badge-top"><span class="badge-icon">🏆</span><span class="badge-text">Top 3 - Dominating</span></div>';
          } else if (rank <= 10) {
            badges += '<div class="analysis-badge badge-good"><span class="badge-icon">🎯</span><span class="badge-text">Top 10 - High Visibility</span></div>';
          } else {
            badges += '<div class="analysis-badge badge-neutral"><span class="badge-icon">📊</span><span class="badge-text">Rank #' + rank + '</span></div>';
          }
          
          // Velocity Badge
          if (velocity.class === 'velocity-high') {
            badges += '<div class="analysis-badge badge-hot"><span class="badge-icon">🚀</span><span class="badge-text">Hot Momentum</span></div>';
          } else if (velocity.class === 'velocity-medium') {
            badges += '<div class="analysis-badge badge-rising"><span class="badge-icon">⚡</span><span class="badge-text">Rising Steadily</span></div>';
          } else {
            badges += '<div class="analysis-badge badge-slow"><span class="badge-icon">💤</span><span class="badge-text">Slow Pace</span></div>';
          }
          
          // Engagement Badge
          if (commentsPerUpvote > 0.5) {
            badges += '<div class="analysis-badge badge-engaged"><span class="badge-icon">💬</span><span class="badge-text">High Engagement</span></div>';
          } else if (commentsPerUpvote > 0.2) {
            badges += '<div class="analysis-badge badge-moderate"><span class="badge-icon">💬</span><span class="badge-text">Moderate Talk</span></div>';
          } else {
            badges += '<div class="analysis-badge badge-quiet"><span class="badge-icon">🤫</span><span class="badge-text">Quiet Discussion</span></div>';
          }
          
          return badges || '<div class="analysis-badge badge-neutral"><span class="badge-icon">⏳</span><span class="badge-text">Building Momentum</span></div>';
        }
        
        function calculateVelocity(product, index) {
          // Simple velocity calculation based on upvotes per hour
          
          if (!product.createdAt || !product.votesCount) {
            // Fallback if data missing - estimate by rank
            if (index < 5) return { class: 'velocity-high', label: '🚀 HOT' };
            if (index < 12) return { class: 'velocity-medium', label: '⚡ Rising' };
            return { class: 'velocity-low', label: '💤 Slow' };
          }
          
          try {
            const createdAt = new Date(product.createdAt);
            const now = new Date();
            
            // Validate date
            if (isNaN(createdAt.getTime())) {
              if (index < 5) return { class: 'velocity-high', label: '🚀 HOT' };
              if (index < 12) return { class: 'velocity-medium', label: '⚡ Rising' };
              return { class: 'velocity-low', label: '💤 Slow' };
            }
            
            const hoursLive = Math.max((now - createdAt) / (1000 * 60 * 60), 0.5);
            const upvotesPerHour = product.votesCount / hoursLive;
            
            if (upvotesPerHour > 30) {
              return { class: 'velocity-high', label: '🚀 HOT' };
            } else if (upvotesPerHour > 15) {
              return { class: 'velocity-medium', label: '⚡ Rising' };
            } else {
              return { class: 'velocity-low', label: '💤 Slow' };
            }
          } catch (error) {
            // Fallback to rank-based velocity
            if (index < 5) return { class: 'velocity-high', label: '🚀 HOT' };
            if (index < 12) return { class: 'velocity-medium', label: '⚡ Rising' };
            return { class: 'velocity-low', label: '💤 Slow' };
          }
        }
        
        function updateEngagementWindows() {
          const engagementWindows = document.getElementById('engagementWindows');
          if (!engagementWindows) return;
          
          const now = new Date();
          const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
          const currentHour = pstNow.getHours();
          
          // Define optimal engagement windows (PST)
          const windows = [
            { start: 6, end: 9, label: 'Morning Peak (6-9 AM PST)', optimal: currentHour >= 6 && currentHour < 9 },
            { start: 12, end: 14, label: 'Lunch Window (12-2 PM PST)', optimal: currentHour >= 12 && currentHour < 14 },
            { start: 17, end: 19, label: 'Evening Peak (5-7 PM PST)', optimal: currentHour >= 17 && currentHour < 19 }
          ];
          
          let html = '';
          windows.forEach(window => {
            const status = window.optimal ? 'ACTIVE NOW' : 'Upcoming';
            const optimalClass = window.optimal ? 'optimal' : '';
            const statusHtml = window.optimal ? '<div class="ew-status">' + status + '</div>' : '';
            
            html += '<div class="engagement-window ' + optimalClass + '">' +
              '<div class="ew-time">' + window.label + '</div>' +
              '<div class="ew-label">High engagement from US makers & hunters</div>' +
              statusHtml +
              '</div>';
          });
          
          engagementWindows.innerHTML = html;
        }
        
        function updateActionSuggestions(top20) {
          const actionSuggestions = document.getElementById('actionSuggestions');
          if (!actionSuggestions) return;
          
          const now = new Date();
          const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
          const currentHour = pstNow.getHours();
          const hoursRemaining = 24 - currentHour;
          
          let suggestions = [];
          
          // Time-based suggestions
          if (hoursRemaining < 6) {
            suggestions.push({
              type: 'urgent',
              text: '⏰ Only ' + hoursRemaining + ' hours left! Push for final upvotes via Twitter, email lists, and Slack communities.'
            });
          }
          
          if (currentHour >= 6 && currentHour < 9) {
            suggestions.push({
              type: 'opportunity',
              text: '🌅 Peak morning window active! Post on Twitter and LinkedIn now for maximum visibility.'
            });
          }
          
          if (currentHour >= 17 && currentHour < 19) {
            suggestions.push({
              type: 'opportunity',
              text: '🌆 Evening peak active! Engage with commenters and share progress updates on social media.'
            });
          }
          
          // Position-based suggestions
          if (top20.length > 0) {
            const avgUpvotes = top20.reduce((sum, p) => sum + p.votesCount, 0) / top20.length;
            suggestions.push({
              type: 'normal',
              text: '📊 Average upvotes for top 20: ' + Math.round(avgUpvotes) + '. Aim to stay above this benchmark.'
            });
          }
          
          // General suggestions
          suggestions.push({
            type: 'normal',
            text: '💬 Respond to every comment within 10 minutes - engagement drives more visibility.'
          });
          
          suggestions.push({
            type: 'normal',
            text: '🔗 Share your ProductHunt link in your email signature and bio for passive upvotes.'
          });
          
          let html = '';
          suggestions.forEach(sug => {
            const className = sug.type === 'urgent' ? 'urgent' : (sug.type === 'opportunity' ? 'opportunity' : '');
            html += '<div class="action-item ' + className + '">' + sug.text + '</div>';
          });
          
          actionSuggestions.innerHTML = html;
        }
        
        function updateSocialTemplates(top20) {
          const twitterTemplate = document.getElementById('twitterTemplate');
          const linkedinTemplate = document.getElementById('linkedinTemplate');
          const emailTemplate = document.getElementById('emailTemplate');
          
          if (!twitterTemplate || !linkedinTemplate || !emailTemplate) return;
          
          const topProduct = top20[0];
          const productName = topProduct ? topProduct.name : '[Your Product]';
          
          // Twitter template
          twitterTemplate.value = \`🚀 We're live on @ProductHunt today!

\${productName} helps [describe your value proposition in one line].

We'd love your support! 

Check it out and let us know what you think 👇
[Your PH Link]

#ProductHunt #Startup #Launch\`;
          
          // LinkedIn template
          linkedinTemplate.value = \`Exciting news! We just launched \${productName} on ProductHunt! 🚀

After months of hard work, we're thrilled to share [brief description of what your product does and the problem it solves].

What makes us different:
• [Key feature 1]
• [Key feature 2]
• [Key feature 3]

We'd be incredibly grateful for your support! Your upvote and feedback would mean the world to our team.

Check us out: [Your ProductHunt Link]

#ProductHunt #ProductLaunch #Innovation #Startup\`;
          
          // Email template
          emailTemplate.value = \`Subject: We're live on ProductHunt - would love your support! 🚀

Hi [Name],

I wanted to personally reach out because we just launched \${productName} on ProductHunt today!

[Brief personal note about your relationship with the recipient]

We've built [product description] to help [target audience] [solve specific problem].

Your support would mean everything to us. If you have 30 seconds, would you mind:
1. Checking out our launch: [Your PH Link]
2. Leaving an upvote if you find it valuable
3. Sharing any feedback you might have

Thank you so much for being part of our journey!

Best,
[Your Name]\`;
        }
        
        function updateCompetitorAnalysis(top20) {
          const competitorInsights = document.getElementById('competitorInsights');
          if (!competitorInsights) return;
          
          if (top20.length < 3) {
            competitorInsights.innerHTML = '<div class="loading-placeholder">Not enough data for competitor analysis</div>';
            return;
          }
          
          // Show positions 1-5 as key competitors to track
          const competitors = top20.slice(0, 5);
          
          let html = '';
          competitors.forEach((product, index) => {
            const rank = index + 1;
            const nextProduct = top20[index + 1];
            
            if (nextProduct) {
              const gap = product.votesCount - nextProduct.votesCount;
              const catchable = gap <= 50;
              const cardClass = catchable ? 'catchable' : 'out-of-reach';
              const actionClass = catchable ? 'can-catch' : 'monitor';
              const actionText = catchable ? ('💪 Gap: ' + gap + ' upvotes - Catchable!') : ('👀 Gap: ' + gap + ' upvotes - Monitor');
              
              html += '<div class="competitor-card ' + cardClass + '">' +
                '<div class="comp-rank">#' + rank + '</div>' +
                '<div class="comp-name">' + product.name + '</div>' +
                '<div class="comp-gap">▲ ' + product.votesCount + ' upvotes</div>' +
                '<div class="comp-action ' + actionClass + '">' + actionText + '</div>' +
                '</div>';
            } else {
              html += '<div class="competitor-card">' +
                '<div class="comp-rank">#' + rank + '</div>' +
                '<div class="comp-name">' + product.name + '</div>' +
                '<div class="comp-gap">▲ ' + product.votesCount + ' upvotes</div>' +
                '<div class="comp-action can-catch">🏆 Top Position!</div>' +
                '</div>';
            }
          });
          
          competitorInsights.innerHTML = html;
        }
        
        // Load Command Center on-demand
        function loadCommandCenter() {
          if (allProducts.length === 0) {
            alert('Please wait for dashboard data to load first');
            return;
          }
          
          // Track event
          if (typeof gtag === 'function') {
            gtag('event', 'load_command_center', {
              'product_count': allProducts.length
            });
          }
          
          // Hide load button, show content
          document.getElementById('commandCenterLoadButton').style.display = 'none';
          document.getElementById('commandCenterContent').style.display = 'grid';
          document.getElementById('autoRefreshBadge').style.display = 'block';
          
          // Initial load
          updateCommandCenter();
          
          // Start auto-refresh interval if not already running
          if (!commandCenterInterval) {
            commandCenterInterval = setInterval(() => {
              if (allProducts.length > 0) {
                updateCommandCenter();
              }
            }, 30000); // 30 seconds
          }
        }
        
        function copyTemplate(type) {
          let textarea;
          let btnSelector;
          
          if (type === 'twitter') {
            textarea = document.getElementById('twitterTemplate');
            btnSelector = '.template-card:nth-child(1) .copy-btn';
          } else if (type === 'linkedin') {
            textarea = document.getElementById('linkedinTemplate');
            btnSelector = '.template-card:nth-child(2) .copy-btn';
          } else if (type === 'email') {
            textarea = document.getElementById('emailTemplate');
            btnSelector = '.template-card:nth-child(3) .copy-btn';
          }
          
          if (!textarea) return;
          
          textarea.select();
          document.execCommand('copy');
          
          const btn = document.querySelector(btnSelector);
          if (btn) {
            const originalText = btn.innerHTML;
            btn.classList.add('copied');
            btn.innerHTML = '✓ Copied!';
            
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = originalText;
            }, 2000);
          }
        }
        
        function copyTrackTemplate(type) {
          let textarea;
          
          if (type === 'twitter') {
            textarea = document.getElementById('trackTwitterTemplate');
          } else if (type === 'linkedin') {
            textarea = document.getElementById('trackLinkedinTemplate');
          } else if (type === 'email') {
            textarea = document.getElementById('trackEmailTemplate');
          }
          
          if (!textarea) return;
          
          textarea.select();
          document.execCommand('copy');
          
          // Visual feedback on the button that was clicked
          const activeSlide = document.querySelector('.template-slide[style*="display: block"]');
          if (activeSlide) {
            const btn = activeSlide.querySelector('.copy-btn');
            if (btn) {
              const originalText = btn.innerHTML;
              btn.innerHTML = '✓ Copied!';
              btn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
              
              setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = 'linear-gradient(135deg, #DA552F 0%, #F97316 100%)';
              }, 2000);
            }
          }
        }
        
        function switchTemplateSlide(index) {
          // Hide all slides
          const slides = document.querySelectorAll('.template-slide');
          slides.forEach(slide => {
            slide.style.display = 'none';
          });
          
          // Show selected slide
          if (slides[index]) {
            slides[index].style.display = 'block';
          }
          
          // Update dot indicators
          const dots = document.querySelectorAll('.template-dot');
          dots.forEach((dot, i) => {
            if (i === index) {
              dot.style.background = '#DA552F';
              dot.style.borderColor = '#DA552F';
            } else {
              dot.style.background = 'white';
              dot.style.borderColor = '#E5E5E5';
            }
          });
        }
        
        async function trackProductHunt() {
          const urlInput = document.getElementById('productHuntUrl');
          const url = urlInput.value.trim();
          
          if (!url) {
            alert('Please enter a ProductHunt URL');
            return;
          }
          
          // Basic validation
          if (!url.includes('producthunt.com/posts/') && !url.includes('producthunt.com/products/')) {
            alert('Please enter a valid ProductHunt product page URL (e.g., https://www.producthunt.com/posts/your-product)');
            return;
          }
          
          // Show loading state
          const trackBtn = document.querySelector('.track-btn');
          const originalText = trackBtn.textContent;
          trackBtn.textContent = '⏳ Tracking...';
          trackBtn.disabled = true;
          
          try {
            const response = await fetch('/api/track-hunt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
              throw new Error('Failed to track product');
            }
            
            const data = await response.json();
            
            // Store product data for saving
            currentTrackedProduct = data.product;
            
            // Display product summary
            displayProductSummary(data.product);
            
            // Fetch and display AI analysis
            displayAIAnalysis(data.product, data.categoryStats);
            
            // Generate and display templates
            generateTrackTemplates(data.product);
            
            // Display competitor analysis
            displayTrackCompetitorAnalysis(data.product, data.competitors);
            
            // Show sections
            document.getElementById('productSummary').style.display = 'block';
            document.getElementById('aiAnalysisSection').style.display = 'block';
            document.getElementById('trackTemplates').style.display = 'block';
            document.getElementById('trackCompetitorAnalysis').style.display = 'block';
            document.getElementById('trackActionSuggestions').style.display = 'block';
            
            // Scroll to summary
            document.getElementById('productSummary').scrollIntoView({ behavior: 'smooth', block: 'start' });
            
          } catch (error) {
            console.error('Error tracking product:', error);
            alert('Failed to track product. Please check the URL and try again.');
          } finally {
            trackBtn.textContent = originalText;
            trackBtn.disabled = false;
          }
        }
        
        function displayProductSummary(product) {
          const summaryGrid = document.getElementById('summaryGrid');
          
          // Calculate velocity status
          const velocityNum = parseInt(product.velocity) || 0;
          let velocityBadge = '';
          if (velocityNum > 30) {
            velocityBadge = '<span style="background: linear-gradient(135deg, #9333EA 0%, #C026D3 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔥 HOT</span>';
          } else if (velocityNum > 15) {
            velocityBadge = '<span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">📈 Rising</span>';
          } else {
            velocityBadge = '<span style="background: #F3F4F6; color: #6B7280; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #E5E5E5;">💤 Slow</span>';
          }
          
          // Rank badge
          let rankBadge = '';
          if (product.rank <= 3) {
            rankBadge = '<span style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #1A1A1A; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🏆 Top 3</span>';
          } else if (product.rank <= 10) {
            rankBadge = '<span style="background: linear-gradient(135deg, #DA552F 0%, #F97316 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🎯 Top 10</span>';
          }
          
          summaryGrid.innerHTML = \`
            <div style="background: white; border: 2px solid #DA552F; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                <h3 style="color: #1A1A1A; margin: 0; font-size: 22px; font-weight: 700;">\${product.name}</h3>
                \${rankBadge}
                \${velocityBadge}
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-top: 20px;">
                <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 10px;">
                  <div style="font-size: 32px; margin-bottom: 4px;">🏆</div>
                  <div style="font-size: 24px; font-weight: 700; color: #92400E;">#\${product.rank}</div>
                  <div style="font-size: 12px; color: #78350F; font-weight: 600;">Rank</div>
                </div>
                
                <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 10px;">
                  <div style="font-size: 32px; margin-bottom: 4px;">▲</div>
                  <div style="font-size: 24px; font-weight: 700; color: #1E40AF;">\${product.votesCount}</div>
                  <div style="font-size: 12px; color: #1E3A8A; font-weight: 600;">Upvotes</div>
                </div>
                
                <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 10px;">
                  <div style="font-size: 32px; margin-bottom: 4px;">💬</div>
                  <div style="font-size: 24px; font-weight: 700; color: #065F46;">\${product.commentsCount}</div>
                  <div style="font-size: 12px; color: #064E3B; font-weight: 600;">Comments</div>
                </div>
                
                <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%); border-radius: 10px;">
                  <div style="font-size: 32px; margin-bottom: 4px;">⚡</div>
                  <div style="font-size: 24px; font-weight: 700; color: #831843;">\${product.velocity || '—'}</div>
                  <div style="font-size: 12px; color: #831843; font-weight: 600;">upvotes/hr</div>
                </div>
              </div>
              
              <div style="margin-top: 16px; padding: 12px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E5E5;">
                <div style="font-size: 12px; color: #6B7280; font-weight: 600; margin-bottom: 4px;">CATEGORY</div>
                <div style="font-size: 14px; color: #1A1A1A; font-weight: 600;">\${product.category}</div>
              </div>
            </div>
          \`;
        }
        
        async function displayAIAnalysis(product, categoryStats) {
          const analysisContainer = document.getElementById('aiAnalysisContent');
          
          // Show loading state
          analysisContainer.innerHTML = \`
            <div style="text-align: center; padding: 40px;">
              <div style="font-size: 32px; margin-bottom: 12px;">🤖</div>
              <div style="color: #6B7280; font-size: 14px;">AI is analyzing your hunt performance...</div>
            </div>
          \`;
          
          try {
            const response = await fetch('/api/analyze-tracked-hunt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product, categoryStats })
            });
            
            if (!response.ok) {
              throw new Error('Failed to get AI analysis');
            }
            
            const analysis = await response.json();
            
            // Priority badge styling
            const priorityConfig = {
              high: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', icon: '🔴', text: 'High Priority' },
              medium: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', icon: '🟠', text: 'Medium Priority' },
              low: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', icon: '🟢', text: 'Low Priority' }
            };
            
            const priority = priorityConfig[analysis.priority] || priorityConfig.medium;
            
            analysisContainer.innerHTML = \`
              <div style="background: white; border-radius: 12px; padding: 0; overflow: hidden;">
                
                <!-- Priority Banner -->
                <div style="background: \${priority.bg}; color: white; padding: 12px 20px; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px;">
                  <span>\${priority.icon}</span>
                  <span>\${priority.text}</span>
                </div>
                
                <!-- Analysis Content -->
                <div style="padding: 24px;">
                  
                  <!-- Performance Summary -->
                  <div style="margin-bottom: 24px;">
                    <h4 style="color: #1A1A1A; margin: 0 0 12px 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                      📊 Performance Overview
                    </h4>
                    <p style="color: #4B5563; margin: 0; line-height: 1.6; font-size: 14px;">\${analysis.performanceSummary}</p>
                  </div>
                  
                  <!-- Key Insights Grid -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    
                    <!-- Category Analysis -->
                    <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1px solid #C7D2FE; border-radius: 10px; padding: 16px;">
                      <div style="color: #4338CA; font-weight: 700; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        📂 Category Performance
                      </div>
                      <div style="color: #3730A3; font-size: 13px; line-height: 1.5;">\${analysis.categoryAnalysis}</div>
                    </div>
                    
                    <!-- Position Analysis -->
                    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #FDE047; border-radius: 10px; padding: 16px;">
                      <div style="color: #92400E; font-weight: 700; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        🏆 Leaderboard Position
                      </div>
                      <div style="color: #78350F; font-size: 13px; line-height: 1.5;">\${analysis.positionAnalysis}</div>
                    </div>
                    
                  </div>
                  
                  <!-- Strengths & Weaknesses -->
                  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                    <div style="color: #374151; font-weight: 700; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚖️ Strengths & Opportunities
                    </div>
                    <div style="color: #4B5563; font-size: 13px; line-height: 1.6;">\${analysis.strengthsAndWeaknesses}</div>
                  </div>
                  
                  <!-- Action Items -->
                  <div>
                    <h4 style="color: #1A1A1A; margin: 0 0 16px 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                      🎯 Recommended Actions
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      \${analysis.actionItems.map((action, index) => \`
                        <div style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border-left: 4px solid #DA552F; border-radius: 8px; padding: 14px 16px; display: flex; align-items: start; gap: 12px;">
                          <div style="background: #DA552F; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">
                            \${index + 1}
                          </div>
                          <div style="color: #1A1A1A; font-size: 14px; line-height: 1.5; font-weight: 500; flex: 1;">
                            \${action}
                          </div>
                        </div>
                      \`).join('')}
                    </div>
                  </div>
                  
                </div>
              </div>
            \`;
            
          } catch (error) {
            console.error('Error fetching AI analysis:', error);
            analysisContainer.innerHTML = \`
              <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; padding: 16px; text-align: center;">
                <div style="color: #991B1B; font-size: 14px; font-weight: 600; margin-bottom: 4px;">⚠️ Analysis Unavailable</div>
                <div style="color: #B91C1C; font-size: 13px;">Could not generate AI insights. Please try again.</div>
              </div>
            \`;
          }
        }
        
        function generateTrackTemplates(product) {
          const productUrl = product.url || \`https://www.producthunt.com/posts/\${product.slug}\`;
          
          // Twitter template
          const twitterText = \`🚀 Just hunted on @ProductHunt today!

\${product.name} - \${product.tagline}

Currently at #\${product.rank} with \${product.votesCount} upvotes! 🎯

Check it out and show your support: \${productUrl}

#ProductHunt #Startup\`;
          
          // LinkedIn template
          const linkedinText = \`Exciting news! We're live on ProductHunt today! 🚀

\${product.name} is currently ranked #\${product.rank} with \${product.votesCount} upvotes.

\${product.tagline}

We'd love your support and feedback. Check out our hunt here: \${productUrl}

#ProductHunt #ProductLaunch #Startup\`;
          
          // Email template
          const emailText = \`Subject: We're Live on ProductHunt! 🚀

Hi there,

I'm excited to share that \${product.name} is live on ProductHunt today!

We're currently at #\${product.rank} with \${product.votesCount} upvotes and would love your support.

\${product.tagline}

Check it out here: \${productUrl}

Your upvote and feedback would mean the world to us!

Best regards\`;
          
          document.getElementById('trackTwitterTemplate').value = twitterText;
          document.getElementById('trackLinkedinTemplate').value = linkedinText;
          document.getElementById('trackEmailTemplate').value = emailText;
        }
        
        function displayTrackCompetitorAnalysis(product, competitors) {
          const insights = document.getElementById('trackCompetitorInsights');
          
          if (!competitors || competitors.length === 0) {
            insights.innerHTML = '<div class="loading-placeholder">No competitor data available</div>';
            return;
          }
          
          let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
          const productRank = product.rank;
          
          // Show products around the tracked product
          competitors.forEach((comp, index) => {
            const rank = comp.rank;
            const gap = Math.abs(comp.votesCount - product.votesCount);
            const isAbove = comp.rank < productRank;
            const isSameProduct = comp.name === product.name;
            
            // Calculate velocity for competitor
            const compVelocity = comp.velocity || '—';
            let velocityIcon = '💤';
            let velocityColor = '#6B7280';
            if (comp.velocity > 30) {
              velocityIcon = '🔥';
              velocityColor = '#9333EA';
            } else if (comp.velocity > 15) {
              velocityIcon = '📈';
              velocityColor = '#F97316';
            }
            
            let borderColor = '#E5E5E5';
            let bgColor = '#FFFFFF';
            let actionBadge = '';
            
            if (isSameProduct) {
              borderColor = '#DA552F';
              bgColor = '#FFF7ED';
              actionBadge = '<div style="background: linear-gradient(135deg, #DA552F 0%, #F97316 100%); color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block;">👉 YOUR PRODUCT</div>';
            } else if (isAbove) {
              if (gap <= 50) {
                borderColor = '#10B981';
                actionBadge = '<div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block;">🎯 Catchable - Gap: ' + gap + '</div>';
              } else {
                actionBadge = '<div style="background: #F3F4F6; color: #6B7280; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block; border: 1px solid #E5E5E5;">Keep Pushing - Gap: ' + gap + '</div>';
              }
            } else {
              borderColor = '#93C5FD';
              bgColor = '#EFF6FF';
              actionBadge = '<div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block;">✅ Leading by ' + gap + '</div>';
            }
            
            html += \`
              <div style="border: 2px solid \${borderColor}; background: \${bgColor}; border-radius: 10px; padding: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #92400E;">
                      #\${rank}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: #1A1A1A; font-size: 15px; margin-bottom: 2px;">\${comp.name}</div>
                      <div style="font-size: 12px; color: #666;">\${comp.category || 'General'}</div>
                    </div>
                  </div>
                  \${actionBadge}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                  <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 8px;">
                    <div style="font-size: 18px; font-weight: 700; color: #1E40AF;">▲ \${comp.votesCount}</div>
                    <div style="font-size: 10px; color: #1E3A8A; font-weight: 600;">Upvotes</div>
                  </div>
                  <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 8px;">
                    <div style="font-size: 18px; font-weight: 700; color: #065F46;">💬 \${comp.commentsCount || 0}</div>
                    <div style="font-size: 10px; color: #064E3B; font-weight: 600;">Comments</div>
                  </div>
                  <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%); border-radius: 8px;">
                    <div style="font-size: 18px; font-weight: 700; color: \${velocityColor};">\${velocityIcon} \${compVelocity}</div>
                    <div style="font-size: 10px; color: #831843; font-weight: 600;">per hour</div>
                  </div>
                </div>
              </div>
            \`;
          });
          
          html += '</div>';
          insights.innerHTML = html;
        }
        
        function updateCategoryFilter() {
          const categories = new Set(allProducts.flatMap(p => p.allCategories));
          const appCategory = document.getElementById('appCategory');
          const currentAppValue = appCategory.value;
          
          appCategory.innerHTML = '<option value="">Select a category</option>';
          
          Array.from(categories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            appCategory.appendChild(option);
          });
          
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
                backgroundColor: 'rgba(218, 85, 47, 0.7)',
                borderColor: '#DA552F',
                borderWidth: 1,
                borderRadius: 4
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
                backgroundColor: 'rgba(218, 85, 47, 0.7)',
                borderColor: '#DA552F',
                borderWidth: 1,
                borderRadius: 4
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
        async function analyzeUserLaunch() {
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
          
          // Show loading state
          const resultsDiv = document.getElementById('analysisResults');
          const scoreDiv = document.getElementById('userScore');
          const labelDiv = document.getElementById('userScoreLabel');
          const insightsDiv = document.getElementById('userInsights');
          
          resultsDiv.classList.add('show');
          scoreDiv.textContent = '...';
          scoreDiv.className = 'result-score';
          labelDiv.textContent = '🤖 AI is analyzing your hunt strategy...';
          insightsDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Analyzing with AI... This may take a few seconds.</div>';
          resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          try {
            // Call AI endpoint with dashboard data for context
            const response = await fetch('/api/analyze-hunt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appName,
                category,
                tagline,
                plannedDay,
                plannedTime,
                dashboardData: allProducts.slice(0, 20) // Send recent products for context
              })
            });
            
            if (!response.ok) {
              throw new Error('AI analysis failed');
            }
            
            const analysis = await response.json();
            
            // Store analysis data for saving
            currentAnalysisData = {
              appName,
              category,
              tagline,
              score: analysis.score || 0,
              scoreLabel: analysis.scoreLabel || 'Analysis Complete',
              insights: analysis.insights || []
            };
            
            // Display AI analysis results
            scoreDiv.textContent = analysis.score || 0;
            scoreDiv.className = 'result-score ' + 
              (analysis.score >= 75 ? 'high' : analysis.score >= 50 ? 'medium' : 'low');
            
            labelDiv.textContent = analysis.scoreLabel || 'Analysis Complete';
            
            // Render AI-generated insights
            insightsDiv.innerHTML = analysis.insights.map(insight => \`
              <div class="insight-item">
                <div class="insight-label">\${insight.label}</div>
                <div class="insight-value">\${insight.value}</div>
                <div class="insight-recommendation">\${insight.recommendation}</div>
                <span class="insight-status \${insight.status}">\${insight.statusText}</span>
              </div>
            \`).join('');
            
            // Track hunt analysis
            if (typeof gtag === 'function') {
              gtag('event', 'analyze_hunt_ai', {
                'category': category,
                'score': analysis.score,
                'has_planned_day': plannedDay ? 1 : 0,
                'has_planned_time': plannedTime ? 1 : 0
              });
            }
            
          } catch (error) {
            console.error('AI Analysis Error:', error);
            scoreDiv.textContent = '!';
            scoreDiv.className = 'result-score low';
            labelDiv.textContent = '❌ AI analysis failed';
            insightsDiv.innerHTML = \`
              <div style="text-align: center; padding: 40px; color: #da552f;">
                <p>Unable to analyze your hunt. Please try again.</p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">Error: \${error.message}</p>
              </div>
            \`;
          }
        }
        
        async function generateLaunchAssets() {
          // Get form values
          const appName = document.getElementById('appName').value.trim();
          const category = document.getElementById('appCategory').value;
          const keyFeatures = document.getElementById('appTagline').value.trim();
          const targetAudience = document.getElementById('targetAudience').value.trim();
          
          // Validation
          if (!appName || !category || !keyFeatures) {
            alert('Please fill in all required fields (App Name, Category, and Tagline/Key Features)');
            return;
          }
          
          // Show loading state
          const resultsDiv = document.getElementById('assetsResults');
          const assetsDiv = document.getElementById('generatedAssets');
          
          resultsDiv.classList.add('show');
          assetsDiv.innerHTML = '<div style="text-align: center; padding: 60px; color: #666;"><div style="font-size: 48px; margin-bottom: 20px;">🤖</div><div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">AI is crafting your hunt assets...</div><div style="font-size: 14px; color: #999;">This may take 10-15 seconds</div></div>';
          resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          try {
            // Call AI endpoint
            const response = await fetch('/api/generate-assets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appName,
                category,
                keyFeatures,
                targetAudience
              })
            });
            
            if (!response.ok) {
              throw new Error('AI generation failed');
            }
            
            const result = await response.json();
            const assets = result.assets || [];
            
            // Display AI-generated assets
            assetsDiv.innerHTML = assets.map((asset, index) => \`
              <div class="asset-card">
                <div class="asset-header">
                  <div class="asset-title">\${asset.title}</div>
                  <button class="copy-btn" onclick="copyToClipboard(event, \${index}, 'asset-content-\${index}')">
                    📋 Copy
                  </button>
                </div>
                <div class="asset-content" id="asset-content-\${index}">\${asset.content}</div>
                <div class="asset-meta">\${asset.meta}</div>
              </div>
            \`).join('');
            
            // Track asset generation
            if (typeof gtag === 'function') {
              gtag('event', 'generate_assets_ai', {
                'category': category,
                'assets_count': assets.length,
                'has_target_audience': targetAudience ? 1 : 0
              });
            }
            
          } catch (error) {
            console.error('AI Asset Generation Error:', error);
            assetsDiv.innerHTML = \`
              <div style="text-align: center; padding: 60px; color: #da552f;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">AI generation failed</div>
                <div style="font-size: 14px; color: #666;">Error: \${error.message}</div>
                <div style="font-size: 14px; color: #999; margin-top: 15px;">Please try again or check your OpenAI API key.</div>
              </div>
            \`;
          }
        }
        
        function copyToClipboard(event, index, elementId) {
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
        
        // Feedback modal functions
        function openFeedbackModal() {
          document.getElementById('feedbackModal').classList.add('show');
          
          // Track feedback modal open
          if (typeof gtag === 'function') {
            gtag('event', 'open_feedback_modal', {
              'event_category': 'engagement'
            });
          }
        }
        
        function closeFeedbackModal() {
          document.getElementById('feedbackModal').classList.remove('show');
        }
        
        // Authentication Functions
        let currentUser = null;
        
        function openAuthModal(tab = 'login') {
          document.getElementById('authModal').classList.add('show');
          switchAuthTab(tab);
        }
        
        function closeAuthModal() {
          document.getElementById('authModal').classList.remove('show');
          clearAuthErrors();
        }
        
        function switchAuthTab(tab) {
          const loginTab = document.getElementById('loginTab');
          const registerTab = document.getElementById('registerTab');
          const loginContent = document.getElementById('loginContent');
          const registerContent = document.getElementById('registerContent');
          
          if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginContent.classList.add('active');
            registerContent.classList.remove('active');
          } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerContent.classList.add('active');
            loginContent.classList.remove('active');
          }
          
          clearAuthErrors();
        }
        
        function clearAuthErrors() {
          document.getElementById('loginError').classList.remove('show');
          document.getElementById('loginSuccess').classList.remove('show');
          document.getElementById('registerError').classList.remove('show');
          document.getElementById('registerSuccess').classList.remove('show');
        }
        
        function showAuthError(type, message) {
          const errorEl = document.getElementById(type + 'Error');
          errorEl.textContent = message;
          errorEl.classList.add('show');
        }
        
        function showAuthSuccess(type, message) {
          const successEl = document.getElementById(type + 'Success');
          successEl.textContent = message;
          successEl.classList.add('show');
        }
        
        async function checkAuth() {
          try {
            const response = await fetch('/api/auth/user', {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              currentUser = data.user;
              updateUIForAuthState(true);
            } else {
              currentUser = null;
              updateUIForAuthState(false);
            }
          } catch (error) {
            console.error('Auth check error:', error);
            currentUser = null;
            updateUIForAuthState(false);
          }
        }
        
        function updateUIForAuthState(isLoggedIn) {
          const authButtons = document.getElementById('authButtons');
          const userInfo = document.getElementById('userInfo');
          const trackedHuntsCard = document.getElementById('trackedHuntsCard');
          const authNavLinks = document.querySelectorAll('.nav-link-auth, .mobile-nav-link-auth');
          
          if (isLoggedIn && currentUser) {
            authButtons.style.display = 'none';
            userInfo.style.display = 'flex';
            document.getElementById('userEmail').textContent = currentUser.email;
            trackedHuntsCard.classList.add('show');
            authNavLinks.forEach(link => link.style.display = 'block');
            loadTrackedHunts();
          } else {
            authButtons.style.display = 'flex';
            userInfo.style.display = 'none';
            trackedHuntsCard.classList.remove('show');
            authNavLinks.forEach(link => link.style.display = 'none');
          }
        }
        
        async function handleLogin(event) {
          event.preventDefault();
          clearAuthErrors();
          
          const email = document.getElementById('loginEmail').value;
          const password = document.getElementById('loginPassword').value;
          const loginBtn = document.getElementById('loginBtn');
          
          loginBtn.disabled = true;
          loginBtn.textContent = 'Logging in...';
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              showAuthSuccess('login', 'Login successful!');
              currentUser = data.user;
              setTimeout(() => {
                closeAuthModal();
                updateUIForAuthState(true);
                event.target.reset();
              }, 1000);
            } else {
              showAuthError('login', data.error || 'Login failed. Please try again.');
            }
          } catch (error) {
            console.error('Login error:', error);
            showAuthError('login', 'An error occurred. Please try again.');
          } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
          }
        }
        
        async function handleRegister(event) {
          event.preventDefault();
          clearAuthErrors();
          
          const name = document.getElementById('registerName').value;
          const email = document.getElementById('registerEmail').value;
          const password = document.getElementById('registerPassword').value;
          const registerBtn = document.getElementById('registerBtn');
          
          registerBtn.disabled = true;
          registerBtn.textContent = 'Creating Account...';
          
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              showAuthSuccess('register', 'Account created successfully!');
              currentUser = data.user;
              setTimeout(() => {
                closeAuthModal();
                updateUIForAuthState(true);
                event.target.reset();
              }, 1000);
            } else {
              showAuthError('register', data.error || 'Registration failed. Please try again.');
            }
          } catch (error) {
            console.error('Register error:', error);
            showAuthError('register', 'An error occurred. Please try again.');
          } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Create Account';
          }
        }
        
        async function handleLogout() {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
            });
            
            if (response.ok) {
              currentUser = null;
              updateUIForAuthState(false);
            }
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        // Store current tracked product data
        let currentTrackedProduct = null;
        let currentAnalysisData = null;
        
        // Save Hunt from Tracker Section
        async function saveHuntFromTracker() {
          if (!currentUser) {
            openAuthModal('login');
            alert('Please login to save hunts to your tracked list');
            return;
          }
          
          if (!currentTrackedProduct) {
            alert('No product data available to save');
            return;
          }
          
          const btn = document.getElementById('saveHuntTrackerBtn');
          const originalText = btn.innerHTML;
          
          btn.classList.add('saving');
          btn.innerHTML = '⏳ Saving...';
          btn.disabled = true;
          
          try {
            const response = await fetch('/api/hunts/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                slug: currentTrackedProduct.slug,
                name: currentTrackedProduct.name,
                url: currentTrackedProduct.url,
                tagline: currentTrackedProduct.tagline || '',
                category: currentTrackedProduct.category || 'Uncategorized',
                rank: currentTrackedProduct.rank || 0,
                upvotes: currentTrackedProduct.votesCount || 0
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              btn.classList.remove('saving');
              btn.innerHTML = '✅ Saved!';
              loadTrackedHunts();
              
              if (typeof gtag === 'function') {
                gtag('event', 'save_hunt_from_tracker', {
                  'product_name': currentTrackedProduct.name
                });
              }
            } else {
              throw new Error(data.error || 'Failed to save hunt');
            }
          } catch (error) {
            console.error('Error saving hunt:', error);
            alert('Failed to save hunt: ' + error.message);
            btn.classList.remove('saving');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        }
        
        // Save Hunt from Leaderboard
        async function saveHuntFromLeaderboard(productIndex) {
          if (!currentUser) {
            openAuthModal('login');
            alert('Please login to save hunts to your tracked list');
            return;
          }
          
          const product = leaderboardProducts[productIndex];
          if (!product) {
            alert('Product data not found');
            return;
          }
          
          const rank = productIndex + 1;
          const btn = document.getElementById('track-lb-' + rank);
          if (!btn) return;
          
          const originalText = btn.innerHTML;
          
          btn.classList.add('saving');
          btn.innerHTML = '⏳';
          btn.disabled = true;
          
          try {
            const response = await fetch('/api/hunts/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                slug: product.slug || '',
                name: product.name,
                url: product.url || '',
                tagline: product.tagline || '',
                category: product.category || 'Uncategorized',
                rank: rank,
                upvotes: product.votesCount || 0
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              btn.classList.remove('saving');
              btn.innerHTML = '✅';
              loadTrackedHunts();
              
              if (typeof gtag === 'function') {
                gtag('event', 'save_hunt_from_leaderboard', {
                  'product_name': product.name,
                  'rank': rank
                });
              }
            } else {
              throw new Error(data.error || 'Failed to save hunt');
            }
          } catch (error) {
            console.error('Error saving hunt:', error);
            alert('Failed to save hunt: ' + error.message);
            btn.classList.remove('saving');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        }
        
        // Save Analysis
        async function saveAnalysis() {
          if (!currentUser) {
            openAuthModal('login');
            alert('Please login to save your analysis');
            return;
          }
          
          if (!currentAnalysisData) {
            alert('No analysis data available to save');
            return;
          }
          
          const btn = document.getElementById('saveAnalysisBtn');
          const originalText = btn.innerHTML;
          
          btn.classList.add('saving');
          btn.innerHTML = '⏳ Saving...';
          btn.disabled = true;
          
          try {
            const response = await fetch('/api/analyses/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(currentAnalysisData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
              btn.classList.remove('saving');
              btn.innerHTML = '✅ Saved!';
              
              if (typeof gtag === 'function') {
                gtag('event', 'save_analysis', {
                  'app_name': currentAnalysisData.appName,
                  'score': currentAnalysisData.score
                });
              }
            } else {
              throw new Error(data.error || 'Failed to save analysis');
            }
          } catch (error) {
            console.error('Error saving analysis:', error);
            alert('Failed to save analysis: ' + error.message);
            btn.classList.remove('saving');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        }
        
        // Tracked Hunts Functions
        async function loadTrackedHunts() {
          try {
            const response = await fetch('/api/hunts/tracked', {
              credentials: 'include'
            });
            
            if (response.ok) {
              const hunts = await response.json();
              displayTrackedHunts(Array.isArray(hunts) ? hunts : []);
            } else {
              console.error('Failed to load tracked hunts');
              displayTrackedHunts([]);
            }
          } catch (error) {
            console.error('Error loading tracked hunts:', error);
            displayTrackedHunts([]);
          }
        }
        
        function displayTrackedHunts(hunts) {
          const listEl = document.getElementById('trackedHuntsList');
          
          if (!hunts || hunts.length === 0) {
            listEl.innerHTML = \`
              <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div class="empty-state-text">No hunts tracked yet. Use "Track My Hunt" above to start tracking!</div>
              </div>
            \`;
            return;
          }
          
          listEl.innerHTML = hunts.map(hunt => {
            const velocity = calculateVelocity(hunt);
            return \`
              <div class="tracked-hunt-item">
                <div class="tracked-hunt-info">
                  <div class="tracked-hunt-name">\${hunt.product_name}</div>
                  <div class="tracked-hunt-stats">
                    <div class="tracked-hunt-stat">
                      <span>Rank:</span>
                      <strong>#\${hunt.current_rank || 'N/A'}</strong>
                    </div>
                    <div class="tracked-hunt-stat">
                      <span>Upvotes:</span>
                      <strong>\${hunt.current_upvotes || 0}</strong>
                    </div>
                    <div class="tracked-hunt-stat">
                      <span>Velocity:</span>
                      <strong>\${velocity}</strong>
                    </div>
                  </div>
                </div>
                <button class="btn-remove" onclick="removeTrackedHunt(\${hunt.id})">Remove</button>
              </div>
            \`;
          }).join('');
        }
        
        function calculateVelocity(hunt) {
          if (!hunt.current_upvotes || !hunt.tracked_at) return 'N/A';
          
          const trackedDate = new Date(hunt.tracked_at);
          const now = new Date();
          const hoursPassed = (now - trackedDate) / (1000 * 60 * 60);
          
          if (hoursPassed < 1) return 'New';
          
          const upvotesPerHour = Math.round(hunt.current_upvotes / hoursPassed);
          return \`\${upvotesPerHour}/hr\`;
        }
        
        async function removeTrackedHunt(huntId) {
          if (!confirm('Are you sure you want to remove this tracked hunt?')) {
            return;
          }
          
          try {
            const response = await fetch(\`/api/hunts/\${huntId}\`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              loadTrackedHunts();
            } else {
              alert('Failed to remove tracked hunt');
            }
          } catch (error) {
            console.error('Error removing tracked hunt:', error);
            alert('An error occurred. Please try again.');
          }
        }
        
        // Initialize on page load
        checkAuth();
        loadDashboardData();
      </script>
    </body>
    </html>
  `);
});

// ========== Authentication API Routes ==========

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await register(email, password, name);
    req.session.userId = user.id;
    
    res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error.message || 'Registration failed' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await login(email, password);
    req.session.userId = user.id;
    
    res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: error.message || 'Login failed' 
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/auth/user', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// ========== Protected Hunt Tracking Routes ==========

// Save/track a hunt
app.post('/api/hunts/track', requireAuth, async (req, res) => {
  try {
    const { slug, name, url, tagline, category, rank, upvotes } = req.body;
    
    if (!slug || !name || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const hunt = await trackedHunts.create(req.session.userId, {
      slug, name, url, tagline, category, rank, upvotes
    });
    
    res.json({ success: true, hunt });
  } catch (error) {
    console.error('Error tracking hunt:', error);
    res.status(500).json({ error: 'Failed to track hunt' });
  }
});

// Get user's tracked hunts
app.get('/api/hunts/tracked', requireAuth, async (req, res) => {
  try {
    const hunts = await trackedHunts.getByUserId(req.session.userId);
    res.json(hunts);
  } catch (error) {
    console.error('Error fetching tracked hunts:', error);
    res.status(500).json({ error: 'Failed to fetch tracked hunts' });
  }
});

// Remove tracked hunt
app.delete('/api/hunts/:id', requireAuth, async (req, res) => {
  try {
    const hunt = await trackedHunts.delete(req.params.id, req.session.userId);
    if (!hunt) {
      return res.status(404).json({ error: 'Hunt not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing hunt:', error);
    res.status(500).json({ error: 'Failed to remove hunt' });
  }
});

// Save an AI analysis
app.post('/api/analyses/save', requireAuth, async (req, res) => {
  try {
    const { appName, category, tagline, score, scoreLabel, insights } = req.body;
    
    if (!appName || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const analysis = await savedAnalyses.create(req.session.userId, {
      appName, category, tagline, score, scoreLabel, insights
    });
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

// Get user's saved analyses
app.get('/api/analyses/saved', requireAuth, async (req, res) => {
  try {
    const analyses = await savedAnalyses.getByUserId(req.session.userId);
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
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

// AI-powered hunt analysis endpoint
app.post('/api/analyze-hunt', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY in environment variables'
      });
    }

    const { appName, category, tagline, plannedDay, plannedTime, dashboardData } = req.body;

    if (!appName || !category || !tagline) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'appName, category, and tagline are required'
      });
    }

    // Prepare context from dashboard data for AI
    const contextData = dashboardData ? JSON.stringify(dashboardData).substring(0, 3000) : 'No data available';

    const prompt = `You are a ProductHunt launch expert analyzing a product launch strategy. Based on real ProductHunt data and best practices, provide a comprehensive analysis.

Product Details:
- Name: ${appName}
- Category: ${category}
- Tagline: ${tagline}
- Planned Day: ${plannedDay || 'Not specified'}
- Planned Time: ${plannedTime || 'Not specified'}

ProductHunt Data Context (recent products):
${contextData}

Provide a detailed analysis with:
1. Overall launch readiness score (0-100)
2. Tagline analysis (length, clarity, impact)
3. Category competitiveness and recommendations
4. Optimal day/time recommendations
5. Specific actionable improvements

Respond in JSON format with this structure:
{
  "score": number (0-100),
  "scoreLabel": "Excellent/Good/Needs Improvement",
  "insights": [
    {
      "label": "Tagline Analysis",
      "value": "current value",
      "recommendation": "detailed recommendation",
      "status": "good/warning/bad",
      "statusText": "status description"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content: "You are an expert ProductHunt launch strategist with deep knowledge of what makes products successful on ProductHunt."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json(analysis);

  } catch (error) {
    console.error('Error in AI hunt analysis:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message
    });
  }
});

// AI-powered hunt assets generation endpoint
app.post('/api/generate-assets', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY in environment variables'
      });
    }

    const { appName, category, keyFeatures, targetAudience } = req.body;

    if (!appName || !category || !keyFeatures) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'appName, category, and keyFeatures are required'
      });
    }

    const prompt = `You are a professional ProductHunt copywriter who has helped launch dozens of successful products, including Golden Kitty Award winners.

Create compelling ProductHunt launch assets for:
- Product Name: ${appName}
- Category: ${category}
- Key Features: ${keyFeatures}
- Target Audience: ${targetAudience || 'General users'}

Generate the following assets based on proven patterns from top ProductHunt launches:

1. **Optimized Tagline** (under 60 characters, punchy, benefit-driven)
2. **Product Description** (2-3 paragraphs, problem-solution-benefits format)
3. **First Comment** (Maker introduction - warm, personal, includes problem statement, solution overview, key benefits, exclusive offer for PH community)
4. **Social Media Post** (Twitter/X optimized, engaging, call-to-action)
5. **Launch Day Tips** (Category-specific timing, engagement strategies, benchmarks)

Respond in JSON format:
{
  "assets": [
    {
      "title": "💡 Optimized Tagline",
      "content": "the tagline text",
      "meta": "insight about why this tagline works"
    },
    {
      "title": "📄 Product Description", 
      "content": "the description text",
      "meta": "best practices used"
    },
    {
      "title": "👋 First Comment (Maker Introduction)",
      "content": "the first comment text",
      "meta": "engagement tips"
    },
    {
      "title": "⤴ Social Media Post Template",
      "content": "the social post text",
      "meta": "platform recommendations"
    },
    {
      "title": "🎯 Hunt Day Success Tips",
      "content": "actionable launch day tips",
      "meta": "timing and strategy insights"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content: "You are an expert ProductHunt copywriter and launch strategist. You understand what makes products go viral on ProductHunt and how to craft compelling copy that converts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error('Error in AI asset generation:', error);
    res.status(500).json({
      error: 'AI generation failed',
      message: error.message
    });
  }
});

// Track hunt endpoint - parse PH URL and return product data
app.post('/api/track-hunt', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('producthunt.com')) {
      return res.status(400).json({ error: 'Invalid ProductHunt URL' });
    }
    
    // Extract product slug from URL - handle both /posts/ and /products/ formats
    let slug = null;
    if (url.includes('/posts/')) {
      const urlParts = url.split('/posts/');
      slug = urlParts[1].split('?')[0].split('/')[0].trim();
    } else if (url.includes('/products/')) {
      const urlParts = url.split('/products/');
      slug = urlParts[1].split('?')[0].split('/')[0].trim();
    }
    
    if (!slug) {
      return res.status(400).json({ error: 'Could not extract product slug from URL' });
    }
    
    // Fetch today's products (no order parameter fetches today's posts by default)
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + PH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          query {
            posts(first: 50) {
              edges {
                node {
                  id
                  name
                  tagline
                  slug
                  votesCount
                  commentsCount
                  createdAt
                  url
                  topics {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `
      })
    });
    
    if (!response.ok) {
      throw new Error('ProductHunt API request failed');
    }
    
    const data = await response.json();
    
    // Check if we have data
    if (!data || !data.data || !data.data.posts || !data.data.posts.edges) {
      console.error('Unexpected API response structure:', data);
      return res.status(500).json({ 
        error: 'Invalid response from ProductHunt API',
        details: data && data.errors ? data.errors : 'No data returned'
      });
    }
    
    const products = data.data.posts.edges.map((edge, index) => {
      const topics = edge.node.topics.edges.map(t => t.node.name);
      return {
        ...edge.node,
        rank: index + 1,
        category: topics[0] || 'General',
        allCategories: topics
      };
    });
    
    // Find the tracked product - match against URL since PH URLs use different slugs than the slug field
    const trackedProduct = products.find(p => {
      // Check if the URL contains the slug we extracted
      return p.url.includes(`/posts/${slug}`) || p.url.includes(`/products/${slug}`);
    });
    
    if (!trackedProduct) {
      return res.status(404).json({ 
        error: "Product not found in today's hunts. Make sure the product was hunted today." 
      });
    }
    
    // Calculate velocity
    const createdAt = new Date(trackedProduct.createdAt);
    const currentTime = new Date();
    const hoursLive = (currentTime - createdAt) / (1000 * 60 * 60);
    const velocity = hoursLive > 0 ? Math.round(trackedProduct.votesCount / hoursLive) : 0;
    trackedProduct.velocity = velocity + '/hr';
    
    // Get competitors (products around it)
    const rank = trackedProduct.rank;
    const startIndex = Math.max(0, rank - 4);
    const endIndex = Math.min(products.length, rank + 3);
    const competitors = products.slice(startIndex, endIndex);
    
    // Calculate category stats
    const categoryProducts = products.filter(p => p.category === trackedProduct.category);
    const categoryLeader = categoryProducts[0]; // First in category
    const categoryAvgUpvotes = categoryProducts.reduce((sum, p) => sum + p.votesCount, 0) / categoryProducts.length;
    
    res.json({
      product: trackedProduct,
      competitors: competitors,
      categoryStats: {
        categoryName: trackedProduct.category,
        categoryLeader: categoryLeader,
        categoryAvgUpvotes: Math.round(categoryAvgUpvotes),
        productsInCategory: categoryProducts.length,
        productsInCategoryTotal: categoryProducts.length,
        top3Products: products.slice(0, 3),
        totalProducts: products.length
      }
    });
    
  } catch (error) {
    console.error('Error tracking hunt:', error);
    res.status(500).json({ error: 'Failed to track product' });
  }
});

// AI Analysis for tracked hunt
app.post('/api/analyze-tracked-hunt', async (req, res) => {
  try {
    const { product, categoryStats } = req.body;
    
    if (!product || !categoryStats) {
      return res.status(400).json({ error: 'Product and category stats required' });
    }
    
    // Build context for AI
    const prompt = `Analyze this ProductHunt product's performance and provide concise, actionable insights.

PRODUCT DATA:
- Name: ${product.name}
- Rank: #${product.rank} overall (out of ${categoryStats.totalProducts} products)
- Upvotes: ${product.votesCount}
- Comments: ${product.commentsCount}
- Category: ${product.category}
- Velocity: ${product.velocity}
- Tagline: ${product.tagline}

CATEGORY CONTEXT:
- Category: ${categoryStats.categoryName}
- Category Average Upvotes: ${categoryStats.categoryAvgUpvotes}
- Category Leader: ${categoryStats.categoryLeader ? `${categoryStats.categoryLeader.name} (#${categoryStats.categoryLeader.rank} overall, ${categoryStats.categoryLeader.votesCount} upvotes)` : 'N/A'}
- Total Products in Category: ${categoryStats.productsInCategory}
- Product's Performance vs Category Average: ${product.votesCount > categoryStats.categoryAvgUpvotes ? `${product.votesCount - categoryStats.categoryAvgUpvotes} upvotes above average` : `${categoryStats.categoryAvgUpvotes - product.votesCount} upvotes below average`}

LEADERBOARD CONTEXT:
- Top 3 Products Overall: ${categoryStats.top3Products.map(p => `#${p.rank} ${p.name} (${p.votesCount} upvotes)`).join(', ')}
- Total Products Today: ${categoryStats.totalProducts}

Provide a professional analysis in JSON format:

{
  "performanceSummary": "2-3 sentence concise summary of overall performance",
  "categoryAnalysis": "How this product performs vs category average and leader",
  "positionAnalysis": "Analysis of overall leaderboard position and competitiveness",
  "strengthsAndWeaknesses": "Key strengths and areas for improvement",
  "actionItems": [
    "Specific action 1 with clear direction",
    "Specific action 2 with clear direction",
    "Specific action 3 with clear direction"
  ],
  "priority": "high|medium|low - urgency of taking action"
}

Make the analysis:
- Professional and data-driven
- Concise but complete
- Action items should be specific, time-sensitive, and easy to follow
- Focus on what the maker can do RIGHT NOW to improve their hunt`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert ProductHunt strategist who provides data-driven insights and actionable recommendations for makers. You understand what drives success on ProductHunt and can identify opportunities for improvement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json(analysis);

  } catch (error) {
    console.error('Error in AI track analysis:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();
    console.log('✓ Database initialized successfully');
    
    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 ProductHunt proxy server running on port ${PORT}`);
      console.log(`API endpoint: /api/producthunt`);
      console.log(`Dashboard endpoint: /api/dashboard-data`);
      console.log(`AI Hunt Analysis: /api/analyze-hunt`);
      console.log(`AI Asset Generation: /api/generate-assets`);
      console.log(`Track Hunt: /api/track-hunt`);
      console.log(`\n✓ Authentication enabled`);
      console.log(`✓ Session management active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();