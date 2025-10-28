# ProductHunter

### Overview
ProductHunter is an AI-powered analytics platform designed to maximize ProductHunt launch success for founders. It offers real-time insights, trend visualization, an AI-powered Launch Score Predictor, and professional launch asset generation. The platform aims to help users predict, optimize, and win their ProductHunt launches through data-driven recommendations and asset creation.

### User Preferences
No specific user preferences were provided in the original `replit.md`.

### System Architecture
ProductHunter is built with Node.js (CommonJS) and uses the Express.js framework. It runs on port 5000 and is hosted on 0.0.0.0 for Replit compatibility. The UI/UX is inspired by ProductHunt's aesthetic, featuring a signature orange branding, glassmorphism effects, gradient backgrounds, and modern UI components.

**Key Features:**
*   **Launch Score Predictor:** An AI-powered system providing a weighted launch score (0-100) based on category hotness, optimal launch day/time alignment, and competition level. It offers real-time recommendations and dynamic updates.
*   **Analyze Your Launch:** A personalized tool where users input app details to receive custom recommendations. It scores and optimizes based on tagline length, category performance, and planned launch day/time alignment.
*   **Analytics Dashboard:** Displays summary statistics, allows searching and filtering of products, and visualizes data using Chart.js (Top Categories by Product Count, Launch Activity Over Time, Average Upvotes by Category). It features ProductHunt-style product cards and is responsive.
*   **Launch Asset Generation:** Generates optimized taglines, descriptions, first comments, and social posts based on patterns from successful ProductHunt launches and Golden Kitty Award winners.

**Technical Implementations:**
*   **Launch Score Algorithm:** A weighted algorithm considering Category Hotness (35%), Best Day Alignment (25%), Best Time Alignment (20%), and Competition Level (20%).
*   **Personalized Analysis Algorithm:** Scores user inputs based on Tagline Length Optimization (25%), Category Performance (30%), Launch Day Timing (25%), and Launch Time Optimization (20%).
*   **Data Handling:** Requires a minimum of 3 products for predictions, with confidence levels for data sufficiency. All calculations use real ProductHunt data and are performed client-side.

### External Dependencies
*   **ProductHunt API:** Used for fetching comprehensive product data and insights.
*   **Express.js:** Web server framework.
*   **CORS:** Enables Cross-Origin Resource Sharing.
*   **Node-Fetch:** HTTP client for API requests.
*   **Chart.js:** For data visualization in the analytics dashboard.
*   **Environment Variables:** `PH_TOKEN` (ProductHunt API token) and `PORT`.