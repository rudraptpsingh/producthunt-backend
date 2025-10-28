# Google Analytics 4 Setup Guide

ProductHunter now has Google Analytics 4 tracking integrated, just like top ProductHunt winners use.

## What's Being Tracked

ProductHunter automatically tracks these key user interactions:

### 1. **Feature Views** (`view_feature`)
- Tracks which features users explore (Hunt Weather, Analyze Your Hunt, etc.)
- Data: feature name, slide index

### 2. **Dashboard Loads** (`dashboard_loaded`)
- Tracks when users successfully load the analytics dashboard
- Data: number of products loaded

### 3. **Hunt Analysis** (`analyze_hunt`)
- Tracks when users analyze their hunt strategy
- Data: category, score, whether planned day/time was specified

### 4. **Asset Generation** (`generate_assets`)
- Tracks when users generate hunt assets (taglines, descriptions, etc.)
- Data: category, number of assets generated, whether target audience specified

## How to Enable Analytics

### Step 1: Create a Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon in bottom left)
3. Under **Property**, click **Create Property**
4. Enter your property name: "ProductHunter"
5. Select your timezone and currency
6. Click **Next** → Choose your industry and business size → Click **Create**
7. Accept the Terms of Service

### Step 2: Get Your Measurement ID

1. In your new GA4 property, go to **Admin** → **Data Streams**
2. Click **Add stream** → Choose **Web**
3. Enter your website URL (your published Replit URL)
4. Give it a name: "ProductHunter Website"
5. Click **Create stream**
6. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Update ProductHunter

1. Open `server.js` in your Replit project
2. Search for `G-XXXXXXXXXX` (appears twice)
3. Replace both occurrences with your real Measurement ID

**Line 36:**
```javascript
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID-HERE"></script>
```

**Line 41:**
```javascript
gtag('config', 'G-YOUR-ID-HERE');
```

4. Save the file
5. Restart your server (it should restart automatically)

### Step 4: Verify It's Working

1. Open your ProductHunter website
2. In Google Analytics, go to **Reports** → **Realtime**
3. You should see yourself as an active user
4. Interact with the features (view slides, analyze a hunt)
5. The events should appear in the Realtime report

## What You'll See in Analytics

After a few hours of usage, you'll be able to see:

- **User Metrics**: Total users, new users, sessions
- **Engagement**: Average engagement time per session
- **Popular Features**: Which features users interact with most
- **User Flow**: How users navigate through ProductHunter
- **Categories**: Which product categories users analyze most
- **Conversions**: Track when users complete key actions

## Privacy & Compliance

The current implementation:
- ✅ Uses standard GA4 tracking (no custom cookies)
- ✅ Anonymous by default (no PII collected)
- ✅ Event-based tracking only
- ⚠️ May require a cookie banner depending on your location (EU: GDPR, California: CCPA)

If you need GDPR compliance, consider adding:
- Cookie consent banner
- Privacy policy page
- Data retention settings in GA4

## Testing Events

To test if events are firing correctly:

1. Open your website
2. Press `F12` (Chrome DevTools)
3. Go to **Console** tab
4. Type: `window.gtag('event', 'test', {test_param: 'hello'})`
5. Check GA4 Realtime to see if it appears

## Need Help?

- [GA4 Official Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Tracking Guide](https://support.google.com/analytics/answer/9267735)
- [GA4 Realtime Report](https://support.google.com/analytics/answer/9271392)

---

**Questions?** The analytics code is fully integrated and ready to go. Just replace the placeholder Measurement ID with your own!
