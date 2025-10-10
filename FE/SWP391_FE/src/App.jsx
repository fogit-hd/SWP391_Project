import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "components/protected-route";
import ManageAccount from "./pages/admin/manageAccount";
import { ToastContainer } from "react-toastify";
import Homepage from "/src/pages/home";
import LoginPage from "/src/pages/login";
import RegisterPage from "/src/pages/register";
import Dashboard from "/src/pages/admin/dashboard";
import TermsPage from "/src/pages/terms";
import Contract from "./pages/econtract";
import ManageContract from "./pages/admin/manageContract";
import ManageService from "./pages/admin/manageService";
import ManageGroup from "./pages/admin/manageGroup";

function App() {
  const router = createBrowserRouter([
    {
      path: "/dashboard",
      element: (
        // <ProtectedRoute role={"ADMIN"}>
        <Dashboard />
        // </ProtectedRoute>
      ),
    },
    {
      path: "/manage-account",
      element: (
        // <ProtectedRoute role={"ADMIN"}>
        <ManageAccount />
        // </ProtectedRoute>
      ),
    },
    {
      path: "/manage-contract",
      element: (
        // <ProtectedRoute role={"ADMIN"}>
        <ManageContract />
        // </ProtectedRoute>
      ),
    },
    {
      path: "/manage-service",
      element: (
        // <ProtectedRoute role={"ADMIN"}>
        <ManageService />
        // </ProtectedRoute>
      ),
    },

    {
      path: "/manage-group",
      element: (
        // <ProtectedRoute role={"ADMIN"}>
        <ManageGroup />
        // </ProtectedRoute>
      ),
    },

    {
      path: "/",
      element: <Homepage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/terms",
      element: <TermsPage />,
    },
    {
      path: "/contract",
      element: <Contract />,
    },
  ]);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
