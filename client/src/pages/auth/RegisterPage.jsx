// client/src/pages/auth/RegisterPage.jsx — Redirect to Login (Public self-registration closed)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
}
