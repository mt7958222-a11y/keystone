import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkOrderBoard from './pages/WorkOrderBoard';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Customers from './pages/Customers';
import TechnicianJobs from './pages/TechnicianJobs';
import CustomerPortal from './pages/CustomerPortal';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'MANAGER':
      return <Navigate to="/dashboard" replace />;
    case 'DISPATCHER':
      return <Navigate to="/board" replace />;
    case 'TECHNICIAN':
      return <Navigate to="/my-jobs" replace />;
    case 'CUSTOMER':
      return <Navigate to="/portal" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow={['MANAGER']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board"
          element={
            <ProtectedRoute allow={['DISPATCHER', 'MANAGER']}>
              <WorkOrderBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute allow={['DISPATCHER', 'MANAGER']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute allow={['TECHNICIAN']}>
              <TechnicianJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal"
          element={
            <ProtectedRoute allow={['CUSTOMER']}>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
