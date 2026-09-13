import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Bookmark, Phone } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { sanitizeListing, formatCurrency } from '../utils/dataSanitizer';
import Button from '../components/ui/Button';
import './ListingDetail.css';

// Using the same random image logic for consistency
import imgMorning from '../assets/home-morning.jpg';
import imgNorth from '../assets/home-north.jpg';
import imgSunset from '../assets/home-sunset.jpg';
import imgWarm from '../assets/home-warm.jpg';

const images = [imgMorning, imgNorth, imgSunset, imgWarm];
const getImage = (id) => {
  if (!id) return images[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return images[Math.abs(hash) % images.length];
};

const ListingDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // We determine if it's a rental by a URL param or state. Let's just try both endpoints if we don't know,
  // but it's cleaner if we pass state. If no state, try listings, if 404, try rentals.
  const isLikelyRental = id.startsWith('R'); 

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const endpoint = isLikelyRental ? `/v1/rentals/${id}` : `/v1/listings/${id}`;
        const response = await apiClient.get(endpoint);
        const data = sanitizeListing(response.data);
        if (!data) throw new Error("Invalid listing data");
        setListing(data);
      } catch (err) {
        console.error(err);
        // Fallback: try the other endpoint if the first fails
        try {
          const fallbackEndpoint = isLikelyRental ? `/v1/listings/${id}` : `/v1/rentals/${id}`;
          const fallbackResponse = await apiClient.get(fallbackEndpoint);
          const data = sanitizeListing(fallbackResponse.data);
          if (!data) throw new Error("Invalid listing data");
          setListing(data);
        } catch (err2) {
          setError('Failed to load listing details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();

    const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    setIsSaved(saved.some(item => item.listing_id === id));
  }, [id, isLikelyRental]);

  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    if (isSaved) {
      const updated = saved.filter(item => item.listing_id !== id);
      localStorage.setItem('saved_listings', JSON.stringify(updated));
      setIsSaved(false);
    } else if (listing) {
      saved.push(listing);
      localStorage.setItem('saved_listings', JSON.stringify(saved));
      setIsSaved(true);
    }
  };

  if (loading) return <div className="container" style={{padding: '4rem', textAlign: 'center'}}>Loading details...</div>;
  if (error || !listing) return <div className="container" style={{padding: '4rem', textAlign: 'center'}}>{error || 'Listing not found'}</div>;

  const imageSrc = getImage(id);
  const isRental = !!listing.deposit;
  
  const title = isRental ? (listing.title || `${listing.bedroom} BHK`) : (listing.apartment_name || `${listing.bedroom} BHK Apartment`);
  const propertyType = listing.property_type ? listing.property_type.toUpperCase() : 'PROPERTY';

  return (
    <div className="detail-page container">
      <div className="back-link">
        <Link to={-1}>← Back to homes</Link>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <img src={imageSrc} alt={title} className="hero-image" />
          
          <div className="detail-content">
            <span className="property-type">{propertyType} · {id}</span>
            <h1 className="detail-title">{title}</h1>
            <p className="detail-locality">
              <span className="pin-icon">📍</span> 
              {listing.locality.charAt(0).toUpperCase() + listing.locality.slice(1)}, Hyderabad
            </p>

            <p className="detail-description">{listing.description}</p>

            <div className="features-grid">
              {listing.bedroom && (
                <div className="feature-card">
                  <span className="feature-icon">🛏️</span> {listing.bedroom} bedrooms
                </div>
              )}
              {listing.bathroom && (
                <div className="feature-card">
                  <span className="feature-icon">🚿</span> {listing.bathroom} bathrooms
                </div>
              )}
              {listing.super_built_up_area && (
                <div className="feature-card">
                  <span className="feature-icon">📏</span> {listing.super_built_up_area} sqft super area
                </div>
              )}
              {listing.floor && (
                <div className="feature-card">
                  <span className="feature-icon">🏢</span> Floor {listing.floor} of {listing.total_floors || '?'}
                </div>
              )}
              {listing.facing_direction && (
                <div className="feature-card">
                  <span className="feature-icon">🧭</span> {listing.facing_direction.charAt(0).toUpperCase() + listing.facing_direction.slice(1)} facing
                </div>
              )}
              {listing.furnishing && (
                <div className="feature-card">
                  <span className="feature-icon">🛋️</span> {listing.furnishing.replace('-', ' ').charAt(0).toUpperCase() + listing.furnishing.replace('-', ' ').slice(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="action-card">
            <p className="asking-label">ASKING PRICE</p>
            <h2 className="asking-price">{formatCurrency(listing.price)}</h2>
            
            <div className="lister-info">
              <p className="listed-by">Listed by {listing.posted_by_name}</p>
              <p className="lister-type">{listing.posted_by.charAt(0).toUpperCase() + listing.posted_by.slice(1)} · Currently live</p>
            </div>

            <Button 
              className={`full-width-btn ${isSaved ? 'btn-saved' : ''}`} 
              onClick={toggleSave}
            >
              <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} style={{marginRight: '0.5rem'}} />
              {isSaved ? 'Saved' : 'Save home'}
            </Button>
            
            <button className="contact-btn">
              <Phone size={16} style={{marginRight: '0.5rem'}} />
              Contact {listing.posted_by_name.split(' ')[0]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
