import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Menu, X, LogIn, LogOut, Shield } from 'lucide-react';
import LoginModal from './LoginModal';

const HeaderContainer = styled.header`
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NotificationButton = styled(motion.button)`
  position: relative;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid #1e293b;
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;

const UserDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 180px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #e2e8f0;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #374151;
  }
`;

const UserInfo = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #334155;
  margin-bottom: 0.5rem;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const UserRole = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: capitalize;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
`;

const SystemStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 6px;
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  background-color: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');
    
    if (token && userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
    }
  }, []);

  const handleLogin = (loginData) => {
    setUser(loginData.user_info);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setShowUserMenu(false);
    // You might want to redirect or refresh here
  };

  const getUserInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  };

  const getPrimaryRole = (roles) => {
    if (!roles || !roles.length) return 'user';
    return roles.includes('admin') ? 'admin' : roles[0];
  };

  return (
    <>
      <HeaderContainer>
        <LeftSection>
          <MenuButton onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </MenuButton>
          <Title>Threat Intelligence Platform</Title>
        </LeftSection>

        <RightSection>
          <SystemStatus>
            <StatusDot />
            <span>All Systems Operational</span>
          </SystemStatus>

          <NotificationButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} />
            <NotificationBadge />
          </NotificationButton>

          {user ? (
            <UserMenu>
              <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
                <UserAvatar>
                  {getUserInitials(user.username)}
                </UserAvatar>
                <span>{user.username}</span>
              </UserButton>

              <AnimatePresence>
                {showUserMenu && (
                  <UserDropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserInfo>
                      <UserName>{user.username}</UserName>
                      <UserRole>{getPrimaryRole(user.roles)}</UserRole>
                    </UserInfo>
                    
                    <DropdownItem onClick={() => setShowUserMenu(false)}>
                      <User size={16} />
                      Profile
                    </DropdownItem>
                    
                    <DropdownItem onClick={() => setShowUserMenu(false)}>
                      <Shield size={16} />
                      Security
                    </DropdownItem>
                    
                    <DropdownItem onClick={handleLogout}>
                      <LogOut size={16} />
                      Sign Out
                    </DropdownItem>
                  </UserDropdown>
                )}
              </AnimatePresence>
            </UserMenu>
          ) : (
            <LoginButton onClick={() => setShowLoginModal(true)}>
              <LogIn size={16} />
              Sign In
            </LoginButton>
          )}
        </RightSection>
      </HeaderContainer>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
};

export default Header;
