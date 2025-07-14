import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Avatar, CircularProgress, Container
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, AccountBalanceWallet as WalletIcon, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from './supabaseClient';
import PageHeader from './PageHeader';
import { useGlobalSnackbar } from './GlobalSnackbar';
import AnimatedBackground from './AnimatedBackground';
import useMediaQuery from '@mui/material/useMediaQuery';

const CreditManagement = () => {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const showSnackbar = useGlobalSnackbar();
  const [editMode, setEditMode] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (search.trim() === '') {
      setLoading(true);
      const fetchWithCredit = async () => {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .gt('credit_balance', 0);
        setCustomers(error ? [] : data || []);
        setLoading(false);
      };
      fetchWithCredit();
      return;
    }
    setLoading(true);
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${search}%`);
      setCustomers(error ? [] : data || []);
      setLoading(false);
    };
    const delayDebounce = setTimeout(fetchCustomers, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleAddCreditClick = (customer) => {
    setSelectedCustomer(customer);
    setCreditAmount('');
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEditCreditClick = (customer) => {
    setSelectedCustomer(customer);
    setCreditAmount(customer.credit_balance ? String(customer.credit_balance) : '');
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setCreditAmount('');
    setEditMode(false);
  };

  const handleAddCredit = async () => {
    if (!creditAmount || isNaN(Number(creditAmount))) {
      showSnackbar('Enter a valid amount', 'error');
      return;
    }
    let newCredit;
    if (editMode) {
      newCredit = Number(creditAmount);
    } else {
      newCredit = Number(selectedCustomer.credit_balance || 0) + Number(creditAmount);
    }
    const { error } = await supabase
      .from('customers')
      .update({ credit_balance: newCredit })
      .eq('customerid', selectedCustomer.customerid);
    if (!error) {
      showSnackbar(editMode ? 'Credit updated successfully' : 'Credit added successfully', 'success');
      setCustomers(customers.map(c => c.customerid === selectedCustomer.customerid ? { ...c, credit_balance: newCredit } : c));
      handleDialogClose();
    } else {
      showSnackbar(editMode ? 'Failed to update credit' : 'Failed to add credit', 'error');
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', p: 0, width: '100%' }}>
      <AnimatedBackground />
      <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, position: 'relative', zIndex: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        <PageHeader title="Credit Management" subtitle="Manually add credits to customer accounts" />
        <Box sx={{ maxWidth: 400, mb: 3, width: '100%' }}>
          <TextField
            label="Search customer name"
            variant="outlined"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            sx={{ width: '100%' }}
          />
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)', width: '100%', overflowX: 'auto', minWidth: 0 }}>
          <Table sx={{ minWidth: 650, width: '100%', fontSize: { xs: 13, sm: 15 } }}>
            <TableHead>
              <TableRow sx={{ background: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 13, sm: 15 }, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 13, sm: 15 }, maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Barangay</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 13, sm: 15 }, maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 13, sm: 15 }, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Current Credit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: 13, sm: 15 }, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center"><CircularProgress size={32} sx={{ my: 3 }} /></TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                      <WalletIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        No customers found
                      </Typography>
                      <Typography variant="body2">Try searching for a customer name.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, i) => (
                  <TableRow key={c.customerid} hover sx={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#e0f2fe', transition: 'background 0.2s', '&:hover': { backgroundColor: '#bae6fd' } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 14 }}>
                          {c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </Avatar>
                        {c.name}
                      </Stack>
                    </TableCell>
                    <TableCell>{c.barangay}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.credit_balance ? `₱${Number(c.credit_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}</TableCell>
                    <TableCell align="right">
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleAddCreditClick(c)} sx={{ mr: 1 }}>
                        Add Credit
                      </Button>
                      {Number(c.credit_balance) > 0 && (
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditCreditClick(c)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xs" fullWidth fullScreen={isMobile}>
          <DialogTitle sx={{ fontSize: { xs: 18, sm: 22 } }}>{editMode ? 'Edit Credit' : `Add Credit to ${selectedCustomer?.name}`}</DialogTitle>
          <DialogContent>
            <TextField
              label="Credit Amount"
              type="number"
              value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              inputProps={{ min: 0 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} sx={{ minHeight: 44, fontSize: { xs: 13, sm: 15 } }}>Cancel</Button>
            <Button onClick={handleAddCredit} variant="contained" sx={{ minHeight: 44, fontSize: { xs: 13, sm: 15 } }}>{editMode ? 'Update Credit' : 'Add Credit'}</Button>
          </DialogActions>
        </Dialog>
        {/* Remove local Snackbar/Alert, global snackbar will handle alerts */}
      </Container>
    </Box>
  );
};

export default CreditManagement; 