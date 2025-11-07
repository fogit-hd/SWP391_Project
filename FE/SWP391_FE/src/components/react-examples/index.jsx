import { AppProvider } from "./AppContext";
import Demo from "./Demo";
import "./styles.css";

const ReactAdvances = () => {
  return (
    <AppProvider>
      <div className="react-advances">
        <Demo />
      </div>
    </AppProvider>
  );
};

export default ReactAdvances;
