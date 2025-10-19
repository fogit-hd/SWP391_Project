import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";

const MyContracts = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <h2>Redirecting to My Contracts...</h2>
      <Button type="primary" onClick={() => navigate("/view-mycontract")}>
        Go to My Contracts
      </Button>
    </div>
  );
};

export default MyContracts;
