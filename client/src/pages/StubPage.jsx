// Stub pages — will be fully implemented in subsequent phases
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const StubPage = ({ title }) => {
  const navigate = useNavigate();
  return (
    <Result
      icon={<span style={{ fontSize: 48 }}>🚧</span>}
      title={<span style={{ color: 'var(--text)' }}>{title}</span>}
      subTitle={<span style={{ color: 'var(--text-muted)' }}>This page is under construction. Coming in the next phase!</span>}
      extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>}
    />
  );
};

export default StubPage;
