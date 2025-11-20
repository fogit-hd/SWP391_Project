import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { MailOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./verify-otp.css";

const VerifyOTP = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state or localStorage (fallback)
    const emailFromState = location.state?.email; // là biến email của navigate("/verify-otp", { state: { email: values.email } }); bên file register ( index.jsx )
    const emailFromStorage = localStorage.getItem("email"); // là biến values.email bên file register ( index.jsx ) đã lưu vào
    const emailToUse = emailFromState || emailFromStorage; // trường hợp check xem chỉ cần tồn tại 1 trong 2 cái là được

    if (emailToUse) {
      setEmail(emailToUse); //setEmail của useState hiện tại thành email vừa lấy được
      form.setFieldsValue({ email: emailToUse }); //set giá trị bên trong cái ô nhập thành email này luôn
    }
  }, [location.state, form]); // hệ thống sẽ tự động chạy useEffect này khi location.state ( tức là cái giá trị email bên register khi navigate qua đây thay đổi, thì web bên này cũng thay đổi theo ) hoặc giá trị trong form khi có sự thay thay đổi

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const requestData = {
        email: localStorage.getItem("email"),
        otp: values.otp,
      };

      console.log("Verifying OTP with data:", requestData);

      message.loading("Đang xác thực OTP...", 0);

      const response = await api.post("/auth/verify-account", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();
      toast.success("Xác thực tài khoản thành công!");
      toast.success("Tài khoản của bạn đã được kích hoạt! Bạn có thể đăng nhập ngay bây giờ.");

      // Clear email from localStorage
      localStorage.removeItem("email");

      // Navigate to login page
      navigate("/login");

      console.log("Verification response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Verification error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Xác thực OTP thất bại. Vui lòng thử lại.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "OTP không hợp lệ. Vui lòng kiểm tra và thử lại.";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy email. Vui lòng đăng ký lại.";
      } else if (error.response?.status === 410) {
        errorMessage =
          error.response.data?.message ||
          "OTP đã hết hạn. Vui lòng yêu cầu mã mới.";
      } else if (error.response?.status === 500) {
        errorMessage =
          error.response.data?.message ||
          "Lỗi máy chủ. Vui lòng thử lại sau.";
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setIsResendDisabled(true);
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOTP = async () => {
    try {
      message.loading("Đang gửi lại OTP...", 0);

      await api.post(
        "/auth/resend-otp",
        { email: email },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      message.destroy();
      toast.success("OTP đã được gửi lại đến email của bạn!");

      // Bắt đầu countdown 60s
      startCountdown();
    } catch (error) {
      message.destroy();
      console.error("Resend OTP error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Gửi lại OTP thất bại. Vui lòng thử lại.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Địa chỉ email không hợp lệ.";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy email. Vui lòng đăng ký trước.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "Quá nhiều yêu cầu. Vui lòng đợi trước khi yêu cầu OTP mới.";
      } else if (error.response?.status === 500) {
        errorMessage =
          error.response.data?.message ||
          "Lỗi máy chủ. Vui lòng thử lại sau.";
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-content">
        <div className="verify-container">
          {/* Background */}
          <div className="verify-background"></div>

          <div className="verify-card-container">
            <Card className="verify-card">
              <div className="verify-header">
                <h2 className="verify-title">Xác thực tài khoản của bạn</h2>
                <p className="verify-subtitle">
                  Vui lòng nhập OTP được gửi đến địa chỉ email của bạn để đổi
                  mật khẩu.
                  <br />
                  <MailOutlined />{" "}
                  <strong>{localStorage.getItem("email")}</strong>
                </p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                className="verify-form"
              >
                {/* OTP */}
                <Form.Item
                  label="Mã xác thực"
                  name="otp"
                  rules={[
                    { required: true, message: "OTP là bắt buộc" },
                    { min: 6, message: "OTP phải có ít nhất 6 ký tự" },
                    { max: 6, message: "OTP phải có đúng 6 ký tự" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "OTP chỉ được chứa số",
                    },
                  ]}
                >
                  <Input
                    placeholder="Nhập OTP 6 chữ số"
                    type="text"
                    prefix={<SafetyOutlined />}
                    allowClear
                    maxLength={6}
                  />
                </Form.Item>

                {/* Resend OTP Link */}
                <div className="resend-otp-container">
                  <p>
                    Không nhận được mã?{" "}
                    <Button
                      type="link"
                      onClick={resendOTP}
                      disabled={isResendDisabled}
                      className="resend-otp-link"
                    >
                      {isResendDisabled
                        ? `Gửi lại OTP (${countdown}s)`
                        : hasRequestedResend
                        ? "Gửi lại OTP"
                        : "Gửi lại OTP"}
                    </Button>
                  </p>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                    className="verify-submit-button"
                  >
                    {isLoading ? "Đang xác thực..." : "Xác thực tài khoản"}
                  </Button>
                </Form.Item>
              </Form>
              
              <div className="verify-login-link" style={{ position: 'relative', zIndex: 10, marginTop: '16px', textAlign: 'center' }}>
                Đã xác thực? <Link to="/login" style={{ pointerEvents: 'auto', cursor: 'pointer', color: '#1890ff', textDecoration: 'none', fontWeight: 500 }}>Đăng nhập</Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
