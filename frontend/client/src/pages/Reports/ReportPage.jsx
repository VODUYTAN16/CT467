import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Button } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { useTranslation } from "react-i18next";
import api from "../../api/api";
import { motion } from "framer-motion";

const ReportPage = () => {
  const { t } = useTranslation();
  const [topEquipment, setTopEquipment] = useState([]);
  const [revenueByPackage, setRevenueByPackage] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get("/reports/export/pdf", {
        responseType: "blob", // Important for downloading files
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting PDF:", err);
      setError(t("message.error_exporting_pdf"));
    }
  };

  const handleExportWord = async () => {
    try {
      const response = await api.get("/reports/export/word", {
        responseType: "blob", // Important for downloading files
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.docx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting Word:", err);
      setError(t("message.error_exporting_word"));
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [equipmentRes, revenueRes, membersRes] = await Promise.all([
          api.get("/reports/equipment/top"),
          api.get("/reports/revenue/packages"),
          api.get("/reports/members/expiring"),
        ]);
        setTopEquipment(equipmentRes.data);
        setRevenueByPackage(revenueRes.data);
        setExpiringMembers(membersRes.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(t("message.error_loading_reports"));
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [t]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box>
          <PageHeader title={t("reports.title")} />
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" onClick={handleExportPdf}>
              {t("reports.exportPdf")}
            </Button>
            <Button variant="contained" onClick={handleExportWord}>
              {t("reports.exportWord")}
            </Button>
          </Box>

          <Grid container spacing={3}>
          {/* Top Equipment Usage */}
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t("reports.topEquipmentUsage.title")}
              </Typography>
              {topEquipment.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("reports.topEquipmentUsage.equipmentName")}</TableCell>
                        <TableCell align="right">{t("reports.topEquipmentUsage.usageCount")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody component={motion.tbody} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                      {topEquipment.map((item, index) => (
                        <TableRow key={item.equipment_id} component={motion.tr} variants={rowVariants} sx={{ "&:nth-of-type(odd)": { backgroundColor: "action.hover" } }}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.usage_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>{t("reports.topEquipmentUsage.noData")}</Typography>
              )}
            </Paper>
          </Grid>

          {/* Revenue by Package */}
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t("reports.revenueByPackage.title")}
              </Typography>
              {revenueByPackage.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("reports.revenueByPackage.packageName")}</TableCell>
                        <TableCell>{t("reports.revenueByPackage.month")}</TableCell>
                        <TableCell align="right">{t("reports.revenueByPackage.totalRevenue")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody component={motion.tbody} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                      {revenueByPackage.map((item, index) => (
                        <TableRow key={index} component={motion.tr} variants={rowVariants} sx={{ "&:nth-of-type(odd)": { backgroundColor: "action.hover" } }}>
                          <TableCell>{item.package_name}</TableCell>
                          <TableCell>{item.ym}</TableCell>
                          <TableCell align="right">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.total_revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>{t("reports.revenueByPackage.noData")}</Typography>
              )}
            </Paper>
          </Grid>

          {/* Members Expiring Soon */}
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t("reports.membersExpiringSoon.title")}
              </Typography>
              {expiringMembers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("reports.membersExpiringSoon.memberName")}</TableCell>
                        <TableCell>{t("reports.membersExpiringSoon.phoneNumber")}</TableCell>
                        <TableCell>{t("reports.membersExpiringSoon.packageName")}</TableCell>
                        <TableCell>{t("reports.membersExpiringSoon.endDate")}</TableCell>
                        <TableCell>{t("reports.membersExpiringSoon.status")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody component={motion.tbody} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                      {expiringMembers.map((item, index) => (
                        <TableRow key={item.member_id} component={motion.tr} variants={rowVariants} sx={{ "&:nth-of-type(odd)": { backgroundColor: "action.hover" } }}>
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone}</TableCell>
                          <TableCell>{item.package_name}</TableCell>
                          <TableCell>{item.end_date}</TableCell>
                          <TableCell>{item.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>{t("reports.membersExpiringSoon.noData")}</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      </motion.div>
    </Container>
  );
};

export default ReportPage;