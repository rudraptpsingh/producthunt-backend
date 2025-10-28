# ProductHunt Analytics Dashboard

## Overview
A comprehensive ProductHunt analytics platform featuring real-time insights, trends visualization, an AI-powered Launch Score Predictor, and a personalized Launch Analyzer to help founders maximize their ProductHunt launch success.

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

### 🎯 Launch Score Predictor (MVP Feature #1)
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

### 💡 Analyze Your Launch (MVP Feature #2)
Personalized launch analysis tool where users input their app details and receive custom recommendations:
- **User Input Form**:
  - App Name (required)
  - Category selection from live ProductHunt data (required)
  - Tagline with multi-line input (required)
  - Planned Launch Day (optional)
  - Planned Launch Time (optional)
- **Intelligent Analysis** (Weighted Scoring):
  - **Tagline Length Optimization (25%)**: Compares user tagline to top performers
  - **Category Performance (30%)**: Analyzes competition and success rate
  - **Launch Day Timing (25%)**: Compares to historical best days
  - **Launch Time Optimization (20%)**: Identifies peak engagement hours
- **Personalized Results Display**:
  - Overall score (0-100) with color coding
  - Success message tailored to score
  - 4 detailed insight cards with recommendations
  - Status badges (Optimal/Good/Needs improvement)
  - Smooth scroll to results
- **Data-Driven Benchmarks**:
  - Optimal tagline length from top 5 performers
  - Category average upvotes and competition level
  - Best performing days and times from real data
  - No penalties for optional fields

### 📊 Analytics Dashboard
- **Summary Statistics**: Products, Total Upvotes, Categories
- **Search & Filters**: Real-time product search and category filtering
- **Chart Visualizations** (Chart.js):
  - Three charts displayed in one row for optimal visual hierarchy
  - Top Categories by Product Count (Bar Chart)
  - Launch Activity Over Time (Line Chart with robust date parsing and error handling)
  - Average Upvotes by Category (Bar Chart)
  - Responsive design: stacks vertically on screens under 1200px
- **Product Cards**: Clean ProductHunt-style cards with click-to-view functionality
- **Show More/Less**: Initially displays 3 products with expandable button to view all (optimized for compact homepage)

### 🎨 Design System
- **Color Palette**:
  - Primary: ProductHunt Orange (#DA552F)
  - Background: Clean beige (#f6f5f4)
  - Cards: White with subtle borders (#e8e7e6)
  - Predictor: Purple gradient (667eea to 764ba2)
  - Insights: Color-coded status (green/yellow/red)
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

### Launch Score Calculation (Predictor)
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

### Personalized Launch Analysis (Analyzer)
User-specific weighted scoring algorithm:

1. **Tagline Length (25%)**
   - Calculates optimal length from top 5 performers
   - Scores based on proximity to optimal (±20% is optimal)
   - Provides specific guidance (add detail vs. be concise)

2. **Category Performance (30%)**
   - Analyzes average upvotes in selected category
   - Benchmarks against all categories
   - Identifies hot categories (70%+), moderate (40-70%), competitive (<40%)

3. **Launch Day Alignment (25%)**
   - Compares user's choice to best performing day
   - Shows percentage difference from optimal
   - No penalty if day not specified (defaults to 75 score)

4. **Launch Time Alignment (20%)**
   - Compares planned time to peak engagement hour
   - Identifies optimal launch windows
   - No penalty if time not specified (defaults to 75 score)

### Data Handling
- Minimum 3 products required for predictions
- Confidence levels: High (10+ products), Medium (5-9), Low (<5)
- Graceful fallbacks for insufficient data
- Respects user filters for targeted analysis
- All calculations use real ProductHunt data
- No external API calls for analysis (all client-side)

## Recent Changes

### 2025-10-28: Chart Layout Optimization & Launch Activity Fix
- Fixed Launch Activity Over Time chart with improved date parsing and error handling
- Optimized chart layout: all 3 charts now display in one row for better visual hierarchy
- Added responsive breakpoint (1200px) to stack charts on smaller screens
- Enhanced chart spacing: reduced padding (14px), height (220px), and gap (12px) for compact display
- Improved x-axis labels with 45-degree rotation for better readability
- Added defensive error handling to prevent chart rendering failures

### 2025-10-28: Homepage Compactness Optimization
- Reduced products section to show only top 3 products initially (changed from 6)
- Made product cards more compact (reduced padding from 16px to 12px)
- Optimized charts section spacing (reduced chart height from 280px to 240px, padding from 20px to 16px)
- Streamlined vertical spacing throughout analytics section
- Improved homepage flow: users can now see "Get Your Product Ready to Launch" without excessive scrolling
- Maintained readability and visual hierarchy while maximizing information density

### 2025-10-28: Form Consolidation - Single Unified Interface
- Consolidated "Get Your Product Ready to Launch" from dual-tab design to single form
- Two action buttons now share the same input fields: "Analyze My Launch" and "Generate Launch Assets"
- Removed tab navigation (analyze vs generate) for cleaner UX
- "Tagline/Key Features" field serves dual purpose with contextual hint text
- Button styling differentiates actions: purple gradient (analyze) vs orange gradient (generate)
- Eliminated duplicate form fields and CSS, streamlined codebase
- Improved user flow: one form, two actionable outcomes

### 2025-10-28: UX Improvements & Chart Optimization
- Removed redundant Category Distribution pie chart (streamlined to 3 focused charts)
- Added "Show More/Less" toggle for products section (initially shows 6, expandable to all)
- Improved Launch Activity Over Time chart with better date parsing and formatting
- Moved "Analyze Your Launch" section to bottom for better page flow
- Enhanced button styling with ProductHunt-branded hover effects

### 2025-10-28: "Analyze Your Launch" Feature
- Added personalized launch analyzer with input form
- Implemented tagline length optimization analysis
- Created category performance benchmarking
- Added day/time optimization recommendations
- Built color-coded insight cards with status badges
- Integrated form validation and smooth UX
- Populated category dropdown from live data

### 2025-10-28: Launch Score Predictor MVP
- Implemented AI-powered launch score predictor as hero feature
- Added weighted algorithm for category, day, time, and competition analysis
- Created purple gradient predictor card with glassmorphism effects
- Added real-time score updates based on filter changes
- Implemented color-coded scoring (green/orange/red)
- Fixed category display bug (now shows actual categories)
- Fixed time display to clarify midnight launches

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

### Immediate Value
- Launch Score Predictor provides insights in seconds
- Analyze Your Launch gives personalized recommendations
- No complex setup or API keys required from users

### Interactive Features
- Predictor updates dynamically with category selection
- Analyzer processes user inputs with instant results
- Smooth animations and transitions throughout

### Professional Design
- ProductHunt-inspired design builds trust
- Clean, modern interface
- Mobile-responsive layouts

### Data-Driven Insights
- All recommendations backed by real ProductHunt data
- Specific, actionable advice
- Transparent scoring methodology

## Future Enhancements (Potential)
- Detailed PDF report generation ($97 premium feature)
- Email list integration (save your analysis)
- Historical trend tracking (6-month lookback)
- More granular time zone support
- Extended data fetching (pagination for 50+ products)
- A/B testing recommendations for taglines
- Competitor analysis by product name
- Launch checklist generator
- Email reminders for optimal launch timing
