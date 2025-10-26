import React, { useEffect, useRef } from 'react';
import './Orb.css';

const Orb = ({ 
  children, 
  className = '',
  orbCount = 3,
  colors = ['#1890ff', '#40a9ff', '#69c0ff'],
  blur = 100,
  duration = 20,
  style = {}
}) => {
  const containerRef = useRef(null);
  const orbsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create orbs dynamically
    orbsRef.current.forEach((orb, index) => {
      if (!orb) return;
      
      // For single orb, make it smaller to only surround text content
      const size = orbCount === 1 ? 550 : Math.random() * 200 + 300;
      const delay = index * (duration / orbCount);
      
      orb.style.width = `${size}px`;
      orb.style.height = `${size}px`;
      orb.style.background = `radial-gradient(circle, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}80 40%, transparent 70%)`;
      orb.style.filter = `blur(${blur}px)`;
      orb.style.animationDelay = `-${delay}s`;
      orb.style.opacity = orbCount === 1 ? '0.7' : '0.8';
    });
  }, [orbCount, colors, blur, duration]);

  return (
    <div 
      ref={containerRef}
      className={`orb-container ${className}`}
      style={style}
    >
      <div className="orb-wrapper">
        {Array.from({ length: orbCount }).map((_, index) => (
          <div
            key={index}
            ref={(el) => (orbsRef.current[index] = el)}
            className="orb"
            style={{
              animationDuration: `${duration}s`,
            }}
          />
        ))}
      </div>
      <div className="orb-content">
        {children}
      </div>
    </div>
  );
};

export default Orb;

