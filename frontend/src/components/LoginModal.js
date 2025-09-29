import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff, Shield, Key } from 'lucide-react';
import axios from 'axios';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(145deg, #1e293b, #334155);
  border: 1px solid #475569;
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ModalIcon = styled.div`
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

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
`;

const ModalSubtitle = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const LoginForm = styled.form`
  display: grid;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: ${props => props.hasToggle ? '3rem' : '1rem'};
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

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #e2e8f0;
  }
`;

const LoginButton = styled.button`
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
  margin-top: 0.5rem;
  
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #334155;
  }
  
  span {
    padding: 0 1rem;
    color: #64748b;
    font-size: 0.875rem;
  }
`;

const DemoSection = styled.div`
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const DemoTitle = styled.h4`
  color: #f1f5f9;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DemoCredentials = styled.div`
  display: grid;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const DemoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #1e293b;
  border-radius: 4px;
`;

const DemoLabel = styled.span`
  color: #94a3b8;
`;

const DemoValue = styled.span`
  color: #3b82f6;
  font-family: monospace;
  cursor: pointer;
  
  &:hover {
    color: #60a5fa;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #374151;
    color: #e2e8f0;
  }
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

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation(
    async (credentials) => {
      const response = await axios.post('/api/v1/auth/login', credentials);
      return response.data;
    },
    {
      onSuccess: (data) => {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
        onLogin(data);
        onClose();
        toast.success(`Welcome back, ${data.user_info.username}!`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Login failed');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Please enter both username and password');
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fillDemoCredentials = (username, password) => {
    setFormData({ username, password });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <ModalContent
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <CloseButton onClick={onClose}>
            ×
          </CloseButton>

          <ModalHeader>
            <ModalIcon>
              <Shield size={32} />
            </ModalIcon>
            <ModalTitle>Secure Access</ModalTitle>
            <ModalSubtitle>Sign in to access threat analysis features</ModalSubtitle>
          </ModalHeader>

          <LoginForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">
                <User size={16} />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                disabled={loginMutation.isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">
                <Lock size={16} />
                Password
              </Label>
              <InputWrapper>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  hasToggle
                  disabled={loginMutation.isLoading}
                />
                <ToggleButton
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </ToggleButton>
              </InputWrapper>
            </FormGroup>

            <LoginButton type="submit" disabled={loginMutation.isLoading}>
              {loginMutation.isLoading ? (
                <LoadingSpinner />
              ) : (
                <Shield size={16} />
              )}
              {loginMutation.isLoading ? 'Signing In...' : 'Sign In'}
            </LoginButton>
          </LoginForm>

          <Divider>
            <span>Demo Credentials</span>
          </Divider>

          <DemoSection>
            <DemoTitle>
              <Key size={16} />
              Try the Demo
            </DemoTitle>
            <DemoCredentials>
              <DemoItem>
                <DemoLabel>Admin:</DemoLabel>
                <DemoValue onClick={() => fillDemoCredentials('admin', 'admin123')}>
                  admin / admin123
                </DemoValue>
              </DemoItem>
              <DemoItem>
                <DemoLabel>Analyst:</DemoLabel>
                <DemoValue onClick={() => fillDemoCredentials('analyst', 'analyst123')}>
                  analyst / analyst123
                </DemoValue>
              </DemoItem>
              <DemoItem>
                <DemoLabel>API Key:</DemoLabel>
                <DemoValue onClick={() => copyToClipboard('demo-api-key')}>
                  demo-api-key
                </DemoValue>
              </DemoItem>
            </DemoCredentials>
          </DemoSection>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};

export default LoginModal;
