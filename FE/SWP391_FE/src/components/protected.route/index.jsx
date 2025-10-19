import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ roleId, children }) {
  const account = useSelector((store) => store.account);
  const navigate = useNavigate();


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
