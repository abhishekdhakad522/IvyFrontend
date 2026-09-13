import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { sanitizeListing, isFraudulent } from '../utils/dataSanitizer';
import FilterBar from '../components/ui/FilterBar';
import ListingCard from '../components/ui/ListingCard';
import Button from '../components/ui/Button';
import './Browse.css';

const Browse = ({ defaultType = 'buy' }) => {
  const [type, setType] = useState(defaultType);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // API uses offset/limit for pagination, not page
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;
  
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Keep type in sync with URL
  useEffect(() => {
    if (location.pathname === '/rent') setType('rent');
    else if (location.pathname === '/buy' || location.pathname === '/') setType('buy');
  }, [location.pathname]);

  const handleTypeToggle = (newType) => {
    navigate(`/${newType}`);
  };

  const fetchListings = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const endpoint = type === 'rent' ? '/v1/rentals' : '/v1/listings';
      const currentOffset = isLoadMore ? offset + LIMIT : 0;
      
      // Clean up filters to only send active ones
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );

      const params = {
        limit: LIMIT,
        offset: currentOffset,
        ...activeFilters
      };

      const response = await apiClient.get(endpoint, { params });
      const data = response.data;
      
      // Sanitize and filter out bad/fraudulent data
      let processedResults = data.results
        .map(item => sanitizeListing(item))
        .filter(Boolean) // Remove nulls (impossible data)
        .filter(item => !isFraudulent(item)); // Remove fake leads
      
      // The API findings state: Inactive, expired and withdrawn listings are NOT excluded server side for rentals (is_live: false bug)
      // So we must manually check is_live if it exists
      processedResults = processedResults.filter(item => item.is_live !== false);

      // Locally apply is_verified if it's set (in case API doesn't filter it)
      if (activeFilters.is_verified) {
        processedResults = processedResults.filter(item => item.is_verified);
      }

      if (isLoadMore) {
        setListings(prev => [...prev, ...processedResults]);
      } else {
        setListings(processedResults);
      }
      
      setHasMore(data.has_more || processedResults.length === LIMIT);
      // API 'total' field is broken (reports 4209 but yields 1100), we just show what they give us
      setTotal(data.total);
      
      if (isLoadMore) {
        setOffset(currentOffset);
      }

    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when filters or type change
  useEffect(() => {
    fetchListings(false);
  }, [type, filters]);

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="browse-page container">
      <div className="browse-header">
        <div className="browse-header-left">
          <p className="breadcrumb">(A) BROWSE → {type.toUpperCase()}</p>
          <h1>{total > 0 ? total : listings.length} homes near you</h1>
          <p className="subtitle">Hyderabad · sorted by newest sample listings</p>
        </div>
        
        <div className="type-toggle">
          <button 
            className={`toggle-btn ${type === 'buy' ? 'active' : ''}`}
            onClick={() => handleTypeToggle('buy')}
          >
            Buy
          </button>
          <button 
            className={`toggle-btn ${type === 'rent' ? 'active' : ''}`}
            onClick={() => handleTypeToggle('rent')}
          >
            Rent
          </button>
        </div>
      </div>

      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        onReset={handleResetFilters} 
      />

      {loading ? (
        <div className="loading-state">Loading listings...</div>
      ) : (
        <>
          {listings.length === 0 ? (
            <div className="empty-state">No listings found matching your criteria.</div>
          ) : (
            <div className="listings-grid">
              {listings.map(listing => (
                <ListingCard 
                  key={listing.listing_id} 
                  listing={listing} 
                  isRental={type === 'rent'} 
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="load-more-container">
              <Button 
                onClick={() => fetchListings(true)} 
                isLoading={loadingMore}
                className="load-more-btn"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Browse;
