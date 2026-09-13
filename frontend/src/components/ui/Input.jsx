import React from 'react';

const Input = ({ 
  label, 
  id, 
  icon: Icon, 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`input-group ${containerClassName}`.trim()}>
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input-with-icon">
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          id={id}
          className={`input-field ${Icon ? 'icon-padding' : ''} ${className}`.trim()}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
