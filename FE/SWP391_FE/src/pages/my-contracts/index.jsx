import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import AppHeader from "../../components/reuse/AppHeader";
import AppFooter from "../../components/reuse/AppFooter";
import "./my-contracts.css";

const MyContracts = () => {
  const navigate = useNavigate();
  
  return (
    <div className="my-contracts-page">
      <AppHeader />
      <div className="my-contracts-content">
        <div className="my-contracts-inner">
          <h2>Redirecting to My Contracts...</h2>
          <Button type="primary" onClick={() => navigate("/view-mycontract")}>
            Go to My Contracts
          </Button>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default MyContracts;
