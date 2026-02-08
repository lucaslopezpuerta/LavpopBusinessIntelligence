// netlify/functions/meta-social.js
// Meta Graph API proxy for Instagram/Facebook metrics
// Includes: followers, insights (profile views, website clicks, reach)

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'https://localhost',           // Capacitor Android
  'capacitor://localhost',       // Capacitor iOS
  'http://localhost:5173',       // Local dev (Vite)
  'http://localhost:5174',       // Local dev alt port
  'http://localhost:8888'        // Netlify dev
];

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'https://www.bilavnova.com';
}

function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;
  if (!API_SECRET) {
    console.error('SECURITY: API_SECRET_KEY not configured. All requests denied.');
    return false;
  }
  return apiKey === API_SECRET;
}

exports.handler = async (event, context) => {
  const corsOrigin = getCorsOrigin(event);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!validateApiKey(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const INSTAGRAM_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;
  const FACEBOOK_PAGE_ID = process.env.META_FACEBOOK_PAGE_ID;

  if (!ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Meta API not configured' })
    };
  }

  try {
    // Fetch Instagram basic data
    const igResponse = await fetch(
      `https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}?fields=followers_count,username,media_count,profile_picture_url&access_token=${ACCESS_TOKEN}`
    );

    if (!igResponse.ok) {
      const error = await igResponse.json();
      console.error('Instagram API error:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: error.error?.message || 'Instagram API error',
          code: error.error?.code
        })
      };
    }

    const igData = await igResponse.json();

    // Fetch Instagram Insights (requires instagram_manage_insights permission)
    // Valid metrics: reach, follower_count, website_clicks, profile_views, accounts_engaged, total_interactions, likes, comments, shares, saves
    let igInsights = null;
    let insightsError = null;
    try {
      const insightsUrl = `https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/insights?metric=reach,profile_views,website_clicks,accounts_engaged,total_interactions&period=day&metric_type=total_value&access_token=${ACCESS_TOKEN}`;

      const insightsResponse = await fetch(insightsUrl);
      const insightsData = await insightsResponse.json();

      if (!insightsResponse.ok) {
        // API returned an error
        insightsError = insightsData.error?.message || 'Unknown insights error';
        console.warn('Instagram Insights API Error:', insightsError);
      } else if (insightsData.data && insightsData.data.length > 0) {
        // Parse insights data - with metric_type=total_value, each metric has total_value object
        igInsights = {};
        insightsData.data.forEach(metric => {
          // With total_value metric type, the value is in total_value.value
          if (metric.total_value !== undefined) {
            igInsights[metric.name] = metric.total_value.value || 0;
          } else if (metric.values && metric.values.length > 0) {
            // Fallback for time-series metrics
            const latestValue = metric.values[metric.values.length - 1];
            igInsights[metric.name] = latestValue?.value || 0;
          }
        });
      } else {
        insightsError = 'No insights data returned';
        console.warn('Instagram Insights: No data returned');
      }
    } catch (err) {
      insightsError = err.message;
      console.warn('Instagram Insights fetch error:', err.message);
    }

    // Fetch Facebook Page data (optional)
    let fbData = null;
    if (FACEBOOK_PAGE_ID) {
      try {
        const fbResponse = await fetch(
          `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}?fields=followers_count,fan_count,name,link&access_token=${ACCESS_TOKEN}`
        );
        if (fbResponse.ok) {
          fbData = await fbResponse.json();
        }
      } catch (fbError) {
        console.warn('Facebook API error (non-critical):', fbError.message);
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        // Cache for 4 hours (insights are daily metrics, refresh a few times per day)
        // 'private' prevents CDN/proxy caching of account-specific data
        'Cache-Control': 'private, max-age=14400'
      },
      body: JSON.stringify({
        instagram: {
          followers: igData.followers_count,
          username: igData.username,
          mediaCount: igData.media_count,
          profilePicture: igData.profile_picture_url,
          url: `https://www.instagram.com/${igData.username}/`,
          // Insights (daily metrics)
          insights: igInsights ? {
            profileViews: igInsights.profile_views || 0,
            websiteClicks: igInsights.website_clicks || 0,
            reach: igInsights.reach || 0,
            accountsEngaged: igInsights.accounts_engaged || 0,
            totalInteractions: igInsights.total_interactions || 0
          } : null
        },
        facebook: fbData ? {
          followers: fbData.followers_count,
          likes: fbData.fan_count,
          name: fbData.name,
          url: fbData.link || `https://www.facebook.com/${FACEBOOK_PAGE_ID}`
        } : null,
        fetchedAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Meta API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch social media data' })
    };
  }
};
