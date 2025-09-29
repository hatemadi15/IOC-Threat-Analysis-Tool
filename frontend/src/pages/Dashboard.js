import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Search,
  Upload,
  Database
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #94a3b8;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid #475569;
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.color || '#3b82f6'};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => `rgba(${props.color}, 0.1)`};
  color: ${props => `rgb(${props.color})`};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StatTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.positive ? '#22c55e' : '#ef4444'};
  font-size: 0.75rem;
  font-weight: 500;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
`;

const ChartHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const ChartSubtitle = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const RecentActivity = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #334155;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => `rgba(${props.color}, 0.1)`};
  color: ${props => `rgb(${props.color})`};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  color: #e2e8f0;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: #64748b;
  font-size: 0.75rem;
`;

const ActivityValue = styled.div`
  color: #3b82f6;
  font-weight: 500;
  font-size: 0.875rem;
`;

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e'];

const Dashboard = () => {
  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery('dashboard-stats', async () => {
    const response = await axios.get('/api/v1/stats');
    return response.data;
  }, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const mockThreatData = [
    { name: 'Jan', threats: 45, blocked: 42 },
    { name: 'Feb', threats: 52, blocked: 48 },
    { name: 'Mar', threats: 38, blocked: 35 },
    { name: 'Apr', threats: 61, blocked: 58 },
    { name: 'May', threats: 73, blocked: 70 },
    { name: 'Jun', threats: 67, blocked: 63 },
  ];

  const mockVerdictData = [
    { name: 'Benign', value: 65, color: '#22c55e' },
    { name: 'Suspicious', value: 25, color: '#f59e0b' },
    { name: 'Malicious', value: 10, color: '#ef4444' },
  ];

  const mockActivity = [
    {
      type: 'analysis',
      text: 'IOC analysis completed',
      value: 'suspicious-domain.com',
      time: '2 minutes ago',
      icon: Search,
      color: '59, 130, 246'
    },
    {
      type: 'upload',
      text: 'File uploaded for analysis',
      value: 'malware.exe',
      time: '5 minutes ago',
      icon: Upload,
      color: '34, 197, 94'
    },
    {
      type: 'threat',
      text: 'New threat detected',
      value: 'High severity',
      time: '12 minutes ago',
      icon: AlertTriangle,
      color: '239, 68, 68'
    },
    {
      type: 'feed',
      text: 'Threat feed updated',
      value: 'VirusTotal',
      time: '1 hour ago',
      icon: Database,
      color: '168, 85, 247'
    }
  ];

  return (
    <DashboardContainer>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>Monitor threat intelligence and system activity</PageSubtitle>
      </PageHeader>

      <StatsGrid>
        <StatCard
          color="#3b82f6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatHeader>
            <div>
              <StatValue>{stats?.total_analyses || 0}</StatValue>
              <StatLabel>Total Analyses</StatLabel>
            </div>
            <StatIcon color="59, 130, 246">
              <Activity size={24} />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>
            <TrendingUp size={12} />
            +12% from last week
          </StatTrend>
        </StatCard>

        <StatCard
          color="#22c55e"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatHeader>
            <div>
              <StatValue>{stats?.completed || 0}</StatValue>
              <StatLabel>Completed</StatLabel>
            </div>
            <StatIcon color="34, 197, 94">
              <CheckCircle size={24} />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>
            <TrendingUp size={12} />
            +8% from last week
          </StatTrend>
        </StatCard>

        <StatCard
          color="#f59e0b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatHeader>
            <div>
              <StatValue>{stats?.verdict_distribution?.SUSPICIOUS || 0}</StatValue>
              <StatLabel>Suspicious</StatLabel>
            </div>
            <StatIcon color="245, 158, 11">
              <AlertTriangle size={24} />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>
            <TrendingUp size={12} />
            +5% from last week
          </StatTrend>
        </StatCard>

        <StatCard
          color="#ef4444"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatHeader>
            <div>
              <StatValue>{stats?.verdict_distribution?.MALICIOUS || 0}</StatValue>
              <StatLabel>Malicious</StatLabel>
            </div>
            <StatIcon color="239, 68, 68">
              <Shield size={24} />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>
            <TrendingUp size={12} />
            +3% from last week
          </StatTrend>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>Threat Detection Trends</ChartTitle>
            <ChartSubtitle>Monthly overview of detected and blocked threats</ChartSubtitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockThreatData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Bar dataKey="threats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <ChartTitle>Verdict Distribution</ChartTitle>
            <ChartSubtitle>Analysis results breakdown</ChartSubtitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockVerdictData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {mockVerdictData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>

      <RecentActivity>
        <ChartHeader>
          <ChartTitle>Recent Activity</ChartTitle>
          <ChartSubtitle>Latest system events and analyses</ChartSubtitle>
        </ChartHeader>
        {mockActivity.map((activity, index) => (
          <ActivityItem key={index}>
            <ActivityIcon color={activity.color}>
              <activity.icon size={16} />
            </ActivityIcon>
            <ActivityContent>
              <ActivityText>{activity.text}</ActivityText>
              <ActivityTime>{activity.time}</ActivityTime>
            </ActivityContent>
            <ActivityValue>{activity.value}</ActivityValue>
          </ActivityItem>
        ))}
      </RecentActivity>
    </DashboardContainer>
  );
};

export default Dashboard;
