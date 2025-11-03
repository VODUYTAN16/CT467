import { useEffect, useState } from "react";
import { Box, Button, Container, Grid, TextField, Typography, MenuItem, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api/api";

const EquipmentForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const [form, setForm] = useState({ name: "", type: "", status: "Hoạt động" });

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/equipment/${id}`);
        setForm({ name: res.data.name || "", type: res.data.type || "", status: res.data.status || "Hoạt động" });
      } catch (err) {
        console.error("Load equipment error", err);
        setSnack({ open: true, severity: "error", message: t("message.error") || "Error loading" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/equipment/${id}`, form);
        setSnack({ open: true, severity: "success", message: t("message.saved") || "Updated" });
      } else {
        await api.post("/equipment", form);
        setSnack({ open: true, severity: "success", message: t("message.saved") || "Saved" });
      }
      setTimeout(() => navigate("/equipment"), 700);
    } catch (err) {
      console.error("Save equipment error", err);
      setSnack({ open: true, severity: "error", message: t("message.error") || "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {isEdit ? t("equipment.edit_equipment") : t("equipment.add_equipment")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label={t("form.name")} name="name" value={form.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={t("equipment.type")} name="type" value={form.type} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label={t("equipment.status")} name="status" value={form.status} onChange={handleChange} fullWidth>
                <MenuItem value="Hoạt động">{t("status.operational") || "Operational"}</MenuItem>
                <MenuItem value="Bảo trì">{t("status.maintenance") || "Maintenance"}</MenuItem>
                <MenuItem value="Hỏng">{t("status.broken") || "Broken"}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate("/equipment")}>
                {t("button.cancel")}
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {t("button.save")}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EquipmentForm;
