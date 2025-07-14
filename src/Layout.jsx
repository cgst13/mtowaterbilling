import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Box, CssBaseline, Avatar, Divider, Badge, Menu, MenuItem, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon,
  Receipt as ReceiptIcon, Payment as PaymentIcon, Person as PersonIcon,
  Analytics as AnalyticsIcon, Water as WaterIcon, Notifications as NotificationsIcon,
  Logout as LogoutIcon, Settings as SettingsIcon, Help as HelpIcon, AccountBalanceWallet as WalletIcon,
  ExpandLess, ExpandMore, Build as BuildIcon, Calculate as CalculateIcon, History as HistoryIcon, CalendarToday as CalendarTodayIcon,
  MailOutline as MailOutlineIcon, Visibility as VisibilityIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { supabase } from './supabaseClient';
import ProfileDialog from './ProfileDialog';
import useMediaQuery from '@mui/material/useMediaQuery';

const drawerWidth = 240;

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
    display: 'block',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 64,
  marginBottom: theme.spacing(2),
}));

const Layout = () => {
  const isMobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(!isMobile); // open by default on desktop
  const [user, setUser] = useState({ name: '', role: '', email: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount] = useState(3); // Example notification count
  const [toolsOpen, setToolsOpen] = useState(false);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
  const notifOpen = Boolean(notifAnchorEl);
  const [messages, setMessages] = useState([]);
  const [messagesAnchorEl, setMessagesAnchorEl] = useState(null);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const messagesOpen = Boolean(messagesAnchorEl);
  const [viewMessage, setViewMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          console.error('No user email found in localStorage.');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, role, email, department, position, status, datecreated, lastlogin')
          .eq('email', email)
          .single();
        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({
            name: `${data.firstname} ${data.lastname}`,
            role: data.role,
            email: data.email,
            department: data.department,
            position: data.position,
            status: data.status,
            datecreated: data.datecreated,
            lastlogin: data.lastlogin
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
    const handleResize = () => setOpen(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch active announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcement')
        .select('*')
        .eq('status', 'active')
        .order('date_posted', { ascending: false });
      setAnnouncements(error ? [] : data || []);
    };
    fetchAnnouncements();
  }, []);

  // Fetch messages for the logged-in user
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user.email) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_email', user.email)
        .order('sent_at', { ascending: false });
      if (!error && data) setMessages(data);
    };
    fetchMessages();
  }, [user.email]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleProfileOpen = () => {
    setProfileOpen(true);
    handleMenuClose();
  };
  const handleProfileClose = () => setProfileOpen(false);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMessagesClick = (event) => {
    setMessagesAnchorEl(event.currentTarget);
  };
  const handleMessagesClose = () => {
    setMessagesAnchorEl(null);
  };
  const handleMessagesModalOpen = () => {
    setMessagesModalOpen(true);
    handleMessagesClose();
  };
  const handleMessagesModalClose = () => {
    setMessagesModalOpen(false);
  };

  const handleToolsSubmenuClick = (sub) => {
    if (sub.text === 'RPT Calculator') {
      navigate('/tools/rpt-calculator');
    }
    // Add more navigation for other tools as needed
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/home' },
    { text: 'Customers', icon: <PeopleIcon />, route: '/customers' },
    { text: 'Billing', icon: <ReceiptIcon />, route: '/billing' },
    { text: 'Payments', icon: <PaymentIcon />, route: '/payments' },
    { text: 'Credit Management', icon: <WalletIcon />, route: '/credit-management' },
    { text: 'Reports', icon: <AnalyticsIcon />, route: '/reports' },
    { text: 'Users', icon: <PersonIcon />, route: '/users' },
    { text: 'Schedule', icon: <CalendarTodayIcon />, route: '/schedule' },
    { text: 'Tools', icon: <BuildIcon />, children: [
      { text: 'RPT Calculator', icon: <CalculateIcon /> },
      { text: 'Old System 2025', icon: <HistoryIcon /> },
      { text: 'Old System 2024', icon: <HistoryIcon /> },
    ] },
  ];

  // Dynamic page title based on route
  const getPageTitle = () => {
    const found = menuItems.find(item => location.pathname.startsWith(item.route));
    return found ? found.text : 'Water Billing System';
  };

  // Role-based menu filtering
  const getMenuAccess = (role) => {
    if (role === 'Admin') return {
      allowed: [
        'Dashboard', 'Customers', 'Billing', 'Payments', 'Credit Management', 'Reports', 'Users', 'Schedule', 'Tools'
      ],
      tools: ['RPT Calculator', 'Old System 2025', 'Old System 2024']
    };
    if (role === 'Collector') return {
      allowed: [
        'Dashboard', 'Payments', 'Credit Management', 'Schedule', 'Tools'
      ],
      tools: ['RPT Calculator', 'Old System 2025', 'Old System 2024']
    };
    if (role === 'Reader') return {
      allowed: ['Dashboard', 'Customers', 'Billing'],
      tools: []
    };
    return { allowed: [], tools: [] };
  };
  const menuAccess = getMenuAccess(user.role);

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #06b6d4 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Branding always at the left of the header */}
          <Box sx={{ ml: isMobile ? 1 : 0, mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', letterSpacing: 1, lineHeight: 1 }}>
              Water Billing System
            </Typography>
            <Typography variant="caption" sx={{ color: '#e0e7ef', fontWeight: 400, fontSize: 13, letterSpacing: 0.5 }}>
              LGU Concepcion, Romblon
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {/* Existing right-side icons and avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleNotifClick}>
              <Badge badgeContent={announcements.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchorEl}
              open={notifOpen}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { minWidth: 320, maxWidth: 400 } }}
            >
              <MenuItem disabled sx={{ fontWeight: 700, fontSize: 16 }}>
                Announcements
              </MenuItem>
              <Divider />
              {announcements.length === 0 ? (
                <MenuItem disabled>No active announcements</MenuItem>
              ) : announcements.map(a => (
                <MenuItem key={a.id} sx={{ whiteSpace: 'normal', alignItems: 'flex-start', flexDirection: 'column', gap: 0.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                      {a.date_posted ? new Date(a.date_posted).toLocaleString() : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: 14 }} noWrap>
                      {a.description.length > 60 ? a.description.slice(0, 60) + '...' : a.description}
                    </Typography>
                    {a.description.length > 60 && (
                      <Button size="small" sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: 'none' }} onClick={() => setExpandedAnnouncement(a)}>
                        Read more
                      </Button>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
            <Dialog open={!!expandedAnnouncement} onClose={() => setExpandedAnnouncement(null)} maxWidth="sm" fullWidth>
              <DialogTitle>{expandedAnnouncement?.title}</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {expandedAnnouncement?.date_posted ? new Date(expandedAnnouncement.date_posted).toLocaleString() : ''} | Posted by: {expandedAnnouncement?.posted_by}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {expandedAnnouncement?.description}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setExpandedAnnouncement(null)} variant="contained">Close</Button>
              </DialogActions>
            </Dialog>
            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleMessagesClick}>
              <Badge badgeContent={messages.length} color="primary">
                <MailOutlineIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={messagesAnchorEl}
              open={messagesOpen}
              onClose={handleMessagesClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { minWidth: 320, maxWidth: 400 } }}
            >
              <MenuItem disabled sx={{ fontWeight: 700, fontSize: 16 }}>
                Messages
              </MenuItem>
              <Divider />
              {messages.length === 0 ? (
                <MenuItem disabled>No messages received</MenuItem>
              ) : (
                messages.slice(0, 5).map((msg) => (
                  <MenuItem key={msg.id || msg.sent_at} sx={{ whiteSpace: 'normal', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{msg.sender_name} ({msg.sender_barangay})</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.message.length > 60 ? msg.message.slice(0, 60) + '…' : msg.message}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>{msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Divider />
              <MenuItem onClick={handleMessagesModalOpen} sx={{ fontWeight: 600, color: 'primary.main', justifyContent: 'center' }}>
                View all messages
              </MenuItem>
            </Menu>
            <Dialog open={messagesModalOpen} onClose={handleMessagesModalClose} maxWidth="sm" fullWidth>
              <DialogTitle>All Messages</DialogTitle>
              <DialogContent dividers>
                {messages.length === 0 ? (
                  <Typography color="text.secondary">No messages received.</Typography>
                ) : (
                  <Box>
                    {messages.map((msg) => (
                      <Box key={msg.id || msg.sent_at} sx={{ mb: 3, p: 2, borderRadius: 2, background: '#f8fafc', boxShadow: '0 1px 4px #38bdf822', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{msg.sender_name} ({msg.sender_barangay})</Typography>
                          <Typography variant="body2" sx={{ mb: 1, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</Typography>
                        </Box>
                        <IconButton onClick={() => setViewMessage(msg)} size="small" sx={{ ml: 1 }} title="View full message">
                          <VisibilityIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleMessagesModalClose}>Close</Button>
              </DialogActions>
            </Dialog>
            {/* Full message dialog */}
            <Dialog open={!!viewMessage} onClose={() => setViewMessage(null)} maxWidth="xs" fullWidth>
              <DialogTitle>Message Details</DialogTitle>
              <DialogContent dividers>
                {viewMessage && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{viewMessage.sender_name} ({viewMessage.sender_barangay})</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{viewMessage.sent_at ? new Date(viewMessage.sent_at).toLocaleString() : ''}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{viewMessage.message}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setViewMessage(null)}>Close</Button>
              </DialogActions>
            </Dialog>
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <HelpIcon />
            </IconButton>
            <Typography variant="body2" sx={{ mr: 1, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600, cursor: 'pointer' }} onClick={handleAvatarClick}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'}
            </Avatar>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <PersonIcon sx={{ mr: 1 }} /> {user.name}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfileOpen}>
                <SettingsIcon sx={{ mr: 1 }} /> Profile & Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: false }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowY: 'auto', // Make sidebar scrollable
          },
          display: { xs: 'block', sm: 'block' },
        }}
      >
        {/* Branding at the top of the sidebar */}
        {!isMobile && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            height: 56, // Reduce height
            px: 2,
            py: 1,
            mb: 1
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, fontSize: 18 }}>
              Water Billing System
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
              LGU Concepcion, Romblon
            </Typography>
          </Box>
        )}
        <Divider />
        <List>
          {menuItems.map((item, index) => {
            const isAllowed = menuAccess.allowed.includes(item.text);
            if (item.children) {
              // Tools submenu
              const allowedTools = item.children.filter(sub => menuAccess.tools.includes(sub.text));
              const showTools = isAllowed && allowedTools.length > 0;
              if (!showTools) return null;
              return (
                <React.Fragment key={item.text}>
                  <ListItem button onClick={() => setToolsOpen(!toolsOpen)}
                    sx={{ borderRadius: 2, mb: 1, mx: 1, minHeight: 48, justifyContent: open ? 'initial' : 'center', px: open ? 2 : 1 }}>
                    <ListItemIcon sx={{ color: '#64748b', minWidth: 40, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                    {open && <ListItemText primary={item.text} />}
                    {open && (toolsOpen ? <ExpandLess /> : <ExpandMore />)}
                  </ListItem>
                  <Collapse in={toolsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {allowedTools.map((sub, subIdx) => (
                        <ListItem button key={sub.text} onClick={() => handleToolsSubmenuClick(sub)} sx={{ pl: open ? 6 : 2, borderRadius: 2, mb: 1, mx: 1, minHeight: 40 }}>
                          <ListItemIcon sx={{ color: '#64748b', minWidth: 40, justifyContent: 'center' }}>{sub.icon}</ListItemIcon>
                          {open && <ListItemText primary={sub.text} />}
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            }
            // Main menu items
            return (
              <ListItem
                button
                key={item.text}
                onClick={isAllowed ? (() => item.route && navigate(item.route)) : undefined}
                selected={location.pathname.startsWith(item.route)}
                disabled={!isAllowed}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  mx: 1,
                  backgroundColor: location.pathname.startsWith(item.route) ? '#e0f2fe' : 'transparent',
                  '&:hover': {
                    backgroundColor: isAllowed ? '#f1f5f9' : 'transparent',
                    cursor: isAllowed ? 'pointer' : 'not-allowed',
                  },
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: open ? 2 : 1,
                  opacity: isAllowed ? 1 : 0.5,
                }}
              >
                <ListItemIcon sx={{ color: location.pathname.startsWith(item.route) ? '#06b6d4' : '#64748b', minWidth: 40, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname.startsWith(item.route) ? 700 : 400,
                      color: location.pathname.startsWith(item.route) ? '#1e3a8a' : '#64748b',
                    }
                  }}
                />}
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          p: { xs: 1, sm: 3 },
          mt: { xs: 7, sm: 0 }, // Add top margin for AppBar on mobile
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      <ProfileDialog open={profileOpen} onClose={handleProfileClose} user={user} />
    </Box>
  );
};

export default Layout; 