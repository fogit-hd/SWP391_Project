import React, { useState } from "react";
import { Form, Input, Radio, Alert, Space, Checkbox, Row, Col } from "antd";
import { WarningOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const DamageReport = ({ onDamageChange, form }) => {
  const [hasDamage, setHasDamage] = useState(false);
  const [damageType, setDamageType] = useState([]);

  const handleDamageChange = (e) => {
    const value = e.target.value === 'yes';
    setHasDamage(value);
    if (onDamageChange) {
      onDamageChange(value);
    }
    if (!value) {
      form.setFieldsValue({ damageReport: '', damageType: [] });
      setDamageType([]);
    }
  };

  const damageOptions = [
    { label: 'Scratches', value: 'scratches' },
    { label: 'Dents', value: 'dents' },
    { label: 'Broken Parts', value: 'broken' },
    { label: 'Interior Damage', value: 'interior' },
    { label: 'Tire Issues', value: 'tire' },
    { label: 'Battery/Charging Issues', value: 'battery' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Form.Item
        name="hasDamage"
        label="Is there any damage to the vehicle?"
        initialValue="no"
      >
        <Radio.Group onChange={handleDamageChange}>
          <Radio value="no">No Damage</Radio>
          <Radio value="yes">Report Damage</Radio>
        </Radio.Group>
      </Form.Item>

      {hasDamage && (
        <>
          <Alert
            message="Please report any damage honestly"
            description="Accurate damage reports help maintain vehicle quality and ensure fair usage for all co-owners."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />

          <Form.Item
            name="damageType"
            label="Type of Damage (Select all that apply)"
          >
            <Checkbox.Group 
              style={{ width: '100%' }}
              onChange={(values) => setDamageType(values)}
            >
              <Row>
                {damageOptions.map(option => (
                  <Col span={12} key={option.value}>
                    <Checkbox value={option.value}>{option.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="damageReport"
            label="Damage Description"
            rules={[
              { required: hasDamage, message: "Please describe the damage" },
              { min: 10, message: "Please provide more details (at least 10 characters)" }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please describe the damage in detail: location, severity, how it happened, etc."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Alert
            message="Important"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Describe the damage location precisely</li>
                <li>Indicate if the damage affects vehicle safety or functionality</li>
                <li>If possible, take photos and upload them above</li>
                <li>The damage will be reviewed by the group admin</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </>
      )}
    </Space>
  );
};

export default DamageReport;
