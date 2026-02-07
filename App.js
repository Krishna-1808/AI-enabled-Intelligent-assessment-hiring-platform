import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AssessmentCreator from './components/AssessmentCreator';
import CandidateAssessment from './components/CandidateAssessment';
import Results from './components/Results';
import Leaderboard from './components/Leaderboard';
import CandidateReport from './components/CandidateReport';
import AdminDashboard from './components/AdminDashboard';

// Services
import api from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUserRole('');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? 
                <Login onLogin={handleLogin} /> : 
                <Navigate to={userRole === 'admin' ? "/admin" : "/dashboard"} />
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated && userRole === 'recruiter' ? 
                <Dashboard onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                isAuthenticated && userRole === 'admin' ? 
                <AdminDashboard onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/create-assessment" 
              element={
                isAuthenticated ? 
                <AssessmentCreator onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/assessment/:assessmentId" 
              element={<CandidateAssessment />} 
            />
            
            <Route 
              path="/results/:assessmentId" 
              element={<Results />} 
            />
            
            <Route 
              path="/leaderboard/:jobId" 
              element={<Leaderboard />} 
            />
            
            <Route 
              path="/report/:candidateId" 
              element={
                isAuthenticated ? 
                <CandidateReport onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <Navigate to={userRole === 'admin' ? "/admin" : "/dashboard"} /> : 
                <Navigate to="/login" />
              } 
            />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App; 