import { useState, useEffect } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Subscriptions as SubscriptionsIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import PageHeader from "../../components/common/PageHeader";
import formatCurrencyVND from "../../utils/formatCurrency";

const SubscriptionList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
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
      console.log("Mapped subscriptions:", mapped);
      setSubscriptions(mapped);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
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
    const memberName = sub.member ? sub.member.full_name : "";
    const packageName = sub.package ? sub.package.name : "";
    const startDate = sub.start_date ? new Date(sub.start_date).toLocaleDateString() : "";
    const endDate = getEndDate(sub.start_date, sub.package ? sub.package.duration : 0)?.toLocaleDateString() || "";

    return [memberName, packageName, startDate, endDate].join(" ").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    {
      field: "member_full_name",
      headerName: t("subscriptions.member") || "Member",
      flex: 1.5,
      minWidth: 150,
    },
    {
      field: "package_name",
      headerName: t("subscriptions.package") || "Package",
      flex: 1.5,
      minWidth: 150,
    },
    {
      field: "package_price",
      headerName: t("packages.price") || "Price",
      width: 120,
      renderCell: (params) => formatCurrencyVND(params.value),
    },
    {
      field: "start_date",
      headerName: t("subscriptions.start_date") || "Start Date",
      width: 150,
      renderCell: (params) => {
        const v = params.value;
        if (!v) return "";
        try {
          const d = v instanceof Date ? v : new Date(v);
          return d && !isNaN(d) ? d.toLocaleDateString() : String(v);
        } catch {
          return String(v);
        }
      },
    },
    {
      field: "end_date",
      headerName: t("subscriptions.end_date") || "End Date",
      width: 150,
      renderCell: (params) => {
        const v = params.value;
        if (!v) return "";
        try {
          const d = v instanceof Date ? v : new Date(v);
          return d && !isNaN(d) ? d.toLocaleDateString() : String(v);
        } catch {
          return String(v);
        }
      },
    },
    {
      field: "status",
      headerName: t("subscriptions.status") || "Status",
      width: 140,
      renderCell: (params) => {
        if (!params.row || !params.row.package_duration) return "N/A";
        const endDate = getEndDate(params.row.start_date, params.row.package_duration);
        const isActive = endDate && new Date() < endDate;
        return isActive ? t("subscription.active") : t("subscription.expired");
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
          {t("subscriptions.add_new")}        </Button>
      </Box>

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
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              borderColor: alpha(theme.palette.divider, 0.3),
            },
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 1,
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
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
