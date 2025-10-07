import { Button, Result } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

function ProtectedRoute({ role, children }) {
  // so sánh role của account đang đăng nhập và cái role mà page yêu cầu

  const account = useSelector((store) => store.account);
  const navigate = useNavigate();

  if (account?.role === role) {
    // cho qua
    return children;
  } else {
    // m ko có quyền truy cập
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button
            onClick={() => {
              navigate("/dashboard");
            }}
            type="primary"
          >
            Back Home
          </Button>
        }
      />
    );
  }
}

export default ProtectedRoute;
