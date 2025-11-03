import { useState, useEffect } from "react";
import { Box, Button, Container, Grid, TextField, Typography, MenuItem, Paper, Snackbar, Alert } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const PaymentForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  
    const [formData, setFormData] = useState({
      amount: "",
      note: "",
    });
    const [memberPhone, setMemberPhone] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberSubscriptions, setMemberSubscriptions] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    const fetchMemberAndSubscriptions = async () => {
      if (!memberPhone) {
        setSelectedMember(null);
        setMemberSubscriptions([]);
        setSelectedSubscription(null);
        setFormData((prev) => ({ ...prev, subscription_id: "", amount: "" }));
        return;
      }

      try {
        const memberRes = await api.get(`/members/by-phone/${memberPhone}`);
        console.log("Member response:", memberRes.data);
        setSelectedMember(memberRes.data);

        const subscriptionsRes = await api.get(`/subscriptions/by-member/${memberRes.data.member_id}`);
        console.log("Subscriptions response:", subscriptionsRes.data);
        setMemberSubscriptions(subscriptionsRes.data);
      } catch (error) {
        console.error("Error fetching member or subscriptions:", error);
        setSelectedMember(null);
        setMemberSubscriptions([]);
        setSelectedSubscription(null);
        setFormData((prev) => ({ ...prev, subscription_id: "", amount: "" }));
      }
    };

    const handler = setTimeout(() => {
      fetchMemberAndSubscriptions();
    }, 500); // Debounce for 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [memberPhone]);

  useEffect(() => {
    if (selectedSubscription) {
      setFormData((prev) => ({
        ...prev,
        subscription_id: selectedSubscription.subscription_id,
        amount: selectedSubscription.package_price,
      }));
    } else {
      setFormData((prev) => ({ ...prev, subscription_id: "", amount: "" }));
    }
  }, [selectedSubscription]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "memberPhone") {
      setMemberPhone(value);
    } else if (name === "subscription_id") {
      const sub = memberSubscriptions.find((s) => s.subscription_id === value);
      setSelectedSubscription(sub);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedSubscription) {
        setSnack({ open: true, severity: "error", message: t("message.select_subscription") || "Please select a subscription." });
        setLoading(false);
        return;
      }

      const payload = {
        subscription_id: formData.subscription_id,
        amount: parseFloat(formData.amount),
        note: formData.note,
      };
      await api.post("/payments", payload);
      setSnack({ open: true, severity: "success", message: t("message.payment_recorded") || "Payment recorded successfully." });
      setTimeout(() => navigate("/payments"), 800);
    } catch (error) {
      console.error("Error creating payment:", error);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };





  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("form.add_payment")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label={t("form.member_phone") || "Member Phone"}
                name="memberPhone"
                value={memberPhone}
                onChange={handleChange}
                error={!selectedMember && memberPhone.length > 0}
                helperText={!selectedMember && memberPhone.length > 0 && t("message.member_not_found")}
              />
            </Grid>
            {selectedMember && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("form.member_name")}: {selectedMember.full_name}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                label={t("form.subscription") || "Subscription"}
                name="subscription_id"
                value={formData.subscription_id}
                onChange={handleChange}
                disabled={!selectedMember || memberSubscriptions.length === 0}
                helperText={!selectedMember && t("message.enter_phone_to_select_subscription")}
              >
                {memberSubscriptions.map((sub) => (
                  <MenuItem key={sub.subscription_id} value={sub.subscription_id}>
                    {sub.subscription_id} - {sub.package_name} (Price: {sub.package_price})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label={t("form.amount") || "Amount"}
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t("form.note") || "Note"} name="note" multiline rows={3} value={formData.note} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate("/payments")}>
                  {t("button.cancel")}
                </Button>
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

export default PaymentForm;
