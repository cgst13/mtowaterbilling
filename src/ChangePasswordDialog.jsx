import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { supabase } from './supabaseClient';

const ChangePasswordDialog = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Get user email from localStorage
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setError('Could not get user email. Please log out and log in again.');
        setLoading(false);
        return;
      }
      // Query users table for this user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (userError || !user) {
        setError('Could not find user. Please log out and log in again.');
        setLoading(false);
        return;
      }
      // Check current password
      if (user.password !== currentPassword) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }
      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('email', email);
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1200);
      }
    } catch (e) {
      setError('Unexpected error. Please try again.');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          label="Current Password"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <TextField
          label="Confirm New Password"
          type="password"
          fullWidth
          margin="normal"
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={22} /> : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog; 