import React from "react";
import { Layout, Row, Col, Typography, Space, Divider } from "antd";
import "../../../pages/home/home.css";



const { Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const AppFooter = () => (
  <Footer className="site-footer">
    <Row gutter={[32, 32]} className="footer-content">
      <Col xs={24} md={10}>
        <Title level={5} className="footer-brand-title">
          EV CoShare - Electric Vehicle Co-Ownership
        </Title>
        <Paragraph className="footer-description">
          Share the future of sustainable transportation. Join our co-ownership community and access premium electric vehicles at a fraction of the cost.
        </Paragraph>
      </Col>
      <Col xs={24} md={7}>
        <Title level={4} className="footer-section-title">Company</Title>
        <Space direction="vertical" size="small" className="footer-links">
          {["How It Works", "Success Stories", "Partner With Us"].map((item) => (
            <a key={item} href="#" className="footer-link">{item}</a>
          ))}
        </Space>
      </Col>
      <Col xs={24} md={7}>
        <Title level={4} className="footer-section-title">Follow Us</Title>
        <Space direction="vertical" size="small" className="footer-links">
          <a
            href="https://www.facebook.com/phong.huynh.192/?locale=vi_VN"
            className="footer-link"
          >
            Facebook
          </a>
        </Space>
      </Col>
    </Row>
    <Divider className="footer-divider" />
    <div className="footer-copyright">
      <Text>&copy; {new Date().getFullYear()} EV CoShare. All Rights Reserved.</Text>
    </div>
  </Footer>
);

export default AppFooter;
