import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Space, Divider, Button } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
import "./contact-us.css";

const { Title, Paragraph, Text } = Typography;

const ContactUs = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      id: 1,
      name: "Huỳnh Dũng Phong",
      role: "Frontend Developer",
      email: "phonghd@gmail.com",
      phone: "0123456789",
      responsibilities: "Frontend development",
    },
    {
      id: 2,
      name: "Phạm Huỳnh Quốc Huy",
      role: "Frontend Developer",
      email: "huyphq@gmail.com",
      phone: "0123456789",
      responsibilities: "Frontend development",
    },
    {
      id: 3,
      name: "Lê Ngọc Khải Nguyên",
      role: "Frontend Developer",
      email: "nguyenlnk@gmail.com",
      phone: "0123456789",
      responsibilities: "Frontend development",
    },
    {
      id: 4,
      name: "Trần Văn Thụy",
      role: "Backend Developer",
      email: "thuytv@gmail.com",
      phone: "0123456789",
      responsibilities: "Backend development",
    },
    {
      id: 5,
      name: "Mai Tuấn Vỹ",
      role: "Backend Developer",
      email: "vytm@gmail.com",
      phone: "0123456789",
      responsibilities: "Backend development",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Card>
          <div style={{ marginBottom: "24px" }}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{ marginBottom: "16px" }}
            >
              Về trang chủ
            </Button>
          </div>
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <Title level={1}>Liên hệ với chúng tôi</Title>
            <Paragraph style={{ fontSize: "16px", color: "#666" }}>
              Giới thiệu về đội ngũ phát triển dự án SWP391
            </Paragraph>
          </div>

          <Divider />

          <Row gutter={[24, 24]}>
            {teamMembers.map((member) => (
              <Col xs={24} sm={12} lg={8} key={member.id}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                        }}
                      >
                        <UserOutlined
                          style={{ fontSize: "40px", color: "#fff" }}
                        />
                      </div>
                      <Title level={4} style={{ margin: 0 }}>
                        {member.name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: "14px" }}>
                        {member.role}
                      </Text>
                    </div>

                    <Divider style={{ margin: "16px 0" }} />

                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <Space>
                        <MailOutlined style={{ color: "#1890ff" }} />
                        <Text>{member.email}</Text>
                      </Space>
                      <Space>
                        <PhoneOutlined style={{ color: "#52c41a" }} />
                        <Text>{member.phone}</Text>
                      </Space>
                    </Space>

                    <div style={{ marginTop: "16px" }}>
                      <Text strong>Nhiệm vụ:</Text>
                      <Paragraph
                        style={{
                          marginTop: "8px",
                          marginBottom: 0,
                          fontSize: "13px",
                          color: "#666",
                        }}
                      >
                        {member.responsibilities}
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider style={{ marginTop: "40px" }} />

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Title level={3}>Dự án SWP391</Title>
            <Paragraph style={{ fontSize: "16px", color: "#666" }}>
              Hệ thống quản lý đồng sở hữu xe điện
            </Paragraph>
            <Paragraph style={{ fontSize: "14px", color: "#999" }}>
              © 2025 SWP391 Team. All rights reserved.
            </Paragraph>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs;

