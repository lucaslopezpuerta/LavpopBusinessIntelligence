// GoogleBusinessWidget.jsx v1.0
// Shows Google Business ratings and review count
// Uses Google Places API with API key from environment variables

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ExternalLink, Loader, AlertCircle } from 'lucide-react';

// Note: GOOGLE_API_KEY should be set in .env file as VITE_GOOGLE_API_KEY
// Place ID extracted from: https://maps.app.goo.gl/VwNojjvheJrXZeRd8
const PLACE_ID = 'ChIJzQ8ZH7XS5pQRDLXOWK6x3HE'; // Lavpop Caxias do Sul

const GoogleBusinessWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGoogleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get API key from environment variable
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        
        if (!apiKey) {
          throw new Error('API key não configurada');
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,name&key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do Google');
        }
        
        const result = await response.json();
        
        if (result.status !== 'OK') {
          throw new Error(result.error_message || 'Erro na API do Google');
        }
        
        setData({
          rating: result.result.rating,
          reviewCount: result.result.user_ratings_total,
          name: result.result.name
        });
        
      } catch (err) {
        console.error('Erro ao buscar dados do Google Business:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleData();
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '180px'
      }}>
        <Loader style={{ width: '20px', height: '20px', color: '#6b7280', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '180px'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
        <div style={{ fontSize: '11px', color: '#dc2626' }}>
          Erro ao carregar
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Generate star display
  const fullStars = Math.floor(data.rating);
  const hasHalfStar = data.rating % 1 >= 0.5;
  
  return (
    <a
      href="https://maps.app.goo.gl/VwNojjvheJrXZeRd8"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '200px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Google Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '24px' }}>🏢</span>
      </div>

      {/* Business Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px'
        }}>
          Google Business
        </div>
        
        {/* Rating Stars */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '2px'
        }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  fill: i < fullStars || (i === fullStars && hasHalfStar) ? '#f59e0b' : 'none',
                  color: i < fullStars || (i === fullStars && hasHalfStar) ? '#f59e0b' : '#d1d5db',
                  strokeWidth: 2
                }}
              />
            ))}
          </div>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#10306B'
          }}>
            {data.rating.toFixed(1)}
          </span>
        </div>

        {/* Review Count */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <MessageSquare style={{ width: '12px', height: '12px' }} />
          {data.reviewCount} avaliações
        </div>
      </div>

      {/* External Link Icon */}
      <ExternalLink style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
    </a>
  );
};

export default GoogleBusinessWidget;
