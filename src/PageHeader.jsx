import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

const PageHeader = ({ title, subtitle, actions }) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: '100%',
      mb: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      px: { xs: 1, md: 2 },
      py: { xs: 2, md: 3 },
      borderRadius: 4,
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(12px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
      borderLeft: '6px solid #38bdf8',
      borderRight: '1px solid #e0f2fe',
      borderTop: '1px solid #e0f2fe',
      borderBottom: '1px solid #e0f2fe',
      animation: 'fadeInHeader 0.7s cubic-bezier(.4,0,.2,1)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 80,
    }}
  >
    <Stack spacing={0.5} sx={{ zIndex: 1 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.5px',
          background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: { xs: 26, md: 32 },
          lineHeight: 1.2,
          animation: 'gradientMove 2.5s linear infinite',
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="subtitle1"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            fontSize: { xs: 15, md: 18 },
            letterSpacing: '-0.2px',
            opacity: 0.92,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
    {actions && <Box sx={{ mt: { xs: 2, sm: 0 }, zIndex: 1, flexShrink: 1, minWidth: 0, maxWidth: '100%' }}>{actions}</Box>}
    <style>{`
      @keyframes fadeInHeader {
        from { opacity: 0; transform: translateY(-24px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
    `}</style>
  </Box>
);

export default PageHeader; 