import React from "react";
import { Button } from "antd";
import "./StarBorder.css";

const StarBorder = ({ children, className = "", as = "button", ...props }) => {
  return (
    <div className="star-border-wrapper">
      <Button className={`star-border-button ${className}`} {...props}>
        <span className="star-border-content">{children}</span>
        <div className="star-border-overlay">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </Button>
    </div>
  );
};

export default StarBorder;

