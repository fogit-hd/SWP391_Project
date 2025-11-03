import React, { useEffect, useState } from "react";
import { Button, Card } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import "./NotificationDetailPanel.css";

const NotificationDetailPanel = ({
  notification,
  isOpen,
  onClose,
  onMarkRead,
  formatRelativeTime,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen && notification) {
      // Small delay for animation trigger
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  const handleClose = async () => {
    setIsVisible(false);
    // Wait for animation to complete
    setTimeout(async () => {
      if (!notification.isRead && onMarkRead) {
        await onMarkRead(notification.id);
      }
      onClose();
    }, 300);
  };

  return (
    <div className={`notification-detail-panel ${isVisible ? "is-visible" : ""}`}>
      <Card
        className="notification-detail-card"
        size="small"
        title={
          <div className="notification-detail-header">
            <div className="notification-detail-title">{notification.title}</div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="notification-close-btn"
              onClick={handleClose}
            />
          </div>
        }
      >
        <div className="notification-detail-time">
          {new Date(notification.createdAt).toLocaleString()} {" • "}
          {formatRelativeTime(notification.createdAt)}
        </div>
        <div className="notification-detail-message">{notification.message}</div>
      </Card>
    </div>
  );
};

export default NotificationDetailPanel;
