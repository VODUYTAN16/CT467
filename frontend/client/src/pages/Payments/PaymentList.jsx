import { useState, useEffect } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Payment as PaymentIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const PaymentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fetchPayments = async () => {
    try {
      const response = await api.get("/payments");
      console.log("API Response for payments:", response.data);
      // backend returns payment_id, map to id for DataGrid
      const mapped = (response.data || []).map((p) => ({ id: p.payment_id, ...p }));
      setPayments(mapped);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);



  // filter using backend fields (member_name, member_phone, package_name, amount, paid_at, note)
  const filteredPayments = payments.filter((payment) => [payment.member_name, payment.member_phone, payment.package_name, payment.amount, payment.paid_at, payment.note].join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    {
      field: "member_name",
      headerName: t("form.member_name") || "Member Name",
      flex: 2,
      minWidth: 180,
    },
    {
      field: "member_phone",
      headerName: t("form.member_phone") || "Member Phone",
      width: 140,
    },
    {
      field: "package_name",
      headerName: t("form.package_name") || "Package Name",
      flex: 1,
      minWidth: 150,
    },
    { field: "amount", headerName: t("form.amount") || "Amount", width: 120 },
    {
      field: "paid_at",
      headerName: t("form.paid_at") || "Paid At",
      width: 160,
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
    { field: "note", headerName: t("form.note") || "Note", flex: 1, minWidth: 150 },
    
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
            <PaymentIcon />
          </Box>
          <Typography variant="h5" component="h1" fontWeight="500">
            {t("sidebar.payments")}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate("/payments/new")} sx={{ px: 3, py: 1 }}>
          {t("form.add_payment")}
        </Button>
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
          rows={filteredPayments}
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

export default PaymentList;
