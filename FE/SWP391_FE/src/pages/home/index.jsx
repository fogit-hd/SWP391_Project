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
  ShoppingCartOutlined,
  LeftOutlined,
  RightOutlined,
  EnvironmentOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";
import "./home.css";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Homepage = () => {
  const account = useSelector((store) => store.account);
  const dispatch = useDispatch();
  const [currentProduct, setCurrentProduct] = useState(0);

  const user = {
    name: "Alex Reid",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=2080",
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const coOwnershipPlans = [
    {
      name: "Urban Commuter",
      monthlyCost: "$89/month",
      image:
        "https://images.unsplash.com/photo-1620027734496-2f08b35b6c82?auto=format&fit=crop&q=80&w=2062",
      description:
        "Perfect for city commuting. Share costs with 2-3 other members and enjoy premium electric bikes for daily travel.",
      specs: { usage: "Up to 500km", members: "2-3 people" },
    },
    {
      name: "Adventure Seeker",
      monthlyCost: "$129/month",
      image:
        "https://images.unsplash.com/photo-1627961958410-a9f4e2f5b355?auto=format&fit=crop&q=80&w=2062",
      description:
        "Ideal for weekend adventures and outdoor enthusiasts. Share high-performance e-bikes with adventure partners.",
      specs: { usage: "Up to 800km", members: "2-4 people" },
    },
    {
      name: "Family Fleet",
      monthlyCost: "$199/month",
      image:
        "https://images.unsplash.com/photo-1598226463239-7a020f5a728b?auto=format&fit=crop&q=80&w=2062",
      description:
        "Complete family solution with multiple e-bikes. Share the fleet with other families in your neighborhood.",
      specs: { usage: "Up to 1000km", members: "2-3 families" },
    },
  ];

  const testimonials = [
    {
      quote:
        "EV Co-ownership changed everything for me! I'm saving $200/month compared to buying my own e-bike, and I get access to premium models. The sharing schedule works perfectly with my neighbors.",
      author: "Jessica M.",
      rating: 5,
    },
    {
      quote:
        "As someone who only uses an e-bike on weekends, co-ownership made perfect sense. I pay a fraction of the cost and get access to top-tier adventure bikes when I need them.",
      author: "David L.",
      rating: 5,
    },
    {
      quote:
        "Our family shares a fleet with two other families in our building. The kids love having different bikes to choose from, and we've built amazing friendships through this community.",
      author: "Sarah K.",
      rating: 5,
    },
  ];

  const nextPlan = () =>
    setCurrentProduct((prev) => (prev + 1) % coOwnershipPlans.length);
  const prevPlan = () =>
    setCurrentProduct((prev) => (prev - 1 + coOwnershipPlans.length) % coOwnershipPlans.length);

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
    },
    {
      key: "orders",
      icon: <ShoppingCartOutlined />,
      label: "Order History",
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
    <Layout style={{ minHeight: "100vh", background: "#001529" }}>
      <Header className="header">
        <Title
          level={2}
          style={{ color: "#1890ff", margin: 0, fontWeight: "bold" }}
        >
          EV CoShare
        </Title>

        <Menu
          theme="dark"
          mode="horizontal"
          style={{
            background: "transparent",
            border: "none",
            minWidth: "400px",
            justifyContent: "center",
          }}
          items={[
            { key: "plans", label: "Co-Ownership Plans" },
            { key: "benefits", label: "Benefits" },
            { key: "contact", label: "Contact" },
          ]}
        />

        <Space>
          {account ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {account.fullName}
                </Text>
                <Avatar
                  src={user.avatar}
                  size={40}
                  style={{ border: "2px solid #1890ff" }}
                />
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Link to="/login">
                <Button ghost>Login</Button>
              </Link>
              <Link to="/register">
                <Button type="primary">Register</Button>
              </Link>
            </Space>
          )}
        </Space>
      </Header>

      <Content style={{ marginTop: 64 }}>
        {/* Hero Section */}
        <div
          style={{
            height: "100vh",
            backgroundImage:
              "url(https://images.unsplash.com/photo-1620802051782-725fa33db067?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0, 21, 41, 0.9), rgba(0, 21, 41, 0.7), transparent)",
            }}
          ></div>
          <div style={{ position: "relative", zIndex: 10, color: "white" }}>
            <Title
              level={1}
              style={{
                color: "white",
                fontSize: "4rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Share the Future.
            </Title>
            <Paragraph
              style={{
                fontSize: "1.25rem",
                color: "#bfbfbf",
                maxWidth: "600px",
                margin: "0 auto 2rem",
              }}
            >
              Experience premium electric vehicles without the full cost. Join our 
              co-ownership community and share the benefits of sustainable transportation.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              style={{
                height: "50px",
                padding: "0 40px",
                fontSize: "18px",
                borderRadius: "25px",
              }}
            >
              Join Co-Ownership
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: "80px 50px", background: "#001529" }}>
          <Row justify="center" style={{ marginBottom: "60px" }}>
            <Col>
              <Title level={1} style={{ color: "white", textAlign: "center" }}>
                Why Choose Co-Ownership?
              </Title>
            </Col>
          </Row>
          <Row gutter={[32, 32]} justify="center">
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
              <Col key={index} xs={24} md={8}>
                <Card
                  style={{
                    background: "#002140",
                    border: "1px solid #1890ff",
                    borderRadius: "16px",
                    textAlign: "center",
                    height: "300px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: "32px" }}
                  hoverable
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "16px",
                      background: "#001529",
                      borderRadius: "50%",
                      border: "1px solid #1890ff",
                      marginBottom: "24px",
                    }}
                  >
                    <div style={{ fontSize: "32px", color: "#1890ff" }}>
                      {feature.icon}
                    </div>
                  </div>
                  <Title
                    level={3}
                    style={{ color: "white", marginBottom: "16px" }}
                  >
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: "#bfbfbf", lineHeight: "1.6" }}>
                    {feature.text}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Product Showcase Section */}
        <div style={{ padding: "80px 50px", background: "#002140" }}>
          <Row justify="center" style={{ marginBottom: "60px" }}>
            <Col>
              <Title level={1} style={{ color: "white", textAlign: "center" }}>
                Choose Your Co-Ownership Plan
              </Title>
            </Col>
          </Row>
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <Carousel
              beforeChange={(from, to) => setCurrentProduct(to)}
              autoplay={false}
              effect="fade"
              arrows
              prevArrow={<LeftOutlined />}
              nextArrow={<RightOutlined />}
            >
              {coOwnershipPlans.map((plan) => (
                <div key={plan.name}>
                  <Row gutter={0} align="middle">
                    <Col xs={24} lg={12}>
                      <img
                        src={plan.image}
                        alt={plan.name}
                        style={{
                          width: "100%",
                          height: "400px",
                          objectFit: "cover",
                        }}
                      />
                    </Col>
                    <Col xs={24} lg={12}>
                      <div style={{ padding: "48px", background: "#002140" }}>
                        <Title
                          level={1}
                          style={{ color: "white", marginBottom: "16px" }}
                        >
                          {plan.name}
                        </Title>
                        <Paragraph
                          style={{ color: "#bfbfbf", marginBottom: "24px" }}
                        >
                          {plan.description}
                        </Paragraph>
                        <Row gutter={32} style={{ marginBottom: "32px" }}>
                          <Col span={12}>
                            <div
                              style={{ textAlign: "center", padding: "16px 0" }}
                            >
                              <EnvironmentOutlined
                                style={{
                                  fontSize: "24px",
                                  color: "#1890ff",
                                  marginBottom: "8px",
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                  color: "white",
                                }}
                              >
                                {plan.specs.usage}
                              </div>
                              <div
                                style={{ fontSize: "14px", color: "#bfbfbf" }}
                              >
                                Monthly Usage
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div
                              style={{ textAlign: "center", padding: "16px 0" }}
                            >
                              <UserOutlined
                                style={{
                                  fontSize: "24px",
                                  color: "#1890ff",
                                  marginBottom: "8px",
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                  color: "white",
                                }}
                              >
                                {plan.specs.members}
                              </div>
                              <div
                                style={{ fontSize: "14px", color: "#bfbfbf" }}
                              >
                                Co-Owners
                              </div>
                            </div>
                          </Col>
                        </Row>
                        <Title
                          level={2}
                          style={{ color: "#1890ff", marginBottom: "24px" }}
                        >
                          {plan.monthlyCost}
                        </Title>
                        <Button
                          ghost
                          size="large"
                          style={{
                            padding: "0 32px",
                            height: "40px",
                            borderRadius: "20px",
                          }}
                        >
                          Join This Plan
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Carousel>
          </div>
        </div>

        {/* Testimonials Section */}
        <div style={{ padding: "80px 50px", background: "#001529" }}>
          <Row justify="center" style={{ marginBottom: "60px" }}>
            <Col>
              <Title level={1} style={{ color: "white", textAlign: "center" }}>
                Trusted by Co-Owners
              </Title>
            </Col>
          </Row>
          <Row justify="center">
            <Col xs={24} lg={16}>
              <Carousel autoplay>
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    <Rate
                      disabled
                      value={testimonial.rating}
                      style={{ color: "#faad14", marginBottom: "24px" }}
                    />
                    <Paragraph
                      style={{
                        fontSize: "18px",
                        color: "#bfbfbf",
                        fontStyle: "italic",
                        marginBottom: "24px",
                        lineHeight: "1.6",
                      }}
                    >
                      "{testimonial.quote}"
                    </Paragraph>
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      - {testimonial.author}
                    </Text>
                  </div>
                ))}
              </Carousel>
            </Col>
          </Row>
        </div>

        {/* Call to Action Section */}
        <div
          style={{
            padding: "80px 50px",
            background: "#002140",
            textAlign: "center",
            position: "relative",
            backgroundImage:
              "url(https://images.unsplash.com/photo-1511994294314-3c662760f3d5?auto=format&fit=crop&q=80&w=2670)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 33, 64, 0.9)",
            }}
          ></div>
          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <Title level={1} style={{ color: "white", marginBottom: "16px" }}>
              Ready to Start Sharing?
            </Title>
            <Paragraph
              style={{
                fontSize: "18px",
                color: "#bfbfbf",
                marginBottom: "32px",
              }}
            >
              Join our co-ownership community today and start saving on premium electric vehicles.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              style={{
                height: "50px",
                padding: "0 40px",
                fontSize: "18px",
                borderRadius: "25px",
              }}
            >
              Start Co-Owning
            </Button>
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer
        style={{
          background: "#001529",
          color: "#bfbfbf",
          padding: "64px 50px 32px",
        }}
      >
        <Row gutter={[32, 32]}>
          <Col xs={24} md={6}>
            <Title level={3} style={{ color: "white", marginBottom: "16px" }}>
              EV CoShare - Electric Vehicle Co-Ownership
            </Title>
            <Paragraph style={{ maxWidth: "300px", color: "#bfbfbf" }}>
              Share the future of sustainable transportation. Join our co-ownership 
              community and access premium electric vehicles at a fraction of the cost.
            </Paragraph>
          </Col>
          <Col xs={24} md={6}>
            <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
              Co-Ownership Plans
            </Title>
            <Space direction="vertical" size="small">
              {["Urban Commuter", "Adventure Seeker", "Family Fleet", "Custom Plans"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{ color: "#bfbfbf", display: "block" }}
                >
                  {item}
                </a>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
              Company
            </Title>
            <Space direction="vertical" size="small">
              {["How It Works", "Success Stories", "Partner With Us"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{ color: "#bfbfbf", display: "block" }}
                >
                  {item}
                </a>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
              Follow Us
            </Title>
            <Space direction="vertical" size="small">
              {["Facebook", "Instagram", "Twitter"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{ color: "#bfbfbf", display: "block" }}
                >
                  {item}
                </a>
              ))}
            </Space>
          </Col>
        </Row>
        <Divider style={{ borderColor: "#1890ff", margin: "32px 0 16px" }} />
        <div style={{ textAlign: "center", color: "#bfbfbf" }}>
          <Text>
            &copy; {new Date().getFullYear()} EV CoShare. All Rights Reserved.
          </Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default Homepage;