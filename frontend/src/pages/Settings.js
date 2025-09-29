import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  Globe,
  Bell,
  Database,
  Server,
  User,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const SettingsContainer = styled.div`
  max-width: 1000px;
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

const SettingsNav = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

const NavTab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: none;
  background-color: ${props => props.active ? '#3b82f6' : '#374151'};
  color: ${props => props.active ? 'white' : '#d1d5db'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.active ? '#2563eb' : '#4b5563'};
  }
`;

const SettingsContent = styled.div`
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  background-color: #0f172a;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
`;

const SectionDescription = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const SectionBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 1.5rem;
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
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
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
  
  &.password {
    padding-right: 3rem;
  }
`;

const TogglePassword = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #e2e8f0;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.success {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  
  &.warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  
  &.error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #334155;
`;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showPasswords, setShowPasswords] = useState({});
  const [settings, setSettings] = useState({
    // API Keys
    virustotalKey: '',
    abuseipdbKey: '',
    urlscanKey: '',
    otxKey: '',
    
    // Security
    enableTwoFactor: false,
    sessionTimeout: '24',
    allowedIPs: '',
    
    // Notifications
    emailAlerts: true,
    slackWebhook: '',
    discordWebhook: '',
    alertThreshold: 'medium',
    
    // Analysis
    defaultTimeout: '300',
    maxFileSize: '100',
    autoSandbox: false,
    retainResults: '30',
    
    // System
    logLevel: 'info',
    backupInterval: '24',
    maintenanceMode: false
  });

  const saveSettings = useMutation(
    async (settingsData) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Settings saved successfully');
      },
      onError: () => {
        toast.error('Failed to save settings');
      }
    }
  );

  const testConnection = useMutation(
    async (service) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    {
      onSuccess: (data, variables) => {
        toast.success(`${variables} connection successful`);
      },
      onError: (error, variables) => {
        toast.error(`${variables} connection failed`);
      }
    }
  );

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = () => {
    saveSettings.mutate(settings);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'api-keys':
        return (
          <SettingsContent>
            <SectionHeader>
              <SectionTitle>API Keys</SectionTitle>
              <SectionDescription>
                Configure API keys for external threat intelligence services
              </SectionDescription>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label htmlFor="vt-key">
                    <Shield size={16} />
                    VirusTotal API Key
                  </Label>
                  <InputWrapper>
                    <Input
                      id="vt-key"
                      type={showPasswords.vt ? 'text' : 'password'}
                      className="password"
                      value={settings.virustotalKey}
                      onChange={(e) => handleInputChange('virustotalKey', e.target.value)}
                      placeholder="Enter VirusTotal API key"
                    />
                    <TogglePassword onClick={() => togglePasswordVisibility('vt')}>
                      {showPasswords.vt ? <EyeOff size={16} /> : <Eye size={16} />}
                    </TogglePassword>
                  </InputWrapper>
                  <StatusIndicator className="success">
                    <CheckCircle size={14} />
                    Connected - 1000 requests/day remaining
                  </StatusIndicator>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="abuse-key">
                    <Globe size={16} />
                    AbuseIPDB API Key
                  </Label>
                  <InputWrapper>
                    <Input
                      id="abuse-key"
                      type={showPasswords.abuse ? 'text' : 'password'}
                      className="password"
                      value={settings.abuseipdbKey}
                      onChange={(e) => handleInputChange('abuseipdbKey', e.target.value)}
                      placeholder="Enter AbuseIPDB API key"
                    />
                    <TogglePassword onClick={() => togglePasswordVisibility('abuse')}>
                      {showPasswords.abuse ? <EyeOff size={16} /> : <Eye size={16} />}
                    </TogglePassword>
                  </InputWrapper>
                  <StatusIndicator className="warning">
                    <AlertTriangle size={14} />
                    Connected - Rate limit approaching
                  </StatusIndicator>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="urlscan-key">
                    <Globe size={16} />
                    URLScan.io API Key
                  </Label>
                  <InputWrapper>
                    <Input
                      id="urlscan-key"
                      type={showPasswords.urlscan ? 'text' : 'password'}
                      className="password"
                      value={settings.urlscanKey}
                      onChange={(e) => handleInputChange('urlscanKey', e.target.value)}
                      placeholder="Enter URLScan.io API key"
                    />
                    <TogglePassword onClick={() => togglePasswordVisibility('urlscan')}>
                      {showPasswords.urlscan ? <EyeOff size={16} /> : <Eye size={16} />}
                    </TogglePassword>
                  </InputWrapper>
                  <HelpText>Optional - Leave empty to use public API with rate limits</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="otx-key">
                    <Database size={16} />
                    AlienVault OTX API Key
                  </Label>
                  <InputWrapper>
                    <Input
                      id="otx-key"
                      type={showPasswords.otx ? 'text' : 'password'}
                      className="password"
                      value={settings.otxKey}
                      onChange={(e) => handleInputChange('otxKey', e.target.value)}
                      placeholder="Enter OTX API key"
                    />
                    <TogglePassword onClick={() => togglePasswordVisibility('otx')}>
                      {showPasswords.otx ? <EyeOff size={16} /> : <Eye size={16} />}
                    </TogglePassword>
                  </InputWrapper>
                  <StatusIndicator className="error">
                    <AlertTriangle size={14} />
                    Not configured
                  </StatusIndicator>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </SettingsContent>
        );

      case 'security':
        return (
          <SettingsContent>
            <SectionHeader>
              <SectionTitle>Security Settings</SectionTitle>
              <SectionDescription>
                Configure security and access control settings
              </SectionDescription>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    checked={settings.enableTwoFactor}
                    onChange={(e) => handleInputChange('enableTwoFactor', e.target.checked)}
                  />
                  <Label>Enable Two-Factor Authentication</Label>
                </CheckboxGroup>

                <FormGroup>
                  <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                  <Select
                    id="session-timeout"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                  >
                    <option value="1">1 hour</option>
                    <option value="8">8 hours</option>
                    <option value="24">24 hours</option>
                    <option value="168">1 week</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
                  <Textarea
                    id="allowed-ips"
                    value={settings.allowedIPs}
                    onChange={(e) => handleInputChange('allowedIPs', e.target.value)}
                    placeholder="Enter IP addresses or CIDR blocks, one per line"
                  />
                  <HelpText>Leave empty to allow access from any IP address</HelpText>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </SettingsContent>
        );

      case 'notifications':
        return (
          <SettingsContent>
            <SectionHeader>
              <SectionTitle>Notification Settings</SectionTitle>
              <SectionDescription>
                Configure alerts and notification preferences
              </SectionDescription>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    checked={settings.emailAlerts}
                    onChange={(e) => handleInputChange('emailAlerts', e.target.checked)}
                  />
                  <Label>Enable Email Alerts</Label>
                </CheckboxGroup>

                <FormGroup>
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    value={settings.slackWebhook}
                    onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    type="url"
                    value={settings.discordWebhook}
                    onChange={(e) => handleInputChange('discordWebhook', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="alert-threshold">Alert Threshold</Label>
                  <Select
                    id="alert-threshold"
                    value={settings.alertThreshold}
                    onChange={(e) => handleInputChange('alertThreshold', e.target.value)}
                  >
                    <option value="low">Low - All threats</option>
                    <option value="medium">Medium - Suspicious and above</option>
                    <option value="high">High - Malicious only</option>
                  </Select>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </SettingsContent>
        );

      case 'analysis':
        return (
          <SettingsContent>
            <SectionHeader>
              <SectionTitle>Analysis Settings</SectionTitle>
              <SectionDescription>
                Configure analysis behavior and performance settings
              </SectionDescription>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label htmlFor="default-timeout">Default Analysis Timeout (seconds)</Label>
                  <Input
                    id="default-timeout"
                    type="number"
                    value={settings.defaultTimeout}
                    onChange={(e) => handleInputChange('defaultTimeout', e.target.value)}
                    min="60"
                    max="3600"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleInputChange('maxFileSize', e.target.value)}
                    min="1"
                    max="1000"
                  />
                </FormGroup>

                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    checked={settings.autoSandbox}
                    onChange={(e) => handleInputChange('autoSandbox', e.target.checked)}
                  />
                  <Label>Automatically submit suspicious files to sandbox</Label>
                </CheckboxGroup>

                <FormGroup>
                  <Label htmlFor="retain-results">Retain Results (days)</Label>
                  <Select
                    id="retain-results"
                    value={settings.retainResults}
                    onChange={(e) => handleInputChange('retainResults', e.target.value)}
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                    <option value="0">Forever</option>
                  </Select>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </SettingsContent>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analysis', label: 'Analysis', icon: SettingsIcon }
  ];

  return (
    <SettingsContainer>
      <PageHeader>
        <PageTitle>Settings</PageTitle>
        <PageSubtitle>Configure system settings and preferences</PageSubtitle>
      </PageHeader>

      <SettingsNav>
        {tabs.map((tab) => (
          <NavTab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </NavTab>
        ))}
      </SettingsNav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>

      <ButtonGroup>
        <ActionButton className="secondary">
          Reset to Defaults
        </ActionButton>
        <ActionButton
          className="primary"
          onClick={handleSave}
          disabled={saveSettings.isLoading}
        >
          {saveSettings.isLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Settings
        </ActionButton>
      </ButtonGroup>
    </SettingsContainer>
  );
};

export default Settings;
