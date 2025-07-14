import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container, Stack, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Tabs, Tab, Card, CardContent, Divider, List, ListItem, ListItemText, Fade, Avatar, Chip, Grid, IconButton, Tooltip, Fab, SvgIcon, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import { supabase } from './supabaseClient';
import AnimatedBackground from './AnimatedBackground';
import FacebookIcon from '@mui/icons-material/Facebook';
import CloseIcon from '@mui/icons-material/Close';

const waterDropBounce = {
  animation: 'waterDropBounce 1.2s cubic-bezier(.68,-0.55,.27,1.55)',
  '@keyframes waterDropBounce': {
    '0%': { transform: 'translateY(-40px) scale(0.7)', opacity: 0 },
    '60%': { transform: 'translateY(10px) scale(1.1)', opacity: 1 },
    '80%': { transform: 'translateY(-5px) scale(0.95)' },
    '100%': { transform: 'translateY(0) scale(1)' },
  },
};

const cardHover = {
  transition: 'box-shadow 0.3s, transform 0.2s',
  '&:hover': {
    boxShadow: 8,
    transform: 'translateY(-2px) scale(1.02)',
  },
};

const buttonHover = {
  transition: 'box-shadow 0.2s, transform 0.1s',
  '&:hover': {
    boxShadow: 4,
    transform: 'scale(1.04)',
  },
};

const rowHover = {
  transition: 'background 0.2s',
  '&:hover': {
    background: '#e0f7fa',
  },
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

// Surcharge calculation function (copied from Payments/Billing page)
function calculateSurcharge(billedMonth, basicAmount) {
  if (!billedMonth || !basicAmount || isNaN(Number(basicAmount))) return 0;
  let [year, month] = billedMonth.slice(0, 7).split('-').map(Number);
  let dueMonth = month + 1;
  let dueYear = year;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear += 1;
  }
  const dueDate = new Date(`${dueYear}-${dueMonth.toString().padStart(2, '0')}-20T00:00:00`);
  const endOfDueMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0, 23, 59, 59);
  const now = new Date();
  const basic = Number(basicAmount);
  let surcharge = 0;
  if (now > dueDate && now <= endOfDueMonth) {
    surcharge = basic * 0.10;
  } else if (now > endOfDueMonth) {
    surcharge = basic * 0.10;
    surcharge += (basic + surcharge) * 0.05;
  }
  return Number(surcharge.toFixed(2));
}

function MessengerChatbox({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [senderBarangay, setSenderBarangay] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const showSnackbar = typeof useGlobalSnackbar === 'function' ? useGlobalSnackbar() : () => {};

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDept('');
      setSelectedUser(null);
      setSenderName('');
      setSenderBarangay('');
      setMessage('');
      setSent(false);
      setErrors({});
      // Fetch departments
      supabase.from('departments').select('*').then(({ data, error }) => {
        if (!error && data) setDepartments(data);
      });
    }
  }, [open]);

  useEffect(() => {
    if (step === 2 && selectedDept) {
      // Fetch users for selected department
      supabase.from('users').select('*').eq('department', selectedDept).then(({ data, error }) => {
        if (!error && data) setUsers(data);
      });
    }
  }, [step, selectedDept]);

  const handleSend = async () => {
    const newErrors = {};
    if (!senderName.trim()) newErrors.senderName = 'Name is required';
    if (!senderBarangay.trim()) newErrors.senderBarangay = 'Barangay is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    if (!selectedUser) newErrors.selectedUser = 'Recipient is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSending(true);
    const payload = {
      department: selectedDept,
      recipient_userid: selectedUser.userid,
      recipient_name: `${selectedUser.firstname} ${selectedUser.lastname}`,
      recipient_email: selectedUser.email,
      sender_name: senderName,
      sender_barangay: senderBarangay,
      message,
      sent_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('messages').insert([payload]);
    setSending(false);
    if (!error) {
      setSent(true);
      setMessage('');
      showSnackbar && showSnackbar('Message sent!', 'success');
    } else {
      showSnackbar && showSnackbar('Failed to send message.', 'error');
    }
  };

  if (!open) return null;
  return (
    <Paper
      elevation={12}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 32 },
        right: { xs: 16, sm: 32 },
        zIndex: 2000,
        width: { xs: '95vw', sm: 350 },
        maxWidth: 400,
        maxHeight: '80vh',
        borderRadius: '16px 16px 12px 12px',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #e0e7ef', bgcolor: 'primary.main', color: '#fff' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Contact Us</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
      </Box>
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {step === 1 && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Which department do you want to contact?</Typography>
            <Stack spacing={1}>
              {departments.map((dept) => (
                <Button key={dept.id || dept.name} variant={selectedDept === (dept.name || dept.department) ? 'contained' : 'outlined'}
                  onClick={() => { setSelectedDept(dept.name || dept.department); setStep(2); }}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
                  {dept.name || dept.department || dept.title}
                </Button>
              ))}
            </Stack>
          </Stack>
        )}
        {step === 2 && (
          <Stack spacing={2}>
            <Button onClick={() => setStep(1)} size="small" sx={{ alignSelf: 'flex-start', mb: 1 }}>← Back</Button>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Who do you want to contact in {selectedDept}?</Typography>
            <Stack spacing={1}>
              {users.length === 0 && <Typography color="text.secondary">No users found in this department.</Typography>}
              {users.map((user) => (
                <Button key={user.userid} variant={selectedUser && selectedUser.userid === user.userid ? 'contained' : 'outlined'}
                  onClick={() => { setSelectedUser(user); setStep(3); }}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
                  {user.firstname} {user.lastname} ({user.position || user.role})
                </Button>
              ))}
            </Stack>
          </Stack>
        )}
        {step === 3 && selectedUser && (
          <Stack spacing={2}>
            <Button onClick={() => setStep(2)} size="small" sx={{ alignSelf: 'flex-start', mb: 1 }}>← Back</Button>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Contact {selectedUser.firstname} {selectedUser.lastname}</Typography>
            <Box sx={{ p: 2, borderRadius: 2, background: '#f1f5f9', mb: 1 }}>
              <Typography><b>Name:</b> {selectedUser.firstname} {selectedUser.lastname}</Typography>
              <Typography><b>Email:</b> {selectedUser.email}</Typography>
              <Typography><b>Department:</b> {selectedUser.department}</Typography>
              <Typography><b>Position:</b> {selectedUser.position}</Typography>
              <Typography><b>Role:</b> {selectedUser.role}</Typography>
            </Box>
            <TextField
              label="Your Name"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              fullWidth
              required
              error={!!errors.senderName}
              helperText={errors.senderName}
              disabled={sending || sent}
            />
            <TextField
              label="Your Barangay"
              value={senderBarangay}
              onChange={e => setSenderBarangay(e.target.value)}
              fullWidth
              required
              error={!!errors.senderBarangay}
              helperText={errors.senderBarangay}
              disabled={sending || sent}
            />
            {sent ? (
              <Alert severity="success">Your message has been sent!</Alert>
            ) : (
              <>
                <TextField
                  label="Your Message"
                  multiline
                  minRows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  fullWidth
                  required
                  error={!!errors.message}
                  helperText={errors.message}
                  disabled={sending}
                />
                <Button variant="contained" onClick={handleSend} disabled={sending || !message.trim()} sx={{ borderRadius: 3, fontWeight: 700 }}>
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

function MessengerFab({ onClick }) {
  return (
    <Tooltip title="Contact us on Messenger" placement="left">
      <Fab
        color="primary"
        size="large"
        aria-label="messenger"
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 32 },
          right: { xs: 24, md: 32 },
          zIndex: 2000,
          boxShadow: '0 4px 24px 0 rgba(59,130,246,0.18)',
        }}
        onClick={onClick}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.02 2 11.1c0 2.7 1.19 5.13 3.18 6.89.13.11.21.27.2.44l-.19 2.01c-.03.34.31.6.63.48l2.24-.89c.13-.05.28-.04.4.03C9.97 20.82 10.97 21 12 21c5.52 0 10-4.02 10-9.1C22 6.02 17.52 2 12 2zm1.88 11.54l-1.88-2.01-3.13 2.01c-.16.1-.36-.07-.29-.25l1.2-3.13-2.44-2.13c-.14-.12-.07-.36.12-.38l3.19-.28 1.19-3.09c.07-.18.32-.18.39 0l1.19 3.09 3.19.28c.19.02.26.26.12.38l-2.44 2.13 1.2 3.13c.07.18-.13.35-.29.25z" fill="#1877F2"/>
        </svg>
      </Fab>
    </Tooltip>
  );
}

const BillChecker = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  
  // Customer search states
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchTab, setSearchTab] = useState(0);
  const [announcementDepartments, setAnnouncementDepartments] = useState({});
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    // Fetch active announcements
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcement')
        .select('*')
        .eq('status', 'active')
        .order('date_posted', { ascending: false });
      if (!error) {
        setAnnouncements(data || []);
        // Fetch departments for posted_by emails
        const emails = Array.from(new Set((data || []).map(a => a.posted_by).filter(Boolean)));
        if (emails.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('email, department')
            .in('email', emails);
          if (!usersError && usersData) {
            const deptMap = {};
            usersData.forEach(u => { deptMap[u.email] = u.department; });
            setAnnouncementDepartments(deptMap);
          }
        }
      }
    };
    // Fetch current schedule of collection
    const fetchSchedule = async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: true });
      if (!error) setSchedule(data || []);
    };
    fetchAnnouncements();
    fetchSchedule();
  }, []);

  // Customer search function
  const handleCustomerSearch = async () => {
    if (!customerId.trim()) {
      setSearchError('Please enter a customer ID');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setCustomer(null);
    setCustomerBills([]);

    try {
      // Search for customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customerid', customerId.trim())
        .single();

      if (customerError || !customerData) {
        setSearchError('Customer not found. Please check the ID and try again.');
        setSearchLoading(false);
        return;
      }

      setCustomer(customerData);

      // Fetch customer bills
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('customerid', customerId.trim())
        .order('billedmonth', { ascending: false });

      if (!billsError) {
        setCustomerBills(billsData || []);
      }



    } catch (error) {
      setSearchError('An error occurred while searching. Please try again.');
      console.error('Search error:', error);
    }

    setSearchLoading(false);
  };

  // Format functions
  const formatAmount = (value) => {
    return value !== null && value !== undefined && value !== '' 
      ? `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : '₱0.00';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'unpaid': return 'error';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #e0e7ef 60%, #f0f9ff 100%)', position: 'relative', zIndex: 0, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <AnimatedBackground />
      {/* Messenger Floating Button */}
      <MessengerFab onClick={() => setChatOpen(true)} />
      <MessengerChatbox open={chatOpen} onClose={() => setChatOpen(false)} />
      <Container maxWidth="xl" sx={{ pt: 6, pb: 2, position: 'relative', px: { xs: 1, sm: 2, md: 4, lg: 6 } }}>
        {/* Header */}
        <Paper elevation={0} sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 5,
          width: '100%',
          textAlign: 'center',
          mb: 4,
          background: 'linear-gradient(135deg, #1e3a8a 60%, #38bdf8 100%)',
          color: '#fff',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'inherit',
          maxWidth: '100%',
          mx: 'auto',
        }}>
            <WaterDropIcon 
            color="inherit" 
              sx={{ 
              fontSize: 54, 
                ...waterDropBounce, 
                cursor: 'pointer', 
              mb: 1,
              opacity: 0.92,
              filter: 'drop-shadow(0 2px 8px #38bdf8cc)',
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.12)' }
              }}
              onClick={() => window.open('/mtowaterbilling/login', '_blank', 'noopener')}
            />
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: 1, fontSize: { xs: 26, sm: 38 }, fontFamily: 'inherit', mb: 1 }}>
              Water Bill Checker
            </Typography>
          <Typography variant="body1" sx={{ maxWidth: 520, fontSize: { xs: 15, sm: 18 }, color: 'rgba(255,255,255,0.93)', mx: 'auto', fontFamily: 'inherit' }}>
            View your billing information, collection schedule, and announcements in a secure, modern interface.
            </Typography>
          {/* Watermark illustration */}
          <WaterDropIcon sx={{
            position: 'absolute',
            right: -40,
            top: -30,
            fontSize: 160,
            color: 'rgba(59,130,246,0.08)',
            pointerEvents: 'none',
          }} />
        </Paper>
        {/* Main Content: Conditional Layout */}
        {!customer ? (
          // No search result: two columns below header
          <Grid container spacing={3} sx={{ maxWidth: '100%', mx: 'auto', alignItems: 'flex-start' }}>
            {/* Left: Bill Search */}
            <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Fade in timeout={500}>
                <Card elevation={0} sx={{ mb: 4, borderRadius: 4, background: 'rgba(255,255,255,0.75)', boxShadow: '0 4px 24px 0 rgba(59,130,246,0.10)', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef' }}>
            <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <SearchIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>
                        Bill Search
                </Typography>
                      <Tooltip title="Enter your Customer ID (e.g., 1001). If unsure, contact support." placement="right">
                        <InfoOutlinedIcon color="info" fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                      </Tooltip>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                        label="Customer ID"
                        variant="filled"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="e.g., 1001"
                        sx={{ flex: 1, borderRadius: 3, background: '#f8fafc', fontFamily: 'inherit' }}
                        inputProps={{ style: { fontSize: 18, fontWeight: 600, letterSpacing: 1 } }}
                        InputLabelProps={{ style: { fontWeight: 700, letterSpacing: 1 } }}
                        inputRef={input => input && input.focus()}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                />
                <Button
                  variant="contained"
                  onClick={handleCustomerSearch}
                  disabled={searchLoading}
                  startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                        sx={{
                          minWidth: 120,
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 16,
                          px: 4,
                          py: 1.2,
                          boxShadow: '0 2px 8px 0 #38bdf855',
                          background: 'linear-gradient(90deg, #2563eb 60%, #38bdf8 100%)',
                          transition: 'all 0.18s',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #38bdf8 60%, #2563eb 100%)',
                            boxShadow: '0 4px 16px 0 #2563eb33',
                            transform: 'scale(1.04)',
                          },
                        }}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </Stack>
              {searchError && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2, fontWeight: 600, fontSize: 15 }}>
                  {searchError}
                </Alert>
              )}
              {/* Customer Information Display */}
              {customer && (
                <Fade in timeout={600}>
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    {/* Customer Info Card */}
                          <Card elevation={0} sx={{ mb: 2, background: 'linear-gradient(135deg, #f0f9ff 60%, #e0e7ef 100%)', borderRadius: 3, boxShadow: '0 2px 12px 0 #38bdf822', position: 'relative', overflow: 'hidden' }}>
                            <WaterDropIcon sx={{ position: 'absolute', right: -18, top: -18, fontSize: 80, color: 'rgba(59,130,246,0.07)', pointerEvents: 'none' }} />
                      <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700, boxShadow: '0 2px 8px #38bdf855' }}>
                            {customer.name ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontSize: 22 }}>
                                {customer.name}
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
                                size="small"
                                      sx={{ ml: 2, minWidth: 120, fontWeight: 700, borderRadius: 999, borderWidth: 2, textTransform: 'uppercase', letterSpacing: 1 }}
                                onClick={() => {
                                  setCustomer(null);
                                  setCustomerBills([]);
                                  setSearchError('');
                                  setCustomerId('');
                                }}
                              >
                                      Change
            </Button>
          </Stack>
                                  <Grid container spacing={1.5}>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PersonIcon color="action" fontSize="small" />
                                  <Typography variant="body2"><b>ID:</b> {customer.customerid}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <CategoryIcon color="action" fontSize="small" />
                                  <Typography variant="body2"><b>Type:</b> {customer.type}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <LocationOnIcon color="action" fontSize="small" />
                                  <Typography variant="body2"><b>Barangay:</b> {customer.barangay}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2"><b>Discount:</b> {customer.discount ? `${customer.discount}%` : '0%'}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2"><b>Credit:</b> {customer.credit_balance !== undefined && customer.credit_balance !== null ? `₱${Number(customer.credit_balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00'}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2"><b>Added:</b> {customer.date_added ? new Date(customer.date_added).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</Typography>
                                </Stack>
                              </Grid>
                              <Grid item xs={12}>
                                <Stack direction="row" alignItems="flex-start" spacing={1}>
                                  <Typography variant="body2"><b>Remarks:</b> {customer.remarks || 'None'}</Typography>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                    {/* Tabs for Bills and Payments */}
                          <Tabs value={searchTab} onChange={(e, newValue) => setSearchTab(newValue)} sx={{ mb: 2, borderRadius: 999, minHeight: 48, background: '#e0e7ef', px: 1 }} TabIndicatorProps={{ style: { borderRadius: 999, height: 4, background: 'linear-gradient(90deg, #2563eb 60%, #38bdf8 100%)' } }}>
                            <Tab label={`Unpaid Bills (${customerBills.filter(bill => bill.paymentstatus !== 'Paid').length})`} icon={<ReceiptIcon />} sx={{ fontWeight: 700, borderRadius: 999, minHeight: 44, mx: 1 }} />
                            <Tab label={`Paid Bills (${customerBills.filter(bill => bill.paymentstatus === 'Paid').length})`} icon={<PaymentIcon />} sx={{ fontWeight: 700, borderRadius: 999, minHeight: 44, mx: 1 }} />
                    </Tabs>
                    <TabPanel value={searchTab} index={0}>
                      {customerBills.filter(bill => bill.paymentstatus !== 'Paid').length === 0 ? (
                              <Stack alignItems="center" sx={{ py: 4 }}>
                                <InfoOutlinedIcon color="info" sx={{ fontSize: 48, mb: 1, opacity: 0.7 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No unpaid bills found for this customer.
                                </Typography>
                              </Stack>
                      ) : (
                              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: '0 1px 8px #38bdf822', background: 'rgba(255,255,255,0.95)' }}>
                          <Table size="small">
                            <TableHead>
                                    <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                                      <TableCell sx={{ fontWeight: 800 }}>Billed Month</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Previous</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Current</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Consumption</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Basic</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Surcharge</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Discount</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {customerBills
                                .filter(bill => bill.paymentstatus !== 'Paid')
                                      .map((bill, idx) => {
                                  const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
                                  const basic = Number(bill.basicamount) || 0;
                                  const discountPercent = Number(customer?.discount) || 0;
                                  const discount = basic * (discountPercent / 100);
                                  const total = basic + surcharge - discount;
                                  return (
                                          <TableRow key={bill.billid} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' } }}>
                                      <TableCell>{formatMonth(bill.billedmonth)}</TableCell>
                                      <TableCell align="right">{bill.previousreading || '-'}</TableCell>
                                      <TableCell align="right">{bill.currentreading || '-'}</TableCell>
                                      <TableCell align="right">{bill.consumption || '-'}</TableCell>
                                      <TableCell align="right">{formatAmount(basic)}</TableCell>
                                      <TableCell align="right">{formatAmount(surcharge)}</TableCell>
                                      <TableCell align="right">{formatAmount(discount)}</TableCell>
                                      <TableCell align="right">{formatAmount(total)}</TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          label={bill.paymentstatus || 'Unpaid'} 
                                          color={getPaymentStatusColor(bill.paymentstatus)}
                                          size="small"
                                                sx={{ fontWeight: 700, borderRadius: 2 }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </TabPanel>
                    <TabPanel value={searchTab} index={1}>
                      {customerBills.filter(bill => bill.paymentstatus === 'Paid').length === 0 ? (
                              <Stack alignItems="center" sx={{ py: 4 }}>
                                <InfoOutlinedIcon color="info" sx={{ fontSize: 48, mb: 1, opacity: 0.7 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No paid bills found for this customer.
                                </Typography>
                              </Stack>
                      ) : (
                              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: '0 1px 8px #38bdf822', background: 'rgba(255,255,255,0.95)' }}>
                          <Table size="small">
                            <TableHead>
                                    <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                                      <TableCell sx={{ fontWeight: 800 }}>Billed Month</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Previous</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Current</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Consumption</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800 }}>Basic</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {customerBills
                                .filter(bill => bill.paymentstatus === 'Paid')
                                      .map((bill, idx) => (
                                      <TableRow key={bill.billid} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' } }}>
                                  <TableCell>{formatMonth(bill.billedmonth)}</TableCell>
                                  <TableCell align="right">{bill.previousreading || '-'}</TableCell>
                                  <TableCell align="right">{bill.currentreading || '-'}</TableCell>
                                  <TableCell align="right">{bill.consumption || '-'}</TableCell>
                                  <TableCell align="right">{formatAmount(bill.basicamount)}</TableCell>
                                  <TableCell align="center">
                                    <Chip 
                                      label={bill.paymentstatus || 'Paid'} 
                                      color={getPaymentStatusColor(bill.paymentstatus)}
                                      size="small"
                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </TabPanel>
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Fade>
            </Grid>
            {/* Right: Announcements + Collection Schedule stacked */}
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', height: '100%' }}>
              <Stack spacing={4} sx={{ width: '100%' }}>
                {/* Active Announcements */}
                <Fade in timeout={900}>
                  <Card elevation={0} sx={{ borderRadius: 4, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 12px 0 #38bdf822', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef', minHeight: 200, width: '100%' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <AnnouncementIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>Announcements</Typography>
                      </Stack>
                      <Divider sx={{ mb: 2 }} />
                      {announcements.length === 0 ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <AnnouncementIcon color="disabled" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                            No active announcements.
                          </Typography>
                        </Stack>
                      ) : (
                        <Stack spacing={2}>
                          {announcements.map(a => (
                            <Card key={a.id} elevation={0} sx={{ borderRadius: 3, background: '#fff', boxShadow: '0 1px 8px #38bdf822', p: 2, borderLeft: a.status === 'archived' ? '4px solid #cbd5e1' : '4px solid #38bdf8', position: 'relative', overflow: 'hidden' }}>
                              <AnnouncementIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 48, color: 'rgba(59,130,246,0.07)', pointerEvents: 'none' }} />
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <AnnouncementIcon color={a.status === 'archived' ? 'disabled' : 'primary'} />
                                  <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{a.title}</Typography>
                                  <Chip label={a.status || 'active'} size="small" color={a.status === 'archived' ? 'default' : 'success'} sx={{ fontWeight: 700 }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {a.date_posted ? new Date(a.date_posted).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>{a.description}</Typography>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  <b>Department:</b> {announcementDepartments[a.posted_by] || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <b>Posted by:</b> {a.posted_by || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <b>Status:</b> {a.status || 'active'}
                                </Typography>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
        {/* Schedule of Collection */}
        <Fade in timeout={700}>
                  <Card elevation={0} sx={{ borderRadius: 4, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 12px 0 #38bdf822', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef' }}>
            <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <EventIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>
                          Collection Schedule
                </Typography>
              </Stack>
                      <Divider sx={{ mb: 2 }} />
              {schedule.length === 0 ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <EventIcon color="disabled" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                            No schedule available.
                          </Typography>
                        </Stack>
              ) : (
                <TableContainer>
                  <Table size="small" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />Barangay</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />Collector</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><EventIcon fontSize="small" sx={{ mr: 0.5, color: 'info.main' }} />Date</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5, color: 'warning.main' }} />Day</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schedule.map((item, idx) => {
                        const dateObj = item.date ? new Date(item.date) : null;
                        const day = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: 'long' }) : '';
                        const isToday = dateObj && new Date().toDateString() === dateObj.toDateString();
                        return (
                                  <TableRow key={item.id || idx} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' }, ...(isToday && { background: '#38bdf822 !important' }) }}>
                                    <TableCell sx={{ fontWeight: 700 }}>{item.barangay}</TableCell>
                            <TableCell>{item.collector_name}</TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <EventIcon fontSize="small" color={isToday ? 'primary' : 'disabled'} />
                                <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400, color: isToday ? 'primary.main' : 'inherit' }}>
                                  {dateObj ? dateObj.toLocaleDateString() : ''}
                                </Typography>
                                {isToday && <Chip label="Today" color="info" size="small" sx={{ ml: 1 }} />}
                              </Stack>
                            </TableCell>
                            <TableCell>{day}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Fade>
              </Stack>
            </Grid>
          </Grid>
        ) : (
          // Search result: result card full width, then two sections below
          <Box>
            {/* Result card (customer info and bills) full width */}
            <Fade in timeout={500}>
              <Card elevation={0} sx={{ mb: 4, borderRadius: 4, background: 'rgba(255,255,255,0.75)', boxShadow: '0 4px 24px 0 rgba(59,130,246,0.10)', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef', maxWidth: '100%' }}>
                <CardContent>
                  {/* Customer Info Card */}
                  <Card elevation={0} sx={{ mb: 2, background: 'linear-gradient(135deg, #f0f9ff 60%, #e0e7ef 100%)', borderRadius: 3, boxShadow: '0 2px 12px 0 #38bdf822', position: 'relative', overflow: 'hidden' }}>
                    <WaterDropIcon sx={{ position: 'absolute', right: -18, top: -18, fontSize: 80, color: 'rgba(59,130,246,0.07)', pointerEvents: 'none' }} />
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700, boxShadow: '0 2px 8px #38bdf855' }}>
                          {customer.name ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontSize: 22 }}>
                              {customer.name}
                            </Typography>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              sx={{ ml: 2, minWidth: 120, fontWeight: 700, borderRadius: 999, borderWidth: 2, textTransform: 'uppercase', letterSpacing: 1 }}
                              onClick={() => {
                                setCustomer(null);
                                setCustomerBills([]);
                                setSearchError('');
                                setCustomerId('');
                              }}
                            >
                              Change
                            </Button>
                          </Stack>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <PersonIcon color="action" fontSize="small" />
                                <Typography variant="body2"><b>ID:</b> {customer.customerid}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <CategoryIcon color="action" fontSize="small" />
                                <Typography variant="body2"><b>Type:</b> {customer.type}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <LocationOnIcon color="action" fontSize="small" />
                                <Typography variant="body2"><b>Barangay:</b> {customer.barangay}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2"><b>Discount:</b> {customer.discount ? `${customer.discount}%` : '0%'}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2"><b>Credit:</b> {customer.credit_balance !== undefined && customer.credit_balance !== null ? `₱${Number(customer.credit_balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00'}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2"><b>Added:</b> {customer.date_added ? new Date(customer.date_added).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12}>
                              <Stack direction="row" alignItems="flex-start" spacing={1}>
                                <Typography variant="body2"><b>Remarks:</b> {customer.remarks || 'None'}</Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                  {/* Tabs for Bills and Payments */}
                  <Tabs value={searchTab} onChange={(e, newValue) => setSearchTab(newValue)} sx={{ mb: 2, borderRadius: 999, minHeight: 48, background: '#e0e7ef', px: 1 }} TabIndicatorProps={{ style: { borderRadius: 999, height: 4, background: 'linear-gradient(90deg, #2563eb 60%, #38bdf8 100%)' } }}>
                    <Tab label={`Unpaid Bills (${customerBills.filter(bill => bill.paymentstatus !== 'Paid').length})`} icon={<ReceiptIcon />} sx={{ fontWeight: 700, borderRadius: 999, minHeight: 44, mx: 1 }} />
                    <Tab label={`Paid Bills (${customerBills.filter(bill => bill.paymentstatus === 'Paid').length})`} icon={<PaymentIcon />} sx={{ fontWeight: 700, borderRadius: 999, minHeight: 44, mx: 1 }} />
                  </Tabs>
                  <TabPanel value={searchTab} index={0}>
                    {customerBills.filter(bill => bill.paymentstatus !== 'Paid').length === 0 ? (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <InfoOutlinedIcon color="info" sx={{ fontSize: 48, mb: 1, opacity: 0.7 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No unpaid bills found for this customer.
                        </Typography>
                      </Stack>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: '0 1px 8px #38bdf822', background: 'rgba(255,255,255,0.95)' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                              <TableCell sx={{ fontWeight: 800 }}>Billed Month</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Previous</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Current</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Consumption</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Basic</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Surcharge</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Discount</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerBills
                              .filter(bill => bill.paymentstatus !== 'Paid')
                              .map((bill, idx) => {
                                const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
                                const basic = Number(bill.basicamount) || 0;
                                const discountPercent = Number(customer?.discount) || 0;
                                const discount = basic * (discountPercent / 100);
                                const total = basic + surcharge - discount;
                                return (
                                  <TableRow key={bill.billid} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' } }}>
                                    <TableCell>{formatMonth(bill.billedmonth)}</TableCell>
                                    <TableCell align="right">{bill.previousreading || '-'}</TableCell>
                                    <TableCell align="right">{bill.currentreading || '-'}</TableCell>
                                    <TableCell align="right">{bill.consumption || '-'}</TableCell>
                                    <TableCell align="right">{formatAmount(basic)}</TableCell>
                                    <TableCell align="right">{formatAmount(surcharge)}</TableCell>
                                    <TableCell align="right">{formatAmount(discount)}</TableCell>
                                    <TableCell align="right">{formatAmount(total)}</TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={bill.paymentstatus || 'Unpaid'} 
                                        color={getPaymentStatusColor(bill.paymentstatus)}
                                        size="small"
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </TabPanel>
                  <TabPanel value={searchTab} index={1}>
                    {customerBills.filter(bill => bill.paymentstatus === 'Paid').length === 0 ? (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <InfoOutlinedIcon color="info" sx={{ fontSize: 48, mb: 1, opacity: 0.7 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No paid bills found for this customer.
                        </Typography>
                      </Stack>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: '0 1px 8px #38bdf822', background: 'rgba(255,255,255,0.95)' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                              <TableCell sx={{ fontWeight: 800 }}>Billed Month</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Previous</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Current</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Consumption</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Basic</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerBills
                              .filter(bill => bill.paymentstatus === 'Paid')
                              .map((bill, idx) => (
                              <TableRow key={bill.billid} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' } }}>
                                <TableCell>{formatMonth(bill.billedmonth)}</TableCell>
                                <TableCell align="right">{bill.previousreading || '-'}</TableCell>
                                <TableCell align="right">{bill.currentreading || '-'}</TableCell>
                                <TableCell align="right">{bill.consumption || '-'}</TableCell>
                                <TableCell align="right">{formatAmount(bill.basicamount)}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={bill.paymentstatus || 'Paid'} 
                                    color={getPaymentStatusColor(bill.paymentstatus)}
                                    size="small"
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </TabPanel>
                </CardContent>
              </Card>
            </Fade>
            {/* Below: two sections, left = schedule, right = announcements */}
            <Grid container spacing={3} sx={{ maxWidth: '100%', mx: 'auto', alignItems: 'flex-start' }}>
              <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                {/* Schedule of Collection */}
                <Fade in timeout={700}>
                  <Card elevation={0} sx={{ borderRadius: 4, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 12px 0 #38bdf822', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <EventIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>
                          Collection Schedule
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb: 2 }} />
                      {schedule.length === 0 ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <EventIcon color="disabled" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                            No schedule available.
                          </Typography>
                        </Stack>
                      ) : (
                        <TableContainer>
                          <Table size="small" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <TableHead>
                              <TableRow sx={{ background: 'linear-gradient(90deg, #e0f2fe 60%, #f0f9ff 100%)' }}>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />Barangay</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />Collector</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><EventIcon fontSize="small" sx={{ mr: 0.5, color: 'info.main' }} />Date</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 15 }}><InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5, color: 'warning.main' }} />Day</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {schedule.map((item, idx) => {
                                const dateObj = item.date ? new Date(item.date) : null;
                                const day = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: 'long' }) : '';
                                const isToday = dateObj && new Date().toDateString() === dateObj.toDateString();
                                return (
                                  <TableRow key={item.id || idx} sx={{ background: idx % 2 === 0 ? '#f8fafc' : '#e0e7ef33', transition: 'background 0.2s', '&:hover': { background: '#bae6fd55' }, ...(isToday && { background: '#38bdf822 !important' }) }}>
                                    <TableCell sx={{ fontWeight: 700 }}>{item.barangay}</TableCell>
                                    <TableCell>{item.collector_name}</TableCell>
                                    <TableCell>
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <EventIcon fontSize="small" color={isToday ? 'primary' : 'disabled'} />
                                        <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400, color: isToday ? 'primary.main' : 'inherit' }}>
                                          {dateObj ? dateObj.toLocaleDateString() : ''}
                                        </Typography>
                                        {isToday && <Chip label="Today" color="info" size="small" sx={{ ml: 1 }} />}
                                      </Stack>
                                    </TableCell>
                                    <TableCell>{day}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Active Announcements */}
        <Fade in timeout={900}>
                  <Card elevation={0} sx={{ borderRadius: 4, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 12px 0 #38bdf822', backdropFilter: 'blur(8px)', border: '1.5px solid #e0e7ef', minHeight: 200, width: '100%' }}>
            <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <AnnouncementIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>Announcements</Typography>
              </Stack>
                      <Divider sx={{ mb: 2 }} />
              {announcements.length === 0 ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <AnnouncementIcon color="disabled" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                            No active announcements.
                          </Typography>
                        </Stack>
              ) : (
                <Stack spacing={2}>
                  {announcements.map(a => (
                            <Card key={a.id} elevation={0} sx={{ borderRadius: 3, background: '#fff', boxShadow: '0 1px 8px #38bdf822', p: 2, borderLeft: a.status === 'archived' ? '4px solid #cbd5e1' : '4px solid #38bdf8', position: 'relative', overflow: 'hidden' }}>
                              <AnnouncementIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 48, color: 'rgba(59,130,246,0.07)', pointerEvents: 'none' }} />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AnnouncementIcon color={a.status === 'archived' ? 'disabled' : 'primary'} />
                                  <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{a.title}</Typography>
                                  <Chip label={a.status || 'active'} size="small" color={a.status === 'archived' ? 'default' : 'success'} sx={{ fontWeight: 700 }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {a.date_posted ? new Date(a.date_posted).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>{a.description}</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          <b>Department:</b> {announcementDepartments[a.posted_by] || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <b>Posted by:</b> {a.posted_by || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <b>Status:</b> {a.status || 'active'}
                        </Typography>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Fade>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BillChecker; 