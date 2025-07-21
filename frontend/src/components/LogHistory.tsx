import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Alert,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search,
  Refresh,
  Clear,
  Visibility,
  Download,
  FilterList,
  Info,
  Warning,
  Error,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SyncLog, FilterOptions } from '../types';
import apiService from '../services/api';

const LogHistory: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLogs({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
      });
      setLogs(response.logs);
      setTotalCount(response.pagination.total);
    } catch (err: any) {
      setError('Failed to load logs');
      console.error('Load logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log: SyncLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleExportLogs = async () => {
    try {
      const blob = await apiService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sync-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Logs exported successfully');
    } catch (err: any) {
      setError('Failed to export logs');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'success':
        return <CheckCircle />;
      case 'info':
      default:
        return <Info />;
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Sync Log History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Message"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level || ''}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                label="Level"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Operation</InputLabel>
              <Select
                value={filters.operation || ''}
                onChange={(e) => handleFilterChange('operation', e.target.value)}
                label="Operation"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="sync">Sync</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={filters.entityType || ''}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                label="Entity Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="auth">Auth</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                size="small"
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadLogs}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportLogs}
                size="small"
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>Timestamp</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Operation</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {formatDate(log.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getLevelIcon(log.level)}
                    label={log.level}
                    color={getLevelColor(log.level) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.operation}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {log.entityType}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.message}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.username || 'System'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.source}
                    variant="outlined"
                    size="small"
                    color="secondary"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(log)}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No logs found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Timestamp
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {formatDate(selectedLog.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Level
                        </Typography>
                        <Chip
                          icon={getLevelIcon(selectedLog.level)}
                          label={selectedLog.level}
                          color={getLevelColor(selectedLog.level) as any}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Operation
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.operation}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Entity Type
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.entityType}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Message
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.message}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User & Source Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          User
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.username || 'System'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Source
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.source}
                        </Typography>
                      </Grid>
                      {selectedLog.ipAddress && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            IP Address
                          </Typography>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                            {selectedLog.ipAddress}
                          </Typography>
                        </Grid>
                      )}
                      {selectedLog.duration && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Duration
                          </Typography>
                          <Typography variant="body1">
                            {selectedLog.duration}ms
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {selectedLog.details && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Details
                      </Typography>
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.200',
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </Typography>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogHistory;