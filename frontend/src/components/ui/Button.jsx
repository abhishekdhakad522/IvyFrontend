import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled, 
  ...props 
}) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : '';
  const combinedClass = `${baseClass} ${className}`.trim();

  return (
    <button 
      className={combinedClass} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
};

export default Button;
