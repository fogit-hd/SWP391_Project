import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../config/axios";
import dayjs from "dayjs";

const ManageTemplate = ({ columns, apiURL, formItems }) => {
  // định nghĩa cái dữ liệu
  // => api
  // 1. tên biến
  // 2. setter
  const [categories, setCategories] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  const fetchCategories = async () => {
    // gọi tới api và lấy dữ liệu categories
    console.log("fetching data from API...");

    // đợi BE trả về dữ liệu
    const response = await api.get(apiURL);

    console.log(response.data);
    setCategories(response.data);
  };

  const handleSubmitForm = async (values) => {
    const { id } = values;
    let response;

    if (id) {
      // => update
      response = await api.put(`${apiURL}/${id}`, values);
    } else {
      // => create new
      response = await api.post(apiURL, values);
    }

    console.log(response.data);
    setOpen(false);
    fetchCategories();
    form.resetFields();
    toast.success("Successfully create new category!");
  };

  // khi load trang lên => fetchCategories()
  useEffect(() => {
    // làm gì khi load trang lên
    fetchCategories();
  }, []);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Add new element
      </Button>
      <Table
        columns={[
          ...columns,
          {
            title: "Action",
            dataIndex: "id",
            key: "id",
            render: (id, record) => {
              // record: {name, description}
              return (
                <>
                  <Button
                    type="primary"
                    onClick={() => {
                      // 1. open modal
                      setOpen(true);
                      console.log(record);
                      // 2. fill old data => form
                      form.setFieldsValue({
                        ...record,
                        createAt: dayjs(record.createAt),
                        startAt: dayjs(record.startAt),
                        endAt: dayjs(record.endAt),
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete element"
                    onConfirm={async () => {
                      // => cho phép delete
                      await api.delete(`${apiURL}/${id}`);

                      fetchCategories(); // cập nhật lại danh sách
                      toast.success("Successfully remove category!");
                    }}
                  >
                    <Button type="primary" danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </>
              );
            },
          },
        ]}
        dataSource={categories}
      />
      <Modal
        title="Create new category"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          labelCol={{
            span: 24,
          }}
          form={form}
          onFinish={handleSubmitForm}
        >
          {formItems}
        </Form>
      </Modal>
    </>
  );
};

export default ManageTemplate;
