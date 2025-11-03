import { useState, useEffect } from "react";
import { Box, Button, Container, Grid, TextField, Typography, MenuItem, Paper, Snackbar, Alert } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

const MemberForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: null,
    gender: "Khác",
    phone: "",
    address: "",
    joined_at: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dob: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // transform date to ISO (backend expects DATE) - send YYYY-MM-DD
      const payload = {
        full_name: formData.full_name,
        dob: formData.dob ? new Date(formData.dob).toISOString().slice(0, 10) : null,
        gender: formData.gender, // expect 'Nam'|'Nữ'|'Khác'
        phone: formData.phone,
        address: formData.address,
      };
      if (isEdit) {
        await api.put(`/members/${id}`, payload);
        setSnack({ open: true, severity: "success", message: t("message.saved") || "Updated successfully" });
      } else {
        await api.post("/members", payload);
        setSnack({ open: true, severity: "success", message: t("message.saved") || "Saved successfully" });
      }
      // navigate after short delay so user sees toast
      setTimeout(() => navigate("/members"), 800);
    } catch (error) {
      console.error("Error creating member:", error);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    const loadMember = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/members/${id}`);
        const m = res.data;
        if (m) {
          setFormData({
            full_name: m.full_name || "",
            dob: m.dob ? new Date(m.dob) : null,
            gender: m.gender || "Khác",
            phone: m.phone || "",
            address: m.address || "",
            joined_at: m.joined_at || null,
          });
        }
      } catch (err) {
        console.error("Error loading member:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMember();
  }, [id]);

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!window.confirm(t("message.confirm_delete_member") || "Are you sure you want to delete this member?")) return;
    setLoading(true);
    try {
      await api.delete(`/members/${id}`);
      setSnack({ open: true, severity: "success", message: t("message.deleted") || "Deleted successfully" });
      setTimeout(() => navigate("/members"), 700);
    } catch (err) {
      console.error("Error deleting member:", err);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEdit ? t("form.edit_member") : t("form.add_member")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField required fullWidth label={t("form.name") || "Full name"} name="full_name" value={formData.full_name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth label={t("form.phone") || "Phone"} name="phone" value={formData.phone} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker inputFormat="yyyy-MM-dd" label={t("form.date_of_birth") || "Date of Birth"} value={formData.dob} onChange={handleDateChange} renderInput={(params) => <TextField {...params} fullWidth />} />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label={t("form.gender") || "Gender"} name="gender" value={formData.gender} onChange={handleChange}>
                <MenuItem value="Nam">{t("gender.male") || "Nam"}</MenuItem>
                <MenuItem value="Nữ">{t("gender.female") || "Nữ"}</MenuItem>
                <MenuItem value="Khác">{t("gender.other") || "Khác"}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t("form.address") || "Address"} name="address" multiline rows={3} value={formData.address} onChange={handleChange} />
            </Grid>
            {isEdit && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={t("form.joined_at") || "Joined at"} value={formData.joined_at ? new Date(formData.joined_at).toLocaleDateString() : ""} disabled />
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate("/members")}>
                  {t("button.cancel")}
                </Button>
                {/* Delete removed from edit form per UI requirement */}
                <Button type="submit" variant="contained" disabled={loading}>
                  {t("button.save")}
                </Button>
              </Box>
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

export default MemberForm;
