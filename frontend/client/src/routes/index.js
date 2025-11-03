// src/routes/index.jsx
import { MainLayout } from "../layouts/MainLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { MemberList } from "../pages/Members/MemberList";
import { MemberForm } from "../pages/Members/MemberForm";
import { SubscriptionList } from "../pages/Subscriptions/SubscriptionList";
import { SubscriptionForm } from "../pages/Subscriptions/SubcriptionForm";
import { PaymentList } from "../pages/Payments/PaymentList";
import { PaymentForm } from "../pages/Payments/PaymentForm";
import { UsageList } from "../pages/Usages/UsageList";
import { UsageForm } from "../pages/Usages/UsageForm";
import { ReportPage } from "../pages/Reports/ReportPage";

const routes = [
  {
    path: "/",
    element: <MainLayout />,
    auth: true,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "members", element: <MemberList /> },
      { path: "members/new", element: <MemberForm /> },
      { path: "members/edit/:id", element: <MemberForm /> },
      { path: "subscriptions", element: <SubscriptionList /> },
      { path: "subscriptions/new", element: <SubscriptionForm /> },
      { path: "subscriptions/edit/:id", element: <SubscriptionForm /> },
      { path: "payments", element: <PaymentList /> },
      { path: "payments/new", element: <PaymentForm /> },
      { path: "payments/edit/:id", element: <PaymentForm /> },
      { path: "usages", element: <UsageList /> },
      { path: "usages/new", element: <UsageForm /> },
      { path: "reports", element: <ReportPage /> },
      // ... other routes
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [{ path: "login", element: <Login /> }],
  },
];
