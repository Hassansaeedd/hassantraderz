// client/src/pages/NotFoundPage.jsx
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Result
        status="404"
        title={<span style={{ color: 'var(--text)' }}>404</span>}
        subTitle={<span style={{ color: 'var(--text-muted)' }}>Page not found</span>}
        extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>}
      />
    </div>
  );
}
