import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import IOCAnalysis from './pages/IOCAnalysis';
import FileAnalysis from './pages/FileAnalysis';
import ThreatFeeds from './pages/ThreatFeeds';
import Sandbox from './pages/Sandbox';
import Settings from './pages/Settings';
import { motion } from 'framer-motion';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #0f172a;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  
  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const ContentArea = styled(motion.main)`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

function App() {
  return (
    <AppContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentArea
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ioc-analysis" element={<IOCAnalysis />} />
            <Route path="/file-analysis" element={<FileAnalysis />} />
            <Route path="/threat-feeds" element={<ThreatFeeds />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}

export default App;
