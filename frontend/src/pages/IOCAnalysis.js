import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import {
  Search,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  Download,
  RefreshCw,
  Info,
  Eye,
  Hash,
  Globe,
  Mail
} from 'lucide-react';
import axios from 'axios';

const AnalysisContainer = styled.div`
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

const AnalysisForm = styled.form`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;

const AnalyzeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: #374151;
  color: #d1d5db;
  border: 1px solid #4b5563;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4b5563;
    border-color: #6b7280;
  }
`;

const ResultsContainer = styled(motion.div)`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
`;

const ResultHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  background-color: #0f172a;
`;

const ResultTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
`;

const ResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
`;

const IOCTypeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 500;
`;

const VerdictCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))';
      case 'SUSPICIOUS':
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))';
      case 'BENIGN':
        return 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.05))';
      default:
        return 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(107, 114, 128, 0.05))';
    }
  }};
  border: 1px solid ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return 'rgba(239, 68, 68, 0.2)';
      case 'SUSPICIOUS':
        return 'rgba(245, 158, 11, 0.2)';
      case 'BENIGN':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  border-radius: 8px;
  margin: 1.5rem;
`;

const VerdictIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return 'rgba(239, 68, 68, 0.2)';
      case 'SUSPICIOUS':
        return 'rgba(245, 158, 11, 0.2)';
      case 'BENIGN':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return '#ef4444';
      case 'SUSPICIOUS':
        return '#f59e0b';
      case 'BENIGN':
        return '#22c55e';
      default:
        return '#9ca3af';
    }
  }};
`;

const VerdictContent = styled.div`
  flex: 1;
`;

const VerdictLabel = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return '#ef4444';
      case 'SUSPICIOUS':
        return '#f59e0b';
      case 'BENIGN':
        return '#22c55e';
      default:
        return '#9ca3af';
    }
  }};
  margin-bottom: 0.25rem;
`;

const ConfidenceScore = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const ScoreBar = styled.div`
  width: 100px;
  height: 8px;
  background-color: #374151;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ScoreFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.verdict) {
      case 'MALICIOUS':
        return 'linear-gradient(90deg, #ef4444, #dc2626)';
      case 'SUSPICIOUS':
        return 'linear-gradient(90deg, #f59e0b, #d97706)';
      case 'BENIGN':
        return 'linear-gradient(90deg, #22c55e, #16a34a)';
      default:
        return 'linear-gradient(90deg, #9ca3af, #6b7280)';
    }
  }};
  width: ${props => props.score}%;
  transition: width 0.5s ease;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
`;

const DetailSection = styled.div`
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #334155;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const DetailValue = styled.span`
  color: #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #94a3b8;
`;

const Spinner = styled.div`
  border: 3px solid #334155;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const getIOCIcon = (type) => {
  switch (type) {
    case 'domain':
      return Globe;
    case 'url':
      return ExternalLink;
    case 'ip_address':
      return Globe;
    case 'email':
      return Mail;
    case 'hash_md5':
    case 'hash_sha1':
    case 'hash_sha256':
      return Hash;
    default:
      return Info;
  }
};

const getVerdictIcon = (verdict) => {
  switch (verdict) {
    case 'MALICIOUS':
      return AlertTriangle;
    case 'SUSPICIOUS':
      return Eye;
    case 'BENIGN':
      return CheckCircle;
    default:
      return Info;
  }
};

const IOCAnalysis = () => {
  const [iocInput, setIocInput] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const analyzeIOC = useMutation(
    async (indicator) => {
      const response = await axios.post('/api/v1/analyze', {
        indicator: indicator.trim()
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setCurrentAnalysis(data.data);
        toast.success('IOC analysis completed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Analysis failed');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!iocInput.trim()) {
      toast.error('Please enter an IOC to analyze');
      return;
    }
    analyzeIOC.mutate(iocInput);
  };

  const handleQuickAction = (ioc) => {
    setIocInput(ioc);
    analyzeIOC.mutate(ioc);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <AnalysisContainer>
      <PageHeader>
        <PageTitle>IOC Analysis</PageTitle>
        <PageSubtitle>Analyze indicators of compromise using multiple threat intelligence sources</PageSubtitle>
      </PageHeader>

      <AnalysisForm onSubmit={handleSubmit}>
        <FormGrid>
          <InputGroup>
            <InputLabel htmlFor="ioc-input">
              Indicator of Compromise (IOC)
            </InputLabel>
            <InputField
              id="ioc-input"
              type="text"
              value={iocInput}
              onChange={(e) => setIocInput(e.target.value)}
              placeholder="Enter URL, domain, IP address, file hash, or email address..."
              disabled={analyzeIOC.isLoading}
            />
          </InputGroup>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <AnalyzeButton type="submit" disabled={analyzeIOC.isLoading}>
              {analyzeIOC.isLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Analyze
            </AnalyzeButton>
          </div>
        </FormGrid>

        <QuickActions>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem', marginRight: '0.5rem' }}>
            Quick test:
          </span>
          <QuickActionButton onClick={() => handleQuickAction('malware.com')}>
            <Globe size={12} />
            malware.com
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('https://suspicious-site.net')}>
            <ExternalLink size={12} />
            suspicious URL
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('192.168.1.100')}>
            <Globe size={12} />
            IP address
          </QuickActionButton>
        </QuickActions>
      </AnalysisForm>

      <AnimatePresence>
        {analyzeIOC.isLoading && (
          <ResultsContainer
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <LoadingState>
              <Spinner />
              <div>Analyzing IOC...</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Querying threat intelligence sources
              </div>
            </LoadingState>
          </ResultsContainer>
        )}

        {currentAnalysis && !analyzeIOC.isLoading && (
          <ResultsContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResultHeader>
              <ResultTitle>{currentAnalysis.indicator}</ResultTitle>
              <ResultMeta>
                <IOCTypeIndicator>
                  {React.createElement(getIOCIcon(currentAnalysis.ioc_type), { size: 12 })}
                  {currentAnalysis.ioc_type?.replace('_', ' ').toUpperCase()}
                </IOCTypeIndicator>
                <span>Analyzed {new Date(currentAnalysis.created_at).toLocaleString()}</span>
                <button
                  onClick={() => copyToClipboard(currentAnalysis.indicator)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                >
                  <Copy size={14} />
                </button>
              </ResultMeta>
            </ResultHeader>

            {currentAnalysis.verdict && (
              <VerdictCard verdict={currentAnalysis.verdict}>
                <VerdictIcon verdict={currentAnalysis.verdict}>
                  {React.createElement(getVerdictIcon(currentAnalysis.verdict), { size: 24 })}
                </VerdictIcon>
                <VerdictContent>
                  <VerdictLabel verdict={currentAnalysis.verdict}>
                    {currentAnalysis.verdict}
                  </VerdictLabel>
                  <ConfidenceScore>
                    Confidence: {Math.round(currentAnalysis.confidence_score)}%
                    <ScoreBar>
                      <ScoreFill 
                        verdict={currentAnalysis.verdict}
                        score={currentAnalysis.confidence_score}
                      />
                    </ScoreBar>
                  </ConfidenceScore>
                </VerdictContent>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f1f5f9' }}>
                    {Math.round(currentAnalysis.threat_score)}/100
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Threat Score
                  </div>
                </div>
              </VerdictCard>
            )}

            <DetailsGrid>
              {currentAnalysis.virustotal_results && (
                <DetailSection>
                  <SectionTitle>
                    <Shield size={16} />
                    VirusTotal
                  </SectionTitle>
                  <DetailItem>
                    <DetailLabel>Detections</DetailLabel>
                    <DetailValue>
                      {currentAnalysis.virustotal_results.malicious_count}/{currentAnalysis.virustotal_results.total_count}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Status</DetailLabel>
                    <DetailValue>{currentAnalysis.virustotal_results.status}</DetailValue>
                  </DetailItem>
                  {currentAnalysis.virustotal_results.scan_date && (
                    <DetailItem>
                      <DetailLabel>Scan Date</DetailLabel>
                      <DetailValue>{currentAnalysis.virustotal_results.scan_date}</DetailValue>
                    </DetailItem>
                  )}
                </DetailSection>
              )}

              {currentAnalysis.abuseipdb_results && (
                <DetailSection>
                  <SectionTitle>
                    <AlertTriangle size={16} />
                    AbuseIPDB
                  </SectionTitle>
                  <DetailItem>
                    <DetailLabel>Abuse Confidence</DetailLabel>
                    <DetailValue>{currentAnalysis.abuseipdb_results.abuse_confidence}%</DetailValue>
                  </DetailItem>
                  {currentAnalysis.abuseipdb_results.country_code && (
                    <DetailItem>
                      <DetailLabel>Country</DetailLabel>
                      <DetailValue>{currentAnalysis.abuseipdb_results.country_code}</DetailValue>
                    </DetailItem>
                  )}
                  {currentAnalysis.abuseipdb_results.usage_type && (
                    <DetailItem>
                      <DetailLabel>Usage Type</DetailLabel>
                      <DetailValue>{currentAnalysis.abuseipdb_results.usage_type}</DetailValue>
                    </DetailItem>
                  )}
                </DetailSection>
              )}

              {currentAnalysis.evidence && currentAnalysis.evidence.length > 0 && (
                <DetailSection>
                  <SectionTitle>
                    <Info size={16} />
                    Evidence
                  </SectionTitle>
                  {currentAnalysis.evidence.map((evidence, index) => (
                    <DetailItem key={index}>
                      <DetailLabel>Evidence {index + 1}</DetailLabel>
                      <DetailValue>{evidence}</DetailValue>
                    </DetailItem>
                  ))}
                </DetailSection>
              )}

              {currentAnalysis.tags && currentAnalysis.tags.length > 0 && (
                <DetailSection>
                  <SectionTitle>
                    <Hash size={16} />
                    Tags
                  </SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {currentAnalysis.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#3b82f6'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </DetailSection>
              )}
            </DetailsGrid>
          </ResultsContainer>
        )}
      </AnimatePresence>
    </AnalysisContainer>
  );
};

export default IOCAnalysis;
