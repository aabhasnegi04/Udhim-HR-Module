import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/Employees/EmployeeProfile';
import AddEmployee from './pages/Employees/AddEmployee';
import OrgChart from './pages/OrgChart';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import Offboarding from './pages/Offboarding';
import Admin from './pages/Admin';
import Setup from './pages/Setup';
import KioskAuth from './pages/KioskAuth';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        
        {/* Kiosk Route - Requires PIN authentication */}
        <Route path="/kiosk" element={<KioskAuth />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredPage="dashboard">
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute requiredPage="employees">
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/add"
          element={
            <ProtectedRoute requiredPage="employees">
              <Layout>
                <AddEmployee />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:employeeId"
          element={
            <ProtectedRoute requiredPage="employees">
              <Layout>
                <EmployeeProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/org-chart"
          element={
            <ProtectedRoute requiredPage="employees">
              <Layout>
                <OrgChart />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute requiredPage="attendance">
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave"
          element={
            <ProtectedRoute requiredPage="leave">
              <Layout>
                <Leave />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payroll"
          element={
            <ProtectedRoute requiredPage="payroll">
              <Layout>
                <Payroll />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/offboarding"
          element={
            <ProtectedRoute requiredPage="offboarding">
              <Layout>
                <Offboarding />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredPage="admin">
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/setup"
          element={
            <ProtectedRoute requiredPage="setup">
              <Layout>
                <Setup />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
