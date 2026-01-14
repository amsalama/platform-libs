import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'

import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import TwoFactorPage from '../features/auth/pages/TwoFactorPage'
import CallbackPage from '../features/auth/pages/CallbackPage'
import SSORedirectPage from '../features/auth/pages/SSORedirectPage'
import LogoutPage from '../features/auth/pages/LogoutPage'
import DashboardRedirectPage from '../features/dashboard/pages/DashboardRedirectPage'
import ProfilePage from '../features/profile/pages/ProfilePage'
import SettingsPage from '../features/settings/pages/SettingsPage'
import AdminDashboard from '../features/admin/pages/AdminDashboard'
import UsersPage from '../features/admin/pages/UsersPage'
import RolesPage from '../features/admin/pages/RolesPage'
import PermissionsPage from '../features/admin/pages/PermissionsPage'
import TenantsPage from '../features/admin/pages/TenantsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/forgot-password',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    path: '/2fa',
    element: <TwoFactorPage />,
  },
  {
    path: '/callback',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <CallbackPage />,
      },
    ],
  },
  {
    path: '/sso',
    element: <SSORedirectPage />,
  },
  {
    path: '/logout',
    element: <LogoutPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardRedirectPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'roles',
            element: <RolesPage />,
          },
          {
            path: 'permissions',
            element: <PermissionsPage />,
          },
          {
            path: 'tenants',
            element: <TenantsPage />,
          },
        ],
      },
    ],
  },
])
