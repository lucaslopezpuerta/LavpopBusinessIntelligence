// netlify/functions/google-business.js
// Google Places API Proxy - Handles CORS restrictions

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const PLACE_ID = 'ChIJW0SI_ryjHpUR_YAfB0aLu8I'; // ← UPDATE with your Place ID
  const API_KEY = process.env.GOOGLE_API_KEY; // From Netlify env vars

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,opening_hours&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.status, message: data.error_message })
      };
    }

    // Return only needed data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400' // Cache 24 hours
      },
      body: JSON.stringify({
        rating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
        isOpen: data.result.opening_hours?.open_now ?? null
      })
    };
  } catch (error) {
    console.error('Error fetching Google Business data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data' })
    };
  }
};
