import { useState, useEffect } from "react";
import { Box, Button, Container, Paper, Typography, IconButton, Tooltip, TextField, InputAdornment, useTheme, alpha, Snackbar, Alert } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Person as PersonIcon } from "@mui/icons-material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const MemberList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fetchMembers = async () => {
    try {
      const response = await api.get("/members");
      // backend returns member_id, map to id for DataGrid
      const mapped = (response.data || []).map((m) => ({ id: m.member_id, ...m }));
      setMembers(mapped);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter((member) => [member.full_name, member.phone, member.gender, member.joined_at].join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

  const columns = [
    { field: "id", headerName: t("form.id") || "ID", width: 90 },
    { field: "full_name", headerName: t("form.name") || "Full name", flex: 2, minWidth: 180 },
    {
      field: "dob",
      headerName: t("form.date_of_birth") || "Date of birth",
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
    {
      field: "gender",
      headerName: t("form.gender") || "Gender",
      width: 110,
      renderCell: (params) => {
        const v = params.value;
        if (!v) return "";
        // backend stores Vietnamese values like 'Nam', 'Nữ', 'Khác'
        if (v === "Nam") return t("gender.male") || "Nam";
        if (v === "Nữ") return t("gender.female") || "Nữ";
        if (v === "Khác") return t("gender.other") || "Khác";
        return v;
      },
    },
    { field: "phone", headerName: t("form.phone") || "Phone", width: 140 },
    {
      field: "joined_at",
      headerName: t("form.joined_at") || "Joined at",
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
    {
      field: "actions",
      headerName: t("table.actions") || "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={t("button.edit") || "Edit"}>
            <IconButton onClick={() => navigate(`/members/edit/${params.row.id}`)} size="small" sx={{ color: theme.palette.primary.main }}>
              <EditIcon fontSize="small" />
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
            <PersonIcon />
          </Box>
          <Typography variant="h5" component="h1" fontWeight="500">
            {t("sidebar.members")}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate("/members/new")} sx={{ px: 3, py: 1 }}>
          {t("form.add_member")}
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
          rows={filteredMembers}
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

export default MemberList;
