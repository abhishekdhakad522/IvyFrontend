export const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const sanitizeListing = (listing) => {
  let { 
    price, 
    carpet_area, 
    super_built_up_area, 
    floor, 
    total_floors,
    website 
  } = listing;

  // Fix known data quality issues based on source
  if (website === 'magichomes' && carpet_area < 500) {
    // Convert sq meters to sqft
    carpet_area = Math.round(carpet_area * 10.7639);
    if (super_built_up_area) {
      super_built_up_area = Math.round(super_built_up_area * 10.7639);
    }
  }

  if (website === 'zerobroker' && price < 100000) {
    // Convert thousands to rupees
    price = price * 1000;
  }

  // Filter conditions - if impossible data, return null
  if (price <= 0) return null;
  if (super_built_up_area && carpet_area > super_built_up_area) return null;
  if (total_floors && floor > total_floors) return null;
  
  return {
    ...listing,
    price,
    carpet_area,
    super_built_up_area
  };
};

// Global cache to detect fraudulent listings that use the same phone number with different names
const contactNameCache = new Map();

export const isFraudulent = (listing) => {
  const phone = listing.posted_by_contact;
  const name = listing.posted_by_name?.toLowerCase().trim();

  if (!phone || !name) return false;

  if (contactNameCache.has(phone)) {
    if (contactNameCache.get(phone) !== name) {
      return true; // Fraudulent: same number, different name
    }
  } else {
    contactNameCache.set(phone, name);
  }

  return false;
};
