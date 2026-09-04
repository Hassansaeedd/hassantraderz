// client/src/router/AppRouter.jsx — Registered Industrial & Expense Routes
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import POSPage from '../pages/pos/POSPage';
import ProductsPage from '../pages/inventory/ProductsPage';
import ProductFormPage from '../pages/inventory/ProductFormPage';
import SalesPage from '../pages/sales/SalesPage';
import SaleDetailPage from '../pages/sales/SaleDetailPage';
import PurchasesPage from '../pages/purchases/PurchasesPage';
import CustomersPage from '../pages/customers/CustomersPage';
import SuppliersPage from '../pages/suppliers/SuppliersPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import UsersPage from '../pages/users/UsersPage';
import RepairsPage from '../pages/repairs/RepairsPage';
import TradeInPage from '../pages/tradein/TradeInPage';
import KhataPage from '../pages/khata/KhataPage';
import ExpensesPage from '../pages/expenses/ExpensesPage';
import LicenseManagementPage from '../pages/admin/LicenseManagementPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main Protected Workspace */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          
          {/* Industrial Mobile Shop Modules */}
          <Route path="/repairs" element={<RepairsPage />} />
          <Route path="/trade-in" element={<TradeInPage />} />
          <Route path="/khata" element={<KhataPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductFormPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/licenses" element={<LicenseManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
