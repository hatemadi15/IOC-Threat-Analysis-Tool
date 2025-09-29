import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Upload,
  Rss,
  Box,
  Settings,
  Activity,
  AlertTriangle
} from 'lucide-react';

const SidebarContainer = styled(motion.aside)`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid #334155;
  padding: 2rem 0;
  overflow-y: auto;
  z-index: 1000;
  
  @media (max-width: 1024px) {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateX(0);
    }
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 2rem;
  margin-bottom: 3rem;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const LogoText = styled.div`
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
  }
  
  p {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
  }
`;

const Nav = styled.nav`
  padding: 0 1rem;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  &.active {
    background-color: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #3b82f6;
      border-radius: 0 2px 2px 0;
    }
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  span {
    font-weight: 500;
    font-size: 0.875rem;
  }
`;

const Section = styled.div`
  margin-top: 2rem;
  
  &:first-child {
    margin-top: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 1rem;
  margin-bottom: 1rem;
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.status === 'online' ? '#22c55e' : 
    props.status === 'warning' ? '#f59e0b' : '#ef4444'
  };
  margin-left: auto;
`;

const Sidebar = () => {
  return (
    <SidebarContainer
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Logo>
        <LogoIcon>
          <Shield size={24} />
        </LogoIcon>
        <LogoText>
          <h1>ThreatIOC</h1>
          <p>Analysis Platform</p>
        </LogoText>
      </Logo>

      <Nav>
        <Section>
          <SectionTitle>Analysis</SectionTitle>
          <NavItem to="/">
            <Activity />
            <span>Dashboard</span>
          </NavItem>
          <NavItem to="/ioc-analysis">
            <Search />
            <span>IOC Analysis</span>
          </NavItem>
          <NavItem to="/file-analysis">
            <Upload />
            <span>File Analysis</span>
          </NavItem>
        </Section>

        <Section>
          <SectionTitle>Intelligence</SectionTitle>
          <NavItem to="/threat-feeds">
            <Rss />
            <span>Threat Feeds</span>
            <StatusIndicator status="online" />
          </NavItem>
          <NavItem to="/sandbox">
            <Box />
            <span>Sandbox</span>
            <StatusIndicator status="warning" />
          </NavItem>
        </Section>

        <Section>
          <SectionTitle>System</SectionTitle>
          <NavItem to="/settings">
            <Settings />
            <span>Settings</span>
          </NavItem>
        </Section>
      </Nav>
    </SidebarContainer>
  );
};

export default Sidebar;
