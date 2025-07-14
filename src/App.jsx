import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { blue, cyan, grey } from '@mui/material/colors';
import Login from './Login';
import Home from './Home';
import Customers from './Customers';
import Layout from './Layout';
import Billing from './Billing';
import Payments from './Payments';
import CreditManagement from './CreditManagement';
import Users from './Users';
import RPTCalculator from './RPTCalculator';
import Reports from './Reports';
import Schedule from './Schedule';
import BillChecker from './BillChecker';
import { AccountCircle, Dashboard } from '@mui/icons-material';
import { GlobalSnackbarProvider } from './GlobalSnackbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a', // Deep blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#06b6d4', // Aqua
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc',
      paper: '#fff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: grey[200],
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'background 0.2s, transform 0.1s',
          '&:active': {
            transform: 'scale(0.96)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(30,58,138,0.06)',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(6,182,212,0.12)',
            transform: 'translateY(-2px) scale(1.01)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(6,182,212,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e0e7ef',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          transition: 'opacity 0.3s',
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalSnackbarProvider>
      <Router basename="/mtowaterbilling/">
        <Routes>
          <Route path="/login" element={
            <Login 
              icon={<AccountCircle fontSize="large" color="primary" />}
              title="Water Billing System"
            />
          } />
          <Route path="/" element={<Navigate to="/billchecker" replace />} />
          <Route path="/billchecker" element={<BillChecker />} />
          <Route path="/" element={<Layout />}>
            <Route path="home" element={
              <Home 
                icon={<Dashboard fontSize="large" color="primary" />}
                title="Dashboard"
              />
            } />
            <Route path="customers" element={<Customers />} />
            <Route path="billing" element={<Billing />} />
            <Route path="payments" element={<Payments />} />
            <Route path="credit-management" element={<CreditManagement />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tools/rpt-calculator" element={<RPTCalculator />} />
            <Route path="schedule" element={<Schedule />} />
          </Route>
        </Routes>
      </Router>
      </GlobalSnackbarProvider>
    </ThemeProvider>
  );
};

export default App;