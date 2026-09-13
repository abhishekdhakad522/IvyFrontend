import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { formatCurrency } from '../utils/dataSanitizer';
import Button from '../components/ui/Button';

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

// A simple project card component inline
const ProjectCard = ({ project }) => {
  // Fix the price floats based on findings (e.g., 65.2 means 65.2 Lakhs or Crores?)
  // Let's assume if price < 1000 it's in Lakhs (or millions? Usually Lakhs in India if small, or Crores).
  // If max is 56.8 it could mean Crores, or if it's 85.4 it could mean Lakhs. The API says price_min/max are returned as small floats. 
  // Wait, in findings it said: "price_min and price_max for projects are returned as small floats (e.g., 65.2, 1.21), likely Lakhs or Crores."
  // If price < 10, it's probably Crores (e.g. 1.21 Cr). If > 10, it's Lakhs (e.g. 65.2 L).
  // Let's format it directly.
  const formatProjectPrice = (price) => {
    if (!price) return 'N/A';
    if (price < 10) return `₹${price} Cr`;
    return `₹${price} L`;
  };

  const navigate = useNavigate();

  return (
    <div className="listing-card" onClick={() => navigate(`/project/${project.project_id}`)} style={{ cursor: 'pointer' }}>
      <div className="listing-image-container">
        <img src={getImage(project.project_id)} alt={project.apartment_name} className="listing-image" />
      </div>
      <div className="listing-content">
        <div className="listing-header">
          <span className="listing-subtitle">{project.developer_name?.toUpperCase()} · {project.locality?.toUpperCase()}</span>
        </div>
        
        <h3 className="listing-title">{project.apartment_name}</h3>
        
        <div className="listing-price-row">
          <span className="listing-price">{formatProjectPrice(project.price_min)} - {formatProjectPrice(project.price_max)}</span>
        </div>
        
        <div className="listing-features">
          <span>{project.project_status}</span>
          <span>{project.total_units} units</span>
          <span>{project.total_listings} active listings</span>
        </div>
      </div>
      
      <div className="listing-footer">
        <span className="listing-posted">
          Launch: {project.launch_date}
        </span>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const fetchProjects = async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentOffset = isLoadMore ? offset + LIMIT : 0;
      const response = await apiClient.get('/v1/projects', {
        params: { limit: LIMIT, offset: currentOffset }
      });
      
      const data = response.data;
      if (isLoadMore) {
        setProjects(prev => [...prev, ...data.results]);
      } else {
        setProjects(data.results);
      }
      
      setHasMore(data.has_more || data.results.length === LIMIT);
      if (isLoadMore) setOffset(currentOffset);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="browse-page container">
      <div className="browse-header">
        <div className="browse-header-left">
          <p className="breadcrumb">(A) BROWSE → PROJECTS</p>
          <h1>Builder Projects</h1>
          <p className="subtitle">New developments and under-construction properties</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading projects...</div>
      ) : (
        <>
          <div className="listings-grid">
            {projects.map(project => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <Button 
                onClick={() => fetchProjects(true)} 
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

export default Projects;
