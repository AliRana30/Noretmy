import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { 
  Article as ArticleIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

const FaqStatsCards = ({ stats }) => {
  const StatsCard = ({ title, value, icon: Icon, color = 'primary' }) => (
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      transition: 'all 0.3s ease-in-out',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)',
        '& .icon-bg': {
          transform: 'scale(1.1) rotate(10deg)',
        }
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
        zIndex: 1
      }
    }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
              {value}
            </Typography>
          </Box>
          <Box 
            className="icon-bg"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            <Icon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (!stats) return null;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard 
          title="Total FAQs" 
          value={stats.total} 
          icon={ArticleIcon}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard 
          title="Active FAQs" 
          value={stats.active} 
          color="success" 
          icon={ToggleOnIcon}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard 
          title="Inactive FAQs" 
          value={stats.inactive} 
          color="warning" 
          icon={ToggleOffIcon}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard 
          title="Categories" 
          value={stats.categoryStats?.length || 0} 
          color="info" 
          icon={CategoryIcon}
        />
      </Grid>
    </Grid>
  );
};

export default FaqStatsCards;
