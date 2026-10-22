import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import RequireRole from "./components/RequireRole";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bookings from "./pages/Bookings";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentResult from "./pages/PaymentResult";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-svh bg-muted/40">
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/payment/:result" element={<PaymentResult />} />
              <Route
                path="/bookings"
                element={
                  <RequireRole roles={["CUSTOMER", "PROVIDER"]}>
                    <Bookings />
                  </RequireRole>
                }
              />
              <Route
                path="/provider"
                element={
                  <RequireRole roles={["PROVIDER"]}>
                    <ProviderDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireRole roles={["ADMIN"]}>
                    <AdminDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="*"
                element={
                  <p className="text-muted-foreground">Page not found.</p>
                }
              />
            </Routes>
          </main>
        </div>
        <Toaster theme="light" position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
