import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "components/protected.route";
import AuthProvider from "components/auth.provider";
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
import ForgotPassword from "./pages/forgot.password";
import VerifyOTP from "./pages/verify.otp";
import UpdateProfile from "./pages/update.profile";
import ChangePassword from "./pages/change.password";
import CreateGroup from "./pages/create.group";
import ViewEContract from "./pages/view.econtract";
import MyGroup from "./pages/myGroup";


function App() {
  const router = createBrowserRouter([
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute roleId={1}>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/manage-account",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageAccount />
        </ProtectedRoute>
      ),
    },
    {
      path: "/manage-contract",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageContract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/manage-service",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageService />
        </ProtectedRoute>
      ),
    },

    {
      path: "/manage-group",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageGroup />
        </ProtectedRoute>
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
      path: "/verify-otp",
      element: <VerifyOTP />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/terms",
      element: <TermsPage />,
    },
    {
      path: "/update-profile",
      element: (
        <ProtectedRoute roleId={3}>
          <UpdateProfile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/change-password",
      element: (
        <ProtectedRoute roleId={3}>
          <ChangePassword />
        </ProtectedRoute>
      ),
    },
    {
      path: "/contract",
      element: (
        <ProtectedRoute roleId={3}>
          <Contract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/view.econtract", 
      element: (
        <ProtectedRoute roleId={3}>
          <ViewEContract />
        </ProtectedRoute>
      )
    },
      {
        path: "/my-group",
        element: (
          <ProtectedRoute roleId={3}>
            <MyGroup />
          </ProtectedRoute>
        ),
      },
      {
        path: "/create-group",
        element: (
          <ProtectedRoute roleId={3}>
            <CreateGroup />
          </ProtectedRoute>
        ),
      },
  ]);

  return (
    <AuthProvider>
      <ToastContainer />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
