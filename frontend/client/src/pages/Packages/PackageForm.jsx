import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/api';

const PackageForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;
  const [values, setValues] = useState({
    name: '',
    duration_months: 1,
    price: 0,
    sessions_per_week: 1,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    if (!editMode) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/packages/${id}`);
        if (res.data)
          setValues({
            name: res.data.name || '',
            duration_months:
              res.data.duration_months !== undefined
                ? Number(res.data.duration_months)
                : 1,
            price: res.data.price !== undefined ? Number(res.data.price) : 0,
            sessions_per_week:
              res.data.sessions_per_week !== undefined
                ? Number(res.data.sessions_per_week)
                : 1,
            description: res.data.description || '',
          });
      } catch (err) {
        console.error(err);
        setSnack({
          open: true,
          severity: 'error',
          message: t('message.error'),
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'duration_months', 'sessions_per_week'];
    setValues((v) => ({
      ...v,
      [name]: numericFields.includes(name)
        ? value === ''
          ? ''
          : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/packages/${id}`, values);
        setSnack({
          open: true,
          severity: 'success',
          message: t('message.updated'),
        });
      } else {
        await api.post('/packages', values);
        setSnack({
          open: true,
          severity: 'success',
          message: t('message.created'),
        });
      }
      setTimeout(() => navigate('/packages'), 600);
    } catch (err) {
      console.error(err);
      const message_err =
        err.response?.data?.message || // backend trả về { message: ... }
        err.message || // fallback
        'An error occurred';
      setSnack({
        open: true,
        severity: 'error',
        message: t(message_err) || 'An error occurred',
      });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {editMode ? t('packages.edit') : t('packages.add')}
      </Typography>
      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('packages.name')}
            name="name"
            value={values.name}
            onChange={handleChange}
            required
          />
          <TextField
            label={t('packages.duration')}
            name="duration_months"
            type="number"
            value={values.duration_months}
            onChange={handleChange}
            inputProps={{ min: 1 }}
            required
          />
          <TextField
            label={t('packages.price')}
            name="price"
            type="number"
            value={values.price}
            onChange={handleChange}
            inputProps={{ min: 0 }}
            required
          />
          <TextField
            label={t('packages.sessions')}
            name="sessions_per_week"
            type="number"
            value={values.sessions_per_week}
            onChange={handleChange}
            inputProps={{ min: 1, max: 7 }}
            required
          />
          <TextField
            label={t('packages.description')}
            name="description"
            value={values.description}
            onChange={handleChange}
            multiline
            rows={3}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/packages')}>
              {t('button.cancel') || 'Cancel'}
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {t('button.save') || 'Save'}
            </Button>
          </Box>
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

export default PackageForm;
