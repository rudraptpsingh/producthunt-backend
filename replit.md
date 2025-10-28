# ProductHunt Analytics Dashboard

## Overview
A comprehensive ProductHunt analytics platform featuring real-time insights, trends visualization, and an AI-powered Launch Score Predictor to help founders maximize their ProductHunt launch success.

## Project Architecture
- **Language**: Node.js (CommonJS)
- **Framework**: Express.js
- **Port**: 5000 (Replit standard)
- **Host**: 0.0.0.0 (to allow Replit proxy access)
- **Design**: ProductHunt-inspired professional UI with signature orange branding

## Dependencies
- express: Web server framework
- cors: Enable CORS for frontend access
- node-fetch: HTTP client for API requests

## Key Features

### 🎯 Launch Score Predictor (MVP Feature)
AI-powered predictive scoring system that analyzes ProductHunt data to provide actionable launch insights:
- **Launch Score (0-100)**: Weighted algorithm analyzing multiple factors
  - Category Hotness (35% weight): Recent performance and trend analysis
  - Best Day Alignment (25% weight): Optimal launch day based on historical data
  - Best Time Alignment (20% weight): Peak engagement hours
  - Competition Level (20% weight): Category saturation analysis
- **Real-time Recommendations**: 
  - Hottest categories with trend indicators (🔥 HOT, 🌤️ WARM, ❄️ COOL)
  - Best launch day with expected performance boost
  - Optimal launch time for maximum visibility
  - Competition assessment with actionable insights
- **Dynamic Updates**: Automatically recalculates when users filter by category
- **Visual Design**: Purple gradient hero card with color-coded scores
  - Green (75-100): Excellent Launch Potential
  - Orange (50-74): Good Launch Opportunity
  - Red (<50): Consider Optimizing

### 📊 Analytics Dashboard
- **Summary Statistics**: Products, Total Upvotes, Categories
- **Search & Filters**: Real-time product search and category filtering
- **Chart Visualizations** (Chart.js):
  - Top Categories by Product Count (Bar Chart)
  - Category Distribution (Pie Chart)
  - Launch Activity Over Time (Line Chart)
  - Average Upvotes by Category (Bar Chart)
- **Product Cards**: Clean ProductHunt-style cards with click-to-view functionality

### 🎨 Design System
- **Color Palette**:
  - Primary: ProductHunt Orange (#DA552F)
  - Background: Clean beige (#f6f5f4)
  - Cards: White with subtle borders (#e8e7e6)
  - Predictor: Purple gradient (667eea to 764ba2)
- **Typography**: Inter font family
- **Components**: Card-based layouts, glassmorphism effects, smooth transitions
- **Responsive**: Mobile-optimized with breakpoints

## API Endpoints

### POST /api/producthunt
- Accepts GraphQL queries in request body
- Proxies requests to ProductHunt API
- Returns GraphQL response data

### GET /api/dashboard-data
- Fetches comprehensive ProductHunt data (20 posts with metadata)
- Returns processed data for dashboard consumption
- Includes: name, tagline, votesCount, commentsCount, url, createdAt, categories

### GET /
- Serves the main analytics dashboard (homepage)
- Full-featured SPA with all analytics and predictor functionality

## Environment Variables
- `PH_TOKEN`: ProductHunt API token (required, stored in Replit Secrets)
- `PORT`: Server port (defaults to 5000)

## Algorithm Details

### Launch Score Calculation
The predictor uses a weighted scoring algorithm:

1. **Category Hotness (35%)**
   - Analyzes products from last 14 days
   - Combines recency ratio (40%) + performance score (60%)
   - Higher scores for trending categories with strong recent performance

2. **Best Day Analysis (25%)**
   - Aggregates upvotes by day of week
   - Identifies days with highest average performance
   - Provides percentage-based impact estimates

3. **Best Time Analysis (20%)**
   - Groups launches by hour of day
   - Finds peak engagement windows
   - Displays optimal launch time in PST

4. **Competition Level (20%)**
   - Compares average vs top quartile performance
   - Low competition (70%+ ratio): Great opportunity
   - Medium competition (40-70% ratio): Moderate difficulty
   - High competition (<40% ratio): Very competitive

### Data Handling
- Minimum 3 products required for predictions
- Confidence levels: High (10+ products), Medium (5-9), Low (<5)
- Graceful fallbacks for insufficient data
- Respects user filters for targeted analysis

## Recent Changes

### 2025-10-28: Launch Score Predictor MVP
- Implemented AI-powered launch score predictor as hero feature
- Added weighted algorithm for category, day, time, and competition analysis
- Created purple gradient predictor card with glassmorphism effects
- Added real-time score updates based on filter changes
- Implemented color-coded scoring (green/orange/red)
- Added confidence badges for data quality indication

### 2025-10-28: ProductHunt-Inspired Redesign
- Redesigned from purple gradient to clean ProductHunt aesthetic
- Changed primary color to ProductHunt orange (#DA552F)
- Implemented white/beige background (#f6f5f4)
- Added ProductHunt-style top bar with logo
- Converted table to card-based product layout
- Added hover effects and professional typography

### 2025-10-28: Analytics Dashboard Launch
- Built comprehensive analytics dashboard with 4 Chart.js visualizations
- Implemented search and category filtering
- Added summary statistics cards
- Created sortable product rankings
- Made dashboard the homepage

### 2025-10-28: Initial Replit Setup
- Moved hardcoded API token to environment variable
- Changed port from 3001 to 5000
- Configured server to bind to 0.0.0.0 for Replit compatibility
- Installed Node.js 20 and dependencies

## User Experience
- Immediate value: Users get actionable insights in seconds
- No forms required: Predictor automatically analyzes best opportunities
- Interactive: Updates dynamically with category selection
- Professional: ProductHunt-inspired design builds trust
- Data-driven: All recommendations backed by real ProductHunt data

## Future Enhancements (Potential)
- Detailed report generation ($97 premium feature)
- Email list integration (save your score)
- Tagline length optimization
- Historical trend tracking
- More granular time zone support
- Extended data fetching (pagination for 50+ products)
