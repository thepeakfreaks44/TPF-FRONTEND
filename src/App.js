import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Gear from "@/pages/Gear";
import Rentals from "@/pages/Rentals";
import Transport from "@/pages/Transport";
import Staff from "@/pages/Staff";
import Salaries from "@/pages/Salaries";
import Users from "@/pages/Users";
import Treks from "@/pages/Treks";
import TrekSchedules from "@/pages/TrekSchedules";
import TransportRegistry from "@/pages/TransportRegistry";
import Attendance from "@/pages/Attendance";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Backup from "@/pages/Backup";
import ClientDetail from "@/pages/ClientDetail";
import Guides from "@/pages/Guides";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="guides" element={<Guides />} />
            <Route path="trek-schedules" element={<TrekSchedules />} />
            <Route path="treks" element={<Treks />} />
            <Route path="gear" element={<Gear />} />
            <Route path="rentals" element={<Rentals />} />
            <Route path="transport" element={<Transport />} />
            <Route path="fleet" element={<TransportRegistry />} />
            <Route path="staff" element={<Staff />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="salaries" element={<Salaries />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="backup" element={<Backup />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
