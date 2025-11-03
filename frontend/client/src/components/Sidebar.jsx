import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InventoryIcon from '@mui/icons-material/Inventory';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group'; // Import icon for User Management
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext); // Get user from AuthContext

  const baseMenuItems = [
    { text: t('navbar.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('sidebar.members'), icon: <PeopleIcon />, path: '/members' },
    { text: t('sidebar.equipment'), icon: <FitnessCenterIcon />, path: '/equipment' },
    { text: t('sidebar.packages'), icon: <InventoryIcon />, path: '/packages' },
    { text: t('sidebar.subscriptions'), icon: <SubscriptionsIcon />, path: '/subscriptions' },
    { text: t('sidebar.payments'), icon: <PaymentIcon />, path: '/payments' },
    { text: t('sidebar.usages'), icon: <AssignmentIcon />, path: '/usages' },
    { text: t('sidebar.reports'), icon: <BarChartIcon />, path: '/reports' },
  ];

  const menuItems = user && user.role === 'admin'
    ? [...baseMenuItems, { text: t('sidebar.user_management'), icon: <GroupIcon />, path: '/users' }]
    : baseMenuItems;

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* The implementation can be swapped with js to avoid SEO duplication of the nav. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
