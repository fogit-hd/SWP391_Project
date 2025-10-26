import React, { useRef, useEffect, useState } from "react";
import { Card } from "antd";
import "./AnimatedCard.css";

const AnimatedCard = ({ children, className = "", delay = 0, ...props }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Card
      ref={domRef}
      className={`animated-card ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ animationDelay: isVisible ? `${delay}ms` : "0ms" }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default AnimatedCard;

