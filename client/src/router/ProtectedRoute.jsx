// client/src/router/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Result, Button } from 'antd';

export default function ProtectedRoute({ roles }) {
  const { user, accessToken } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You do not have permission to access this page."
        extra={<Button type="primary" onClick={() => window.history.back()}>Go Back</Button>}
      />
    );
  }

  return <Outlet />;
}
