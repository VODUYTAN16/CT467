import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Paper,
  Box,
  Container,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import formatCurrencyVND from '../../utils/formatCurrency';
import PageHeader from '../../components/common/PageHeader';
import { AttachMoney, CalendarToday, FitnessCenter } from '@mui/icons-material';
import api from '../../api/api';

const SubscriptionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);

  const initialFormData = {
    package_id: '',
    start_date: new Date(),
  };

  const [formData, setFormData] = useState(initialFormData);

  const [memberPhone, setMemberPhone] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const packagesRes = await api.get('/packages');
        setPackages(packagesRes.data);

        if (isEditMode) {
          const subRes = await api.get(`/subscriptions/${id}`);
          const packageIdFromSub = Number(subRes.data.package_id);
          setFormData({
            ...subRes.data,
            package_id: packageIdFromSub,
            start_date: subRes.data.start_date
              ? new Date(subRes.data.start_date)
              : null,
          });
          if (packageIdFromSub) {
            const packageDetailsRes = await api.get(
              `/packages/${packageIdFromSub}`
            );
            setSelectedPackageDetails(packageDetailsRes.data);
          }
          // If in edit mode, also fetch member details by member_id and set memberPhone
          if (subRes.data.member_id) {
            const memberRes = await api.get(
              `/members/${subRes.data.member_id}`
            );
            setSelectedMember(memberRes.data);
            setMemberPhone(memberRes.data.phone);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnack({
          open: true,
          severity: 'error',
          message: t('message.error') || 'An error occurred',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode, t]);

  useEffect(() => {
    const fetchPackageDetails = async () => {
      if (formData.package_id) {
        try {
          const res = await api.get(`/packages/${formData.package_id}`);
          setSelectedPackageDetails(res.data);
        } catch (error) {
          console.error('Error fetching package details:', error);
          setSelectedPackageDetails(null);
        }
      } else {
        setSelectedPackageDetails(null);
      }
    };
    fetchPackageDetails();
  }, [formData.package_id]);

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberPhone) {
        setSelectedMember(null);
        setFormData((prev) => ({ ...prev, member_id: '' }));
        return;
      }

      try {
        const memberRes = await api.get(`/members/by-phone/${memberPhone}`);
        setSelectedMember(memberRes.data);
        setFormData((prev) => ({
          ...prev,
          member_id: memberRes.data.member_id,
        }));
      } catch (error) {
        console.error('Error fetching member:', error);
        setSelectedMember(null);
        setFormData((prev) => ({ ...prev, member_id: '' }));
      }
    };

    const handler = setTimeout(() => {
      fetchMember();
    }, 500); // Debounce for 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [memberPhone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'memberPhone') {
      setMemberPhone(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'package_id' ? Number(value) : value,
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, start_date: date }));
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setSelectedPackageDetails(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString().slice(0, 10)
          : null,
      };

      if (isEditMode) {
        await api.put(`/subscriptions/${id}`, payload);
        console.log('Updating subscription:', payload);
        setSnack({
          open: true,
          severity: 'success',
          message: t('message.saved') || 'Updated successfully',
        });
      } else {
        await api.post('/subscriptions', payload);
        console.log('Creating subscription:', payload);
        setSnack({
          open: true,
          severity: 'success',
          message: t('message.saved') || 'Saved successfully',
        });
      }
      navigate('/subscriptions', { state: { refresh: true } });
    } catch (error) {
      console.error('Error saving subscription:', error);
      const message_err =
        error.response?.data?.message || // backend trả về { message: ... }
        error.message || // fallback
        'An error occurred';
      setSnack({
        open: true,
        severity: 'error',
        message: t(message_err) || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={
          isEditMode
            ? t('subscriptions.edit_title')
            : t('subscriptions.add_title')
        }
      />
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
            <Grid xs={12} md={6}>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <TextField
                    required
                    fullWidth
                    label={t('form.member_phone') || 'Member Phone'}
                    name="memberPhone"
                    value={memberPhone}
                    onChange={handleChange}
                    error={!selectedMember && memberPhone.length > 0}
                    helperText={
                      !selectedMember &&
                      memberPhone.length > 0 &&
                      t('message.member_not_found')
                    }
                  />
                </Grid>
                {selectedMember && (
                  <Grid xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('form.member_name')}: {selectedMember.full_name}
                    </Typography>
                  </Grid>
                )}
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t('subscriptions.package')}
                    name="package_id"
                    select
                    value={formData.package_id}
                    onChange={handleChange}
                    required
                    disabled={!selectedMember}
                  >
                    {packages.map((pkg) => (
                      <MenuItem key={pkg.package_id} value={pkg.package_id}>
                        {pkg.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label={t('subscriptions.start_date')}
                      value={formData.start_date}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: { fullWidth: true, required: true },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Grid>

            {/* Package Details */}
            <Grid xs={12} md={6}>
              {selectedPackageDetails && (
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: 3,
                    height: '100%',
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {t('packages.details')}
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoney />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('packages.price')}
                        secondary={formatCurrencyVND(
                          selectedPackageDetails.price
                        )}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                        secondaryTypographyProps={{
                          fontSize: '1.1rem',
                          color: 'text.primary',
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('packages.duration')}
                        secondary={
                          selectedPackageDetails.duration_months !== null &&
                          selectedPackageDetails.duration_months !== undefined
                            ? `${selectedPackageDetails.duration_months} ${t(
                                'packages.months'
                              )}`
                            : t('common.no_data')
                        }
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                        secondaryTypographyProps={{
                          fontSize: '1.1rem',
                          color: 'text.primary',
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <FitnessCenter />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('packages.sessions')}
                        secondary={
                          selectedPackageDetails.sessions_per_week !== null &&
                          selectedPackageDetails.sessions_per_week !== undefined
                            ? String(selectedPackageDetails.sessions_per_week)
                            : t('common.no_data')
                        }
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                        secondaryTypographyProps={{
                          fontSize: '1.1rem',
                          color: 'text.primary',
                        }}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </Grid>

            {/* Action Buttons */}
            <Grid xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/subscriptions')}
                >
                  {t('button.cancel')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClear}
                >
                  {t('button.clear')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {t('button.save')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
export default SubscriptionForm;
