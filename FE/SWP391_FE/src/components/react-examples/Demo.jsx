import { useNavigate } from "react-router";
import { useAppContext } from "./useAppContext";
import "./styles.css";
import { Button } from "antd";

const Demo = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  return (
    <div className={`demo-container theme-${state.theme}`}>
      <h2>React Advanced:</h2>

      <div className="demo-section">
        <h3>Theme Switcher</h3>
        <p>
          Theme hiện tại: <strong>{state.theme}</strong>
        </p>
        <div className="theme-buttons">
          {["light", "dark", "blue", "gray", "red"].map((theme) => (
            <button
              key={theme}
              onClick={() => actions.setTheme(theme)}
              className={`theme-btn ${state.theme === theme ? "active" : ""}`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>Notifications</h3>
        <div className="notif-controls">
          <button
            onClick={() =>
              actions.addNotification({ message: "Success!", type: "success" })
            }
          >
            Add Success
          </button>
          <button
            onClick={() =>
              actions.addNotification({ message: "Error!", type: "error" })
            }
          >
            Add Error
          </button>
          <button
            onClick={() =>
              actions.addNotification({ message: "Info", type: "info" })
            }
          >
            Add Info
          </button>
        </div>
        <div className="notif-list">
          {state.notifications.length === 0 ? (
            <p>Chưa có thông báo</p>
          ) : (
            state.notifications.map((notif) => (
              <div key={notif.id} className={`notif-item ${notif.type}`}>
                <span>{notif.message}</span>
                <button onClick={() => actions.removeNotification(notif.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <Button onClick={() => navigate("/")}>BACK</Button>
      </div>
    </div>
  );
};

export default Demo;
