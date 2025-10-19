import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Space,
  Spin,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const { Title, Paragraph } = Typography;

const VerifyContractOTP = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const account = useSelector((state) => state.account?.user || {});
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userData = account.email ? account : localUser;

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để xác thực OTP");
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle form submission
  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await api.post(`/contracts/${contractId}/sign`, {
        otp: values.otp,
      });

      message.success("Ký hợp đồng thành công!");
      navigate("/my-contracts");
    } catch (error) {
      console.error("Error signing contract:", error);
      if (error.response?.status === 400) {
        message.error("Mã OTP không đúng hoặc đã hết hạn");
      } else {
        message.error("Không thể ký hợp đồng. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await api.post(`/contracts/${contractId}/send-otp`);
      message.success("Mã OTP mới đã được gửi đến email của bạn");
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      console.error("Error resending OTP:", error);
      message.error("Không thể gửi lại mã OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // Handle back to contracts
  const handleBack = () => {
    navigate("/my-contracts");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title level={2} style={{ marginBottom: "8px" }}>
            Xác thực OTP
          </Title>
          <Paragraph type="secondary">
            Nhập mã OTP đã được gửi đến email của bạn để ký hợp đồng
          </Paragraph>
        </div>

        <Form
          form={form}
          name="verify-otp"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="otp"
            label="Mã OTP"
            rules={[
              { required: true, message: "Vui lòng nhập mã OTP" },
              { len: 6, message: "Mã OTP phải có 6 chữ số" },
            ]}
          >
            <Input
              placeholder="Nhập mã OTP 6 chữ số"
              maxLength={6}
              style={{
                textAlign: "center",
                fontSize: "18px",
                letterSpacing: "2px",
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: "16px" }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
            >
              {loading ? "Đang xác thực..." : "Xác thực và ký hợp đồng"}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: "16px" }}>
            <Button
              type="link"
              onClick={handleResendOTP}
              loading={resendLoading}
              disabled={countdown > 0}
              block
              icon={<ReloadOutlined />}
            >
              {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: "0" }}>
            <Button
              type="text"
              onClick={handleBack}
              block
              icon={<ArrowLeftOutlined />}
            >
              Quay lại danh sách hợp đồng
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Paragraph type="secondary" style={{ fontSize: "12px" }}>
            Mã OTP có hiệu lực trong 10 phút. Vui lòng kiểm tra email của bạn.
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default VerifyContractOTP;
