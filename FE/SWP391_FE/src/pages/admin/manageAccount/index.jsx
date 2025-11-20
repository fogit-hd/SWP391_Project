import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Spin,
  Alert,
  Layout,
  theme,
  Modal,
  Form,
  Input,
  Upload,
  Row,
  Col,
  Select,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  UploadOutlined,
  IdcardOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import api from "../../../config/axios";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import { toast } from "react-toastify";

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

const ManageAccount = () => {
  // Layout state
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);
  const [isTechnicianModalVisible, setIsTechnicianModalVisible] =
    useState(false);
  const [staffForm] = Form.useForm();
  const [technicianForm] = Form.useForm();
  const [staffUploadedFiles, setStaffUploadedFiles] = useState([]);
  const [technicianUploadedFiles, setTechnicianUploadedFiles] = useState([]);
  const [staffScannedData, setStaffScannedData] = useState(null);
  const [technicianScannedData, setTechnicianScannedData] = useState(null);
  const [isStaffScanning, setIsStaffScanning] = useState(false);
  const [isTechnicianScanning, setIsTechnicianScanning] = useState(false);
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);
  const [isTechnicianSubmitting, setIsTechnicianSubmitting] = useState(false);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // Format: DD/MM/YYYY
    } catch (e) {
      return dateString;
    }
  };

  // CCCD Scanning function (reusable)
  const scanCCCD = async (files, setScannedData, setIsScanning) => {
    if (files.length < 2) {
      message.error("Please upload both front and back images of your CCCD.");
      return;
    }

    setIsScanning(true);
    try {
      message.loading("Scanning CCCD...", 0);

      // Scan front side
      const frontFormData = new FormData();
      const frontFile = files[0].originFileObj || files[0];
      frontFormData.append("file", frontFile);

      const frontResponse = await api.post(
        "/auth/identity-card",
        frontFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Scan back side
      const backFormData = new FormData();
      const backFile = files[1].originFileObj || files[1];
      backFormData.append("file", backFile);

      const backResponse = await api.post("/auth/identity-card", backFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy();

      // Extract and combine data
      const frontData = frontResponse.data?.data || frontResponse.data || {};
      const backData = backResponse.data?.data || backResponse.data || {};

      const combinedData = {};
      Object.keys(frontData).forEach((key) => {
        const value = frontData[key];
        if (value && value !== "N/A" && value !== "undefined") {
          combinedData[key] = value;
        }
      });

      Object.keys(backData).forEach((key) => {
        const value = backData[key];
        if (value && value !== "N/A" && value !== "undefined") {
          if (!combinedData[key] || combinedData[key] === "N/A") {
            combinedData[key] = value;
          }
        }
      });

      if (Object.keys(combinedData).length === 0) {
        throw new Error(
          "Unable to extract information from CCCD. Please ensure images are clear and readable."
        );
      }

      // Validate essential fields
      const missingFields = [];
      if (!combinedData.fullName) missingFields.push("Full Name");
      if (!combinedData.idNumber) missingFields.push("ID Number");
      if (!combinedData.dateOfBirth) missingFields.push("Date of Birth");

      if (missingFields.length > 0) {
        toast.warning(
          `CCCD đã được quét nhưng thiếu: ${missingFields.join(
            ", "
          )}. Vui lòng kiểm tra lại thông tin.`
        );
      } else {
        toast.success("Quét CCCD thành công! Đã trích xuất tất cả thông tin.");
      }

      setScannedData(combinedData);
      return combinedData;
    } catch (error) {
      message.destroy();
      let errorMessage = "Quét CCCD thất bại. Vui lòng thử lại.";
      if (error.response?.status === 400) {
        errorMessage =
          "Không thể quét CCCD. Vui lòng đảm bảo hình ảnh rõ ràng và hiển thị đầy đủ CCCD.";
      }
      toast.error(errorMessage);
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-fill form from scanned data
  const autoFillForm = (form, scannedData) => {
    if (!scannedData) return;

    const formValues = {
      fullName: scannedData.fullName || "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: scannedData.dateOfBirth
        ? formatDate(scannedData.dateOfBirth)
        : "",
      gender:
        scannedData.gender === "true" ||
        scannedData.gender === "Male" ||
        scannedData.gender === "Nam" ||
        scannedData.gender === true
          ? "male"
          : scannedData.gender === "false" ||
            scannedData.gender === "Female" ||
            scannedData.gender === "Nữ" ||
            scannedData.gender === false
          ? "female"
          : "male",
      idNumber: scannedData.idNumber || "",
      issueDate: scannedData.issueDate ? formatDate(scannedData.issueDate) : "",
      expiryDate: scannedData.expiryDate
        ? formatDate(scannedData.expiryDate)
        : "",
      placeOfIssue: scannedData.placeOfIssue || "",
      placeOfBirth: scannedData.placeOfBirth || "",
      address: scannedData.address || "",
    };

    form.setFieldsValue(formValues);
    toast.info(
      "Form đã được điền tự động từ CCCD. Bạn vẫn có thể chỉnh sửa các trường."
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: false,
      render: (text, record) => (
        <Tooltip title={`ID: ${record.id}`} placement="top">
          <span style={{ cursor: "help" }}>{text || "N/A"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: false,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: false,
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      sorter: false,
      filters: [
        { text: "Admin", value: "Admin" },
        { text: "Staff", value: "Staff" },
        { text: "Technician", value: "Technician" },
        { text: "CoOwner", value: "CoOwner" },
      ],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      render: (status) => (
        <span style={{ color: status === "active" ? "green" : "red" }}>
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A"}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: false,
      render: (date) => (date ? formatDate(date) : "N/A"),
    },
  ];

  // API Functions
  const fetchUsers = async (
    page = 1,
    pageSize = 10,
    sortField = null,
    sortOrder = null,
    filters = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page.toString(),
        limit: pageSize.toString(),
      };

      if (sortField && sortOrder) {
        params.sortBy = sortField;
        params.sortOrder = sortOrder === "ascend" ? "asc" : "desc";
      }

      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key].length > 0) {
          params[key] = filters[key].join(",");
        }
      });

      const response = await api.get("/accounts", { params });

      setData(response.data.data || response.data || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.data.total || response.data.data?.length || 0,
      }));
    } catch (err) {
      setError(err.message);
      message.error(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Staff Account
  const handleCreateStaff = async (values) => {
    if (staffUploadedFiles.length < 2) {
      message.error("Please upload both front and back images of CCCD.");
      return;
    }

    setIsStaffSubmitting(true);
    try {
      const formData = new FormData();

      // Add form fields
      formData.append(
        "fullName",
        values.fullName || staffScannedData?.fullName || ""
      );
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append(
        "dateOfBirth",
        values.dateOfBirth || staffScannedData?.dateOfBirth || ""
      );

      const genderValue = values.gender || staffScannedData?.gender || "";
      if (
        genderValue === "male" ||
        genderValue === true ||
        genderValue === "true" ||
        genderValue === "Male" ||
        genderValue === "Nam"
      ) {
        formData.append("gender", "true");
      } else {
        formData.append("gender", "false");
      }

      formData.append(
        "idNumber",
        values.idNumber || staffScannedData?.idNumber || ""
      );
      formData.append(
        "issueDate",
        values.issueDate || staffScannedData?.issueDate || ""
      );
      formData.append(
        "expiryDate",
        values.expiryDate || staffScannedData?.expiryDate || ""
      );
      formData.append(
        "placeOfIssue",
        values.placeOfIssue || staffScannedData?.placeOfIssue || ""
      );
      formData.append(
        "placeOfBirth",
        values.placeOfBirth || staffScannedData?.placeOfBirth || ""
      );
      formData.append(
        "address",
        values.address || staffScannedData?.address || ""
      );
      formData.append("roleId", "2"); // Staff roleId = 2

      // Add uploaded files
      staffUploadedFiles.forEach((file, index) => {
        const fileObj = file.originFileObj || file;
        if (index === 0) {
          formData.append("frontImage", fileObj);
        } else if (index === 1) {
          formData.append("backImage", fileObj);
        }
      });

      message.loading("Creating staff account...", 0);
      await api.post("/accounts/create-staff", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy();
      toast.success("Tạo tài khoản nhân viên thành công!");
      setIsStaffModalVisible(false);
      staffForm.resetFields();
      setStaffUploadedFiles([]);
      setStaffScannedData(null);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.destroy();
      console.error("Create staff error:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể tạo tài khoản nhân viên.";
      toast.error(errorMessage);
    } finally {
      setIsStaffSubmitting(false);
    }
  };

  // Create Technician Account
  const handleCreateTechnician = async (values) => {
    if (technicianUploadedFiles.length < 2) {
      message.error("Please upload both front and back images of CCCD.");
      return;
    }

    setIsTechnicianSubmitting(true);
    try {
      const formData = new FormData();

      // Add form fields
      formData.append(
        "fullName",
        values.fullName || technicianScannedData?.fullName || ""
      );
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append(
        "dateOfBirth",
        values.dateOfBirth || technicianScannedData?.dateOfBirth || ""
      );

      const genderValue = values.gender || technicianScannedData?.gender || "";
      if (
        genderValue === "male" ||
        genderValue === true ||
        genderValue === "true" ||
        genderValue === "Male" ||
        genderValue === "Nam"
      ) {
        formData.append("gender", "true");
      } else {
        formData.append("gender", "false");
      }

      formData.append(
        "idNumber",
        values.idNumber || technicianScannedData?.idNumber || ""
      );
      formData.append(
        "issueDate",
        values.issueDate || technicianScannedData?.issueDate || ""
      );
      formData.append(
        "expiryDate",
        values.expiryDate || technicianScannedData?.expiryDate || ""
      );
      formData.append(
        "placeOfIssue",
        values.placeOfIssue || technicianScannedData?.placeOfIssue || ""
      );
      formData.append(
        "placeOfBirth",
        values.placeOfBirth || technicianScannedData?.placeOfBirth || ""
      );
      formData.append(
        "address",
        values.address || technicianScannedData?.address || ""
      );
      formData.append("roleId", "4"); // Technician roleId = 4

      // Add uploaded files
      technicianUploadedFiles.forEach((file, index) => {
        const fileObj = file.originFileObj || file;
        if (index === 0) {
          formData.append("frontImage", fileObj);
        } else if (index === 1) {
          formData.append("backImage", fileObj);
        }
      });

      message.loading("Creating technician account...", 0);
      await api.post("/accounts/create-technician", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy();
      toast.success("Tạo tài khoản kỹ thuật viên thành công!");
      setIsTechnicianModalVisible(false);
      technicianForm.resetFields();
      setTechnicianUploadedFiles([]);
      setTechnicianScannedData(null);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.destroy();
      console.error("Create technician error:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể tạo tài khoản kỹ thuật viên.";
      toast.error(errorMessage);
    } finally {
      setIsTechnicianSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    const { current, pageSize } = paginationConfig;
    const { field, order } = sorter;
    fetchUsers(current, pageSize, field, order, filters);
  };

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-fill forms when scanned data changes
  useEffect(() => {
    if (staffScannedData && isStaffModalVisible) {
      autoFillForm(staffForm, staffScannedData);
    }
  }, [staffScannedData, isStaffModalVisible]);

  useEffect(() => {
    if (technicianScannedData && isTechnicianModalVisible) {
      autoFillForm(technicianForm, technicianScannedData);
    }
  }, [technicianScannedData, isTechnicianModalVisible]);

  // Render Create Account Modal
  const renderCreateAccountModal = (
    visible,
    onCancel,
    form,
    title,
    icon,
    uploadedFiles,
    setUploadedFiles,
    scannedData,
    setScannedData,
    isScanning,
    setIsScanning,
    onSubmit,
    isSubmitting
  ) => {
    return (
      <Modal
        title={
          <Space>
            {icon}
            <span>{title}</span>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="CCCD Verification" required>
                <Upload
                  accept=".png,.jpg,.jpeg"
                  multiple
                  maxCount={2}
                  beforeUpload={(file) => {
                    const isPng = file.type === "image/png";
                    const isJpeg =
                      file.type === "image/jpeg" ||
                      file.type === "image/jpg" ||
                      /\.jpe?g$/i.test(file.name);
                    if (!isPng && !isJpeg) {
                      message.error(`${file.name} must be PNG or JPG/JPEG.`);
                      return Upload.LIST_IGNORE;
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error("Image must be smaller than 5MB!");
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                  fileList={uploadedFiles}
                  onRemove={() => {
                    setUploadedFiles([]);
                    setScannedData(null);
                    form.setFieldsValue({
                      fullName: "",
                      dateOfBirth: "",
                      gender: "",
                      idNumber: "",
                      issueDate: "",
                      expiryDate: "",
                      placeOfIssue: "",
                      placeOfBirth: "",
                      address: "",
                    });
                  }}
                  onChange={(info) => {
                    let list = info.fileList || [];
                    list = list.filter((f) => {
                      const t = f.type || "";
                      const name = f.name || "";
                      const isP = t === "image/png";
                      const isJ =
                        t === "image/jpeg" ||
                        t === "image/jpg" ||
                        /\.jpe?g$/i.test(name);
                      return isP || isJ;
                    });
                    if (list.length > 2) list = list.slice(list.length - 2);
                    setUploadedFiles(list);
                    setScannedData(null);
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    Upload CCCD Images (2 files)
                  </Button>
                </Upload>
                {uploadedFiles.length === 2 && (
                  <div style={{ marginTop: "10px" }}>
                    <Button
                      type="primary"
                      icon={<IdcardOutlined />}
                      loading={isScanning}
                      onClick={async () => {
                        const files = uploadedFiles.map(
                          (file) => file.originFileObj || file
                        );
                        const result = await scanCCCD(
                          files,
                          setScannedData,
                          setIsScanning
                        );
                        if (result) {
                          autoFillForm(form, result);
                        }
                      }}
                    >
                      {isScanning ? "Scanning CCCD..." : "Scan CCCD"}
                    </Button>
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: "Full name is required" }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Phone is required" },
                  {
                    pattern: /^[0-9]+$/,
                    message: "Phone must contain only numbers",
                  },
                  { min: 10, message: "Phone must be at least 10 digits" },
                ]}
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[
                  { required: true, message: "Date of birth is required" },
                ]}
              >
                <Input placeholder="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: "Gender is required" }]}
              >
                <Select>
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idNumber"
                label="ID Number"
                rules={[{ required: true, message: "ID number is required" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="issueDate" label="Issue Date">
                <Input placeholder="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Expiry Date">
                <Input placeholder="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="placeOfIssue" label="Place of Issue">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="placeOfBirth" label="Place of Birth">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={onCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={uploadedFiles.length < 2}
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-accounts"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title="User Management"
              extra={
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="primary"
                    icon={<UserOutlined />}
                    onClick={() => setIsStaffModalVisible(true)}
                  >
                    Create Staff Account
                  </Button>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    onClick={() => setIsTechnicianModalVisible(true)}
                  >
                    Create Technician Account
                  </Button>
                </Space>
              }
            >
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button size="small" onClick={handleRefresh}>
                      Retry
                    </Button>
                  }
                />
              )}

              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} users`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={handleTableChange}
                />
              </Spin>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>

      {/* Staff Modal */}
      {renderCreateAccountModal(
        isStaffModalVisible,
        () => {
          setIsStaffModalVisible(false);
          staffForm.resetFields();
          setStaffUploadedFiles([]);
          setStaffScannedData(null);
        },
        staffForm,
        "Create Staff Account",
        <UserOutlined />,
        staffUploadedFiles,
        setStaffUploadedFiles,
        staffScannedData,
        setStaffScannedData,
        isStaffScanning,
        setIsStaffScanning,
        handleCreateStaff,
        isStaffSubmitting
      )}

      {/* Technician Modal */}
      {renderCreateAccountModal(
        isTechnicianModalVisible,
        () => {
          setIsTechnicianModalVisible(false);
          technicianForm.resetFields();
          setTechnicianUploadedFiles([]);
          setTechnicianScannedData(null);
        },
        technicianForm,
        "Create Technician Account",
        <TeamOutlined />,
        technicianUploadedFiles,
        setTechnicianUploadedFiles,
        technicianScannedData,
        setTechnicianScannedData,
        isTechnicianScanning,
        setIsTechnicianScanning,
        handleCreateTechnician,
        isTechnicianSubmitting
      )}
    </Layout>
  );
};

export default ManageAccount;
