import React from "react";
import { Button } from "antd";
import "./AnimatedButton.css";

const AnimatedButton = ({ children, className = "", ...props }) => {
  return (
    <Button className={`animated-button ${className}`} {...props}>
      {children}
    </Button>
  );
};

export default AnimatedButton;

