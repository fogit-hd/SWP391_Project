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
  InputNumber,
  Tag,
  Tooltip,
  Image,
  Descriptions,
  Upload,
  Tabs,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  HomeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../config/axios";
import "./my-vehicle.css";

const { Header, Content, Footer } = Layout;

const normalizeImageList = (value) => {
  if (!value) {
    console.log("normalizeImageList: value is empty/null");
    return [];
  }
  
  console.log("normalizeImageList input:", value, "type:", typeof value, "isArray:", Array.isArray(value));
  
  if (Array.isArray(value)) {
    console.log("normalizeImageList: Processing array with", value.length, "items");
    const result = value
      .map((item, index) => {
        console.log(`  Item ${index}:`, item, "type:", typeof item);
        if (typeof item === "string") {
          console.log(`    -> String URL: ${item}`);
          return item;
        }
        if (item?.url) {
          console.log(`    -> Object with url: ${item.url}`);
          return item.url;
        }
        if (item?.imageUrl) {
          console.log(`    -> Object with imageUrl: ${item.imageUrl}`);
          return item.imageUrl;
        }
        if (item?.vehicleImageUrl) {
          console.log(`    -> Object with vehicleImageUrl: ${item.vehicleImageUrl}`);
          return item.vehicleImageUrl;
        }
        console.log(`    -> Unknown format, skipping`);
        return "";
      })
      .filter(Boolean);
    console.log("✅ normalizeImageList array result:", result, "length:", result.length);
    return result;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        console.log("normalizeImageList: Parsed JSON string to array");
        return normalizeImageList(parsed);
      }
    } catch (_) {
      // not JSON, fallback to delimiter split
    }
    const result = trimmed
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    console.log("normalizeImageList string result:", result);
    return result;
  }
  console.log("normalizeImageList: no match, returning empty array");
  return [];
};

const getVehicleImagesFromRequest = (request) => {
  if (!request) return [];
  
  // Debug: Log để kiểm tra
  console.log("=== GET VEHICLE IMAGES ===");
  console.log("Request object:", request);
  console.log("All request keys:", Object.keys(request || {}));
  
  // Đặc biệt xử lý vehicleImageUrl nếu là array
  let vehicleImageUrlArray = null;
  if (Array.isArray(request.vehicleImageUrl)) {
    vehicleImageUrlArray = request.vehicleImageUrl;
    console.log("✅ vehicleImageUrl is ARRAY with", vehicleImageUrlArray.length, "items:", vehicleImageUrlArray);
  } else if (request.vehicleImageUrl) {
    console.log("⚠️ vehicleImageUrl is NOT array, type:", typeof request.vehicleImageUrl, "value:", request.vehicleImageUrl);
  }
  
  // Kiểm tra tất cả các field có thể chứa ảnh
  const possibleSources = [
    vehicleImageUrlArray || request.vehicleImageUrl,  // Ưu tiên array nếu có
    request.vehicleImageUrls,
    request.vehicleImages,
    request.vehicleImageUrlList,
    request.imageUrls,
    request.images,
    request.imageUrl,
  ];
  
  console.log("vehicleImageUrl:", request.vehicleImageUrl);
  console.log("vehicleImageUrl type:", typeof request.vehicleImageUrl);
  console.log("vehicleImageUrl isArray:", Array.isArray(request.vehicleImageUrl));
  if (Array.isArray(request.vehicleImageUrl)) {
    console.log("vehicleImageUrl array length:", request.vehicleImageUrl.length);
    console.log("vehicleImageUrl array items:", request.vehicleImageUrl);
  }
  console.log("vehicleImageUrls:", request.vehicleImageUrls);
  console.log("vehicleImages:", request.vehicleImages);
  console.log("vehicleImageUrlList:", request.vehicleImageUrlList);
  console.log("imageUrls:", request.imageUrls);
  console.log("images:", request.images);
  console.log("imageUrl:", request.imageUrl);
  
  // Lấy tất cả ảnh từ tất cả các nguồn (không chỉ field đầu tiên)
  const allImages = [];
  for (let i = 0; i < possibleSources.length; i++) {
    const source = possibleSources[i];
    if (!source) {
      console.log(`Source ${i} is empty/null, skipping`);
      continue;
    }
    console.log(`Processing source ${i}:`, source, "type:", typeof source, "isArray:", Array.isArray(source));
    const list = normalizeImageList(source);
    if (list.length) {
      console.log(`✅ Found ${list.length} images from source ${i}:`, list);
      allImages.push(...list);
    } else {
      console.log(`❌ No images found in source ${i}`);
    }
  }
  
  // Loại bỏ duplicate và trả về tất cả ảnh
  const uniqueImages = [...new Set(allImages)];
  console.log("📸 All unique images:", uniqueImages);
  console.log("📊 Total images found:", uniqueImages.length);
  
  // Nếu không tìm thấy ảnh nào, log cảnh báo
  if (uniqueImages.length === 0) {
    console.warn("⚠️ No images found in request! Check the response structure.");
  } else if (uniqueImages.length === 1 && Array.isArray(request.vehicleImageUrl) && request.vehicleImageUrl.length > 1) {
    console.error("🚨 ERROR: Backend returned array with", request.vehicleImageUrl.length, "items but only", uniqueImages.length, "image was extracted!");
    console.error("Original array:", request.vehicleImageUrl);
    console.error("Extracted images:", uniqueImages);
  }
  
  return uniqueImages;
};

const MyVehicleRequests = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [myVehicles, setMyVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Form instances
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  // File upload states
  const [vehicleImageFileList, setVehicleImageFileList] = useState([]);
  const [registrationPaperFileList, setRegistrationPaperFileList] = useState(
    []
  );
  const MAX_VEHICLE_IMAGES = 4;

  // Filter data when searchText changes
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(allRequests);
    } else {
      const filtered = allRequests.filter((request) => {
        const searchLower = searchText.toLowerCase();
        return (
          request.plateNumber?.toLowerCase().includes(searchLower) ||
          request.make?.toLowerCase().includes(searchLower) ||
          request.model?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredData(filtered);
    }
  }, [searchText, allRequests]);

  // Update displayed data when filteredData or pagination changes
  useEffect(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const paginatedData = filteredData.slice(
      startIndex,
      startIndex + pagination.pageSize
    );
    setData(paginatedData);
    setPagination((prev) => ({
      ...prev,
      total: filteredData.length,
    }));
  }, [filteredData, pagination.current, pagination.pageSize]);

  const columns = [
    {
      title: "Biển số",
      dataIndex: "plateNumber",
      key: "plateNumber",
      width: 130,
      sorter: (a, b) =>
        (a.plateNumber || "").localeCompare(b.plateNumber || ""),
    },
    {
      title: "Hãng",
      dataIndex: "make",
      key: "make",
      width: 100,
      sorter: (a, b) => (a.make || "").localeCompare(b.make || ""),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 100,
      sorter: (a, b) => (a.model || "").localeCompare(b.model || ""),
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        let color = type === "CREATE" ? "blue" : "orange";
        return (
          <Tag color={color}>{type === "CREATE" ? "TẠO MỚI" : "CẬP NHẬT"}</Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      filters: [
        { text: "Chờ duyệt", value: "PENDING" },
        { text: "Đã duyệt", value: "APPROVED" },
        { text: "Từ chối", value: "REJECTED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = "default";
        let text = status;
        if (status === "APPROVED") {
          color = "green";
          text = "Đã duyệt";
        }
        if (status === "REJECTED") {
          color = "red";
          text = "Từ chối";
        }
        if (status === "PENDING") {
          color = "orange";
          text = "Chờ duyệt";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          {record.status === "PENDING" && (
            <Tooltip title="Xóa yêu cầu">
              <Button
                type="link"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteClick(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // API Functions
  const fetchMyVehicleRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/vehicle-requests/my-requests");
      const requests = response.data || [];

      // Sort by createdAt descending (newest first)
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllRequests(requests);
      setFilteredData(requests);
    } catch (err) {
      setError(err.message);
      message.error(`Không thể tải danh sách yêu cầu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const response = await api.get("/Vehicle/my-vehicles");

      // API có thể trả về data trong response.data.data hoặc response.data
      const vehicles = response.data.data || response.data || [];
      setMyVehicles(vehicles);
      return vehicles; // Return vehicles để có thể sử dụng trong async/await
    } catch (err) {
      console.error("Failed to fetch my vehicles:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải danh sách xe của bạn";
      message.error(errorMessage);
      return []; // Return empty array on error
    }
  };

  const fetchRequestDetail = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/vehicle-requests/${id}`);
      setLoading(false);

      // API có thể trả về data trực tiếp hoặc wrapped trong response
      const detail = response.data?.data || response.data;
      
      // Debug: Log để kiểm tra cấu trúc response
      console.log("=== FETCH REQUEST DETAIL ===");
      console.log("Full response:", response.data);
      console.log("Detail object:", detail);
      console.log("Detail keys:", Object.keys(detail || {}));
      console.log("vehicleImageUrls:", detail?.vehicleImageUrls, "type:", typeof detail?.vehicleImageUrls, "isArray:", Array.isArray(detail?.vehicleImageUrls));
      console.log("vehicleImages:", detail?.vehicleImages, "type:", typeof detail?.vehicleImages, "isArray:", Array.isArray(detail?.vehicleImages));
      console.log("vehicleImageUrl:", detail?.vehicleImageUrl, "type:", typeof detail?.vehicleImageUrl, "isArray:", Array.isArray(detail?.vehicleImageUrl));
      console.log("vehicleImageUrlList:", detail?.vehicleImageUrlList, "type:", typeof detail?.vehicleImageUrlList, "isArray:", Array.isArray(detail?.vehicleImageUrlList));
      console.log("registrationPaperUrl:", detail?.registrationPaperUrl);
      
      // Log chi tiết nếu vehicleImageUrl là array
      if (Array.isArray(detail?.vehicleImageUrl)) {
        console.log("vehicleImageUrl is ARRAY with length:", detail.vehicleImageUrl.length);
        console.log("vehicleImageUrl array items:", detail.vehicleImageUrl);
      }
      
      return detail;
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải chi tiết yêu cầu";
      message.error(errorMessage);
      return null;
    }
  };

  const handleViewDetail = async (id) => {
    const detail = await fetchRequestDetail(id);

    if (detail) {
      setSelectedRequest(detail);
      setDetailModalVisible(true);
    }
  };

  const handleDeleteClick = (record) => {
    console.log("Delete clicked for record:", record);

    // Chỉ cho phép xóa request có status PENDING
    if (record.status !== "PENDING") {
      console.log("Status is not PENDING, showing warning");
      message.warning("Chỉ có thể xóa yêu cầu đang chờ duyệt (PENDING)");
      return;
    }

    console.log("Setting requestToDelete and showing modal");
    setRequestToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      console.log("Deleting request with ID:", requestToDelete.id);
      setLoading(true);
      const response = await api.delete(
        `/vehicle-requests/delete/${requestToDelete.id}`
      );

      // Hiển thị message từ backend hoặc message mặc định
      const successMessage = response.data?.message || "Xóa yêu cầu thành công";
      toast.success(successMessage);

      setDeleteModalVisible(false);
      setRequestToDelete(null);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("Delete request error:", err.response?.data);
      const errorData = err.response?.data;
      let errorMessage = "Không thể xóa yêu cầu";

      if (errorData) {
        // Ưu tiên lấy message từ backend (đã có thông báo cụ thể)
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Plain string error
        else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setRequestToDelete(null);
  };

  const handleCreateClick = () => {
    fetchMyVehicles();
    setCreateModalVisible(true);
  };

  const handleUpdateClick = () => {
    fetchMyVehicles();
    setUpdateModalVisible(true);
  };

  const handleVehicleImagesChange = ({ fileList }) => {
    if (fileList.length > MAX_VEHICLE_IMAGES) {
      message.warning(`Chỉ được chọn tối đa ${MAX_VEHICLE_IMAGES} hình ảnh xe`);
      fileList = fileList.slice(-MAX_VEHICLE_IMAGES);
    }
    setVehicleImageFileList(fileList);
  };

  const handleCreateSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate required files
      if (vehicleImageFileList.length === 0) {
        message.error("Vui lòng tải lên ít nhất 1 hình ảnh xe");
        setLoading(false);
        return;
      }
      if (vehicleImageFileList.length > MAX_VEHICLE_IMAGES) {
        message.error(`Chỉ được chọn tối đa ${MAX_VEHICLE_IMAGES} hình ảnh xe`);
        setLoading(false);
        return;
      }
      if (registrationPaperFileList.length === 0) {
        message.error("Vui lòng tải lên giấy đăng ký xe");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("modelYear", values.modelYear);
      // Color không required, nếu bỏ trống thì gửi empty string
      formData.append("color", values.color || "");
      // Battery capacity không required, nếu bỏ trống thì gửi 0
      formData.append("batteryCapacityKwh", values.batteryCapacityKwh ?? 0);
      // Range không required, nếu bỏ trống thì gửi 0
      formData.append("rangeKm", values.rangeKm ?? 0);
      // Plate number là required, không có fallback
      formData.append("plateNumber", values.plateNumber);
      
      // Log số lượng ảnh trước khi gửi
      console.log("=== CREATING REQUEST ===");
      console.log("Number of vehicle images to upload:", vehicleImageFileList.length);
      console.log("Vehicle image files:", vehicleImageFileList.map(f => ({ name: f.name, size: f.size })));
      
      // Gửi tất cả ảnh với key "vehicleImages" (số nhiều)
      vehicleImageFileList.forEach((file, index) => {
        console.log(`Appending vehicleImages[${index}]:`, file.name, file.originFileObj);
        formData.append("vehicleImages", file.originFileObj);
      });
      
      // Backward compatibility for older API expecting single file
      if (vehicleImageFileList[0]) {
        console.log("Appending vehicleImage (single, backward compat):", vehicleImageFileList[0].name);
        formData.append("vehicleImage", vehicleImageFileList[0].originFileObj);
      }
      
      formData.append(
        "registrationPaperUrl",
        registrationPaperFileList[0].originFileObj
      );

      console.log("=== FormData entries ===");
      let vehicleImagesCount = 0;
      for (let pair of formData.entries()) {
        if (pair[0] === "vehicleImages") {
          vehicleImagesCount++;
          console.log(`${pair[0]}[${vehicleImagesCount}]:`, pair[1]?.name || pair[1]);
        } else {
          console.log(pair[0], pair[1]?.name || pair[1]);
        }
      }
      console.log(`Total vehicleImages entries: ${vehicleImagesCount}`);

      const response = await api.post("/vehicle-requests/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Kiểm tra response data để xử lý trường hợp backend trả về 200 OK nhưng có lỗi
      const responseData = response.data;

      console.log("=== CREATE REQUEST RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Response data:", responseData);
      console.log("Response data keys:", Object.keys(responseData || {}));
      console.log("Response data.data:", responseData?.data);
      console.log(
        "Response data.data keys:",
        Object.keys(responseData?.data || {})
      );
      
      // Kiểm tra chi tiết về ảnh trong response
      const detail = responseData?.data || responseData;
      console.log("=== IMAGES IN RESPONSE ===");
      console.log("vehicleImageUrl:", detail?.vehicleImageUrl, "type:", typeof detail?.vehicleImageUrl, "isArray:", Array.isArray(detail?.vehicleImageUrl));
      if (Array.isArray(detail?.vehicleImageUrl)) {
        console.log("✅ vehicleImageUrl is ARRAY with", detail.vehicleImageUrl.length, "items");
        detail.vehicleImageUrl.forEach((url, idx) => {
          console.log(`  [${idx}]:`, url);
        });
      } else if (detail?.vehicleImageUrl) {
        console.log("⚠️ vehicleImageUrl is NOT array:", detail.vehicleImageUrl);
      }
      console.log("vehicleImageUrls:", detail?.vehicleImageUrls);
      console.log("vehicleImages:", detail?.vehicleImages);
      
      console.log("Full response:", JSON.stringify(responseData, null, 2));

      // Kiểm tra các trường hợp backend trả về lỗi dù status code là 200
      // Kiểm tra trong responseData và responseData.data
      const hasError =
        responseData?.success === false ||
        responseData?.isSuccess === false ||
        responseData?.httpStatus === "BAD_REQUEST" ||
        responseData?.httpStatus === "CONFLICT" ||
        (responseData?.status && responseData.status >= 400) ||
        responseData?.data?.success === false ||
        responseData?.data?.isSuccess === false ||
        responseData?.data?.httpStatus === "BAD_REQUEST" ||
        responseData?.data?.httpStatus === "CONFLICT" ||
        (responseData?.data?.status && responseData.data.status >= 400) ||
        responseData?.data?.error ||
        responseData?.error;

      if (hasError) {
        // Xử lý như lỗi
        console.log("=== ERROR DETECTED IN 200 RESPONSE ===");
        console.log("Response data:", responseData);
        const errorMessage =
          responseData?.data?.message ||
          responseData?.message ||
          "Biển số xe đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!";
        toast.error(errorMessage, { duration: 3000 });
        setLoading(false);
        return;
      }

      // Hiển thị message từ backend hoặc message mặc định
      const successMessage =
        responseData?.message ||
        "Tạo yêu cầu xe mới thành công! Vui lòng chờ duyệt.";
      toast.success(successMessage);

      setCreateModalVisible(false);
      createForm.resetFields();
      setVehicleImageFileList([]);
      setRegistrationPaperFileList([]);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("=== CREATE REQUEST ERROR ===");
      console.error("Status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      console.error("Data type:", typeof err.response?.data);
      console.error("Has errors?", err.response?.data?.errors);
      console.error("Has title?", err.response?.data?.title);
      console.error("Has message?", err.response?.data?.message);
      console.error("Full error object:", err);

      const errorData = err.response?.data;
      let errorMessage =
        "Biển số xe đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!";

      // Nếu backend trả về message cụ thể thì dùng message đó
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
      // Nếu có lỗi khác, mặc định vẫn là lỗi trùng biển số
      else if (typeof errorData === "string" && errorData) {
        errorMessage = errorData;
      }

      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate required files
      if (vehicleImageFileList.length === 0) {
        message.error("Vui lòng tải lên ít nhất 1 hình ảnh xe");
        setLoading(false);
        return;
      }
      if (vehicleImageFileList.length > MAX_VEHICLE_IMAGES) {
        message.error(`Chỉ được chọn tối đa ${MAX_VEHICLE_IMAGES} hình ảnh xe`);
        setLoading(false);
        return;
      }
      if (registrationPaperFileList.length === 0) {
        message.error("Vui lòng tải lên giấy đăng ký xe");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("vehicleId", selectedVehicleId);
      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("modelYear", values.modelYear);
      // Color không required, nếu bỏ trống thì gửi empty string
      formData.append("color", values.color || "");
      // Battery capacity không required, nếu bỏ trống thì gửi 0
      formData.append("batteryCapacityKwh", values.batteryCapacityKwh ?? 0.0);
      // Range không required, nếu bỏ trống thì gửi 0
      formData.append("rangeKm", values.rangeKm ?? 0.0);
      // Plate number là required
      formData.append("plateNumber", values.plateNumber);
      vehicleImageFileList.forEach((file) =>
        formData.append("vehicleImages", file.originFileObj)
      );
      if (vehicleImageFileList[0]) {
        formData.append("vehicleImage", vehicleImageFileList[0].originFileObj);
      }
      formData.append(
        "registrationPaperUrl",
        registrationPaperFileList[0].originFileObj
      );

      console.log("Update FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await api.post("/vehicle-requests/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Hiển thị message từ backend hoặc message mặc định
      const successMessage =
        response.data?.message ||
        "Tạo yêu cầu cập nhật xe thành công! Vui lòng chờ staff duyệt.";
      toast.success(successMessage);

      setUpdateModalVisible(false);
      updateForm.resetFields();
      setVehicleImageFileList([]);
      setRegistrationPaperFileList([]);
      setSelectedVehicleId(null);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("Update request error:", err.response?.data);
      console.error("Full error object:", err);
      const errorData = err.response?.data;
      let errorMessage = "Không thể tạo yêu cầu cập nhật";

      if (errorData) {
        // 1. Ưu tiên message từ backend (đã có thông báo cụ thể)
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        // 2. Xử lý validation errors (format từ ASP.NET)
        else if (errorData.errors && typeof errorData.errors === "object") {
          const fieldNames = {
            PlateNumber: "Biển số xe",
            Make: "Hãng xe",
            Model: "Model",
            ModelYear: "Năm sản xuất",
            Color: "Màu sắc",
            BatteryCapacityKwh: "Dung lượng pin",
            RangeKm: "Quãng đường",
            VehicleImage: "Hình ảnh xe",
            RegistrationPaperUrl: "Giấy đăng ký",
            VehicleId: "Xe",
          };

          const errorMessages = Object.entries(errorData.errors)
            .map(([field, messages]) => {
              const messageArray = Array.isArray(messages)
                ? messages
                : [messages];
              const fieldName = fieldNames[field] || field;
              return `${fieldName}: ${messageArray.join(", ")}`;
            })
            .join("\n");
          errorMessage = errorMessages || "Vui lòng kiểm tra lại thông tin";
        }
        // 3. Xử lý title + errors (ASP.NET Validation Problem)
        else if (errorData.title && errorData.title.includes("Validation")) {
          errorMessage = "Lỗi validation: Vui lòng kiểm tra lại thông tin";
        }
        // 4. Plain string error
        else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = myVehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      updateForm.setFieldsValue({
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        modelYear: vehicle.modelYear,
        color: vehicle.color,
        batteryCapacityKwh: vehicle.batteryCapacityKwh,
        rangeKm: vehicle.rangeKm,
      });
    }
  };

  // Open modals automatically when navigated to with query params
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get("create");
    const editId = params.get("edit");

    if (create) {
      // open create modal
      fetchMyVehicles();
      setCreateModalVisible(true);
    }

    if (editId) {
      // open update modal and preselect vehicle
      (async () => {
        const vehicles = await fetchMyVehicles();
        // Find vehicle from fetched data directly
        const vehicle = vehicles.find((v) => v.id === editId);
        if (vehicle) {
          setSelectedVehicleId(editId);
          updateForm.setFieldsValue({
            plateNumber: vehicle.plateNumber,
            make: vehicle.make,
            model: vehicle.model,
            modelYear: vehicle.modelYear,
            color: vehicle.color,
            batteryCapacityKwh: vehicle.batteryCapacityKwh || 0.0,
            rangeKm: vehicle.rangeKm || 0,
          });
          setUpdateModalVisible(true);
        } else {
          message.error("Không tìm thấy xe này trong danh sách của bạn");
        }
      })();
    }
  }, [location.search]);

  const handleTableChange = (paginationConfig, filters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    fetchMyVehicleRequests();
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Load data on component mount
  useEffect(() => {
    fetchMyVehicleRequests();
  }, []);

  const baseUploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    accept: "image/*",
  };

  const vehicleImageUploadProps = {
    ...baseUploadProps,
    multiple: true,
    maxCount: MAX_VEHICLE_IMAGES,
  };

  const singleImageUploadProps = {
    ...baseUploadProps,
    maxCount: 1,
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "16px" }}>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          </div>
          <Tabs
            activeKey={location.pathname}
            onChange={(key) => navigate(key)}
            items={[
              { key: "/view-myvehicle", label: "Danh sách các xe" },
              { key: "/my-vehicle-requests", label: "Yêu cầu đăng ký xe" },
            ]}
            style={{ marginBottom: 16 }}
          />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title={
                <span style={{ fontSize: "20px", fontWeight: "600" }}>
                  Yêu cầu xe của tôi
                </span>
              }
              extra={
                <Space>
                  <Input
                    placeholder="Tìm theo biển số, hãng hoặc model"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    allowClear
                    onClear={handleClearSearch}
                    style={{ width: 300 }}
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    Làm mới
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateClick}
                  >
                    Tạo yêu cầu xe mới
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={handleUpdateClick}>
                    Yêu cầu cập nhật xe
                  </Button>
                </Space>
              }
            >
              {error && (
                <Alert
                  message="Lỗi"
                  description={error}
                  type="error"
                  closable
                  style={{ marginBottom: 16 }}
                  onClose={() => setError(null)}
                />
              )}

              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} của ${total} yêu cầu`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 1200 }}
                />
              </Spin>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Vehicle Management System {new Date().getFullYear()}
        </Footer>
      </Layout>

      {/* Create Request Modal */}
      <Modal
        title="Tạo yêu cầu xe mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          setVehicleImageFileList([]);
          setRegistrationPaperFileList([]);
        }}
        footer={null}
        width={700}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            name="make"
            label="Hãng xe"
            rules={[
              { required: true, message: "Vui lòng nhập hãng xe" },
              { min: 2, message: "Hãng xe phải có ít nhất 2 ký tự" },
              { max: 50, message: "Hãng xe không được quá 50 ký tự" },
            ]}
          >
            <Input placeholder="VD: Toyota, Honda, Vinfast..." />
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[
              { required: true, message: "Vui lòng nhập model" },
              { min: 1, message: "Model phải có ít nhất 1 ký tự" },
              { max: 50, message: "Model không được quá 50 ký tự" },
            ]}
          >
            <Input placeholder="VD: Vios, City, VF5..." />
          </Form.Item>

          <Form.Item
            name="modelYear"
            label="Năm sản xuất"
            rules={[
              { required: true, message: "Vui lòng nhập năm sản xuất" },
              {
                type: "number",
                min: 1900,
                max: new Date().getFullYear(),
                message: `Năm sản xuất phải từ 1900 đến ${new Date().getFullYear()}`,
              },
            ]}
          >
            <InputNumber
              min={1900}
              max={new Date().getFullYear()}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <Input placeholder="VD: Trắng, Đen, Xanh..." />
          </Form.Item>

          <Form.Item
            name="batteryCapacityKwh"
            label="Dung lượng pin (kWh)"
            rules={[
              {
                type: "number",
                min: 0,
                message: "Dung lượng pin không được là số âm",
              },
            ]}
          >
            <InputNumber
              min={0}
              step={0.1}
              style={{ width: "100%" }}
              placeholder="VD: 50.5"
            />
          </Form.Item>

          <Form.Item
            name="rangeKm"
            label="Quãng đường (km)"
            rules={[
              {
                type: "number",
                min: 0,
                message: "Quãng đường không được là số âm",
              },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="VD: 300"
            />
          </Form.Item>

          <Form.Item
            name="plateNumber"
            label="Biển số xe"
            rules={[
              { required: true, message: "Vui lòng nhập biển số xe" },
              {
                pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3}\.[0-9]{2}$/,
                message:
                  "Biển số xe phải có dạng 51F-123.45 (2 số + 1-2 chữ + dấu '-' + 3 số + '.' + 2 số)",
              },
            ]}
          >
            <Input placeholder="VD: 51F-123.45" />
          </Form.Item>

          <Form.Item
            name="vehicleImage"
            label="Hình ảnh xe"
            rules={[
              { required: true, message: "Vui lòng tải lên hình ảnh xe" },
            ]}
            extra={`Chọn tối thiểu 1 và tối đa ${MAX_VEHICLE_IMAGES} hình ảnh (ít nhất 1 hình ảnh chứa biển số xe)`}
          >
            <Upload
              {...vehicleImageUploadProps}
              fileList={vehicleImageFileList}
              onChange={handleVehicleImagesChange}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="registrationPaper"
            label="Giấy đăng ký xe"
            rules={[
              { required: true, message: "Vui lòng tải lên giấy đăng ký xe" },
            ]}
          >
            <Upload
              {...singleImageUploadProps}
              fileList={registrationPaperFileList}
              onChange={({ fileList }) =>
                setRegistrationPaperFileList(fileList)
              }
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Chọn giấy đăng ký</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space style={{ float: "right" }}>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  createForm.resetFields();
                  setVehicleImageFileList([]);
                  setRegistrationPaperFileList([]);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo yêu cầu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Request Modal */}
      <Modal
        title="Tạo yêu cầu cập nhật xe"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          updateForm.resetFields();
          setVehicleImageFileList([]);
          setRegistrationPaperFileList([]);
          setSelectedVehicleId(null);
        }}
        footer={null}
        width={700}
      >
        <Alert
          message="Chọn xe cần cập nhật"
          description="Vui lòng chọn xe từ danh sách xe của bạn, sau đó chỉnh sửa thông tin cần cập nhật."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item label="Chọn xe">
          <select
            className="ant-input"
            value={selectedVehicleId || ""}
            onChange={(e) => handleVehicleSelect(e.target.value)}
            style={{ width: "100%", padding: "4px 11px" }}
          >
            <option value="">-- Chọn xe --</option>
            {myVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </Form.Item>

        {selectedVehicleId && (
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateSubmit}
          >
            <Form.Item
              name="make"
              label="Hãng xe"
              rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
            >
              <Input placeholder="VD: Toyota, Honda, Vinfast..." />
            </Form.Item>

            <Form.Item
              name="model"
              label="Model"
              rules={[{ required: true, message: "Vui lòng nhập model" }]}
            >
              <Input placeholder="VD: Vios, City, VF5..." />
            </Form.Item>

            <Form.Item
              name="modelYear"
              label="Năm sản xuất"
              rules={[
                { required: true, message: "Vui lòng nhập năm sản xuất" },
                {
                  type: "number",
                  min: 1900,
                  max: new Date().getFullYear(),
                  message: `Năm sản xuất phải từ 1900 đến ${new Date().getFullYear()}`,
                },
              ]}
            >
              <InputNumber
                min={1900}
                max={new Date().getFullYear()}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="color" label="Màu sắc">
              <Input placeholder="VD: Trắng, Đen, Xanh..." />
            </Form.Item>

            <Form.Item
              name="batteryCapacityKwh"
              label="Dung lượng pin (kWh)"
              value={0.0}
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Dung lượng pin không được là số âm",
                },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="rangeKm"
              label="Quãng đường (km)"
              value={0}
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Quãng đường không được là số âm",
                },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="plateNumber"
              label="Biển số xe"
              rules={[
                { required: true, message: "Vui lòng nhập biển số xe" },
                {
                  pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3}\.[0-9]{2}$/,
                  message:
                    "Biển số xe phải có dạng 51F-123.45 (2 số + 1-2 chữ + '-' + 3 số + '.' + 2 số)",
                },
              ]}
            >
              <Input placeholder="VD: 51F-123.45" />
            </Form.Item>

            <Form.Item
              name="vehicleImage"
              label="Hình ảnh xe"
              rules={[
                { required: true, message: "Vui lòng tải lên hình ảnh xe" },
              ]}
              extra={`Chọn tối thiểu 1 và tối đa ${MAX_VEHICLE_IMAGES} hình ảnh (ít nhất 1 hình ảnh chứa biển số xe)`}
            >
              <Upload
                {...vehicleImageUploadProps}
                fileList={vehicleImageFileList}
                onChange={handleVehicleImagesChange}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn hình ảnh mới</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="registrationPaper"
              label="Giấy đăng ký xe"
              rules={[
                { required: true, message: "Vui lòng tải lên giấy đăng ký xe" },
              ]}
            >
              <Upload
                {...singleImageUploadProps}
                fileList={registrationPaperFileList}
                onChange={({ fileList }) =>
                  setRegistrationPaperFileList(fileList)
                }
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn giấy đăng ký mới</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Space style={{ float: "right" }}>
                <Button
                  onClick={() => {
                    setUpdateModalVisible(false);
                    updateForm.resetFields();
                    setVehicleImageFileList([]);
                    setRegistrationPaperFileList([]);
                    setSelectedVehicleId(null);
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Tạo yêu cầu cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu xe"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedRequest(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2} size="small">
              {selectedRequest.vehicleId && (
                <Descriptions.Item label="ID xe" span={2}>
                  {selectedRequest.vehicleId}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Loại yêu cầu">
                <Tag
                  color={selectedRequest.type === "CREATE" ? "blue" : "orange"}
                >
                  {selectedRequest.type === "CREATE" ? "TẠO MỚI" : "CẬP NHẬT"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    selectedRequest.status === "APPROVED"
                      ? "green"
                      : selectedRequest.status === "REJECTED"
                      ? "red"
                      : "orange"
                  }
                >
                  {selectedRequest.status === "APPROVED"
                    ? "Đã duyệt"
                    : selectedRequest.status === "REJECTED"
                    ? "Từ chối"
                    : "Chờ duyệt"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Biển số">
                {selectedRequest.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Hãng">
                {selectedRequest.make}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selectedRequest.model}
              </Descriptions.Item>
              <Descriptions.Item label="Năm">
                {selectedRequest.modelYear}
              </Descriptions.Item>
              <Descriptions.Item label="Màu">
                {selectedRequest.color || (
                  <Tag color={"gray"}>CHƯA CẬP NHẬT</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Pin (kWh)">
                {selectedRequest.batteryCapacityKwh || (
                  <Tag color={"gray"}>CHƯA CẬP NHẬT</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Quãng đường (km)">
                {selectedRequest.rangeKm || (
                  <Tag color={"gray"}>CHƯA CẬP NHẬT</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {selectedRequest.createdByName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={2}>
                {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật" span={2}>
                {new Date(selectedRequest.updatedAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              {selectedRequest.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  <Alert
                    message={selectedRequest.rejectionReason}
                    type="error"
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {(() => {
                  console.log("=== RENDERING VEHICLE IMAGES ===");
                  console.log("selectedRequest:", selectedRequest);
                  const vehicleImages =
                    getVehicleImagesFromRequest(selectedRequest);
                  console.log("Vehicle images to display:", vehicleImages);
                  console.log("Number of images:", vehicleImages.length);
                  
                  if (!vehicleImages.length) {
                    console.log("No vehicle images to display");
                    return (
                      <div>
                        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                          Hình ảnh xe:
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 200,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                            border: "1px dashed #d9d9d9",
                            borderRadius: 8,
                          }}
                        >
                          <span style={{ color: "#999" }}>
                            Chưa có hình ảnh xe
                          </span>
                        </div>
                      </div>
                    );
                  }
                  
                  console.log("Rendering", vehicleImages.length, "images");
                  return (
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                        Hình ảnh xe ({vehicleImages.length} ảnh):
                      </div>
                      <Space wrap size="middle">
                        {vehicleImages.map((img, index) => {
                          // Đảm bảo URL là string hợp lệ
                          const imageUrl = typeof img === 'string' ? img : (img?.url || img?.imageUrl || '');
                          if (!imageUrl) {
                            console.warn(`Invalid image URL at index ${index}:`, img);
                            return null;
                          }
                          console.log(`Rendering image ${index + 1}:`, imageUrl);
                          return (
                            <Image
                              key={`${imageUrl}-${index}`}
                              src={imageUrl}
                              alt={`Vehicle ${index + 1}`}
                              style={{
                                width: 180,
                                height: 150,
                                objectFit: "cover",
                                borderRadius: 8,
                              }}
                              preview
                              onError={(e) => {
                                console.error(`Failed to load image at index ${index}:`, imageUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                          );
                        })}
                      </Space>
                    </div>
                  );
                })()}
                {selectedRequest.registrationPaperUrl && (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Giấy đăng ký:
                    </div>
                    <Image
                      src={selectedRequest.registrationPaperUrl}
                      alt="Registration"
                      style={{
                        width: 180,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                      preview
                      onError={(e) => {
                        console.error("Failed to load registration paper:", selectedRequest.registrationPaperUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa yêu cầu xe"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
        centered
        confirmLoading={loading}
      >
        {requestToDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn xóa yêu cầu{" "}
              <strong>
                {requestToDelete.type === "CREATE" ? "tạo mới" : "cập nhật"}
              </strong>{" "}
              xe <strong>{requestToDelete.plateNumber}</strong>?
            </p>
            <Alert
              message="Hành động này không thể hoàn tác!"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default MyVehicleRequests;
