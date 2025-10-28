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
import MyGroup from "./pages/view.mygroup";
import MyVehicle from "./pages/view.myvehicle";
import CreateEContract from "./pages/create.econtract";
import MyContracts from "./pages/view.mycontract";
import ReviewEContract from "./pages/staff/review.econtract/index";
import SignEContract from "./pages/sign.econtract/index";
import StaffDashboard from "./pages/staff/dashboard";
import TechnicianDashboard from "./pages/technician/dashboard";
import ReviewService from "./pages/technician/review.service";
import CreateServiceRequest from "./pages/create.service";
import BookingCalendar from "./pages/booking";

function App() {
  const router = createBrowserRouter([
    // ADMIN PAGE
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

    // STAFF PAGE

    {
      path: "/staff/dashboard",
      element: (
        <ProtectedRoute roleId={2}>
          <StaffDashboard />
        </ProtectedRoute>
      ),
    },

    {
      path: "/staff/review-econtract",
      element: (
        <ProtectedRoute roleId={2}>
          <ReviewEContract />
        </ProtectedRoute>
      ),
    },
    // TECHNICIAN PAGE

    {
      path: "/technician/dashboard",
      element: (
        <ProtectedRoute roleId={4}>
          <TechnicianDashboard />
        </ProtectedRoute>
      ),
    },

    {
      path: "/technician/review-service",
      element: (
        <ProtectedRoute roleId={4}>
          <ReviewService />
        </ProtectedRoute>
      ),
    },

    // GUEST PAGE

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

    // CO-OWNER PAGE
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
      path: "/view-mygroup",
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
      path: "/view-myvehicle",
      element: (
        <ProtectedRoute roleId={3}>
          <MyVehicle />
        </ProtectedRoute>
      ),
    },
        {
      path: "/sign-econtract/:contractId",
      element: (
        <ProtectedRoute roleId={3}>
          <SignEContract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/booking",
      element: (
        <ProtectedRoute roleId={3}>
          <BookingCalendar />
        </ProtectedRoute>
      ),
    },
    {
      path: "/my-contracts",
      element: (
        <ProtectedRoute roleId={3}>
          <SignEContract />
        </ProtectedRoute>
      ),
    },
    {
      path: "/review-econtract",
      element: (
        <ProtectedRoute roleId={3}>
          <ReviewEContract />
        </ProtectedRoute>
      ),
    },

    {
      path: "/review-econtract",
      element: (
        <ProtectedRoute roleId={3}>
          <ReviewEContract />
        </ProtectedRoute>
      ),
    },

    {
      path: "/create-service-request",
      element: (
        <ProtectedRoute roleId={3}>
          <CreateServiceRequest />
        </ProtectedRoute>
      ),
    },

    {
      path: "/staff/dashboard",
      element: (
        <ProtectedRoute roleId={2}>
          <StaffDashboard />
        </ProtectedRoute>
      ),
    }
  ]);
  

  return (
    <AuthProvider>
      <ToastContainer />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
