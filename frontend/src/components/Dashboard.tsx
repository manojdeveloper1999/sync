import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory,
  History,
  ExitToApp,
  AccountCircle,
  TrendingUp,
  TrendingDown,
  Sync,
  Error,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LogStats } from '../types';
import apiService from '../services/api';
import ProductList from './ProductList';
import LogHistory from './LogHistory';

type TabType = 'dashboard' | 'products' | 'logs';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const stats = await apiService.getLogStats();
      setLogStats(stats);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change >= 0 ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: change >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {change >= 0 ? '+' : ''}{change}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!logStats) {
      return null;
    }

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Dashboard Overview
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Logs"
              value={logStats.overview.total.toLocaleString()}
              change={logStats.overview.change}
              icon={<History />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Activity"
              value={logStats.overview.today.toLocaleString()}
              icon={<Sync />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Success Rate"
              value={`${Math.round(
                ((logStats.levels.find(l => l._id === 'success')?.count || 0) /
                  logStats.overview.total) *
                  100
              )}%`}
              icon={<CheckCircle />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Errors"
              value={logStats.levels.find(l => l._id === 'error')?.count || 0}
              icon={<Error />}
              color="#d32f2f"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Operations Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {logStats.operations.map((op, index) => (
                  <Chip
                    key={op._id}
                    label={`${op._id}: ${op.count}`}
                    color={index % 2 === 0 ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Log Levels
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {logStats.levels.map((level) => (
                  <Chip
                    key={level._id}
                    label={`${level._id}: ${level.count}`}
                    color={
                      level._id === 'error'
                        ? 'error'
                        : level._id === 'warning'
                        ? 'warning'
                        : level._id === 'success'
                        ? 'success'
                        : 'default'
                    }
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Recent Activity
          </Typography>
          {logStats.recentActivity.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {logStats.recentActivity.map((log) => (
                <Box
                  key={log._id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {log.message}
                    </Typography>
                    <Chip
                      size="small"
                      label={log.level}
                      color={
                        log.level === 'error'
                          ? 'error'
                          : log.level === 'warning'
                          ? 'warning'
                          : log.level === 'success'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(log.createdAt).toLocaleString()} | {log.username || 'System'}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">No recent activity</Typography>
          )}
        </Paper>
      </Box>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductList />;
      case 'logs':
        return <LogHistory />;
      default:
        return renderDashboard();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Product Sync Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => setActiveTab('dashboard')}
              sx={{
                bgcolor: activeTab === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: 2,
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<Inventory />}
              onClick={() => setActiveTab('products')}
              sx={{
                bgcolor: activeTab === 'products' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: 2,
              }}
            >
              Products
            </Button>
            <Button
              color="inherit"
              startIcon={<History />}
              onClick={() => setActiveTab('logs')}
              sx={{
                bgcolor: activeTab === 'logs' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: 2,
              }}
            >
              Logs
            </Button>
          </Box>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2">
                Welcome, {user?.username}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {renderContent()}
    </Box>
  );
};

export default Dashboard;