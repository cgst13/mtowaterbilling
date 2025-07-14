import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress,
  TablePagination, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert, Card, CardContent, Stack, Avatar, Tooltip, Grid, Skeleton, Container
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon, Search as SearchIcon, FilterList as FilterListIcon, SentimentDissatisfied as EmptyIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from './PageHeader';
import { useGlobalSnackbar } from './GlobalSnackbar';
import AnimatedBackground from './AnimatedBackground';
import useMediaQuery from '@mui/material/useMediaQuery';

// Remove static barangayList
// const barangayList = [
//   'San Jose', 'San Juan', 'San Pedro', 'San Pablo', 'San Isidro', 'San Antonio', 'San Nicolas', 'San Rafael', 'San Roque', 'San Vicente', 'Other'
// ];

const initialForm = { name: '', type: '', barangay: '', discount: '', remarks: '' };

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

// Add this helper function above the Customers component
async function generateUniqueCustomerId(supabase) {
  let id, exists;
  do {
    id = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const { data } = await supabase.from('customers').select('customerid').eq('customerid', id);
    exists = data && data.length > 0;
  } while (exists);
  return id;
}

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterType, setFilterType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const showSnackbar = useGlobalSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [sortOption, setSortOption] = useState('name_asc'); // Added sort option
  const [totalCount, setTotalCount] = useState(0);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Add this useEffect for fetching customers with correct dependencies
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('date_added', { ascending: false })
        .range(from, to);
      if (search) query = query.ilike('name', `%${search}%`);
      if (filterBarangay) query = query.eq('barangay', filterBarangay);
      if (filterType) query = query.eq('type', filterType);
      const { data, error, count } = await query;
      if (!error) {
        setCustomers(data || []);
        setTotalCount(count || 0);
      } else setError('Failed to fetch customers');
      setLoading(false);
    };
    fetchCustomers();
  }, [page, rowsPerPage, search, filterBarangay, filterType]);

  const fetchDiscountOptions = async () => {
    const { data, error } = await supabase
      .from('discount')
      .select('*');
    if (!error) {
      console.log('Discount options fetched:', data); // Debug log
      setDiscountOptions(data || []);
    } else {
      console.error('Error fetching discount options:', error);
    }
  };

  const fetchTypeOptions = async () => {
    const { data, error } = await supabase
      .from('customer_type')
      .select('*');
    if (!error) setTypeOptions(data || []);
  };

  const fetchBarangayOptions = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('*');
    if (!error) setBarangayOptions(data || []);
  };

  useEffect(() => {
    fetchDiscountOptions();
    fetchTypeOptions();
    fetchBarangayOptions();
  }, []);

  const handleSearch = (c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterBarangay || c.barangay === filterBarangay) &&
    (!filterType || c.type === filterType);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDialogOpen = (customer = null) => {
    if (customer) {
      setForm({ ...customer });
      setEditId(customer.customerid);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpenDialog(true);
  };
  const handleDialogClose = () => setOpenDialog(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEdit = async () => {
    if (!form.name) return showSnackbar('Name is required', 'error');
    if (editId) {
      // Edit
      const { error } = await supabase
        .from('customers')
        .update({ ...form })
        .eq('customerid', editId);
      if (!error) showSnackbar(`Customer "${form.name}" updated successfully.`, 'success');
      else {
        console.error('Update failed:', error);
        showSnackbar(`Update failed: ${error?.message || 'Unknown error'}`, 'error');
      }
    } else {
      // Add
      const customerid = await generateUniqueCustomerId(supabase);
      const { error } = await supabase
        .from('customers')
        .insert([{ ...form, customerid }]);
      if (!error) showSnackbar(`Customer "${form.name}" added successfully.`, 'success');
      else showSnackbar(`Add failed: ${error?.message || 'Unknown error'}`, 'error');
    }
    setOpenDialog(false);
    // fetchCustomers(); // This is now handled by the useEffect
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customerid', id);
    if (!error) showSnackbar('Customer deleted successfully.', 'success');
    else showSnackbar(`Delete failed: ${error?.message || 'Unknown error'}`, 'error');
    // fetchCustomers(); // This is now handled by the useEffect
  };

  const handleDeleteClick = (customerid) => {
    setCustomerToDelete(customerid);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      await handleDelete(customerToDelete);
      setCustomerToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  const handleDeleteCancel = () => {
    setCustomerToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', p: 0, width: '100%' }}>
      <AnimatedBackground />
      <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, position: 'relative', zIndex: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        {/* Modern Header with Filters Inline */}
        <Card elevation={3} sx={{ mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)', p: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white'
              }}>
                <GroupIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 24 }, color: '#1e293b', mb: 0.5 }}>
                  Customers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Total: {totalCount}
                </Typography>
              </Box>
            </Stack>
            {/* Inline Filters and Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap" sx={{ flexShrink: 0 }}>
              <TextField
                label="Search by name"
                variant="outlined"
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#6b7280' }} />, sx: { borderRadius: 2 } }}
                sx={{ width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1d4ed8', borderWidth: 2, }, }, }}
              />
              <FormControl sx={{ minWidth: { xs: '100%', sm: 140 } }} size="small">
                <InputLabel sx={{ fontWeight: 600 }}>Barangay</InputLabel>
                <Select
                  value={filterBarangay}
                  label="Barangay"
                  onChange={e => setFilterBarangay(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {barangayOptions.map(b => <MenuItem key={b.barangay} value={b.barangay}>{b.barangay}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: { xs: '100%', sm: 140 } }} size="small">
                <InputLabel sx={{ fontWeight: 600 }}>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={e => setFilterType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {typeOptions.map(t => <MenuItem key={t.type} value={t.type}>{t.type}</MenuItem>)}
                </Select>
              </FormControl>
              {/* Action Buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, sm: 0 } }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportToCSV(customers, 'customers.csv')}
                  sx={{
                    minWidth: 44,
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: '#3b82f6',
                    color: '#1e40af',
                    background: 'white',
                    '&:hover': {
                      borderColor: '#1d4ed8',
                      background: 'rgba(59, 130, 246, 0.04)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleDialogOpen()}
                  sx={{
                    minWidth: 44,
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Add Customer
                </Button>
              </Stack>
            </Stack>
                      </Stack>
          {/* Table Section */}
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto', minWidth: 0, width: '100%' }}>
            <Table sx={{ minWidth: 800, width: '100%', fontSize: { xs: 13, sm: 15 } }} stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>ID</TableCell>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Barangay</TableCell>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Discount</TableCell>
                  <TableCell sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Remarks</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  {loading ? (
                  Array.from({ length: rowsPerPage }).map((_, i) => (
                      <TableRow key={i}>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width={100} /></TableCell>
                      </TableRow>
                    ))
                  ) : customers.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 6, color: 'text.secondary' }}>
                        <GroupIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            No customers found
                          </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting your search criteria or filters
                        </Typography>
                        </Box>
                    </TableCell>
                    </TableRow>
                  ) : (
                  customers.map((customer, index) => (
                      <TableRow
                      key={customer.customerid} 
                        hover
                        sx={{
                        transition: 'all 0.2s', 
                          '&:hover': {
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                        },
                        '&:nth-of-type(even)': {
                          background: '#fafbfc'
                        }
                        }}
                      >
                      <TableCell sx={{ fontWeight: 600, color: '#1e40af' }}>{customer.customerid}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ 
                            width: 36, 
                            height: 36, 
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            fontSize: 14,
                            fontWeight: 600
                          }}>
                            {customer.name ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, color: '#1f2937' }}>{customer.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 20, height: 20, bgcolor: 'transparent', color: '#1e40af', fontSize: 12, fontWeight: 700 }}>{customer.type?.[0]}</Avatar>
                          <Typography sx={{ fontWeight: 500, color: '#1e40af' }}>{customer.type}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: '#374151' }}>{customer.barangay}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: '#0e7490' }}>{customer.discount}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 400, color: '#64748b' }}>{customer.remarks}</Typography>
                      </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleDialogOpen(customer)} sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', '&:hover': { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }, transition: 'all 0.2s' }}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDeleteClick(customer.customerid)} sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }, transition: 'all 0.2s' }}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontWeight: 600, color: '#374151' } }}
          />
          </TableContainer>
      </Card>
      </Container>
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            minHeight: isMobile ? '100vh' : 'auto'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: { xs: 20, sm: 24 },
            pb: 1,
            color: 'white',
            letterSpacing: 0.5,
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <GroupIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          {editId ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <DialogContent
          sx={{
            p: { xs: 3, sm: 4 },
            background: 'transparent',
            minWidth: { xs: 0, sm: 400 },
            minHeight: 200,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f5f9',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '4px',
              '&:hover': {
                background: '#94a3b8',
              },
            },
          }}
        >
          <Card elevation={2} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af' }}>
                <GroupIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Customer Details
              </Typography>
            </Stack>
            <Stack spacing={3}>
              <TextField
                label="Customer Name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                fullWidth
                required
                placeholder="Enter full name..."
                InputLabelProps={{ sx: { fontWeight: 600, color: '#374151' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1d4ed8',
                      borderWidth: 2,
                    },
                  },
                }}
                helperText="Required. The customer's full name."
              />
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600, color: '#374151' }}>Type</InputLabel>
                <Select
                  name="type"
                  value={form.type}
                  label="Type"
                  onChange={handleFormChange}
                  sx={{ borderRadius: 2 }}
                >
              {typeOptions.map(t => <MenuItem key={t.type} value={t.type}>{t.type}</MenuItem>)}
            </Select>
          </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600, color: '#374151' }}>Barangay</InputLabel>
                <Select
                  name="barangay"
                  value={form.barangay}
                  label="Barangay"
                  onChange={handleFormChange}
                  sx={{ borderRadius: 2 }}
                >
              {barangayOptions.map(b => <MenuItem key={b.barangay} value={b.barangay}>{b.barangay}</MenuItem>)}
            </Select>
          </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600, color: '#374151' }}>Discount</InputLabel>
            <Select
              name="discount"
              value={form.discount}
              label="Discount"
              onChange={handleFormChange}
                    sx={{ borderRadius: 2 }}
            >
                    <MenuItem value="">None</MenuItem>
                    {discountOptions.map((d, index) => (
                      <MenuItem key={index} value={d.discountpercentage || d.discount || d.type || d.id}>
                        {d.type ? `${d.type} (${d.discountpercentage || d.discount || 0}%)` : 
                         d.discountpercentage ? `${d.discountpercentage}%` :
                         d.discount || 'Discount Option'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
              <TextField
                label="Remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleFormChange}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder="Additional notes or remarks..."
                InputLabelProps={{ sx: { fontWeight: 600, color: '#374151' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1d4ed8',
                      borderWidth: 2,
                    },
                  },
                }}
                helperText="Optional. Any additional information."
              />
            </Stack>
          </Card>
        </DialogContent>
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderTop: '1px solid #e5e7eb',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button 
            onClick={handleDialogClose} 
            variant="outlined" 
            sx={{ 
              minWidth: 120, 
              fontWeight: 600, 
              borderRadius: 2,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                background: '#f9fafb'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddOrEdit} 
            variant="contained" 
            sx={{ 
              minWidth: 120, 
              fontWeight: 600, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              },
              transition: 'all 0.2s'
            }}
          >
            {editId ? 'Save Changes' : 'Add Customer'}
          </Button>
        </Box>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} fullScreen={isMobile}>
        <DialogTitle sx={{ fontSize: { xs: 18, sm: 22 } }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: { xs: 13, sm: 15 } }}>Are you sure you want to delete this customer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ minHeight: 44, fontSize: { xs: 13, sm: 15 } }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" sx={{ minHeight: 44, fontSize: { xs: 13, sm: 15 } }}>Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Remove local Snackbar/Alert, global snackbar will handle alerts */}
    </Box>
  );
};

export default Customers; 