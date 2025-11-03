import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemberList from "./pages/Members/MemberList";
import MemberForm from "./pages/Members/MemberForm";
import EquipmentList from "./pages/Equipment/EquipmentList";
import EquipmentForm from "./pages/Equipment/EquipmentForm";
import PackageList from "./pages/Packages/PackageList";
import PackageForm from "./pages/Packages/PackageForm";
import SubscriptionList from "./pages/Subscriptions/SubscriptionList";
import SubscriptionForm from "./pages/Subscriptions/SubcriptionForm";
import PaymentList from "./pages/Payments/PaymentList";
import PaymentForm from "./pages/Payments/PaymentForm";
import UsageList from "./pages/Usages/UsageList";
import UsageForm from "./pages/Usages/UsageForm";
import ReportPage from "./pages/Reports/ReportPage";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Box, Typography, CssBaseline } from "@mui/material";
import { useTheme } from "@mui/material/styles"; // Import useTheme
import { useEffect } from "react"; // Import useEffect

function App() {
  const theme = useTheme(); // Get the current theme

  useEffect(() => {
    // Directly apply the theme's background color to the body for debugging
    document.body.style.backgroundColor = theme.palette.background.default;
    document.body.style.color = theme.palette.text.primary;
  }, [theme]); // Re-run when theme changes

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <CssBaseline />

      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<MemberList />} />
          <Route path="members/new" element={<MemberForm />} />
          <Route path="members/edit/:id" element={<MemberForm />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="equipment/new" element={<EquipmentForm />} />
          <Route path="equipment/edit/:id" element={<EquipmentForm />} />
          <Route path="packages" element={<PackageList />} />
          <Route path="packages/new" element={<PackageForm />} />
          <Route path="packages/edit/:id" element={<PackageForm />} />
          <Route path="subscriptions" element={<SubscriptionList />} />
          <Route path="subscriptions/new" element={<SubscriptionForm />} />
          <Route path="subscriptions/edit/:id" element={<SubscriptionForm />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="payments/new" element={<PaymentForm />} />
          <Route path="payments/edit/:id" element={<PaymentForm />} />
          <Route path="usages" element={<UsageList />} />
          <Route path="usages/new" element={<UsageForm />} />
          <Route path="usages/edit/:id" element={<UsageForm />} />
          <Route path="reports" element={<ReportPage />} />
          {/* Add other protected routes here */}
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
