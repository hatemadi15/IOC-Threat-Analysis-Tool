import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload,
  File,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Hash,
  FileText,
  Image,
  Archive,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';

const FileAnalysisContainer = styled.div`
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

const UploadSection = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${props => props.isDragActive ? '#3b82f6' : '#475569'};
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  background-color: ${props => props.isDragActive ? 'rgba(59, 130, 246, 0.05)' : '#0f172a'};
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.02);
  }
`;

const DropzoneIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const DropzoneText = styled.div`
  color: #e2e8f0;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DropzoneSubtext = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const SupportedFormats = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FormatTag = styled.span`
  padding: 0.25rem 0.5rem;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 500;
`;

const FileQueue = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
`;

const FileItem = styled(motion.div)`
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => getFileTypeColor(props.type)};
  color: white;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  color: #e2e8f0;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FileSize = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const FileActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &.analyze {
    background-color: #3b82f6;
    color: white;
    
    &:hover {
      background-color: #2563eb;
    }
  }
  
  &.remove {
    background-color: #374151;
    color: #94a3b8;
    
    &:hover {
      background-color: #ef4444;
      color: white;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AnalysisResults = styled(motion.div)`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const ResultHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: between;
`;

const ResultTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  flex: 1;
`;

const AnalysisStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.analyzing {
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

const ThreatIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: ${props => {
    switch (props.level) {
      case 'HIGH':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))';
      case 'MEDIUM':
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))';
      case 'LOW':
        return 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.05))';
      default:
        return 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(107, 114, 128, 0.05))';
    }
  }};
  border: 1px solid ${props => {
    switch (props.level) {
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.2)';
      case 'MEDIUM':
        return 'rgba(245, 158, 11, 0.2)';
      case 'LOW':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  border-radius: 8px;
  margin: 1.5rem;
`;

const ThreatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.level) {
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.2)';
      case 'MEDIUM':
        return 'rgba(245, 158, 11, 0.2)';
      case 'LOW':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#22c55e';
      default:
        return '#9ca3af';
    }
  }};
`;

const ThreatContent = styled.div`
  flex: 1;
`;

const ThreatLevel = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => {
    switch (props.level) {
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#22c55e';
      default:
        return '#9ca3af';
    }
  }};
  margin-bottom: 0.25rem;
`;

const ThreatDescription = styled.div`
  color: #94a3b8;
  font-size: 0.875rem;
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

const LoadingSpinner = styled.div`
  border: 2px solid #334155;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const getFileTypeColor = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'exe':
    case 'dll':
    case 'msi':
      return 'linear-gradient(135deg, #ef4444, #dc2626)';
    case 'pdf':
      return 'linear-gradient(135deg, #dc2626, #b91c1c)';
    case 'doc':
    case 'docx':
    case 'xls':
    case 'xlsx':
      return 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    case 'zip':
    case 'rar':
    case '7z':
      return 'linear-gradient(135deg, #7c3aed, #6d28d9)';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'linear-gradient(135deg, #059669, #047857)';
    default:
      return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
};

const getFileIcon = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return FileText;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return Image;
    case 'zip':
    case 'rar':
    case '7z':
      return Archive;
    default:
      return File;
  }
};

const FileAnalysis = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({});

  const analyzeFile = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/v1/analyze/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { fileId: file.name, data: response.data };
    },
    {
      onSuccess: ({ fileId, data }) => {
        setAnalysisResults(prev => ({
          ...prev,
          [fileId]: data.data
        }));
        toast.success('File analysis completed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'File analysis failed');
      }
    }
  );

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending'
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'application/octet-stream': ['.exe', '.dll', '.bin'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'text/*': ['.txt', '.log']
    }
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setAnalysisResults(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  const startAnalysis = (fileItem) => {
    analyzeFile.mutate(fileItem.file);
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileItem.id ? { ...f, status: 'analyzing' } : f
    ));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <FileAnalysisContainer>
      <PageHeader>
        <PageTitle>File Analysis</PageTitle>
        <PageSubtitle>Upload and analyze files for malware detection and threat assessment</PageSubtitle>
      </PageHeader>

      <UploadSection>
        <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <DropzoneIcon>
            <Upload size={32} />
          </DropzoneIcon>
          <DropzoneText>
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          </DropzoneText>
          <DropzoneSubtext>
            or click to select files (max 100MB per file)
          </DropzoneSubtext>
          <SupportedFormats>
            <FormatTag>EXE</FormatTag>
            <FormatTag>DLL</FormatTag>
            <FormatTag>PDF</FormatTag>
            <FormatTag>DOC</FormatTag>
            <FormatTag>ZIP</FormatTag>
            <FormatTag>Images</FormatTag>
            <FormatTag>Text</FormatTag>
          </SupportedFormats>
        </DropzoneContainer>

        {uploadedFiles.length > 0 && (
          <FileQueue>
            <h4 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>Upload Queue</h4>
            {uploadedFiles.map((fileItem) => (
              <FileItem
                key={fileItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <FileIcon type={fileItem.name}>
                  {React.createElement(getFileIcon(fileItem.name), { size: 20 })}
                </FileIcon>
                <FileInfo>
                  <FileName>{fileItem.name}</FileName>
                  <FileSize>{formatFileSize(fileItem.size)}</FileSize>
                </FileInfo>
                <FileActions>
                  <ActionButton
                    className="analyze"
                    onClick={() => startAnalysis(fileItem)}
                    disabled={fileItem.status === 'analyzing'}
                    title="Analyze file"
                  >
                    {fileItem.status === 'analyzing' ? (
                      <LoadingSpinner />
                    ) : (
                      <Play size={16} />
                    )}
                  </ActionButton>
                  <ActionButton
                    className="remove"
                    onClick={() => removeFile(fileItem.id)}
                    title="Remove file"
                  >
                    <X size={16} />
                  </ActionButton>
                </FileActions>
              </FileItem>
            ))}
          </FileQueue>
        )}
      </UploadSection>

      <AnimatePresence>
        {Object.entries(analysisResults).map(([fileId, result]) => (
          <AnalysisResults
            key={fileId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ResultHeader>
              <ResultTitle>{result.filename || fileId}</ResultTitle>
              <AnalysisStatus className="completed">
                <CheckCircle size={16} />
                Analysis Complete
              </AnalysisStatus>
            </ResultHeader>

            <ThreatIndicator level={result.threat_level || 'LOW'}>
              <ThreatIcon level={result.threat_level || 'LOW'}>
                {result.threat_level === 'HIGH' ? (
                  <AlertTriangle size={24} />
                ) : result.threat_level === 'MEDIUM' ? (
                  <Eye size={24} />
                ) : (
                  <CheckCircle size={24} />
                )}
              </ThreatIcon>
              <ThreatContent>
                <ThreatLevel level={result.threat_level || 'LOW'}>
                  {result.threat_level || 'LOW'} RISK
                </ThreatLevel>
                <ThreatDescription>
                  {result.threat_level === 'HIGH' && 'File contains malicious content'}
                  {result.threat_level === 'MEDIUM' && 'File shows suspicious characteristics'}
                  {(!result.threat_level || result.threat_level === 'LOW') && 'File appears to be safe'}
                </ThreatDescription>
              </ThreatContent>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f1f5f9' }}>
                  {Math.round(result.confidence_score || 85)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Confidence
                </div>
              </div>
            </ThreatIndicator>

            <DetailsGrid>
              <DetailSection>
                <SectionTitle>
                  <FileText size={16} />
                  File Information
                </SectionTitle>
                <DetailItem>
                  <DetailLabel>File Name</DetailLabel>
                  <DetailValue>{result.filename || fileId}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>File Size</DetailLabel>
                  <DetailValue>{formatFileSize(result.file_size || 0)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>File Type</DetailLabel>
                  <DetailValue>{result.file_type || 'Unknown'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>MD5 Hash</DetailLabel>
                  <DetailValue style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {result.md5_hash || 'N/A'}
                  </DetailValue>
                </DetailItem>
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <Shield size={16} />
                  Security Analysis
                </SectionTitle>
                <DetailItem>
                  <DetailLabel>Threat Level</DetailLabel>
                  <DetailValue>{result.threat_level || 'Low'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Confidence Score</DetailLabel>
                  <DetailValue>{Math.round(result.confidence_score || 85)}%</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Scan Engines</DetailLabel>
                  <DetailValue>{result.scan_engines || 'Multiple'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Analysis Time</DetailLabel>
                  <DetailValue>{result.analysis_time || '2.3s'}</DetailValue>
                </DetailItem>
              </DetailSection>

              {result.indicators && (
                <DetailSection>
                  <SectionTitle>
                    <AlertTriangle size={16} />
                    Threat Indicators
                  </SectionTitle>
                  {result.indicators.map((indicator, index) => (
                    <DetailItem key={index}>
                      <DetailLabel>{indicator.type}</DetailLabel>
                      <DetailValue>{indicator.description}</DetailValue>
                    </DetailItem>
                  ))}
                </DetailSection>
              )}

              {result.behavior && (
                <DetailSection>
                  <SectionTitle>
                    <Eye size={16} />
                    Behavioral Analysis
                  </SectionTitle>
                  {result.behavior.map((behavior, index) => (
                    <DetailItem key={index}>
                      <DetailLabel>Action {index + 1}</DetailLabel>
                      <DetailValue>{behavior}</DetailValue>
                    </DetailItem>
                  ))}
                </DetailSection>
              )}
            </DetailsGrid>
          </AnalysisResults>
        ))}
      </AnimatePresence>
    </FileAnalysisContainer>
  );
};

export default FileAnalysis;
