import { useState, useEffect } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, AccessTime as AccessTimeIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const UsageList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fetchUsages = async () => {
    try {
      const response = await api.get("/usages");
      const mapped = (response.data || []).map((u) => ({ id: u.usage_id, ...u }));
      setUsages(mapped);
    } catch (error) {
      console.error("Error fetching usages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(t("message.confirm_delete_usage") || "Are you sure you want to delete this usage record?")) {
      try {
        await api.delete(`/usages/${id}`);
        setSnack({ open: true, severity: "success", message: t("message.deleted") || "Deleted successfully" });
        fetchUsages();
      } catch (error) {
        console.error("Error deleting usage:", error);
        setSnack({ open: true, severity: "error", message: t("message.error") || "An error occurred" });
      }
    }
  };

  const filteredUsages = usages.filter((usage) =>
    [usage.member_name, usage.equipment_name, usage.use_date].join(" ").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    { field: "member_name", headerName: t("usage.member_name") || "Member Name", flex: 1.5, minWidth: 150 },
    { field: "equipment_name", headerName: t("usage.equipment_name") || "Equipment Name", flex: 1.5, minWidth: 150 },
    {
      field: "use_date",
      headerName: t("usage.use_date") || "Use Date",
      width: 140,
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
    { field: "start_time", headerName: t("usage.start_time") || "Start Time", width: 120 },
    { field: "end_time", headerName: t("usage.end_time") || "End Time", width: 120 },
    {
      field: "actions",
      headerName: t("table.actions") || "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Edit is not directly supported for usages, as per backend comment "nếu cần chỉnh sửa thì xoá rồi tạo lại" */}
          {/* <Tooltip title={t("button.edit") || "Edit"}>
            <IconButton onClick={() => navigate(`/usages/edit/${params.row.id}`)} size="small" sx={{ color: theme.palette.primary.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip> */}
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
            <AccessTimeIcon />
          </Box>
          <Typography variant="h5" component="h1" fontWeight="500">
            {t("sidebar.usages")}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate("/usages/new")} sx={{ px: 3, py: 1 }}>
          {t("usage.add_new") || "Add New Usage"}
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
          placeholder={t("form.search") || "Search..."}
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
          rows={filteredUsages}
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

export default UsageList;
