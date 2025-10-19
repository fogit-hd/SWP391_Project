import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Typography,
  Card,
  Space,
  Row,
  Col,
  Divider,
  Input,
  DatePicker,
  Modal,
  Checkbox,
} from "antd";
import { Link } from "react-router-dom";
import "antd/dist/reset.css";
import "./view-econtract.css";

import AdImage1 from "./picture/OIP.jpg"; // Import ad images
import AdImage2 from "./picture/tai-khoan-dong-so-huu-joint-account-la-gi-48-1.jpg";
import AdImage3 from "./picture/ecar.png";
import AppHeader from "../../components/reuse/AppHeader";
import AppFooter from "../../components/reuse/AppFooter";

import {
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const ViewEContract = () => {
  const [contracts] = useState([
    {
      id: 1,
      contract_number: "EV-2024-001",
      title: "Co-Ownership Agreement - Group A",
      file_url: "#",
      status: "Active",
      effective_from: "2024-01-01",
      expires_at: "2026-01-01",
      signed_at: "2023-12-15 10:00:00",
      created_at: "2023-12-10 09:30:00",
      updated_at: "2024-02-01 12:00:00",
    },
    {
      id: 2,
      contract_number: "EV-2024-002",
      title: "Maintenance Service Contract - Group B",
      file_url: "#",
      status: "Pending",
      effective_from: "2024-05-10",
      expires_at: "2025-05-10",
      signed_at: null,
      created_at: "2024-04-15 15:00:00",
      updated_at: "2024-06-01 09:00:00",
    },
  ]);

  const [current, setCurrent] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const currentContract = contracts[current];

  // Derived filtered contracts (client-side demo)
  const filteredContracts = contracts.filter((c) => {
    // search filter
    const q = searchText.trim().toLowerCase();
    if (q) {
      const inTitle = (c.title || "").toLowerCase().includes(q);
      const inNumber = (c.contract_number || "").toLowerCase().includes(q);
      if (!inTitle && !inNumber) return false;
    }

    // date range filter (filter by effective_from)
    const [start, end] = dateRange;
    if (start && end) {
      // contract effective_from expected in YYYY-MM-DD
      const eff = new Date(c.effective_from);
      // normalize times
      const s = new Date(start);
      const e = new Date(end);
      // include boundaries
      if (eff < s || eff > e) return false;
    }

    return true;
  });

  // Keep current index in bounds when filtered list changes
  useEffect(() => {
    if (filteredContracts.length === 0) {
      setCurrent(0);
    } else if (current > filteredContracts.length - 1) {
      setCurrent(0);
    }
  }, [filteredContracts.length]);

  const nextContract = () =>
    setCurrent((prev) => (prev + 1) % filteredContracts.length);
  const prevContract = () =>
    setCurrent((prev) =>
      prev === 0 ? filteredContracts.length - 1 : prev - 1
    );

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase();
    return (
      <span className={`contract-status-badge ${statusClass}`}>{status}</span>
    );
  };

  const DetailRow = ({ icon, label, value }) => (
    <Row align="middle" className="contract-detail-row">
      <Col span={1}>{icon}</Col>
      <Col span={8}>
        <Text className="contract-detail-label">{label}:</Text>
      </Col>
      <Col span={15}>
        <Text className="contract-detail-value">{value}</Text>
      </Col>
    </Row>
  );

  // Use the current filtered contract (or a placeholder)
  const displayedContract =
    filteredContracts.length > 0 ? filteredContracts[current] : null;

  // Demo sign state (client-side only)
  const [isSignModalVisible, setIsSignModalVisible] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedBy, setSignedBy] = useState(null);
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);

  // Advertisement slideshow
  const adImages = [AdImage1, AdImage2, AdImage3];
  const [adIndex, setAdIndex] = useState(0);
  const [adPaused, setAdPaused] = useState(false);

  useEffect(() => {
    if (adPaused) return undefined;
    const t = setInterval(() => {
      setAdIndex((i) => (i + 1) % adImages.length);
    }, 4000);
    return () => clearInterval(t);
  }, [adPaused]);

  return (
    <Layout className="page-layout">
      <AppHeader />

      <Content className="view-content">
        <Row
          gutter={[32, 32]}
          style={{ width: "100%", maxWidth: "1400px", marginTop: "2rem" }}
        >
          <Col xs={24} lg={16}>
            <Card
              title={
                <div className="card-header-title">
                  <FileTextOutlined />
                  <span>
                    {displayedContract
                      ? displayedContract.title
                      : "No contracts found"}
                  </span>
                </div>
              }
              extra={
                <Button
                  icon={<DownloadOutlined />}
                  type="primary"
                  ghost
                  href={displayedContract ? displayedContract.file_url : "#"}
                  disabled={!displayedContract}
                >
                  Download PDF
                </Button>
              }
              bordered={false}
              className="view-card"
            >
              {/* Search + Date filters */}
              <div className="search-filter-row">
                <Input.Search
                  placeholder="Search by title or contract number"
                  allowClear
                  onSearch={(v) => setSearchText(v)}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  className="search-input"
                />
                <DatePicker.RangePicker
                  className="date-range-picker"
                  onChange={(dates) => {
                    if (!dates) {
                      setDateRange([null, null]);
                      return;
                    }
                    const [start, end] = dates;
                    // store ISO date strings (YYYY-MM-DD)
                    setDateRange([
                      start ? start.format("YYYY-MM-DD") : null,
                      end ? end.format("YYYY-MM-DD") : null,
                    ]);
                  }}
                  allowEmpty={[true, true]}
                />
              </div>
              <Row gutter={[32, 16]}>
                <Col xs={24} md={12}>
                  <DetailRow
                    icon={<FileTextOutlined />}
                    label="Contract Number"
                    value={
                      displayedContract
                        ? displayedContract.contract_number
                        : "-"
                    }
                  />
                  <DetailRow
                    icon={<CheckCircleOutlined />}
                    label="Status"
                    value={
                      displayedContract
                        ? getStatusBadge(displayedContract.status)
                        : "-"
                    }
                  />
                </Col>
                <Col xs={24} md={12}>
                  <DetailRow
                    icon={<CalendarOutlined />}
                    label="Effective From"
                    value={
                      displayedContract ? displayedContract.effective_from : "-"
                    }
                  />
                  <DetailRow
                    icon={<CalendarOutlined />}
                    label="Expires At"
                    value={
                      displayedContract ? displayedContract.expires_at : "-"
                    }
                  />
                </Col>
              </Row>

              <Divider />

              <Row gutter={[32, 16]}>
                <Col xs={24} md={12}>
                  <DetailRow
                    icon={<ClockCircleOutlined />}
                    label="Signed At"
                    value={
                      displayedContract
                        ? displayedContract.signed_at || "Not yet signed"
                        : "-"
                    }
                  />
                </Col>
                <Col xs={24} md={12}>
                  <DetailRow
                    icon={<EditOutlined />}
                    label="Last Updated"
                    value={
                      displayedContract ? displayedContract.updated_at : "-"
                    }
                  />
                </Col>
              </Row>

              <div className="view-navigation">
                <Space>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={prevContract}
                    shape="circle"
                    className="nav-button"
                    disabled={filteredContracts.length <= 1}
                  />
                  <Text strong>
                    {filteredContracts.length > 0
                      ? `Contract ${current + 1} of ${filteredContracts.length}`
                      : "No contracts"}
                  </Text>
                  <Button
                    icon={<RightOutlined />}
                    onClick={nextContract}
                    shape="circle"
                    className="nav-button"
                    disabled={filteredContracts.length <= 1}
                  />
                </Space>
              </div>

              {/* Sign / Join actions */}
              <div
                className="contract-actions"
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                {signed && signedBy ? (
                  <div className="signed-badge">
                    Signed by {signedBy.name} — {signedBy.time}
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => setIsSignModalVisible(true)}
                    disabled={!displayedContract}
                  >
                    Sign Contract
                  </Button>
                )}
                <Button
                  onClick={() =>
                    window.open(
                      displayedContract ? displayedContract.file_url : "#"
                    )
                  }
                >
                  View PDF
                </Button>
              </div>

              <Modal
                className="view-contract-modal"
                title={`Sign ${
                  displayedContract
                    ? displayedContract.contract_number
                    : "contract"
                }`}
                open={isSignModalVisible}
                onCancel={() => setIsSignModalVisible(false)}
                onOk={() => {
                  if (!agree) return;
                  const now = new Date();
                  setSigned(true);
                  setSignedBy({
                    name: signName || "You",
                    time: now.toLocaleString(),
                  });
                  setIsSignModalVisible(false);
                }}
                okButtonProps={{ disabled: !agree }}
              >
                <p>
                  Please confirm you agree to the terms and sign the contract.
                </p>
                <Input
                  placeholder="Type your full name as signature"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <Checkbox
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                >
                  I agree to sign this contract electronically
                </Checkbox>
              </Modal>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <div className="advertisement-panel">
              <div
                className="ad-image-wrap"
                onClick={() => setAdPaused((p) => !p)}
                title={adPaused ? "Click to resume" : "Click to pause"}
              >
                {adImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Ad ${i + 1}`}
                    className={`ad-slide ${i === adIndex ? "active" : ""}`}
                  />
                ))}
              </div>
              <Title level={4}>Drive the Future</Title>
              <Text>
                Experience the thrill of electric vehicles without the full
                cost. Join a co-ownership group today!
              </Text>

              <Link to="/contract">
                <Button type="primary" style={{ marginTop: "16px" }}>
                  Learn More
                </Button>
              </Link>
              <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                {adPaused
                  ? "Paused — click image to resume"
                  : "Click image to pause"}
              </div>
            </div>
          </Col>
        </Row>
      </Content>

      <AppFooter />
    </Layout>
  );
};

export default ViewEContract;
