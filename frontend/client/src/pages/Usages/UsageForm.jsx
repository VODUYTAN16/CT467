import { useState, useEffect } from "react";
import { Box, Button, Container, Grid, TextField, Typography, MenuItem, Paper, Snackbar, Alert } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const UsageForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const [members, setMembers] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [formData, setFormData] = useState({
    member_id: "",
    equipment_id: "",
    use_date: null,
    start_time: null,
    end_time: null,
  });

  const fetchMembersAndEquipment = async () => {
    try {
      const [membersRes, equipmentRes] = await Promise.all([
        api.get("/members"),
        api.get("/equipment"),
      ]);
      setMembers(membersRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (error) {
      console.error("Error fetching members or equipment:", error);
      setSnack({ open: true, severity: "error", message: t("usage.error_loading_dependencies") || "Error loading members or equipment" });
    }
  };

  useEffect(() => {
    fetchMembersAndEquipment();
  }, []);

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
      use_date: date,
    }));
  };

  const handleTimeChange = (name, time) => {
    setFormData((prev) => ({
      ...prev,
      [name]: time,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        member_id: formData.member_id,
        equipment_id: formData.equipment_id,
        use_date: formData.use_date ? new Date(formData.use_date).toISOString().slice(0, 10) : null,
        start_time: formData.start_time ? new Date(formData.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null,
        end_time: formData.end_time ? new Date(formData.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null,
      };

      await api.post("/usages", payload);
      setSnack({ open: true, severity: "success", message: t("message.saved") || "Usage record created successfully" });
      setTimeout(() => navigate("/usages"), 800);
    } catch (error) {
      console.error("Error creating usage record:", error);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("usage.add_new") || "Add New Usage"}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label={t("usage.member") || "Member"}
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
              >
                {members.map((member) => (
                  <MenuItem key={member.member_id} value={member.member_id}>
                    {member.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label={t("usage.equipment") || "Equipment"}
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
              >
                {equipment.map((eq) => (
                  <MenuItem key={eq.equipment_id} value={eq.equipment_id}>
                    {eq.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t("usage.use_date") || "Use Date"}
                  value={formData.use_date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label={t("usage.start_time") || "Start Time"}
                  value={formData.start_time}
                  onChange={(time) => handleTimeChange("start_time", time)}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label={t("usage.end_time") || "End Time"}
                  value={formData.end_time}
                  onChange={(time) => handleTimeChange("end_time", time)}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate("/usages")}>
                  {t("button.cancel") || "Cancel"}
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {t("button.save") || "Save"}
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

export default UsageForm;
