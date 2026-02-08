// netlify/functions/google-business.js
// NEW PLACES API VERSION

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

  const PLACE_ID = 'ChIJW0SI_ryjHpUR_YAfB0aLu8I'; // Your Place ID
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    // NEW API endpoint
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,regularOpeningHours'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.error?.message || 'API error' })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=86400'
      },
      body: JSON.stringify({
        rating: data.rating,
        totalReviews: data.userRatingCount,
        isOpen: data.regularOpeningHours?.openNow ?? null
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data' })
    };
  }
};
