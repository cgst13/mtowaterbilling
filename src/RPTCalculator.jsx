import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import AnimatedBackground from './AnimatedBackground';
import PageHeader from './PageHeader';
import useMediaQuery from '@mui/material/useMediaQuery';

const RPTCalculator = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', p: 0, width: '100%' }}>
      <AnimatedBackground />
      <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, position: 'relative', zIndex: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        <PageHeader title="RPT Calculator" />
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)', width: '100%' }}>
          <Box sx={{ width: '100%', height: { xs: 300, sm: 400, md: 700 }, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
            <iframe
              title="RPT Calculator"
              src="https://script.google.com/macros/s/AKfycbzdhU6lDW5kd9w28hE3inteCV1zdz_VLUOOD_RAWwUlyIyNCTsoMfklGIbOKsf5TX96qg/exec"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RPTCalculator; 