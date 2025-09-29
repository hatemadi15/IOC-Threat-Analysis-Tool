import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Box,
  Upload,
  Play,
  Pause,
  Stop,
  Download,
  Eye,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  MonitorSpeaker,
  Cpu,
  HardDrive,
  Network,
  FileText,
  Image as ImageIcon,
  Archive,
  Server,
  Container,
  Terminal
} from 'lucide-react';

const SandboxContainer = styled.div`
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

const SandboxGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SandboxCard = styled(motion.div)`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  background-color: #0f172a;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardDescription = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const SandboxStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  
  &.online {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  
  &.offline {
    background-color: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }
  
  &.deploying {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  &.error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  
  &.pulse {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const SandboxActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
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

const SandboxSpecs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const SpecItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  font-size: 0.875rem;
`;

const SpecIcon = styled.div`
  color: #3b82f6;
`;

const SpecLabel = styled.span`
  color: #94a3b8;
  flex: 1;
`;

const SpecValue = styled.span`
  color: #e2e8f0;
  font-weight: 500;
`;

const AnalysisQueue = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  margin-bottom: 2rem;
`;

const QueueHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: between;
`;

const QueueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  flex: 1;
`;

const QueueStats = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
`;

const QueueBody = styled.div`
  padding: 1.5rem;
`;

const QueueItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  color: #e2e8f0;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FileDetails = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const AnalysisStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.queued {
    background-color: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }
  
  &.running {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  &.completed {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  
  &.failed {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

const ItemActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background-color: #374151;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4b5563;
    color: #e2e8f0;
  }
  
  &.primary {
    background-color: #3b82f6;
    color: white;
    
    &:hover {
      background-color: #2563eb;
    }
  }
  
  &.danger {
    background-color: #dc2626;
    color: white;
    
    &:hover {
      background-color: #b91c1c;
    }
  }
`;

const UploadArea = styled.div`
  border: 2px dashed #475569;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background-color: #0f172a;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover, &.active {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.05);
  }
`;

const UploadIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const UploadText = styled.div`
  color: #e2e8f0;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'exe':
    case 'dll':
      return Terminal;
    case 'pdf':
      return FileText;
    case 'jpg':
    case 'png':
      return ImageIcon;
    case 'zip':
    case 'rar':
      return Archive;
    default:
      return FileText;
  }
};

const mockQueue = [
  {
    id: 1,
    filename: 'suspicious.exe',
    size: '2.3 MB',
    status: 'running',
    progress: 65,
    environment: 'Windows 10',
    startTime: '2 min ago'
  },
  {
    id: 2,
    filename: 'malware_sample.dll',
    size: '1.8 MB',
    status: 'queued',
    progress: 0,
    environment: 'Windows 11',
    startTime: 'Pending'
  },
  {
    id: 3,
    filename: 'phishing_doc.pdf',
    size: '876 KB',
    status: 'completed',
    progress: 100,
    environment: 'Ubuntu 20.04',
    startTime: '15 min ago'
  }
];

const Sandbox = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState('windows10');
  
  const { data: sandboxStats } = useQuery('sandbox-stats', async () => ({
    cloudStatus: 'online',
    localStatus: 'deploying',
    queueSize: 3,
    activeAnalyses: 1
  }));

  const deploySandbox = useMutation(
    async (type) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    },
    {
      onSuccess: (data, variables) => {
        toast.success(`${variables} sandbox deployed successfully`);
      },
      onError: () => {
        toast.error('Failed to deploy sandbox');
      }
    }
  );

  const submitToSandbox = useMutation(
    async ({ file, environment }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('File submitted to sandbox for analysis');
      },
      onError: () => {
        toast.error('Failed to submit file to sandbox');
      }
    }
  );

  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      submitToSandbox.mutate({ file, environment: selectedEnvironment });
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/octet-stream': ['.exe', '.dll'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/zip': ['.zip']
    }
  });

  return (
    <SandboxContainer>
      <PageHeader>
        <PageTitle>Sandbox Analysis</PageTitle>
        <PageSubtitle>Dynamic malware analysis in isolated environments</PageSubtitle>
      </PageHeader>

      <SandboxGrid>
        <SandboxCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CardHeader>
            <CardTitle>
              <Server size={20} />
              Cloud Sandbox
            </CardTitle>
            <CardDescription>
              Managed sandbox environment with multiple OS configurations
            </CardDescription>
          </CardHeader>
          <CardBody>
            <SandboxStatus className={sandboxStats?.cloudStatus || 'offline'}>
              <StatusDot className={sandboxStats?.cloudStatus === 'online' ? 'pulse' : ''} />
              {sandboxStats?.cloudStatus === 'online' ? 'Online' : 'Offline'}
            </SandboxStatus>
            
            <SandboxActions>
              <ActionButton className="primary">
                <Play size={16} />
                Start Analysis
              </ActionButton>
              <ActionButton className="secondary">
                <Settings size={16} />
                Configure
              </ActionButton>
            </SandboxActions>

            <SandboxSpecs>
              <SpecItem>
                <SpecIcon><Cpu size={16} /></SpecIcon>
                <SpecLabel>CPU</SpecLabel>
                <SpecValue>4 vCPUs</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><HardDrive size={16} /></SpecIcon>
                <SpecLabel>Memory</SpecLabel>
                <SpecValue>8 GB RAM</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><Network size={16} /></SpecIcon>
                <SpecLabel>Network</SpecLabel>
                <SpecValue>Isolated</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><MonitorSpeaker size={16} /></SpecIcon>
                <SpecLabel>OS</SpecLabel>
                <SpecValue>Multi-OS</SpecValue>
              </SpecItem>
            </SandboxSpecs>
          </CardBody>
        </SandboxCard>

        <SandboxCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardHeader>
            <CardTitle>
              <Container size={20} />
              Local Sandbox
            </CardTitle>
            <CardDescription>
              Self-hosted containerized sandbox for air-gapped environments
            </CardDescription>
          </CardHeader>
          <CardBody>
            <SandboxStatus className={sandboxStats?.localStatus || 'offline'}>
              <StatusDot />
              {sandboxStats?.localStatus === 'deploying' ? 'Deploying...' : 
               sandboxStats?.localStatus === 'online' ? 'Online' : 'Offline'}
            </SandboxStatus>
            
            <SandboxActions>
              <ActionButton 
                className="primary"
                onClick={() => deploySandbox.mutate('local')}
                disabled={deploySandbox.isLoading}
              >
                <Box size={16} />
                Deploy Local
              </ActionButton>
              <ActionButton className="secondary">
                <Settings size={16} />
                Configure
              </ActionButton>
            </SandboxActions>

            <SandboxSpecs>
              <SpecItem>
                <SpecIcon><Container size={16} /></SpecIcon>
                <SpecLabel>Type</SpecLabel>
                <SpecValue>Docker</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><Shield size={16} /></SpecIcon>
                <SpecLabel>Isolation</SpecLabel>
                <SpecValue>Full</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><Activity size={16} /></SpecIcon>
                <SpecLabel>Monitoring</SpecLabel>
                <SpecValue>Real-time</SpecValue>
              </SpecItem>
              <SpecItem>
                <SpecIcon><Clock size={16} /></SpecIcon>
                <SpecLabel>Timeout</SpecLabel>
                <SpecValue>5 minutes</SpecValue>
              </SpecItem>
            </SandboxSpecs>
          </CardBody>
        </SandboxCard>
      </SandboxGrid>

      <AnalysisQueue>
        <QueueHeader>
          <QueueTitle>Analysis Queue</QueueTitle>
          <QueueStats>
            <span>Queue: {sandboxStats?.queueSize || 0}</span>
            <span>•</span>
            <span>Active: {sandboxStats?.activeAnalyses || 0}</span>
          </QueueStats>
        </QueueHeader>
        
        <QueueBody>
          <UploadArea {...getRootProps()} className={isDragActive ? 'active' : ''}>
            <input {...getInputProps()} />
            <UploadIcon>
              <Upload size={24} />
            </UploadIcon>
            <UploadText>
              {isDragActive ? 'Drop files here...' : 'Drag & drop files for sandbox analysis'}
            </UploadText>
            <UploadSubtext>
              Supports EXE, DLL, PDF, DOC, ZIP files (max 50MB)
            </UploadSubtext>
          </UploadArea>

          {mockQueue.map((item, index) => (
            <QueueItem
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {React.createElement(getFileIcon(item.filename), { size: 16 })}
                </div>
              </div>
              
              <FileInfo>
                <FileName>{item.filename}</FileName>
                <FileDetails>
                  {item.size} • {item.environment} • Started: {item.startTime}
                  {item.status === 'running' && ` • Progress: ${item.progress}%`}
                </FileDetails>
              </FileInfo>

              <AnalysisStatus className={item.status}>
                {item.status === 'running' && <Activity size={14} className="animate-pulse" />}
                {item.status === 'completed' && <CheckCircle size={14} />}
                {item.status === 'queued' && <Clock size={14} />}
                {item.status === 'failed' && <AlertTriangle size={14} />}
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </AnalysisStatus>

              <ItemActions>
                {item.status === 'completed' && (
                  <>
                    <IconButton className="primary" title="View Results">
                      <Eye size={14} />
                    </IconButton>
                    <IconButton title="Download Report">
                      <Download size={14} />
                    </IconButton>
                  </>
                )}
                {item.status === 'running' && (
                  <IconButton className="danger" title="Stop Analysis">
                    <Stop size={14} />
                  </IconButton>
                )}
                {item.status === 'queued' && (
                  <IconButton className="danger" title="Remove from Queue">
                    <Stop size={14} />
                  </IconButton>
                )}
              </ItemActions>
            </QueueItem>
          ))}
        </QueueBody>
      </AnalysisQueue>
    </SandboxContainer>
  );
};

export default Sandbox;
