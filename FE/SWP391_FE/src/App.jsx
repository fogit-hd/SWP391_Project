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
import ManageStatistic from "./pages/admin/manageStatistic";
import ManageVehicleRequests from "./pages/staff/manageVehicleRequest/ManageVehicleRequests";
import ForgotPassword from "./pages/forgot.password";
import VerifyOTP from "./pages/verify.otp";
import UpdateProfile from "./pages/update.profile";
import ChangePassword from "./pages/change.password";
import CreateGroup from "./pages/create.group";
import MyGroup from "./pages/view.mygroup";
import MyVehicle from "./pages/view.myvehicle";
import MyVehicleRequests from "./pages/view.myvehicle/MyVehicleRequests";
import CreateEContract from "./pages/create.econtract";
import MyContracts from "./pages/view.mycontract";
import ReviewEContract from "./pages/staff/review.econtract/index";
import SignEContract from "./pages/sign.econtract/index";
import StaffDashboard from "./pages/staff/dashboard";
import TechnicianDashboard from "./pages/technician/dashboard";
import ReviewService from "./pages/technician/review.service";
import ServiceJobsPage from "./pages/technician/service.jobs";
import CreateServiceRequest from "./pages/create.service";
import BookingCalendar from "./pages/booking";
import PaymentHistory from "./pages/payment.history";
import BookingManagement from "./pages/booking/index.jsx";
import ManageBooking from "./pages/staff/Manage.Booking/index.jsx";
import ContactUs from "./pages/contact.us";

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
    {
      path: "/admin/manage-statistic",
      element: (
        <ProtectedRoute roleId={1}>
          <ManageStatistic />
        </ProtectedRoute>
      ),
    },

    // STAFF PAGE

    {
      path: "/staff/dashboard",
      element: (
        <ProtectedRoute roleId={[1, 2]}>
          <StaffDashboard />
        </ProtectedRoute>
      ),
    },

    {
      path: "/staff/manage-vehicle-requests",
      element: (
        <ProtectedRoute roleId={[1, 2]}>
          <ManageVehicleRequests />
        </ProtectedRoute>
      ),
    },

    {
      path: "/staff/review-econtract",
      element: (
        <ProtectedRoute roleId={[1, 2]}>
          <ReviewEContract />
        </ProtectedRoute>
      ),
    },
    // TECHNICIAN PAGE

    {
      path: "/technician/dashboard",
      element: (
        <ProtectedRoute roleId={[4]}>
          <TechnicianDashboard />
        </ProtectedRoute>
      ),
    },

    {
      path: "/technician/review-services",
      element: (
        <ProtectedRoute roleId={[1, 2, 4]}>
          <ReviewService />
        </ProtectedRoute>
      ),
    },

    {
      path: "/technician/service-jobs",
      element: (
        <ProtectedRoute roleId={[1, 4]}>
          <ServiceJobsPage />
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
    {
      path: "/contact-us",
      element: <ContactUs />,
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
      path: "/payment-history",
      element: (
        <ProtectedRoute roleId={3}>
          <PaymentHistory />
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
      path: "/my-vehicle-requests",
      element: (
        <ProtectedRoute roleId={3}>
          <MyVehicleRequests />
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
          <BookingManagement />
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
        <ProtectedRoute roleId={[1, 2]}>
          <StaffDashboard />
        </ProtectedRoute>
      ),
    },

    {
      path: "/Manage.Booking",
      element: (
        <ProtectedRoute roleId={[1, 2]}>
          <ManageBooking />
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
