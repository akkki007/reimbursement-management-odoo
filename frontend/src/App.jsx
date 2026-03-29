import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpense from './pages/expenses/SubmitExpense';
import ExpenseHistory from './pages/expenses/ExpenseHistory';
import ScanReceipt from './pages/expenses/ScanReceipt';
import ApprovalQueue from './pages/approvals/ApprovalQueue';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import ManageUsers from './pages/admin/ManageUsers';
import ApprovalRules from './pages/admin/ApprovalRules';
import CompanySettings from './pages/admin/CompanySettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Expense routes */}
          <Route
            path="/expenses/submit"
            element={
              <ProtectedRoute>
                <SubmitExpense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/scan"
            element={
              <ProtectedRoute>
                <ScanReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpenseHistory />
              </ProtectedRoute>
            }
          />

          {/* Approval routes */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <ApprovalQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals/:expenseId"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <ApprovalDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rules"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ApprovalRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <CompanySettings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
