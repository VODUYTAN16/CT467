import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Container, Paper } from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import { Link } from 'react-router-dom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { title: t('sidebar.members'), path: '/members', icon: <PeopleAltIcon fontSize="large" /> },
    { title: t('sidebar.equipment'), path: '/equipment', icon: <FitnessCenterIcon fontSize="large" /> },
    { title: t('sidebar.packages'), path: '/packages', icon: <LocalOfferIcon fontSize="large" /> },
    { title: t('sidebar.subscriptions'), path: '/subscriptions', icon: <SubscriptionsIcon fontSize="large" /> },
    { title: t('sidebar.payments'), path: '/payments', icon: <PaymentIcon fontSize="large" /> },
    { title: t('sidebar.reports'), path: '/reports', icon: <AssessmentIcon fontSize="large" /> },
    { title: t('sidebar.usages'), path: '/usage', icon: <TimelineIcon fontSize="large" /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.welcome_message')} />

      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          {t('dashboard.quick_actions')}
        </Typography>
        <Grid container spacing={3}>
          {quickLinks.map((link, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {link.icon}
                  </Box>
                  <Typography variant="h6" component="div" align="center" gutterBottom>
                    {link.title}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    component={Link}
                    to={link.path}
                  >
                    {t('button.go')}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;