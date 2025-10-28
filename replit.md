# HuntProductHunt

### Overview
HuntProductHunt is an AI-powered analytics platform designed to maximize ProductHunt success for Makers. It offers real-time insights, trend visualization, an AI-powered Hunt Weather system, and professional hunt asset generation. The platform uses authentic ProductHunt terminology (Hunt, Maker, Hunting) throughout to feel native to the PH community and help users predict, optimize, and win their ProductHunt hunts through data-driven recommendations and asset creation.

### Recent Changes
*   **October 28, 2025:** Complete UI redesign to match ProductHunt's aesthetic - white backgrounds (#FFFFFF), signature orange (#DA552F), clean borders, minimal shadows. Rebranded from "Launch" to "Hunt" terminology throughout. Updated hero with "Analyze. Hunt. Win." tagline and award badges. Optimized for mobile with responsive design (typography, spacing, touch-friendly buttons). **Added Google Analytics 4 (GA4)** tracking to match top ProductHunt winners' analytics stack - tracks feature views, dashboard loads, hunt analysis, and asset generation with event-based monitoring. **Implemented auto-refresh for Hunt Weather** - score and recommendations now update every 60 seconds to reflect real-time changes in optimal hunt timing. **Added lightweight feedback system** - footer with feedback modal offering email contact, Twitter sharing, and ProductHunt link (no backend required). **Integrated OpenAI API** for AI-powered hunt analysis and asset generation using gpt-4o-mini for cost optimization - both features now use real AI instead of template-based logic, providing personalized insights based on ProductHunt best practices and successful launch patterns. **Renamed product from "ProductHunter" to "HuntProductHunt"** - updated branding everywhere including logo, page title, feedback forms, analytics documentation, and project documentation to reflect the new name. **Built Launch Day Command Center** - comprehensive real-time dashboard tracking top 20 products with live leaderboard (velocity indicators: 🔥HOT/📈Rising/📉Slow), competitor analysis with catchability gaps (🟢≤50 upvotes=Catchable / 🔴>50=Monitor), optimal engagement windows (6-9AM, 12-2PM, 5-7PM PST), action suggestions, and pre-written social templates (Twitter/LinkedIn/Email) with one-click copy-to-clipboard. **Optimized dashboard performance** - Command Center now loads on-demand only (user clicks "Load Command Center" button) instead of running analysis automatically on page load, significantly improving initial dashboard load time. Auto-refresh (30s interval) only starts after user loads Command Center.

### User Preferences
*   Use ProductHunt-specific terminology: "Hunt" (not "Launch"), "Maker" (product creator), "Hunter" (discovers products), "Hunting" (discovering/upvoting)

### System Architecture
HuntProductHunt is built with Node.js (CommonJS) and uses the Express.js framework. It runs on port 5000 and is hosted on 0.0.0.0 for Replit compatibility. The UI/UX is inspired by ProductHunt's aesthetic, featuring a signature orange branding, glassmorphism effects, gradient backgrounds, and modern UI components.

**Key Features:**
*   **Hunt Weather:** An AI-powered system providing a weighted hunt score (0-100) based on category hotness, optimal hunt day/time alignment, and competition level. It offers real-time recommendations, dynamic updates, and includes real-time hunt timers (user time, PST time, today's hunt countdown, next hunt countdown).
*   **Analyze Your Hunt (AI-Powered):** Uses OpenAI gpt-4o-mini to analyze Maker's product details (name, category, tagline, timing) and provide personalized insights with scores, recommendations, and actionable improvements based on real ProductHunt data and proven launch strategies.
*   **Analytics Dashboard:** Displays summary statistics, allows searching and filtering of products, and visualizes data using Chart.js (Top Categories by Product Count, Hunt Activity Over Time, Average Upvotes by Category). It features ProductHunt-style product cards and is responsive.
*   **Hunt Asset Generation (AI-Powered):** Uses OpenAI gpt-4o-mini to generate 5 professional hunt assets: optimized tagline (60 chars max), compelling product description, Maker first comment, social media post, and category-specific launch tips - all based on Golden Kitty Award winners' patterns and ProductHunt best practices.
*   **Launch Day Command Center:** On-demand real-time dashboard for tracking top 20 products with live leaderboard (velocity indicators: 🔥HOT >30 upvotes/hr, 📈Rising 15-30/hr, 📉Slow <15/hr), competitor analysis with catchability gaps (green ≤50 upvote gap = catchable, red >50 = monitor), optimal engagement timing windows (6-9AM, 12-2PM, 5-7PM PST), contextual action suggestions, and pre-written social templates (Twitter/LinkedIn/Email) with one-click copy-to-clipboard functionality. Auto-refreshes every 30 seconds after user activation.
*   **Feedback System:** Lightweight footer with feedback modal allowing users to send email feedback (cosmorudyrp@gmail.com), share on Twitter, or visit ProductHunt. No backend infrastructure required - uses mailto links and social sharing URLs.

**Technical Implementations:**
*   **Hunt Score Algorithm:** A weighted algorithm considering Category Hotness (35%), Best Day Alignment (25%), Best Time Alignment (20%), and Competition Level (20%).
*   **AI-Powered Hunt Analysis:** POST /api/analyze-hunt endpoint using OpenAI gpt-4o-mini (temp: 0.7, max_tokens: 1500) with structured JSON output. Analyzes product details against ProductHunt data to generate personalized hunt scores and actionable insights.
*   **AI-Powered Asset Generation:** POST /api/generate-assets endpoint using OpenAI gpt-4o-mini (temp: 0.8, max_tokens: 2000) with structured JSON output. Generates 5 professional hunt assets based on proven patterns from top ProductHunt launches and Golden Kitty winners.
*   **Real-Time Hunt Timers:** Four synchronized clocks displaying user local time, PST time (ProductHunt timezone), countdown to today's hunt end (11:59 PM PST), and countdown to next hunt start (12:01 AM PST tomorrow). Updates every second.
*   **Auto-Refresh Hunt Weather:** Hunt Weather score and recommendations automatically recalculate every 60 seconds to provide up-to-date insights as time progresses and optimal hunt windows change.
*   **Data Handling:** Requires a minimum of 3 products for predictions, with confidence levels for data sufficiency. All calculations use real ProductHunt data and are performed client-side. AI features send recent ProductHunt data as context for more accurate recommendations.

### External Dependencies
*   **ProductHunt API:** Used for fetching comprehensive product data and insights.
*   **OpenAI API:** Powers AI-driven hunt analysis and asset generation using gpt-4o-mini model for cost-effective, high-quality recommendations.
*   **Express.js:** Web server framework.
*   **CORS:** Enables Cross-Origin Resource Sharing.
*   **Node-Fetch:** HTTP client for API requests.
*   **Chart.js:** For data visualization in the analytics dashboard.
*   **Google Analytics 4 (GA4):** Event-based analytics tracking user interactions (feature views, dashboard loads, hunt analysis, asset generation). Requires Measurement ID replacement in server.js (currently placeholder G-XXXXXXXXXX). See ANALYTICS_SETUP.md for configuration.
*   **Environment Variables:** `PH_TOKEN` (ProductHunt API token), `OPENAI_API_KEY` (OpenAI API key for AI features), and `PORT`.