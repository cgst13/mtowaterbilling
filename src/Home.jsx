import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Box, CssBaseline, Container, Paper, Avatar,
  Grid, Card, CardContent, Chip, Button, Divider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon, 
  Receipt as ReceiptIcon, Payment as PaymentIcon, Person as PersonIcon,
  TrendingUp as TrendingUpIcon, Water as WaterIcon, AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon, Settings as SettingsIcon,
  Logout as LogoutIcon, Analytics as AnalyticsIcon, Group as GroupIcon,
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon, CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { supabase } from './supabaseClient'; // Ensure you have the correct path to your Supabase client
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from './PageHeader';
import AnimatedBackground from './AnimatedBackground';
import useMediaQuery from '@mui/material/useMediaQuery';

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0f7ff 0%, #cce7ff 100%)',
  color: '#1e293b',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const ActionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.2s ease-in-out',
  border: '1px solid #e2e8f0',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderColor: '#4f46e5',
  },
}));

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
    if (isNaN(end)) return setDisplay(value);
    if (start === end) return;
    let increment = end / 30;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  if (typeof value === 'string' && value.includes('₱')) {
    return `₱${display.toLocaleString()}`;
  }
  if (typeof value === 'string' && value.includes('L')) {
    return `${display.toLocaleString()} L`;
  }
  return display.toLocaleString();
};

const Home = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState({ name: '', role: '', userid: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: null,
    monthlyRevenue: null,
    waterConsumption: null,
    pendingBills: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speedMbps, setSpeedMbps] = useState(null);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [isStable, setIsStable] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [mySchedule, setMySchedule] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [uncollectedRevenue, setUncollectedRevenue] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the logged-in user's email from localStorage
        const email = localStorage.getItem('userEmail');
        if (!email) {
          console.error('No user email found in localStorage.');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, role, userid')
          .eq('email', email)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({
            name: `${data.firstname} ${data.lastname}`,
            role: data.role,
            userid: data.userid,
          });
          // If collector, fetch schedule
          if (data.role === 'Collector') {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const { data: sched } = await supabase
              .from('schedules')
              .select('*')
              .eq('collector_id', data.userid)
              .eq('month', month)
              .eq('year', year);
            if (sched && sched.length > 0) {
              setMySchedule(sched);
              setScheduleDialogOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
      setLoading(false);
    };

    fetchUserData();

    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthStart = `${year}-${month}-01`;
      const nextMonth = new Date(year, now.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString().slice(0, 10);
      // Total Customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      // Monthly Revenue (sum of totalbillamount for Paid bills this month)
      const { data: paidBills, error: paidBillsError } = await supabase
        .from('bills')
        .select('totalbillamount, paymentstatus, datepaid')
        .gte('datepaid', monthStart)
        .lt('datepaid', monthEnd)
        .eq('paymentstatus', 'Paid');
      const monthlyRevenue = paidBills && paidBills.length > 0
        ? paidBills.reduce((sum, b) => sum + (Number(b.totalbillamount) || 0), 0)
        : 0;
      // Water Consumption (sum of consumption for ALL bills, regardless of status)
      const { data: allBills, error: allBillsError } = await supabase
        .from('bills')
        .select('consumption');
      const waterConsumption = allBills && allBills.length > 0
        ? allBills.reduce((sum, b) => sum + (Number(b.consumption) || 0), 0)
        : 0;
      // Pending Bills (count of bills not Paid)
      const { count: pendingBills } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .neq('paymentstatus', 'Paid');
      setStats({
        totalCustomers: totalCustomers ?? 0,
        monthlyRevenue,
        waterConsumption,
        pendingBills: pendingBills ?? 0,
      });
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    let intervalId;
    const testSpeed = async () => {
      if (!navigator.onLine) {
        setSpeedMbps(null);
        setIsStable(false);
        setSpeedHistory([]);
        return;
      }
      const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg'; // ~30KB
      const fileSizeBytes = 30000; // Approximate size in bytes
      const startTime = performance.now();
      try {
        await fetch(imageUrl, { cache: 'no-store' });
        const endTime = performance.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const bitsLoaded = fileSizeBytes * 8;
        const speed = (bitsLoaded / durationSeconds) / (1024 * 1024); // Mbps
        setSpeedMbps(speed);
        setSpeedHistory(prev => {
          const updated = [...prev, speed].slice(-5);
          // Calculate stability: if max-min < 20% of average, it's stable
          const avg = updated.reduce((a, b) => a + b, 0) / updated.length;
          const min = Math.min(...updated);
          const max = Math.max(...updated);
          setIsStable((max - min) < avg * 0.2);
          return updated;
        });
      } catch (e) {
        setSpeedMbps(null);
        setIsStable(false);
      }
    };
    testSpeed();
    intervalId = setInterval(testSpeed, 5000);
    return () => clearInterval(intervalId);
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchRevenueTrend = async () => {
      const { data: bills, error } = await supabase
        .from('bills')
        .select('billedmonth, totalbillamount, paymentstatus')
        .eq('paymentstatus', 'Paid');
      if (error) {
        setRevenueData([]);
        return;
      }
      const monthly = {};
      bills.forEach(bill => {
        if (!bill.billedmonth) return;
        const month = bill.billedmonth.slice(0, 7); // 'YYYY-MM'
        if (!monthly[month]) monthly[month] = 0;
        monthly[month] += Number(bill.totalbillamount) || 0;
      });
      const months = Object.keys(monthly).sort();
      const chartData = months.map(month => ({
        month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: monthly[month]
      }));
      setRevenueData(chartData);
    };
    fetchRevenueTrend();
  }, []);

  useEffect(() => {
    const fetchRevenueStats = async () => {
      // Total Revenue (Paid)
      const { data: paidBills, error: paidError } = await supabase
        .from('bills')
        .select('totalbillamount')
        .eq('paymentstatus', 'Paid');
      const total = paidBills && paidBills.length > 0
        ? paidBills.reduce((sum, b) => sum + (Number(b.totalbillamount) || 0), 0)
        : 0;
      setTotalRevenue(total);
      // Uncollected Revenue (Unpaid)
      const { data: unpaidBills, error: unpaidError } = await supabase
        .from('bills')
        .select('totalbillamount')
        .eq('paymentstatus', 'Unpaid');
      const uncollected = unpaidBills && unpaidBills.length > 0
        ? unpaidBills.reduce((sum, b) => sum + (Number(b.totalbillamount) || 0), 0)
        : 0;
      setUncollectedRevenue(uncollected);
    };
    fetchRevenueStats();
  }, []);

  const statsData = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: <PeopleIcon />, color: '#4f46e5', format: v => v?.toLocaleString() },
    { title: 'Total Revenue', value: totalRevenue, icon: <MoneyIcon />, color: '#059669', format: v => v != null ? `₱${Number(v).toLocaleString()}` : '' },
    { title: 'Uncollected Revenue', value: uncollectedRevenue, icon: <MoneyIcon />, color: '#f87171', format: v => v != null ? `₱${Number(v).toLocaleString()}` : '' },
    { title: 'Water Consumption', value: stats.waterConsumption, icon: <WaterIcon />, color: '#0ea5e9', format: v => v != null ? `${Number(v).toLocaleString()} L` : '' },
    { title: 'Pending Bills', value: stats.pendingBills, icon: <ReceiptIcon />, color: '#f59e0b', format: v => v?.toLocaleString() },
  ];

  const quickActions = [
    { title: 'Add New Customer', description: 'Register a new water service customer', color: '#4f46e5', route: '/customers' },
    { title: 'Generate Bills', description: 'Create monthly billing statements', color: '#059669', route: '/billing' },
    { title: 'Process Payment', description: 'Record customer payments', color: '#0ea5e9', route: '/payments' },
    { title: 'View Reports', description: 'Access detailed analytics and reports', color: '#8b5cf6', route: '/reports' },
  ];

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/home' },
    { text: 'Customers', icon: <PeopleIcon />, route: '/customers' },
    { text: 'Billing', icon: <ReceiptIcon />, route: '/billing' },
    { text: 'Payments', icon: <PaymentIcon /> },
    { text: 'Analytics', icon: <AnalyticsIcon /> },
    { text: 'Users', icon: <PersonIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', position: 'relative', minHeight: '100vh', p: 0, width: '100%' }}>
      <AnimatedBackground />
      <CssBaseline />
      {/* Remove AppBar, Drawer, and sidebar rendering. */}
      {/* Only render the dashboard cards, quick actions, etc. */}
      <Container maxWidth={false} sx={{ mt: { xs: 1, sm: 3 }, mb: { xs: 2, sm: 4 }, position: 'relative', zIndex: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        <PageHeader
          title="Dashboard Overview"
          subtitle="LGU Concepcion, Romblon - Water Billing Management System"
          actions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOnline ? (
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                ) : (
                  <CancelIcon sx={{ color: 'grey.500' }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 14 } }}>
                  System {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 14 } }}>
                  {speedMbps !== null ? `${speedMbps.toFixed(1)} Mbps` : 'N/A'}
                </Typography>
                <Chip
                  label={isStable ? 'Stable' : 'Unstable'}
                  color={isStable ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>
          }
        />

          {/* Stats Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 }, width: '100%' }}>
            {loadingStats
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                      <Skeleton variant="rectangular" height={100} animation="wave" />
                    </Card>
                  </Grid>
                ))
              : statsData.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <StatsCard>
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)', 
                            borderRadius: 2, 
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                          }}>
                            {stat.icon}
                          </Box>
                          <TrendingUpIcon sx={{ opacity: 0.7 }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', md: '2.5rem' } }}>
                          {stat.format ? stat.format(stat.value) : <AnimatedNumber value={stat.value} />}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: 13, sm: 15 } }}>
                          {stat.title}
                        </Typography>
                      </CardContent>
                    </StatsCard>
                  </Grid>
                ))}
          </Grid>

          {/* Revenue Trend Chart */}
          <Paper elevation={3} sx={{ mb: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 }, borderRadius: 3, width: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', fontSize: { xs: 16, sm: 20 } }}>
              Monthly Revenue Trend
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={220} animation="wave" />
            ) : (
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                <LineChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontWeight: 600, fill: '#64748b', fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={{ fontWeight: 600, fill: '#64748b', fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip formatter={v => `₱${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>

          {/* Quick Actions */}
          <Box sx={{ mb: { xs: 2, sm: 4 }, width: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, fontSize: { xs: 16, sm: 22 } }}>
              Quick Actions
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <ActionCard>
                    <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          backgroundColor: `${action.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px auto'
                        }}
                      >
                        <Box sx={{ color: action.color, fontSize: 24 }}>
                          {index === 0 && <PeopleIcon />}
                          {index === 1 && <ReceiptIcon />}
                          {index === 2 && <PaymentIcon />}
                          {index === 3 && <AnalyticsIcon />}
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e293b', fontSize: { xs: 15, sm: 18 } }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: { xs: 12, sm: 14 } }}>
                        {action.description}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderColor: action.color,
                          color: action.color,
                          minHeight: 44,
                          px: 2,
                          fontSize: { xs: 13, sm: 15 },
                          '&:hover': {
                            backgroundColor: `${action.color}10`,
                            borderColor: action.color
                          }
                        }}
                        onClick={() => navigate(action.route)}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </ActionCard>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Recent Activity */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e2e8f0', width: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, fontSize: { xs: 16, sm: 22 } }}>
              Recent Activity
            </Typography>
            <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontSize: { xs: 13, sm: 16 } }}>
                No recent activity to display. Start by adding customers or processing payments.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2,
                  minHeight: 44,
                  fontSize: { xs: 13, sm: 15 },
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca, #6d28d9)',
                  }
                }}
              >
                View All Activities
              </Button>
            </Box>
          </Paper>
        </Container>
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: 4,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            border: '1px solid rgba(255,255,255,0.18)',
            animation: 'fadeInDialog 0.7s cubic-bezier(.4,0,.2,1)',
            position: 'relative',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: { xs: 18, sm: 22 },
          color: '#0284c7',
          background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          pb: 1.5
        }}>
          <CalendarTodayIcon sx={{ color: '#0ea5e9', fontSize: { xs: 24, sm: 32 }, mr: 1, filter: 'drop-shadow(0 2px 8px #38bdf8aa)' }} />
          Your Collection Schedule for This Month
        </DialogTitle>
        <DialogContent sx={{ mt: 1, p: 0 }}>
          {mySchedule.length > 0 ? (
            <TableContainer component={Paper} sx={{
              mt: 2, mb: 2, boxShadow: '0 2px 12px 0 #0ea5e91a', borderRadius: 3, background: 'rgba(255,255,255,0.85)',
              animation: 'fadeInTable 0.8s cubic-bezier(.4,0,.2,1)',
              overflowX: 'auto',
              minWidth: 0
            }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(90deg, #bae6fd 0%, #e0f2fe 100%)' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontSize: { xs: 13, sm: 16 } }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontSize: { xs: 13, sm: 16 } }}>Barangay</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mySchedule.map((s, i) => (
                    <TableRow key={i} sx={{ transition: 'background 0.3s', '&:hover': { background: '#e0f2fe' } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#0ea5e9', fontSize: { xs: 12, sm: 15 } }}>
                        {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: { xs: 12, sm: 15 } }}>{s.barangay}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', color: '#64748b', fontWeight: 500, fontSize: { xs: 13, sm: 15 } }}>No schedule found for this month.</Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setScheduleDialogOpen(false)} variant="contained" sx={{
            background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)',
            color: '#fff', fontWeight: 700, px: 4, borderRadius: 2,
            boxShadow: '0 2px 8px 0 #0ea5e955',
            minHeight: 44,
            fontSize: { xs: 13, sm: 15 },
            '&:hover': { background: 'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)' }
          }}>Close</Button>
        </DialogActions>
        <style>{`
          @keyframes fadeInDialog {
            from { opacity: 0; transform: translateY(40px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes fadeInTable {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </Dialog>
    </Box>
  );
};

export default Home;