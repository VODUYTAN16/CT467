import { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const EquimentList = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/equipment");
      const mapped = (res.data || []).map((e) => ({ id: e.equipment_id, ...e }));
      setRows(mapped);
    } catch (err) {
      console.error("Error loading equipment", err);
      setSnack({ open: true, severity: "error", message: t("equipment.error_loading") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t("message.confirm_delete_equipment"))) return;
    try {
      await api.delete(`/equipment/${id}`);
      setSnack({ open: true, severity: "success", message: t("message.deleted") });
      fetch();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
    }
  };

  const filtered = rows.filter((r) => [r.name, r.type, r.status].join(" ").toLowerCase().includes(query.toLowerCase()));

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    { field: "name", headerName: t("form.name") || "Name", flex: 1, minWidth: 180 },
    { field: "type", headerName: t("equipment.type") || "Type", width: 160 },
    { field: "status", headerName: t("equipment.status") || "Status", width: 140 },
    {
      field: "actions",
      headerName: t("table.actions") || "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={t("button.edit") || "Edit"}>
            <IconButton size="small" onClick={() => navigate(`/equipment/edit/${params.row.id}`)} sx={{ color: theme.palette.primary.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("button.delete") || "Delete"}>
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
        <Typography variant="h5">{t("equipment.title") || t("sidebar.equipment")}</Typography>
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/equipment/new")}>
            {t("equipment.add_equipment")}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[5, 10, 25]} disableRowSelectionOnClick sx={{ border: "none", "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(theme.palette.primary.main, 0.02) } }} />
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EquimentList;
