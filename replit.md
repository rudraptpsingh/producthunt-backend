# ProductHunter

### Overview
ProductHunter is an AI-powered analytics platform designed to maximize ProductHunt success for Makers. It offers real-time insights, trend visualization, an AI-powered Hunt Weather system, and professional hunt asset generation. The platform uses authentic ProductHunt terminology (Hunt, Maker, Hunting) throughout to feel native to the PH community and help users predict, optimize, and win their ProductHunt hunts through data-driven recommendations and asset creation.

### Recent Changes
*   **October 28, 2025:** Rebranded from "Launch" to "Hunt" terminology throughout the platform to use authentic ProductHunt language (Hunt, Maker, Hunting). Updated hero section with "Analyze. Hunt. Win." tagline and reorganized layout to feature ProductHunt award badges prominently with animated trophy badge.

### User Preferences
*   Use ProductHunt-specific terminology: "Hunt" (not "Launch"), "Maker" (product creator), "Hunter" (discovers products), "Hunting" (discovering/upvoting)

### System Architecture
ProductHunter is built with Node.js (CommonJS) and uses the Express.js framework. It runs on port 5000 and is hosted on 0.0.0.0 for Replit compatibility. The UI/UX is inspired by ProductHunt's aesthetic, featuring a signature orange branding, glassmorphism effects, gradient backgrounds, and modern UI components.

**Key Features:**
*   **Hunt Weather:** An AI-powered system providing a weighted hunt score (0-100) based on category hotness, optimal hunt day/time alignment, and competition level. It offers real-time recommendations, dynamic updates, and includes real-time hunt timers (user time, PST time, today's hunt countdown, next hunt countdown).
*   **Analyze Your Hunt:** A personalized tool where Makers input app details to receive custom recommendations. It scores and optimizes based on tagline length, category performance, and planned hunt day/time alignment.
*   **Analytics Dashboard:** Displays summary statistics, allows searching and filtering of products, and visualizes data using Chart.js (Top Categories by Product Count, Hunt Activity Over Time, Average Upvotes by Category). It features ProductHunt-style product cards and is responsive.
*   **Hunt Asset Generation:** Generates optimized taglines, descriptions, first comments (Maker introductions), and social posts based on patterns from successful ProductHunt hunts and Golden Kitty Award winners.

**Technical Implementations:**
*   **Hunt Score Algorithm:** A weighted algorithm considering Category Hotness (35%), Best Day Alignment (25%), Best Time Alignment (20%), and Competition Level (20%).
*   **Personalized Analysis Algorithm:** Scores Maker inputs based on Tagline Length Optimization (25%), Category Performance (30%), Hunt Day Timing (25%), and Hunt Time Optimization (20%).
*   **Real-Time Hunt Timers:** Four synchronized clocks displaying user local time, PST time (ProductHunt timezone), countdown to today's hunt end (11:59 PM PST), and countdown to next hunt start (12:01 AM PST tomorrow).
*   **Data Handling:** Requires a minimum of 3 products for predictions, with confidence levels for data sufficiency. All calculations use real ProductHunt data and are performed client-side.

### External Dependencies
*   **ProductHunt API:** Used for fetching comprehensive product data and insights.
*   **Express.js:** Web server framework.
*   **CORS:** Enables Cross-Origin Resource Sharing.
*   **Node-Fetch:** HTTP client for API requests.
*   **Chart.js:** For data visualization in the analytics dashboard.
*   **Environment Variables:** `PH_TOKEN` (ProductHunt API token) and `PORT`.