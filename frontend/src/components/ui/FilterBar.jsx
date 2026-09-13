import './FilterBar.css';

const FilterBar = ({ filters, setFilters, onReset }) => {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="filter-bar">
      <div className="filter-item">
        <label>LOCALITY</label>
        <select 
          value={filters.locality || ''} 
          onChange={(e) => handleChange('locality', e.target.value)}
        >
          <option value="">Any</option>
          <option value="banjara hills">Banjara Hills</option>
          <option value="jubilee hills">Jubilee Hills</option>
          <option value="hitec city">HITEC City</option>
          <option value="kondapur">Kondapur</option>
          <option value="kukatpally">Kukatpally</option>
          <option value="gachibowli">Gachibowli</option>
          <option value="madhapur">Madhapur</option>
          <option value="miyapur">Miyapur</option>
          <option value="ameerpet">Ameerpet</option>
          <option value="begumpet">Begumpet</option>
          <option value="somajiguda">Somajiguda</option>
          <option value="uppal">Uppal</option>
          <option value="lb nagar">LB Nagar</option>
          <option value="secunderabad">Secunderabad</option>
          <option value="dilsukhnagar">Dilsukhnagar</option>
        </select>
      </div>

      <div className="filter-item">
        <label>BEDROOMS</label>
        <select 
          value={filters.bhk || ''} 
          onChange={(e) => handleChange('bhk', e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4+ BHK</option>
        </select>
      </div>

      <div className="filter-item">
        <label>MAX PRICE</label>
        <select 
          value={filters.max_price || ''} 
          onChange={(e) => handleChange('max_price', e.target.value)}
        >
          <option value="">Any</option>
          <option value="5000000">₹50 L</option>
          <option value="10000000">₹1 Cr</option>
          <option value="20000000">₹2 Cr</option>
          <option value="50000000">₹5 Cr</option>
        </select>
      </div>

      <div className="filter-item">
        <label>FURNISHING</label>
        <select 
          value={filters.furnishing || ''} 
          onChange={(e) => handleChange('furnishing', e.target.value)}
        >
          <option value="">Any</option>
          <option value="unfurnished">Unfurnished</option>
          <option value="semi-furnished">Semi-furnished</option>
          <option value="fully-furnished">Fully-furnished</option>
        </select>
      </div>

      <div className="filter-item filter-checkbox">
        <label>
          <input 
            type="checkbox" 
            checked={!!filters.is_verified} 
            onChange={(e) => handleChange('is_verified', e.target.checked ? true : '')}
          />
          VERIFIED ONLY
        </label>
      </div>

      <button className="reset-filters" onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
};

export default FilterBar;
