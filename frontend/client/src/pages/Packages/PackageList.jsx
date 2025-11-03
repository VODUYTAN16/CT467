import { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import formatCurrencyVND from "../../utils/formatCurrency";

const PackageList = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const [pageSize, setPageSize] = useState(10);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/packages", { params: { q: query } });
      const mapped = (res.data || []).map((p) => ({
        id: p.package_id ?? p.id,
        ...p,
      }));
      setRows(mapped);
    } catch (err) {
      console.error("Error loading packages", err);
      const status = err?.response?.status;
      if (status === 401) {
        try {
          localStorage.removeItem("token");
        } catch (e) {}
        setSnack({ open: true, severity: "warning", message: t("message.login_required") || "Please login to view this page" });
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setSnack({ open: true, severity: "error", message: t("message.error") });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [query]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("message.confirm_delete_member") || "Are you sure?")) return;
    try {
      await api.delete(`/packages/${id}`);
      setSnack({ open: true, severity: "success", message: t("message.deleted") });
      fetch();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: t("message.error") });
    }
  };

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    { field: "name", headerName: t("packages.name") || "Name", flex: 1, minWidth: 180 },
    { field: "duration_months", headerName: t("packages.duration") || "Duration (months)", width: 160 },
    {
      field: "price",
      headerName: t("packages.price") || "Price",
      width: 140,
      type: "number",
      renderCell: (params) => formatCurrencyVND(params.value || 0),
    },
    { field: "sessions_per_week", headerName: t("packages.sessions") || "Sessions / week", width: 160 },
    {
      field: "actions",
      headerName: t("table.actions") || "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={t("button.edit")}>
            <IconButton size="small" onClick={() => navigate(`/packages/edit/${params.row.id}`)} sx={{ color: theme.palette.primary.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("button.delete")}>
            <IconButton size="small" onClick={() => handleDelete(params.row.id)} sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">{t("packages.title") || "Packages"}</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder={t("form.search")}
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/packages/new")}>
            {t("packages.add") || "Add"}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          pageSize={pageSize}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          pageSizeOptions={[5, 10, 25, 100]}
          disableRowSelectionOnClick
          sx={{ border: "none", "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
        />
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PackageList;
