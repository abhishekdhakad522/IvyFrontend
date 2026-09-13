import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ui/ListingCard';
import './Browse.css'; // Reuse browse layout styles

const Saved = () => {
  const [savedListings, setSavedListings] = useState([]);

  const loadSaved = () => {
    const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    setSavedListings(saved);
  };

  useEffect(() => {
    loadSaved();
    
    // Listen for custom event if saved listings change on this page
    window.addEventListener('savedListingsChanged', loadSaved);
    return () => window.removeEventListener('savedListingsChanged', loadSaved);
  }, []);

  return (
    <div className="browse-page container">
      <div className="browse-header">
        <div className="browse-header-left">
          <p className="breadcrumb">YOUR ACCOUNT → SAVED</p>
          <h1>Saved Homes</h1>
          <p className="subtitle">Your shortlisted properties</p>
        </div>
      </div>

      {savedListings.length === 0 ? (
        <div className="empty-state">You haven't saved any homes yet.</div>
      ) : (
        <div className="listings-grid">
          {savedListings.map(listing => (
            <ListingCard 
              key={listing.listing_id} 
              listing={listing} 
              isRental={!!listing.deposit} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;
