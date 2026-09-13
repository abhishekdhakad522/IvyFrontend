import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiClient } from '../api/apiClient';
import { sanitizeListing, isFraudulent, formatCurrency } from '../utils/dataSanitizer';
import './Insights.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const getMedian = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const fetchAllRecords = async (endpoint, setProgressMsg) => {
  let all = [];
  let offset = 0;
  const limit = 200;
  let hasMore = true;
  let fakeCount = 0;
  let corruptCount = 0;

  while (hasMore) {
    const response = await apiClient.get(endpoint, { params: { limit, offset } });
    const rawResults = response.data.results;
    
    for (const item of rawResults) {
      if (endpoint === '/v1/projects') {
        all.push(item);
      } else {
        const sanitized = sanitizeListing(item);
        if (!sanitized) {
          corruptCount++;
          continue;
        }
        if (isFraudulent(sanitized)) {
          fakeCount++;
          continue;
        }
        if (sanitized.is_live !== false) {
          all.push(sanitized);
        }
      }
    }
    
    offset += limit;
    hasMore = response.data.has_more && rawResults.length > 0;
    if (setProgressMsg) setProgressMsg(`Fetching ${endpoint} (offset: ${offset})...`);
  }
  
  return { all, fakeCount, corruptCount };
};

const Insights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressMsg, setProgressMsg] = useState('Initializing...');
  const [activeTab, setActiveTab] = useState('buy');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setProgressMsg('Fetching Buy listings...');
        const buyRes = await fetchAllRecords('/v1/listings', setProgressMsg);
        
        setProgressMsg('Fetching Rentals...');
        const rentRes = await fetchAllRecords('/v1/rentals', setProgressMsg);
        
        setProgressMsg('Fetching Projects...');
        const projRes = await fetchAllRecords('/v1/projects', setProgressMsg);

        // --- Process BUY ---
        const buyPrices = buyRes.all.map(l => l.price);
        const buyPricesSqft = buyRes.all.filter(l => l.carpet_area > 0).map(l => l.price / l.carpet_area);
        
        const buyLocMap = {};
        buyRes.all.forEach(l => {
          const loc = l.locality.toLowerCase();
          if (!buyLocMap[loc]) buyLocMap[loc] = { count: 0, prices: [] };
          buyLocMap[loc].count++;
          buyLocMap[loc].prices.push(l.price);
        });
        const buyByLocality = Object.keys(buyLocMap)
          .map(loc => ({ locality: loc.charAt(0).toUpperCase() + loc.slice(1), count: buyLocMap[loc].count, median: getMedian(buyLocMap[loc].prices) }))
          .sort((a, b) => b.count - a.count).slice(0, 10);

        const buyBhkMap = {};
        buyRes.all.forEach(l => {
          if (!l.bedroom) return;
          const bhk = l.bedroom >= 4 ? '4+ BHK' : `${l.bedroom} BHK`;
          buyBhkMap[bhk] = (buyBhkMap[bhk] || 0) + 1;
        });
        const buyByBhk = Object.keys(buyBhkMap).map(k => ({ name: k, value: buyBhkMap[k] })).sort((a, b) => a.name.localeCompare(b.name));

        // --- Process RENT ---
        const rentPrices = rentRes.all.map(l => l.price);
        const rentDeposits = rentRes.all.map(l => l.deposit);
        
        const rentLocMap = {};
        rentRes.all.forEach(l => {
          const loc = l.locality.toLowerCase();
          if (!rentLocMap[loc]) rentLocMap[loc] = { count: 0, prices: [] };
          rentLocMap[loc].count++;
          rentLocMap[loc].prices.push(l.price);
        });
        const rentByLocality = Object.keys(rentLocMap)
          .map(loc => ({ locality: loc.charAt(0).toUpperCase() + loc.slice(1), count: rentLocMap[loc].count, median: getMedian(rentLocMap[loc].prices) }))
          .sort((a, b) => b.count - a.count).slice(0, 10);

        const rentBhkMap = {};
        rentRes.all.forEach(l => {
          if (!l.bedroom) return;
          const bhk = l.bedroom >= 4 ? '4+ BHK' : `${l.bedroom} BHK`;
          rentBhkMap[bhk] = (rentBhkMap[bhk] || 0) + 1;
        });
        const rentByBhk = Object.keys(rentBhkMap).map(k => ({ name: k, value: rentBhkMap[k] })).sort((a, b) => a.name.localeCompare(b.name));

        // --- Process PROJECTS ---
        // min price in projects could be in raw float based on finding, wait, dataSanitizer is not applied to projects here? 
        // We didn't sanitize projects. Let's do it inline:
        const parseProjPrice = (val) => {
          if (!val) return 0;
          return val < 10 ? val * 10000000 : val * 100000;
        };

        const projPrices = projRes.all.map(p => parseProjPrice(p.price_min)).filter(v => v > 0);
        const projUnits = projRes.all.map(p => p.total_units || 0).reduce((acc, v) => acc + v, 0);
        
        const projLocMap = {};
        projRes.all.forEach(p => {
          if (!p.locality) return;
          const loc = p.locality.toLowerCase();
          if (!projLocMap[loc]) projLocMap[loc] = 0;
          projLocMap[loc]++;
        });
        const projByLocality = Object.keys(projLocMap)
          .map(loc => ({ locality: loc.charAt(0).toUpperCase() + loc.slice(1), count: projLocMap[loc], median: projLocMap[loc] })) // median here is just used for bar chart value mapping
          .sort((a, b) => b.count - a.count).slice(0, 10);

        const projStatusMap = {};
        projRes.all.forEach(p => {
          if (!p.project_status) return;
          const status = p.project_status.charAt(0).toUpperCase() + p.project_status.slice(1);
          projStatusMap[status] = (projStatusMap[status] || 0) + 1;
        });
        const projByStatus = Object.keys(projStatusMap).map(k => ({ name: k, value: projStatusMap[k] }));

        setData({
          buy: {
            total: buyRes.all.length,
            medianPrice: getMedian(buyPrices),
            medianPriceSqft: getMedian(buyPricesSqft),
            byLocality: buyByLocality,
            byBhk: buyByBhk
          },
          rent: {
            total: rentRes.all.length,
            medianRent: getMedian(rentPrices),
            medianDeposit: getMedian(rentDeposits),
            byLocality: rentByLocality,
            byBhk: rentByBhk
          },
          projects: {
            total: projRes.all.length,
            medianMinPrice: getMedian(projPrices),
            totalUnits: projUnits,
            byLocality: projByLocality,
            byStatus: projByStatus
          },
          truth: {
            fakeCount: buyRes.fakeCount + rentRes.fakeCount,
            corruptCount: buyRes.corruptCount + rentRes.corruptCount
          }
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="container insights-loading">
        <h2>Crunching Market Data</h2>
        <p>{progressMsg}</p>
        <div className="spinner" style={{marginTop: '2rem'}}>
          <div style={{width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return <div className="container" style={{padding: '4rem'}}>Error loading insights.</div>;

  const currentData = data[activeTab];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      if (activeTab === 'projects') {
        return (
          <div className="custom-tooltip">
            <p className="label">{`${label}`}</p>
            <p className="intro">Projects: {payload[0].payload.count}</p>
          </div>
        );
      }
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="intro">Median: {formatCurrency(payload[0].payload.median)}</p>
          <p className="desc">Listings: {payload[0].payload.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="insights-page container">
      <div className="browse-header">
        <div className="browse-header-left">
          <p className="breadcrumb">MARKET → INSIGHTS</p>
          <h1>Hyderabad Market Overview</h1>
          <p className="subtitle">Real-time computed analytics from live listings</p>
        </div>
        
        <div className="type-toggle">
          <button className={`toggle-btn ${activeTab === 'buy' ? 'active' : ''}`} onClick={() => setActiveTab('buy')}>Buy</button>
          <button className={`toggle-btn ${activeTab === 'rent' ? 'active' : ''}`} onClick={() => setActiveTab('rent')}>Rent</button>
          <button className={`toggle-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects</button>
        </div>
      </div>

      {activeTab === 'buy' && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><p className="kpi-label">TOTAL LISTINGS</p><h2 className="kpi-value">{currentData.total.toLocaleString()}</h2></div>
            <div className="kpi-card"><p className="kpi-label">MEDIAN PRICE</p><h2 className="kpi-value">{formatCurrency(currentData.medianPrice)}</h2></div>
            <div className="kpi-card"><p className="kpi-label">MEDIAN PRICE / SQFT</p><h2 className="kpi-value">₹{Math.round(currentData.medianPriceSqft).toLocaleString()}</h2></div>
          </div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Median Price by Top Localities</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.byLocality} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis dataKey="locality" angle={-45} textAnchor="end" tick={{fontSize: 12}} interval={0} />
                    <YAxis tickFormatter={(val) => `₹${(val/10000000).toFixed(1)}Cr`} tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="median" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">Listings by BHK</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentData.byBhk} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {currentData.byBhk.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'rent' && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><p className="kpi-label">TOTAL RENTALS</p><h2 className="kpi-value">{currentData.total.toLocaleString()}</h2></div>
            <div className="kpi-card"><p className="kpi-label">MEDIAN MONTHLY RENT</p><h2 className="kpi-value">{formatCurrency(currentData.medianRent)}</h2></div>
            <div className="kpi-card"><p className="kpi-label">MEDIAN DEPOSIT</p><h2 className="kpi-value">{formatCurrency(currentData.medianDeposit)}</h2></div>
          </div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Median Rent by Top Localities</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.byLocality} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis dataKey="locality" angle={-45} textAnchor="end" tick={{fontSize: 12}} interval={0} />
                    <YAxis tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="median" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">Rentals by BHK</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentData.byBhk} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {currentData.byBhk.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'projects' && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><p className="kpi-label">TOTAL PROJECTS</p><h2 className="kpi-value">{currentData.total.toLocaleString()}</h2></div>
            <div className="kpi-card"><p className="kpi-label">MEDIAN STARTING PRICE</p><h2 className="kpi-value">{formatCurrency(currentData.medianMinPrice)}</h2></div>
            <div className="kpi-card"><p className="kpi-label">TOTAL NEW UNITS</p><h2 className="kpi-value">{currentData.totalUnits.toLocaleString()}</h2></div>
          </div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Projects by Top Localities</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.byLocality} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis dataKey="locality" angle={-45} textAnchor="end" tick={{fontSize: 12}} interval={0} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">Projects by Status</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentData.byStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {currentData.byStatus.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="data-truth-section">
        <h2>The Truth About Your Data</h2>
        <p>Because the analytics API endpoint was broken (404), this dashboard computes everything directly on your device. During processing, our local data sanitizer uncovered several issues across both Buy and Rent datasets:</p>
        
        <div className="truth-grid">
          <div className="truth-card">
            <span className="truth-icon">🛑</span>
            <h4>{data.truth.fakeCount} Fake Leads Blocked</h4>
            <p>We automatically detected and removed listings where the same contact number was used across multiple different fake seller names.</p>
          </div>
          <div className="truth-card">
            <span className="truth-icon">🧹</span>
            <h4>{data.truth.corruptCount} Corrupt Records Purged</h4>
            <p>We safely ignored properties with impossible dimensions (e.g. carpet area larger than super built up area) or negative prices.</p>
          </div>
          <div className="truth-card">
            <span className="truth-icon">🔄</span>
            <h4>Units Standardized</h4>
            <p>We caught and converted properties listed in square meters or thousands of rupees into standard sqft and INR amounts.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Insights;
