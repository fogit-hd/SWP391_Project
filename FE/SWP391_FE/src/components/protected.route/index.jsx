import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ roleId, children }) {
  const account = useSelector((store) => store.account);
  const navigate = useNavigate();

  console.log("=== ProtectedRoute Debug ===");
  console.log("Full account object:", account);
  console.log("Current user roleId:", account?.roleId);
  console.log("Required roleId:", roleId);
  console.log("RoleId type:", typeof account?.roleId);
  console.log("Comparison result:", account?.roleId === roleId);
  console.log("===========================");

  if (account?.roleId === roleId) {
    // dạ em mời anh qua
    return children;
  } else {
    // m đéo có quyền truy cập, cút ra ngoài
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button
            onClick={() => {
              navigate("/");
            }}
            type="primary"
          >
            Back to homepage
          </Button>
        }
      />
    );
  }
}

export default ProtectedRoute;
