import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { formatCurrency } from '../utils/dataSanitizer';
import './ListingDetail.css'; // Reusing layout styles from ListingDetail

// Using random image logic
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

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/v1/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <div className="container" style={{padding: '4rem', textAlign: 'center'}}>Loading project...</div>;
  if (error || !project) return <div className="container" style={{padding: '4rem', textAlign: 'center'}}>{error || 'Project not found'}</div>;

  const imageSrc = getImage(id);

  // Helper for price formatting (same as in Projects page)
  const formatProjectPrice = (price) => {
    if (!price) return 'N/A';
    if (price < 10) return `₹${price} Cr`;
    return `₹${price} L`;
  };

  return (
    <div className="detail-page container">
      <div className="back-link">
        <Link to="/projects">← Back to projects</Link>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <img src={imageSrc} alt={project.apartment_name} className="hero-image" />
          
          <div className="detail-content">
            <span className="property-type">{project.developer_name?.toUpperCase()} · {project.project_status?.toUpperCase()}</span>
            <h1 className="detail-title">{project.apartment_name}</h1>
            <p className="detail-locality">
              <span className="pin-icon">📍</span> 
              {project.locality?.charAt(0).toUpperCase() + project.locality?.slice(1)}, Hyderabad
            </p>

            <p className="detail-description">
              A premium residential project by {project.developer_name}. 
              Currently {project.project_status} with {project.total_units} total units across {project.total_towers} towers.
            </p>

            <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontSize: '1.2rem'}}>Project Details</h3>
            <div className="features-grid">
              {project.total_units && (
                <div className="feature-card">
                  <span className="feature-icon">🏢</span> {project.total_units} Units
                </div>
              )}
              {project.total_towers && (
                <div className="feature-card">
                  <span className="feature-icon">🏙️</span> {project.total_towers} Towers
                </div>
              )}
              {project.total_floors && (
                <div className="feature-card">
                  <span className="feature-icon">🪜</span> {project.total_floors} Floors
                </div>
              )}
              {(project.min_area_sqft || project.max_area_sqft) && (
                <div className="feature-card">
                  <span className="feature-icon">📏</span> {project.min_area_sqft} - {project.max_area_sqft} sqft
                </div>
              )}
              {project.launch_date && (
                <div className="feature-card">
                  <span className="feature-icon">📅</span> Launch: {project.launch_date}
                </div>
              )}
              {project.possession_date && (
                <div className="feature-card">
                  <span className="feature-icon">🔑</span> Possession: {project.possession_date}
                </div>
              )}
            </div>

            {project.amenities && project.amenities.length > 0 && (
              <>
                <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontSize: '1.2rem'}}>Amenities</h3>
                <div className="features-grid">
                  {project.amenities.map(amenity => (
                    <div className="feature-card" key={amenity}>
                      <span className="feature-icon">✨</span> {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {project.rera_number && (
              <p style={{marginTop: '2rem', fontSize: '0.8rem', color: 'var(--color-text-light)', fontFamily: 'monospace'}}>
                RERA: {project.rera_number}
              </p>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="action-card">
            <p className="asking-label">PRICE RANGE</p>
            <h2 className="asking-price" style={{fontSize: '1.8rem'}}>
              {formatProjectPrice(project.price_min)} - {formatProjectPrice(project.price_max)}
            </h2>
            
            <div className="lister-info">
              <p className="listed-by">{project.developer_name}</p>
              <p className="lister-type">Developer</p>
            </div>
            
            <div style={{
              background: 'var(--color-bg)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem'}}>{project.total_listings}</p>
              <p style={{fontSize: '0.8rem', color: 'var(--color-text-light)'}}>Active resale/rent listings in this project</p>
            </div>

            <button className="contact-btn">
              Contact Developer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
