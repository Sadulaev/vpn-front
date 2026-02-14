import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Typography,
  Modal,
  Descriptions,
  message,
} from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';

const { Title } = Typography;
const { Search } = Input;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchText, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchText) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user: any) => {
      const searchLower = searchText.toLowerCase();
      return (
        user.telegramId?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredUsers(filtered);
  };

  const handleViewDetails = async (record: any) => {
    setSelectedUser(record);
    setDetailModalVisible(true);

    // Load user subscriptions
    try {
      const subs = await api.getUserSubscriptions(record.id);
      setUserSubscriptions(subs);
    } catch (error) {
      message.error('Failed to load user subscriptions');
    }
  };

  const columns = [
    {
      title: 'Telegram ID',
      dataIndex: 'telegramId',
      key: 'telegramId',
      render: (id: string) => id || '-',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: any) => {
        const name = [record.firstName, record.lastName].filter(Boolean).join(' ');
        return name || '-';
      },
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => (username ? `@${username}` : '-'),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          inactive: 'default',
          banned: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Users</Title>
        <Search
          placeholder="Search by name, username, email, Telegram ID..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 400 }}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(value) => setSearchText(value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
      />

      <Modal
        title="User Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedUser && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID" span={2}>
                {selectedUser.id}
              </Descriptions.Item>
              <Descriptions.Item label="Telegram ID">
                {selectedUser.telegramId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedUser.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                {selectedUser.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="First Name">
                {selectedUser.firstName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Name">
                {selectedUser.lastName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={
                    selectedUser.status === 'active'
                      ? 'green'
                      : selectedUser.status === 'banned'
                      ? 'red'
                      : 'default'
                  }
                >
                  {selectedUser.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Traffic Used">
                {(selectedUser.totalTrafficUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
              </Descriptions.Item>
              <Descriptions.Item label="Traffic Limit">
                {selectedUser.trafficLimit
                  ? `${(selectedUser.trafficLimit / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : 'Unlimited'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {dayjs(selectedUser.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
              Subscriptions ({userSubscriptions.length})
            </Title>

            <Table
              columns={[
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag
                      color={
                        status === 'active'
                          ? 'green'
                          : status === 'expired'
                          ? 'red'
                          : 'orange'
                      }
                    >
                      {status.toUpperCase()}
                    </Tag>
                  ),
                },
                {
                  title: 'Plan',
                  dataIndex: 'planName',
                  key: 'planName',
                  render: (plan: string, record: any) =>
                    plan || `${record.periodMonths} month(s)`,
                },
                {
                  title: 'Expires At',
                  dataIndex: 'expiresAt',
                  key: 'expiresAt',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
                },
                {
                  title: 'Created At',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
                },
              ]}
              dataSource={userSubscriptions}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Users;
