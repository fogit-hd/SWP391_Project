import React, { useState, useEffect } from "react";
import {
  Button,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Carousel,
  Rate,
  Divider,
} from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  FireOutlined,
  UserOutlined,
  LogoutOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";
import "./home.css";
import "../../../index.css";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Homepage = () => {
  const account = useSelector((store) => store.account);
  const dispatch = useDispatch();

  const user = {
    name: "Alex Reid",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=2080",
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const testimonials = [
    {
      quote:
        "EV Co-ownership changed everything for me! I'm saving $200/month compared to buying my own e-bike, and I get access to premium models. The sharing schedule works perfectly with my neighbors.",
      author: "JohHuy Q.",
      rating: 5,
    },
    {
      quote:
        "As someone who only uses an e-bike on weekends, co-ownership made perfect sense. I pay a fraction of the cost and get access to top-tier adventure bikes when I need them.",
      author: "DavidVy M.",
      rating: 4.5,
    },
    {
      quote:
        "Our family shares a fleet with two other families in our building. The kids love having different bikes to choose from, and we've built amazing friendships through this community.",
      author: "SarahNgyn L.",
      rating: 4.9,
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
    },
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "History",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="page-layout">
      <Header className="header">
        <Title level={2} className="site-title">
          EVCS
        </Title>

        <Space className="nav-menu">
          <Link to="/available">
            <Button type="text" className="nav-menu-button">
              Available teams
            </Button>
          </Link>
          <Link to="/contact">
            <Button type="text" className="nav-menu-button">
              Contact Us
            </Button>
          </Link>
        </Space>

        <Space className="header-actions">
          {account ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space className="user-profile">
                <Text className="user-name">{account.fullName}</Text>
                <Avatar src={user.avatar} size={40} className="user-avatar" />
              </Space>
            </Dropdown>
          ) : (
            <Space className="auth-buttons">
              <Link to="/login">
                <Button ghost className="nav-button">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button type="primary" className="nav-button">
                  Register
                </Button>
              </Link>
            </Space>
          )}
        </Space>
      </Header>

      <Content className="page-content">
        {/* Hero Section */}
        <div className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <Title level={1} className="hero-title">
              Share the Future.
            </Title>
            <Paragraph className="hero-paragraph">
              Experience premium electric vehicles without the full cost. Join
              our co-ownership community and share the benefits of sustainable
              transportation.
            </Paragraph>
            <Link to="/contract">
              <Button type="primary" size="large" className="hero-cta">
                Join Co-Ownership Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <Row justify="center" className="section-header">
            <Col>
              <Title level={1} className="section-title">
                Why Choose Co-Ownership?
              </Title>
            </Col>
          </Row>
          <div className="features-grid">
            {[
              {
                icon: <RocketOutlined />,
                title: "Cost Savings",
                text: "Save up to 70% on electric vehicle costs by sharing ownership with like-minded individuals.",
              },
              {
                icon: <FireOutlined />,
                title: "Premium Access",
                text: "Access top-tier electric vehicles and bikes without the full purchase price.",
              },
              {
                icon: <ThunderboltOutlined />,
                title: "Flexible Usage",
                text: "Use vehicles when you need them, share costs when you don't. Perfect for occasional users.",
              },
            ].map((feature, index) => (
              <Card key={index} className="feature-card" hoverable>
                <div className="feature-icon-container">
                  <div className="feature-icon">{feature.icon}</div>
                </div>
                <Title level={3} className="feature-title">
                  {feature.title}
                </Title>
                <Paragraph className="feature-description">
                  {feature.text}
                </Paragraph>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="testimonials-section">
          <Row justify="center" className="section-header">
            <Col>
              <Title level={1} className="section-title">
                Trusted by Co-Owners
              </Title>
            </Col>
          </Row>
          <Row justify="center">
            <Col xs={24} lg={16}>
              <Carousel autoplay className="testimonials-carousel">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-item">
                    <Rate
                      disabled
                      value={testimonial.rating}
                      className="testimonial-rating"
                    />
                    <Paragraph className="testimonial-quote">
                      "{testimonial.quote}"
                    </Paragraph>
                    <Text className="testimonial-author">
                      - {testimonial.author}
                    </Text>
                  </div>
                ))}
              </Carousel>
            </Col>
          </Row>
        </div>

        {/* Call to Action Section */}
        <div className="cta-section">
          <div className="cta-overlay" />
          <div className="cta-content">
            <Title level={1} className="cta-title">
              Ready to Start Sharing?
            </Title>
            <Paragraph className="cta-paragraph">
              Join our co-ownership community today and start saving on premium
              electric vehicles.
            </Paragraph>
        

  <Link to="/view-econtract">
  <Button type="primary" size="large" className="cta-cta">
    Start Co-Owning
  </Button>
</Link>


          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="site-footer">
        <Row gutter={[32, 32]} className="footer-content">
          <Col xs={24} md={10}>
            <Title level={5} className="footer-brand-title">
              EV CoShare - Electric Vehicle Co-Ownership
            </Title>
            <Paragraph className="footer-description">
              Share the future of sustainable transportation. Join our
              co-ownership community and access premium electric vehicles at a
              fraction of the cost.
            </Paragraph>
          </Col>
          <Col xs={24} md={7}>
            <Title level={4} className="footer-section-title">
              Company
            </Title>
            <Space direction="vertical" size="small" className="footer-links">
              {["How It Works", "Success Stories", "Partner With Us"].map(
                (item) => (
                  <a key={item} href="#" className="footer-link">
                    {item}
                  </a>
                )
              )}
            </Space>
          </Col>
          <Col xs={24} md={7}>
            <Title level={4} className="footer-section-title">
              Follow Us
            </Title>
            <Space direction="vertical" size="small" className="footer-links">
              {["Facebook"].map((item) => (
                <a
                  key={item}
                  href="https://www.facebook.com/phong.huynh.192/?locale=vi_VN"
                  className="footer-link"
                >
                  {item}
                </a>
              ))}
            </Space>
          </Col>
        </Row>
        <Divider className="footer-divider" />
        <div className="footer-copyright">
          <Text className="copyright-text">
            &copy; {new Date().getFullYear()} EV CoShare. All Rights Reserved.
          </Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default Homepage;
