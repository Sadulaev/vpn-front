import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import {
  UserOutlined,
  ServerOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '@/services/api';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, servers, subStats] = await Promise.all([
        api.getUsers(),
        api.getServers(),
        api.getStatistics(),
      ]);

      setStats({
        totalUsers: users.length,
        totalServers: servers.length,
        totalSubscriptions: subStats.total,
        activeSubscriptions: subStats.active,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Servers"
              value={stats.totalServers}
              prefix={<ServerOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Subscriptions"
              value={stats.totalSubscriptions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Subscriptions"
              value={stats.activeSubscriptions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
