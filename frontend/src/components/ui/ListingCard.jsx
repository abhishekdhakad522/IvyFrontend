import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/dataSanitizer';
import './ListingCard.css';

// Randomly (but consistently) assign an image based on string hash
import imgMorning from '../../assets/home-morning.jpg';
import imgNorth from '../../assets/home-north.jpg';
import imgSunset from '../../assets/home-sunset.jpg';
import imgWarm from '../../assets/home-warm.jpg';

const images = [imgMorning, imgNorth, imgSunset, imgWarm];
const getImage = (id) => {
  if (!id) return images[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return images[Math.abs(hash) % images.length];
};

const ListingCard = ({ listing, isRental = false }) => {
  const [isSaved, setIsSaved] = useState(false);
  const id = listing.listing_id;
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    setIsSaved(saved.some(item => item.listing_id === id));
  }, [id]);

  const toggleSave = (e) => {
    e.preventDefault(); // prevent navigation if wrapped in link
    e.stopPropagation(); // prevent card click
    const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    if (isSaved) {
      const updated = saved.filter(item => item.listing_id !== id);
      localStorage.setItem('saved_listings', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      saved.push(listing);
      localStorage.setItem('saved_listings', JSON.stringify(saved));
      setIsSaved(true);
    }
    // Dispatch an event so the Saved page can update if we are on it
    window.dispatchEvent(new Event('savedListingsChanged'));
  };

  const imageSrc = getImage(id);
  const title = isRental 
    ? listing.title || `${listing.bedroom} BHK for rent` 
    : `${listing.bedroom} BHK · ${listing.facing_direction ? listing.facing_direction.charAt(0).toUpperCase() + listing.facing_direction.slice(1) + ' facing' : ''}`;
  
  const subtitle = isRental 
    ? `${listing.apartment_name || 'Independent'} · ${listing.locality.toUpperCase()}`
    : `${listing.apartment_name ? listing.apartment_name.toUpperCase() + ' · ' : ''}${listing.locality.toUpperCase()}`;

  const postedDate = new Date(listing.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const priceSqft = listing.carpet_area ? Math.round(listing.price / listing.carpet_area) : null;

  return (
    <div className="listing-card" onClick={() => navigate(`/listing/${id}`)} style={{ cursor: 'pointer' }}>
      <div className="listing-image-container">
        <img src={imageSrc} alt={title} className="listing-image" />
        {listing.is_verified && (
          <div className="badge badge-verified">
            <ShieldCheck size={14} /> Verified
          </div>
        )}
      </div>
      
      <div className="listing-content">
        <div className="listing-header">
          <span className="listing-subtitle">{subtitle}</span>
          <div className="status-dot"></div>
        </div>
        
        <h3 className="listing-title">{title}</h3>
        
        <div className="listing-price-row">
          <span className="listing-price">{formatCurrency(listing.price)}</span>
          {!isRental && priceSqft && (
            <span className="listing-price-sqft">₹{priceSqft.toLocaleString('en-IN')}/sqft</span>
          )}
          {isRental && (
            <span className="listing-price-sqft">Deposit: {formatCurrency(listing.deposit)}</span>
          )}
        </div>
        
        <div className="listing-features">
          <span>{listing.carpet_area} sqft</span>
          <span>{listing.bathroom} bath</span>
          {listing.furnishing && <span>{listing.furnishing.replace('-', ' ')}</span>}
          {listing.covered_parking ? <span>{listing.covered_parking} parking</span> : null}
        </div>
      </div>
      
      <div className="listing-footer">
        <span className="listing-posted">
          {listing.posted_by.charAt(0).toUpperCase() + listing.posted_by.slice(1)} · {postedDate}
        </span>
        
        <div className="listing-actions">
          <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={toggleSave}>
            <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /> Save
          </button>
          <Link to={`/listing/${id}`} className="action-link">
            View →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
