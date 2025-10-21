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
import ManageContract from "./pages/admin/manageContract";
import ManageService from "./pages/admin/manageService";
import ManageGroup from "./pages/admin/manageGroup";
import ManageVehicle from "./pages/admin/manageVehicle";
import ForgotPassword from "./pages/forgot.password";
import VerifyOTP from "./pages/verify.otp";
import UpdateProfile from "./pages/update.profile";
import ChangePassword from "./pages/change.password";
import CreateGroup from "./pages/create.group";
import MyGroup from "./pages/myGroup";
import MyVehicle from "./pages/my-vehicle";
import CreateEContract from "./pages/create.econtract";
import MyContracts from "./pages/view.mycontract";
import VerifyContractOTP from "./pages/verify.contract.otp/index";
import ReviewEContract from "./pages/staff/review.econtract/index";

function App() {
  const router = createBrowserRouter([
    {
      path: "/admin/dashboard",
      element: (
        <ProtectedRoute roleId={1}>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/manage-account",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageAccount />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/manage-contract",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageContract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/manage-service",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageService />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/manage-group",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageGroup />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/manage-vehicle",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageVehicle />
        </ProtectedRoute>
      ),
    },

    {
      path: "/staff/review-econtract",
      element: (
        <ProtectedRoute roleId={1 | 2}>
          <ReviewEContract />
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
      path: "/create-econtract",
      element: (
        <ProtectedRoute roleId={3}>
          <CreateEContract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/view-mycontract",
      element: (
        <ProtectedRoute roleId={3}>
          <MyContracts />
        </ProtectedRoute>
      ),
    },
    {
      path: "/view-myGroup",
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
    {
      path: "/my-vehicle",
      element: (
        <ProtectedRoute roleId={3}>
          <MyVehicle />
        </ProtectedRoute>
      ),
    },
    {
      path: "/my-contracts",
      element: (
        <ProtectedRoute roleId={3}>
          <MyContracts />
        </ProtectedRoute>
      ),
    },
    {
      path: "/verify-contract-otp/:contractId",
      element: (
        <ProtectedRoute roleId={3}>
          <VerifyContractOTP />
        </ProtectedRoute>
      ),
    },
    {
      path: "/review-econtract",
      element: (
        <ProtectedRoute roleId={2}>
          <ReviewEContract />
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
