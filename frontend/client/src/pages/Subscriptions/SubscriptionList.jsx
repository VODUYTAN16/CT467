import { useState, useEffect } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert, Chip } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Subscriptions as SubscriptionsIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api, { getMembersExpiringSoon } from "../../api/api";
import PageHeader from "../../components/common/PageHeader";
import formatCurrencyVND from "../../utils/formatCurrency";

const SubscriptionList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get("/subscriptions");
      const mapped = (response.data || []).map((sub) => ({ id: sub.subscription_id, ...sub }));
      console.log("First mapped subscription:", mapped[0]);
      setSubscriptions(mapped);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringMembers = async () => {
    try {
      const response = await getMembersExpiringSoon(7); // Fetch members expiring in 7 days
      setExpiringMembers(response.data);
    } catch (error) {
      console.error("Error fetching expiring members:", error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchExpiringMembers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(t("message.confirm_delete_subscription") || "Are you sure you want to delete this subscription?")) {
      try {
        await api.delete(`/subscriptions/${id}`);
        setSnack({ open: true, severity: "success", message: t("message.deleted") || "Deleted successfully" });
        fetchSubscriptions();
      } catch (error) {
        console.error("Error deleting subscription:", error);
        setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
      }
    }
  };

  const getEndDate = (startDate, durationMonths) => {
    if (!startDate || !durationMonths) return null;
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!sub) return false;
    const memberName = sub.member?.full_name || "";
    const packageName = sub.package?.name || "";
    const startDate = sub.start_date ? new Date(sub.start_date).toLocaleDateString() : "";
    const endDate = getEndDate(sub.start_date, sub.package?.duration || 0)?.toLocaleDateString() || "";

    return [memberName, packageName, startDate, endDate].join(" ").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    {
      field: "member_full_name",
      headerName: t("subscriptions.member") || "Member",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => params.row.member?.full_name || "N/A",
    },
    {
      field: "package_name",
      headerName: t("subscriptions.package") || "Package",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => params.row.package?.name || "N/A",
    },
    {
      field: "start_date",
      headerName: t("subscriptions.start_date") || "Start Date",
      width: 150,
      renderCell: (params) => {
        const v = params.value;
        if (!v) return "";
        const d = new Date(v);
        return !isNaN(d) ? d.toLocaleDateString() : "";
      },
    },
    {
      field: "end_date",
      headerName: t("subscriptions.end_date") || "End Date",
      width: 150,
      renderCell: (params) => {
        const v = params.value;
        if (!v) return "";
        const d = new Date(v);
        return !isNaN(d) ? d.toLocaleDateString() : "";
      },
    },
    {
      field: "status",
      headerName: t("subscriptions.status") || "Status",
      width: 140,
      renderCell: (params) => {
        const endDate = params.row.end_date ? new Date(params.row.end_date) : null;
        const isActive = endDate && new Date() < endDate;
        const statusText = isActive ? t("subscription.active") : t("subscription.expired");
        return <Chip label={statusText} size="small" color={isActive ? "success" : "default"} variant="outlined" />;
      },
    },
    {
      field: "paid",
      headerName: t("subscriptions.payment_status") || "Payment",
      width: 140,
      renderCell: (params) => {
        const isPaid = params.value;
        const label = isPaid ? t("subscription.paid") : t("subscription.unpaid");
        return <Chip label={label} size="small" color={isPaid ? "success" : "warning"} variant="filled" />;
      },
    },
    {
      field: "actions",
      headerName: t("table.actions") || "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={t("button.edit") || "Edit"}>
            <IconButton onClick={() => navigate(`/subscriptions/edit/${params.row.id}`)} size="small" sx={{ color: theme.palette.primary.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("button.delete") || "Delete"}>
            <IconButton onClick={() => handleDelete(params.row.id)} size="small" sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
            }}
          >
            <SubscriptionsIcon />
          </Box>
          <Typography variant="h5" component="h1" fontWeight="500">
            {t("sidebar.subscriptions")}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate("/subscriptions/new")} sx={{ px: 3, py: 1 }}>
          {t("subscriptions.add_new")}
        </Button>
      </Box>

      {/* Expiring Members Section */}
      {expiringMembers.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="h6" component="h2" fontWeight="500" mb={2}>
            {t("subscriptions.expiring_subscriptions") || "Members Expiring in 7 Days"}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {expiringMembers.map((member) => (
              <Chip
                key={member.member_id}
                label={`${member.full_name} - ${member.phone} - ${member.package_name} (Expires: ${new Date(member.end_date).toLocaleDateString()})`}
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Main Content */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: "background.paper",
          overflow: "hidden",
        }}
      >
        {/* Search Section */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t("form.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: alpha(theme.palette.common.black, 0.02),
              "&:hover": {
                bgcolor: alpha(theme.palette.common.black, 0.03),
              },
              "& fieldset": {
                borderColor: alpha(theme.palette.divider, 0.3),
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* DataGrid Section */}
        <DataGrid
          rows={filteredSubscriptions}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          autoHeight
          getRowClassName={(params) => (!params.row.paid ? `unpaid-row` : "")}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              borderColor: alpha(theme.palette.divider, 0.3),
            },
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 1,
            },
            "& .unpaid-row": {
              bgcolor: alpha(theme.palette.warning.light, 0.15),
              "&:hover": {
                bgcolor: alpha(theme.palette.warning.light, 0.25),
              },
            },
            "& .MuiDataGrid-row:nth-of-type(even):not(.unpaid-row)": {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            },
            [`& .${gridClasses.row}:hover`]: {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            },
            "& .MuiDataGrid-virtualScroller": {
              bgcolor: "transparent",
            },
          }}
        />
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default SubscriptionList;
