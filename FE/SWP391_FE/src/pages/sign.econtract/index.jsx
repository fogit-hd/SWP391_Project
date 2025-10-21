import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Row,
  Col,
  Alert,
  Divider,
  Statistic,
} from "antd";
import {
  SafetyCertificateOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import { toast } from "react-toastify";

const { Title, Paragraph, Text } = Typography;

const SignEContract = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userData } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");

  // Get email and contract info from location state or user data
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else if (userData?.email) {
      setEmail(userData.email);
    }

    // Set contract data from state if available
    if (location.state?.contract) {
      setContractData(location.state.contract);
    }
  }, [location.state, userData]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để ký hợp đồng");
      navigate("/login");
      return;
    }

    if (!contractId) {
      toast.error("Không tìm thấy ID hợp đồng");
      navigate("/view-mycontract");
      return;
    }

    loadContractData();
  }, [isAuthenticated, contractId, navigate]);

  // Load contract data
  const loadContractData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contracts/${contractId}`);
      setContractData(response.data);
    } catch (error) {
      console.error("Error loading contract:", error);
      message.error("Không thể tải thông tin hợp đồng");
      navigate("/view-mycontract");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    try {
      setOtpLoading(true);
      await api.post(`/contracts/${contractId}/send-otp`);
      setOtpSent(true);
      setCountdown(60); // 60 seconds countdown
      message.success("Mã OTP đã được gửi đến email của bạn");
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error sending OTP:", error);
      message.error("Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) {
      message.warning(`Vui lòng chờ ${countdown} giây trước khi gửi lại OTP`);
      return;
    }
    await handleSendOTP();
  };

  // Verify and sign contract
  const handleSignContract = async (values) => {
    try {
      setSignLoading(true);
      const payload = {
        otp: values.otp,
        email: email,
      };

      await api.post(`/contracts/${contractId}/sign`, payload);
      message.success("Hợp đồng đã được ký thành công!");
      toast.success("Hợp đồng đã được ký thành công!");
      
      // Navigate back to contracts list
      navigate("/view-mycontract");
    } catch (error) {
      console.error("Error signing contract:", error);
      if (error.response?.status === 400) {
        message.error("Mã OTP không đúng. Vui lòng kiểm tra lại.");
      } else if (error.response?.status === 404) {
        message.error("Không tìm thấy hợp đồng.");
      } else {
        message.error("Không thể ký hợp đồng. Vui lòng thử lại.");
      }
    } finally {
      setSignLoading(false);
    }
  };

  // Format countdown display
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>
          <Text>Đang tải thông tin hợp đồng...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/view-mycontract")}
              style={{ marginBottom: "16px" }}
            >
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <SafetyCertificateOutlined />
              Ký hợp đồng điện tử
            </Title>
            <Paragraph type="secondary">
              Vui lòng xác thực danh tính để ký hợp đồng
            </Paragraph>
          </div>


          {/* OTP Section */}
          <Card>
            <Title level={4}>Xác thực OTP</Title>
            
            {!otpSent ? (
              <div>
                <Alert
                  message="Bước 1: Gửi mã OTP"
                  description="Nhấn nút bên dưới để gửi mã OTP đến email của bạn"
                  type="info"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="large"
                  loading={otpLoading}
                  onClick={handleSendOTP}
                  block
                >
                  Gửi mã OTP
                </Button>
              </div>
            ) : (
              <div>
                <Alert
                  message="Mã OTP đã được gửi"
                  description={`Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra email và nhập mã OTP bên dưới.`}
                  type="success"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSignContract}
                  autoComplete="off"
                >
                  <Form.Item
                    name="otp"
                    label="Mã OTP"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã OTP" },
                      { len: 6, message: "Mã OTP phải có 6 chữ số" },
                      { pattern: /^\d{6}$/, message: "Mã OTP chỉ được chứa số" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập mã OTP 6 chữ số"
                      maxLength={6}
                      style={{ textAlign: "center", fontSize: "18px", letterSpacing: "4px" }}
                    />
                  </Form.Item>

                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ textAlign: "center" }}>
                      {countdown > 0 ? (
                        <Text type="secondary">
                          Có thể gửi lại OTP sau {formatCountdown(countdown)}
                        </Text>
                      ) : (
                        <Button
                          type="link"
                          icon={<ReloadOutlined />}
                          onClick={handleResendOTP}
                          loading={otpLoading}
                        >
                          Gửi lại mã OTP
                        </Button>
                      )}
                    </div>

                    <Divider />

                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      size="large"
                      htmlType="submit"
                      loading={signLoading}
                      block
                    >
                      Xác nhận và ký hợp đồng
                    </Button>
                  </Space>
                </Form>
              </div>
            )}
          </Card>

          {/* Security Notice */}
          <Alert
            message="Lưu ý bảo mật"
            description="Mã OTP có hiệu lực trong 5 phút. Không chia sẻ mã OTP với bất kỳ ai. Hợp đồng sau khi ký sẽ có hiệu lực pháp lý."
            type="warning"
            showIcon
          />
        </Space>
      </Card>
    </div>
  );
};

export default SignEContract;
