import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Checkbox, Stack, Avatar, TablePagination, CircularProgress, Grid, Tabs, Tab, Skeleton, Container, useMediaQuery, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SentimentDissatisfied as EmptyIcon, Receipt as ReceiptIcon, Payment as PaymentIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from './PageHeader';
import { useGlobalSnackbar } from './GlobalSnackbar';
import AnimatedBackground from './AnimatedBackground';

function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const replacer = (key, value) => value === null ? '' : value;
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','),
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [paying, setPaying] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [paidBills, setPaidBills] = useState([]);
  const [paidPage, setPaidPage] = useState(0);
  const [paidRowsPerPage, setPaidRowsPerPage] = useState(15);
  const [user, setUser] = useState({ name: '', role: '' });

  // Add state for payment amount and credit
  const [paymentAmount, setPaymentAmount] = useState('');
  const [creditApplied, setCreditApplied] = useState(0);
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const showSnackbar = useGlobalSnackbar();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Fetch customers matching search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${searchTerm}%`);
      setSearchResults(error ? [] : data || []);
      setLoading(false);
    };
    const delayDebounce = setTimeout(fetchCustomers, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Fetch bills for selected customer
  useEffect(() => {
    if (!selectedCustomer) {
      setBills([]);
      setSelectedBills([]);
      return;
    }
    const fetchBills = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('customerid', selectedCustomer.customerid)
        .order('billedmonth', { ascending: false });
      setBills(error ? [] : data || []);
      setSelectedBills([]);
      setLoading(false);
    };
    fetchBills();
  }, [selectedCustomer]);

  // Fetch paid bills when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      (async () => {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('customerid', selectedCustomer.customerid)
          .eq('paymentstatus', 'Paid')
          .order('dateencoded', { ascending: false });
        if (!error) setPaidBills(data || []);
      })();
    } else {
      setPaidBills([]);
    }
  }, [selectedCustomer]);

  // When customer is selected, refetch their info to get latest credit_balance
  useEffect(() => {
    if (!selectedCustomer) return;
    const fetchCustomer = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customerid', selectedCustomer.customerid)
        .single();
      if (!error && data) {
        setSelectedCustomer(data);
      }
    };
    fetchCustomer();
  }, [selectedCustomer?.customerid]);

  // Fetch current user's full name on mount
  useEffect(() => {
    // Fetch current user's full name
    const fetchUserData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          console.error('No user email found in localStorage.');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, role')
          .eq('email', email)
          .single();
        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({
            name: `${data.firstname} ${data.lastname}`,
            role: data.role,
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, []);

  // Helper: Calculate total due for selected bills
  const getTotalDue = () => {
    const selected = bills.filter(b => selectedBills.includes(b.billid));
    return selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0);
  };

  // Helper: Calculate how much credit will be applied
  useEffect(() => {
    if (!selectedCustomer || !selectedBills.length) {
      setCreditApplied(0);
      return;
    }
    const totalDue = getTotalDue();
    const credit = Number(selectedCustomer.credit_balance) || 0;
    setCreditApplied(Math.min(totalDue, credit));
  }, [selectedCustomer, selectedBills]);

  // Helper: Calculate total billed for selected bills (now includes surcharge)
  const getTotalBilled = () => {
    if (!selectedCustomer || !selectedBills.length) return 0;
    const discountRate = Number(selectedCustomer.discount) || 0;
    if (selectedBills.length === 1) {
      const bill = bills.find(b => b.billid === selectedBills[0]);
      if (!bill) return 0;
      const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
      const discountAmount = ((Number(bill.basicamount) || 0) * discountRate) / 100;
      const totalBeforeCredit = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - discountAmount;
      const credit = Number(selectedCustomer.credit_balance) || 0;
      return Math.max(totalBeforeCredit - credit, 0);
    } else {
      const selected = bills.filter(b => selectedBills.includes(b.billid));
      const totalSurcharge = selected.reduce((sum, b) => sum + (Number(calculateSurcharge(b.billedmonth, b.basicamount)) || 0), 0);
      const totalDiscount = selected.reduce((sum, b) => sum + (((Number(b.basicamount) || 0) * discountRate) / 100), 0);
      const totalAmountBeforeCredit = selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0) + totalSurcharge - totalDiscount;
      const credit = Number(selectedCustomer.credit_balance) || 0;
      return Math.max(totalAmountBeforeCredit - credit, 0);
    }
  };

  // Set paymentAmount to total billed by default, and update if total billed changes
  React.useEffect(() => {
    const totalBilled = getTotalBilled();
    // Only update if paymentAmount is empty or matches previous total billed
    if (
      paymentAmount === '' ||
      Number(paymentAmount) === prevTotalBilledRef.current
    ) {
      setPaymentAmount(totalBilled ? totalBilled.toString() : '');
      }
    prevTotalBilledRef.current = totalBilled;
    // eslint-disable-next-line
  }, [selectedBills, bills, selectedCustomer]);

  // Track previous total billed for comparison
  const prevTotalBilledRef = React.useRef(0);

  // Unpaid bills for table
  const unpaidBills = bills.filter(b => b.paymentstatus !== 'Paid');
  const paginatedBills = unpaidBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Checkbox logic
  const isAllSelected = paginatedBills.length > 0 && paginatedBills.every(b => selectedBills.includes(b.billid));
  const isIndeterminate = selectedBills.length > 0 && !isAllSelected;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBills(paginatedBills.map(b => b.billid));
    } else {
      setSelectedBills([]);
    }
  };

  const handleSelectBill = (billid) => {
    setSelectedBills(prev =>
      prev.includes(billid) ? prev.filter(id => id !== billid) : [...prev, billid]
    );
  };

  // Update handleMarkAsPaid to handle overpayment/credit
  const handleMarkAsPaid = async () => {
    setPaying(true);
    const now = paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString();
    let totalBilled = 0;
    let overpayment = 0;
    let selected = bills.filter(b => selectedBills.includes(b.billid));
    selected = selected.sort((a, b) => new Date(a.billedmonth) - new Date(b.billedmonth));
    const discountRate = Number(selectedCustomer.discount) || 0;
    if (selected.length === 1) {
      const bill = selected[0];
      const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
      const discountAmount = ((Number(bill.basicamount) || 0) * discountRate) / 100;
      const totalBeforeCredit = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - discountAmount;
      const credit = Number(selectedCustomer.credit_balance) || 0;
      totalBilled = Math.max(totalBeforeCredit - credit, 0);
    } else {
      const totalSurcharge = selected.reduce((sum, b) => sum + (Number(calculateSurcharge(b.billedmonth, b.basicamount)) || 0), 0);
      const totalDiscount = selected.reduce((sum, b) => sum + (((Number(b.basicamount) || 0) * discountRate) / 100), 0);
      const totalAmountBeforeCredit = selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0) + totalSurcharge - totalDiscount;
      const credit = Number(selectedCustomer.credit_balance) || 0;
      totalBilled = Math.max(totalAmountBeforeCredit - credit, 0);
    }
    const payment = Number(paymentAmount);
    overpayment = payment - totalBilled;
    for (let i = 0; i < selected.length; i++) {
      const bill = selected[i];
      const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
      const billDiscount = Number((((Number(bill.basicamount) || 0) * discountRate) / 100).toFixed(2));
      const billTotal = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - billDiscount;
      let advancePayment = null;
      if (i === selected.length - 1 && overpayment > 0) {
        advancePayment = overpayment;
      } else {
        advancePayment = null;
      }
      const updatePayload = {
        ...bill,
        paymentstatus: 'Paid',
        datepaid: now,
        paidby: user.name,
        basicamount: bill.basicamount,
        surchargeamount: surcharge,
        discountamount: billDiscount,
        totalbillamount: billTotal,
        advancepaymentamount: advancePayment,
      };
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) updatePayload[key] = null;
      });
      await supabase
        .from('bills')
        .update(updatePayload)
        .eq('billid', bill.billid);
    }

    // 2. Update customer credit_balance
    console.log('Updating credit_balance to:', overpayment, typeof overpayment);
    const { error: creditError } = await supabase
      .from('customers')
      .update({ credit_balance: overpayment })
      .eq('customerid', selectedCustomer.customerid);
    if (creditError) {
      console.error('Failed to update credit_balance:', creditError);
    }
    // Refresh bills and customer info
    // 1. Refresh unpaid bills
    const { data: billsData } = await supabase
      .from('bills')
      .select('*')
      .eq('customerid', selectedCustomer.customerid)
      .order('billedmonth', { ascending: false });
    setBills(billsData || []);
    setSelectedBills([]);
    setPaymentAmount('');
    setCreditApplied(0);
    // 2. Refetch customer info
    const { data: cust } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', selectedCustomer.customerid)
      .single();
    if (cust) setSelectedCustomer(cust);
    setPaying(false);
  };

  // Helper to format amounts
  const formatAmount = (value) => value !== null && value !== undefined && value !== '' ? `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

  // Surcharge calculation function (same as Billing.jsx)
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

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', p: 0 }}>
      <AnimatedBackground />
      <Container maxWidth={false} disableGutters sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        px: { xs: 0, sm: 2 },
        py: { xs: 0, sm: 2 },
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'auto',
        overflowY: 'visible',
      }}>
        <PageHeader
          title="Payments"
          actions={
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportToCSV(paginatedBills, 'unpaid_bills.csv')}
              size="large"
              sx={{ minHeight: 44, fontSize: { xs: 13, sm: 15 } }}
            >
              Export CSV
            </Button>
          }
        />
        {/* 1. Enhance the search bar and results */}
        <Box sx={{ width: { xs: '100%', md: 400 }, mb: 1, mt: 0, mx: 0 }}>
          <Paper elevation={2} sx={{ p: 1.2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 1 }}>
            <SearchIcon sx={{ color: 'primary.main', mr: 1 }} />
            <TextField
              label="Search customer name"
              variant="standard"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              placeholder="Type to search..."
              InputProps={{ disableUnderline: true }}
              sx={{ background: 'transparent' }}
            />
          </Paper>
          {searchTerm && searchResults.length === 0 && !loading && (
            <Box sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
              <EmptyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography>No customers found.</Typography>
            </Box>
          )}
        </Box>
        <Grid container spacing={1} alignItems="stretch" sx={{ flex: 1, minHeight: 0, height: { xs: 'auto', md: 'calc(100vh - 80px)' }, width: '100%', m: 0 }}>
        {/* Left column: Customer Info, Summary */}
          <Grid item xs={12} md={4} sx={{
            display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: 'calc(100vh - 120px)' }, minHeight: 0, pr: { md: 1 },
          }}>
          {(!selectedCustomer && !loading && searchResults.length === 0) ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }} />
          ) : (
            <>
              {selectedCustomer && (
                // 2. Customer Info Panel redesign
                <Paper sx={{ mb: 2, p: 3, background: 'linear-gradient(135deg, #e0f7fa 0%, #e0e7ff 100%)', borderRadius: 4, boxShadow: 3, position: 'relative' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 28, boxShadow: 2 }}>
                      {selectedCustomer.name ? selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>{selectedCustomer.name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">ID: {selectedCustomer.customerid}</Typography>
                        <Chip label={selectedCustomer.type} size="small" color="info" sx={{ fontWeight: 600 }} />
                        <Chip label={selectedCustomer.barangay} size="small" color="secondary" sx={{ fontWeight: 600 }} />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Chip icon={<DownloadIcon sx={{ color: 'success.main' }} />} label={`Credit: ${formatAmount(selectedCustomer.credit_balance || 0)}`} size="small" color="success" />
                        {selectedCustomer.discount > 0 && (
                          <Chip label={`Discount: ${Number(selectedCustomer.discount).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} size="small" color="warning" />
                        )}
                      </Stack>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" color="secondary" onClick={() => setSelectedCustomer(null)} sx={{ fontWeight: 600, borderRadius: 2 }}>
                      Change Customer
                    </Button>
                  </Stack>
                </Paper>
              )}
              {!selectedCustomer && !loading && searchResults.length > 0 && (
                  <Paper sx={{ mb: 2, p: 2, borderRadius: 3, flex: '0 0 auto' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Select a customer:</Typography>
                  <Stack spacing={1}>
                    {searchResults.map(c => (
                      <Box
                        key={c.customerid}
                        sx={{ cursor: 'pointer', p: 1.5, borderRadius: 2, '&:hover': { background: '#e0e7ef' }, display: 'flex', alignItems: 'center', gap: 2 }}
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 16 }}>
                          {c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.barangay} | {c.type}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}
              {loading && <CircularProgress sx={{ my: 4 }} />}
              {/* Summary only visible when a customer is selected */}
              {selectedCustomer && (
                // 3. Bill Summary & Payment Form redesign
                <Paper elevation={2} sx={{ mt: 2, background: '#f8fafc', borderRadius: 4, p: 3, boxShadow: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>Bill Summary</Typography>
                  {selectedBills.length === 0 ? (
                    <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                      <Typography variant="body2">Select a bill to see its summary.</Typography>
                    </Box>
                  ) : selectedBills.length === 1 ? (() => {
                    const bill = bills.find(b => b.billid === selectedBills[0]);
                    if (!bill) return null;
                    const discountRate = Number(selectedCustomer.discount) || 0;
                    const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
                    const discountAmount = ((Number(bill.basicamount) || 0) * discountRate) / 100;
                    const totalBeforeCredit = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - discountAmount;
                    const credit = Number(selectedCustomer.credit_balance) || 0;
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Basic Amount:</Typography>
                          <Typography variant="body2">{formatAmount(bill.basicamount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Surcharge:</Typography>
                          <Typography variant="body2">{formatAmount(surcharge)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Discount ({discountRate}%):</Typography>
                          <Typography variant="body2">-{formatAmount(discountAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Credit Applied:</Typography>
                          <Typography variant="body2">-{formatAmount(credit)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Amount:</Typography>
                          <Typography variant="body2">{formatAmount(totalBeforeCredit - credit)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Billed:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAmount(totalBeforeCredit - credit)}</Typography>
                        </Box>
                      </>
                    );
                  })() : (() => {
                    const selected = bills.filter(b => selectedBills.includes(b.billid));
                    const discountRate = Number(selectedCustomer.discount) || 0;
                    const totalBasic = selected.reduce((sum, b) => sum + (Number(b.basicamount) || 0), 0);
                    const totalSurcharge = selected.reduce((sum, b) => sum + (Number(calculateSurcharge(b.billedmonth, b.basicamount)) || 0), 0);
                    const totalDiscount = selected.reduce((sum, b) => sum + (((Number(b.basicamount) || 0) * discountRate) / 100), 0);
                    const totalAmountBeforeCredit = selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0) + totalSurcharge - totalDiscount;
                    const credit = Number(selectedCustomer.credit_balance) || 0;
                    return (
                      <>
                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>{selectedBills.length} bills selected</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Basic Amount:</Typography>
                          <Typography variant="body2">{formatAmount(totalBasic)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Surcharge:</Typography>
                          <Typography variant="body2">{formatAmount(totalSurcharge)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Discount ({discountRate}%):</Typography>
                          <Typography variant="body2">-{formatAmount(totalDiscount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Credit Applied:</Typography>
                          <Typography variant="body2">-{formatAmount(credit)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Amount:</Typography>
                          <Typography variant="body2">{formatAmount(totalAmountBeforeCredit - credit)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Billed:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAmount(totalAmountBeforeCredit - credit)}</Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Paper>
              )}
              {selectedCustomer && selectedBills.length > 0 && (
                // 3. Bill Summary & Payment Form redesign
                <Paper elevation={2} sx={{ mt: 2, p: 2, background: '#f8fafc', borderRadius: 3, flex: '0 0 auto' }}>
                  <TextField
                    label="Payment Amount"
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    size="small"
                    sx={{ width: 180, mb: 2 }}
                    inputProps={{ min: 0 }}
                  />
                    <TextField
                      label="Payment Date"
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      size="small"
                      sx={{ width: 180, mb: 2, ml: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  {paymentAmount && Number(paymentAmount) > 0 && Number(paymentAmount) > Number((() => {
                    if (selectedBills.length === 1) {
                      const bill = bills.find(b => b.billid === selectedBills[0]);
                      if (bill) {
                        const discountRate = Number(selectedCustomer.discount) || 0;
                        const discountAmount = ((Number(bill.basicamount) || 0) * discountRate) / 100;
                        const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
                        const totalBeforeCredit = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - discountAmount;
                        const credit = Number(selectedCustomer.credit_balance) || 0;
                        return Math.max(totalBeforeCredit - credit, 0);
                      }
                    } else {
                      const selected = bills.filter(b => selectedBills.includes(b.billid));
                      const discountRate = Number(selectedCustomer.discount) || 0;
                      const totalDiscount = selected.reduce((sum, b) => sum + (((Number(b.basicamount) || 0) * discountRate) / 100), 0);
                      const totalSurcharge = selected.reduce((sum, b) => sum + (Number(calculateSurcharge(b.billedmonth, b.basicamount)) || 0), 0);
                      const totalAmountBeforeCredit = selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0) + totalSurcharge - totalDiscount;
                      const credit = Number(selectedCustomer.credit_balance) || 0;
                      return Math.max(totalAmountBeforeCredit - credit, 0);
                    }
                    return 0;
                  })()) && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Overpayment will be credited: {formatAmount(Number(paymentAmount) - Number((() => {
                        if (selectedBills.length === 1) {
                          const bill = bills.find(b => b.billid === selectedBills[0]);
                          if (bill) {
                            const discountRate = Number(selectedCustomer.discount) || 0;
                            const discountAmount = ((Number(bill.basicamount) || 0) * discountRate) / 100;
                            const surcharge = calculateSurcharge(bill.billedmonth, bill.basicamount);
                            const totalBeforeCredit = (Number(bill.totalbillamount) || Number(bill.basicamount) || 0) + surcharge - discountAmount;
                            const credit = Number(selectedCustomer.credit_balance) || 0;
                            return Math.max(totalBeforeCredit - credit, 0);
                          }
                        } else {
                          const selected = bills.filter(b => selectedBills.includes(b.billid));
                          const discountRate = Number(selectedCustomer.discount) || 0;
                          const totalDiscount = selected.reduce((sum, b) => sum + (((Number(b.basicamount) || 0) * discountRate) / 100), 0);
                          const totalSurcharge = selected.reduce((sum, b) => sum + (Number(calculateSurcharge(b.billedmonth, b.basicamount)) || 0), 0);
                          const totalAmountBeforeCredit = selected.reduce((sum, b) => sum + (Number(b.totalbillamount) || Number(b.basicamount) || 0), 0) + totalSurcharge - totalDiscount;
                          const credit = Number(selectedCustomer.credit_balance) || 0;
                          return Math.max(totalAmountBeforeCredit - credit, 0);
                        }
                        return 0;
                      })()))}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedBills.length === 0 || paying}
                    onClick={handleMarkAsPaid}
                    sx={{ minWidth: 180, fontWeight: 700, borderRadius: 2 }}
                  >
                    {paying ? <CircularProgress size={22} sx={{ color: 'white', mr: 1 }} /> : null}
                    {paying ? 'Processing...' : 'Mark as Paid'}
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Grid>
        {/* Right column: Tabs, Tables */}
          <Grid item xs={12} md={8} sx={{
            display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: 'calc(100vh - 120px)' }, minHeight: 0, pl: { md: 1 },
          }}>
          {selectedCustomer && (
            <>
              {/* 4. Tabs & Tables redesign */}
              <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 2 }}>
                <Tab icon={<ReceiptIcon sx={{ mr: 1 }} />} label="Unpaid Bills" />
                <Tab icon={<PaymentIcon sx={{ mr: 1 }} />} label="Payment History" />
              </Tabs>
              {tabIndex === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 120 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Unpaid Bills</Typography>
                    {/* Unpaid Bills Table */}
                    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 2, mb: 2, overflowX: 'auto', height: 'auto', minHeight: 80 }}>
                      <Table sx={{ minWidth: 700, fontSize: { xs: 12, sm: 14 } }} stickyHeader>
                        <TableHead>
                          <TableRow sx={{ background: 'linear-gradient(90deg, #e0e7ff 0%, #f1f5f9 100%)' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={isIndeterminate}
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                inputProps={{ 'aria-label': 'select all bills' }}
                              />
                            </TableCell>
                            <TableCell>Bill ID</TableCell>
                            <TableCell>Billed Month</TableCell>
                            <TableCell>Previous Reading</TableCell>
                            <TableCell>Current Reading</TableCell>
                            <TableCell>Consumption</TableCell>
                            <TableCell>Amount Due</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                {Array.from({ length: 7 }).map((__, j) => (
                                  <TableCell key={j}><Skeleton variant="text" width={80} /></TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : paginatedBills.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                                  <EmptyIcon sx={{ fontSize: 48, mb: 1 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    No unpaid bills found
                                  </Typography>
                                  <Typography variant="body2">Try adjusting your search or filters.</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedBills.map((b, i) => (
                              <TableRow
                                key={b.billid}
                                hover
                                sx={{
                                  backgroundColor: i % 2 === 0 ? '#f8fafc' : '#e0f2fe',
                                  transition: 'background 0.2s',
                                  '&:hover': {
                                    backgroundColor: '#bae6fd',
                                  },
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedBills.includes(b.billid)}
                                    onChange={() => handleSelectBill(b.billid)}
                                  />
                                </TableCell>
                                <TableCell>{b.billid}</TableCell>
                                <TableCell>{b.billedmonth ? b.billedmonth.slice(0, 7) : ''}</TableCell>
                                <TableCell>{b.previousreading}</TableCell>
                                <TableCell>{b.currentreading}</TableCell>
                                <TableCell>{b.consumption}</TableCell>
                                <TableCell>₱{Number(b.totalbillamount || b.basicamount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        component="div"
                        count={unpaidBills.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setPage(0);
                        }}
                        rowsPerPageOptions={[15, 25, 50]}
                      />
                    </TableContainer>
                  </Box>
              )}
              {tabIndex === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 120 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Payment History</Typography>
                    {/* 5. Payment History Table redesign (similar to above, with PaymentIcon and improved empty state) */}
                    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 2, mb: 2, overflowX: 'auto', height: 'auto', minHeight: 80 }}>
                      <Table sx={{ fontSize: { xs: 12, sm: 14 } }}>
                        <TableHead>
                          <TableRow sx={{ background: 'linear-gradient(90deg, #e0e7ff 0%, #f1f5f9 100%)' }}>
                            <TableCell>Bill ID</TableCell>
                            <TableCell>Billed Month</TableCell>
                            <TableCell>Previous Reading</TableCell>
                            <TableCell>Current Reading</TableCell>
                            <TableCell>Consumption</TableCell>
                            <TableCell>Amount Paid</TableCell>
                            <TableCell>Date Paid</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paidBills.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center">
                                <Box sx={{ py: 4, color: 'text.secondary' }}>
                                  <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
                                  <Typography>No payment history found.</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paidBills.slice(paidPage * paidRowsPerPage, paidPage * paidRowsPerPage + paidRowsPerPage).map((bill) => (
                              <TableRow key={bill.billid} hover sx={{ '&:hover': { backgroundColor: '#e0f2fe' } }}>
                                <TableCell>{bill.billid}</TableCell>
                                <TableCell>{bill.billedmonth ? bill.billedmonth.slice(0, 7) : ''}</TableCell>
                                <TableCell>{bill.previousreading}</TableCell>
                                <TableCell>{bill.currentreading}</TableCell>
                                <TableCell>{bill.consumption}</TableCell>
                                <TableCell>₱{Number(bill.totalbillamount || bill.basicamount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell>{bill.datepaid ? new Date(bill.datepaid).toLocaleDateString() : ''}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        component="div"
                        count={paidBills.length}
                        page={paidPage}
                        onPageChange={(e, newPage) => setPaidPage(newPage)}
                        rowsPerPage={paidRowsPerPage}
                        onRowsPerPageChange={e => {
                          setPaidRowsPerPage(parseInt(e.target.value, 10));
                          setPaidPage(0);
                        }}
                        rowsPerPageOptions={[15, 25, 50]}
                      />
                    </TableContainer>
                  </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default Payments; 