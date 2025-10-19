import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Divider,
  Form,
  Input,
  Select,
  Button,
  Modal,
  message,
} from "antd";
import api from "../../config/axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const CreateEContract = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const account = useSelector((state) => state.account?.user || {});
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userData = account.email ? account : localUser;

  useEffect(() => {
    if (userData) {
      form.setFieldsValue({
        fullName: userData.fullName || "",
        idNumber: userData.idNumber || "",
        address: userData.address || "",
      });
    }
  }, [userData, form]);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        fullName: userData.fullName,
        idNumber: userData.idNumber,
        address: userData.address,
      };

      const res = await api.post("/contracts/create", payload);
      toast.success("Contract created successfully!");
      setIsModalVisible(true);
    } catch (error) {
      console.error(error);
      message.error("Failed to create contract. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="econ-wrapper-center">
      <Card className="econ-card animate-fade-up">
        <Title level={3} className="econ-main-title">
          Co-ownership Contract — EVCars
        </Title>

        <Paragraph className="econ-intro">
          Join the green revolution! Fill in the details below to create your
          co-ownership contract.
        </Paragraph>

        <Divider />

        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          className="econ-form"
          initialValues={{
            term: 6,
            share: 50,
          }}
        >
          <Form.Item label="Full Name" name="fullName">
            <Input disabled />
          </Form.Item>

          <Form.Item label="National ID (CCCD)" name="idNumber">
            <Input disabled />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Vehicle Model"
            name="vehicleModel"
            rules={[{ required: true, message: "Please enter vehicle model" }]}
          >
            <Input placeholder="E.g. EVCars Model X" />
          </Form.Item>

          <Form.Item
            label="Ownership Share (%)"
            name="share"
            rules={[{ required: true, message: "Please specify share" }]}
          >
            <Input type="number" min={1} max={100} />
          </Form.Item>

          <Form.Item
            label="Contract Duration"
            name="term"
            rules={[{ required: true, message: "Please select contract term" }]}
          >
            <Select>
              <Option value={6}>6 months</Option>
              <Option value={12}>12 months (1 year)</Option>
              <Option value={24}>24 months (2 years)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={3} placeholder="Optional terms..." />
          </Form.Item>

          <Form.Item className="econ-submit">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              size="large"
            >
              {isLoading ? "Creating..." : "Create Contract"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Contract Created"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="OK"
      >
        <p>Your contract has been successfully created and recorded.</p>
      </Modal>
    </div>
  );
};

export default CreateEContract;
