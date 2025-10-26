import React, { useRef, useEffect, useState } from "react";
import { Card } from "antd";
import "./LightningCard.css";

const LightningCard = ({ children, className = "", delay = 0, ...props }) => {
  const [isVisible, setVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(cardRef.current);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Card
      ref={cardRef}
      className={`lightning-card ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ animationDelay: isVisible ? `${delay}ms` : "0ms" }}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <div
        className="lightning-card-glow"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(24, 144, 255, 0.15), transparent 40%)`,
        }}
      />
      <div className="lightning-card-content">{children}</div>
    </Card>
  );
};

export default LightningCard;

