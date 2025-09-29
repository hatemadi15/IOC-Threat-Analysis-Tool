import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import {
  Rss,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Settings,
  Play,
  Pause,
  Plus,
  Trash2,
  ExternalLink,
  Shield
} from 'lucide-react';

const ThreatFeedsContainer = styled.div`
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

const ControlPanel = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ControlSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
  
  &.secondary {
    background-color: #374151;
    color: #d1d5db;
    border: 1px solid #4b5563;
    
    &:hover {
      background-color: #4b5563;
    }
  }
  
  &.danger {
    background-color: #dc2626;
    color: white;
    
    &:hover {
      background-color: #b91c1c;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatusCard = styled(motion.div)`
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
  
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

const StatusValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const StatusLabel = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const FeedsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const FeedCard = styled(motion.div)`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
`;

const FeedHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: between;
`;

const FeedInfo = styled.div`
  flex: 1;
`;

const FeedName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const FeedDescription = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const FeedMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #64748b;
`;

const FeedActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FeedStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.active {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  
  &.inactive {
    background-color: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }
  
  &.error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

const FeedBody = styled.div`
  padding: 1.5rem;
`;

const FeedStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #94a3b8;
  font-size: 0.75rem;
`;

const FeedConfig = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ConfigItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 0.75rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
`;

const ConfigLabel = styled.span`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const ConfigValue = styled.span`
  color: #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
`;

const AddFeedModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`;

const ModalHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const mockFeeds = [
  {
    id: 'vt-intel',
    name: 'VirusTotal Intelligence',
    description: 'High-quality threat intelligence from VirusTotal community',
    status: 'active',
    lastUpdate: '2 hours ago',
    updateInterval: '1 hour',
    recordCount: 15420,
    errorCount: 0,
    source: 'VirusTotal API',
    format: 'JSON',
    url: 'https://www.virustotal.com/vtapi/v2/intelligence/hunting',
    categories: ['Malware', 'Phishing', 'C&C']
  },
  {
    id: 'abuse-ip',
    name: 'AbuseIPDB Feed',
    description: 'Real-time IP reputation and abuse reports',
    status: 'active',
    lastUpdate: '30 minutes ago',
    updateInterval: '30 minutes',
    recordCount: 8934,
    errorCount: 2,
    source: 'AbuseIPDB API',
    format: 'CSV',
    url: 'https://api.abuseipdb.com/api/v2/blacklist',
    categories: ['Malicious IPs', 'Botnets', 'Scanners']
  },
  {
    id: 'otx-pulses',
    name: 'AlienVault OTX Pulses',
    description: 'Community-driven threat intelligence pulses',
    status: 'active',
    lastUpdate: '1 hour ago',
    updateInterval: '2 hours',
    recordCount: 23567,
    errorCount: 0,
    source: 'OTX API',
    format: 'JSON',
    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
    categories: ['IOCs', 'Campaigns', 'TTPs']
  },
  {
    id: 'custom-feed',
    name: 'Custom Threat Feed',
    description: 'Organization-specific threat indicators',
    status: 'inactive',
    lastUpdate: '1 day ago',
    updateInterval: '6 hours',
    recordCount: 1250,
    errorCount: 5,
    source: 'Internal SIEM',
    format: 'STIX/TAXII',
    url: 'https://internal.company.com/threatfeed',
    categories: ['Internal IOCs', 'Custom Rules']
  }
];

const ThreatFeeds = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    format: 'JSON',
    interval: '1',
    auth: ''
  });

  const { data: feedStats, isLoading } = useQuery('feed-stats', async () => {
    // Mock API call
    return {
      totalFeeds: 4,
      activeFeeds: 3,
      totalRecords: 49171,
      lastUpdate: '30 minutes ago'
    };
  });

  const updateFeed = useMutation(
    async (feedId) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Feed updated successfully');
      },
      onError: () => {
        toast.error('Failed to update feed');
      }
    }
  );

  const toggleFeed = useMutation(
    async ({ feedId, action }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    {
      onSuccess: (data, variables) => {
        toast.success(`Feed ${variables.action}d successfully`);
      },
      onError: () => {
        toast.error('Failed to toggle feed');
      }
    }
  );

  const addFeed = useMutation(
    async (feedData) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Threat feed added successfully');
        setShowAddModal(false);
        setNewFeed({ name: '', url: '', format: 'JSON', interval: '1', auth: '' });
      },
      onError: () => {
        toast.error('Failed to add threat feed');
      }
    }
  );

  const handleAddFeed = (e) => {
    e.preventDefault();
    addFeed.mutate(newFeed);
  };

  return (
    <ThreatFeedsContainer>
      <PageHeader>
        <PageTitle>Threat Intelligence Feeds</PageTitle>
        <PageSubtitle>Manage and monitor external threat intelligence sources</PageSubtitle>
      </PageHeader>

      <ControlPanel>
        <ControlSection>
          <ActionButton
            className="primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Feed
          </ActionButton>
          <ActionButton
            className="secondary"
            onClick={() => updateFeed.mutate('all')}
            disabled={updateFeed.isLoading}
          >
            {updateFeed.isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Update All
          </ActionButton>
        </ControlSection>
      </ControlPanel>

      <StatusOverview>
        <StatusCard
          color="#3b82f6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatusValue>{feedStats?.totalFeeds || 0}</StatusValue>
          <StatusLabel>Total Feeds</StatusLabel>
        </StatusCard>

        <StatusCard
          color="#22c55e"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatusValue>{feedStats?.activeFeeds || 0}</StatusValue>
          <StatusLabel>Active Feeds</StatusLabel>
        </StatusCard>

        <StatusCard
          color="#f59e0b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatusValue>{feedStats?.totalRecords?.toLocaleString() || 0}</StatusValue>
          <StatusLabel>Total Records</StatusLabel>
        </StatusCard>

        <StatusCard
          color="#8b5cf6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatusValue>{feedStats?.lastUpdate || 'N/A'}</StatusValue>
          <StatusLabel>Last Update</StatusLabel>
        </StatusCard>
      </StatusOverview>

      <FeedsGrid>
        {mockFeeds.map((feed, index) => (
          <FeedCard
            key={feed.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <FeedHeader>
              <FeedInfo>
                <FeedName>{feed.name}</FeedName>
                <FeedDescription>{feed.description}</FeedDescription>
                <FeedMeta>
                  <span>Last updated: {feed.lastUpdate}</span>
                  <span>•</span>
                  <span>Interval: {feed.updateInterval}</span>
                  <span>•</span>
                  <span>{feed.recordCount.toLocaleString()} records</span>
                </FeedMeta>
              </FeedInfo>
              <FeedActions>
                <FeedStatus className={feed.status}>
                  {feed.status === 'active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {feed.status.charAt(0).toUpperCase() + feed.status.slice(1)}
                </FeedStatus>
                <ActionButton
                  className="secondary"
                  onClick={() => updateFeed.mutate(feed.id)}
                  disabled={updateFeed.isLoading}
                  title="Update feed"
                >
                  <RefreshCw size={14} />
                </ActionButton>
                <ActionButton
                  className="secondary"
                  onClick={() => toggleFeed.mutate({ feedId: feed.id, action: feed.status === 'active' ? 'pause' : 'start' })}
                  title={feed.status === 'active' ? 'Pause feed' : 'Start feed'}
                >
                  {feed.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                </ActionButton>
              </FeedActions>
            </FeedHeader>

            <FeedBody>
              <FeedStats>
                <StatItem>
                  <StatValue>{feed.recordCount.toLocaleString()}</StatValue>
                  <StatLabel>Records</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{feed.errorCount}</StatValue>
                  <StatLabel>Errors</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{feed.format}</StatValue>
                  <StatLabel>Format</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{feed.categories.length}</StatValue>
                  <StatLabel>Categories</StatLabel>
                </StatItem>
              </FeedStats>

              <FeedConfig>
                <ConfigItem>
                  <ConfigLabel>Source</ConfigLabel>
                  <ConfigValue>{feed.source}</ConfigValue>
                </ConfigItem>
                <ConfigItem>
                  <ConfigLabel>URL</ConfigLabel>
                  <ConfigValue style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {feed.url.substring(0, 30)}...
                  </ConfigValue>
                </ConfigItem>
                <ConfigItem>
                  <ConfigLabel>Categories</ConfigLabel>
                  <ConfigValue>{feed.categories.join(', ')}</ConfigValue>
                </ConfigItem>
              </FeedConfig>
            </FeedBody>
          </FeedCard>
        ))}
      </FeedsGrid>

      <AnimatePresence>
        {showAddModal && (
          <AddFeedModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ModalHeader>
                <ModalTitle>Add New Threat Feed</ModalTitle>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Configure a new external threat intelligence source
                </p>
              </ModalHeader>

              <form onSubmit={handleAddFeed}>
                <FormGroup>
                  <Label htmlFor="feed-name">Feed Name</Label>
                  <Input
                    id="feed-name"
                    type="text"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder="Enter feed name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="feed-url">Feed URL</Label>
                  <Input
                    id="feed-url"
                    type="url"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                    placeholder="https://example.com/threatfeed"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="feed-format">Data Format</Label>
                  <Select
                    id="feed-format"
                    value={newFeed.format}
                    onChange={(e) => setNewFeed({ ...newFeed, format: e.target.value })}
                  >
                    <option value="JSON">JSON</option>
                    <option value="CSV">CSV</option>
                    <option value="XML">XML</option>
                    <option value="STIX">STIX/TAXII</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="feed-interval">Update Interval (hours)</Label>
                  <Select
                    id="feed-interval"
                    value={newFeed.interval}
                    onChange={(e) => setNewFeed({ ...newFeed, interval: e.target.value })}
                  >
                    <option value="0.5">30 minutes</option>
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="feed-auth">Authentication (optional)</Label>
                  <Input
                    id="feed-auth"
                    type="password"
                    value={newFeed.auth}
                    onChange={(e) => setNewFeed({ ...newFeed, auth: e.target.value })}
                    placeholder="API key or token"
                  />
                </FormGroup>

                <ModalActions>
                  <ActionButton
                    type="button"
                    className="secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    type="submit"
                    className="primary"
                    disabled={addFeed.isLoading}
                  >
                    {addFeed.isLoading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Add Feed
                  </ActionButton>
                </ModalActions>
              </form>
            </ModalContent>
          </AddFeedModal>
        )}
      </AnimatePresence>
    </ThreatFeedsContainer>
  );
};

export default ThreatFeeds;
