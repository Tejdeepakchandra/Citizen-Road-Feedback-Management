import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { REPORT_STATUS, REPORT_CATEGORIES } from '../../utils/constants';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ReportList = ({ reports = [], showActions = false }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const theme = useTheme();
  const navigate = useNavigate();

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      assigned: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getCategoryIcon = (category) => {
    const cat = REPORT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : '📋';
  };

  const getCategoryLabel = (category) => {
    const cat = REPORT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : 'Other';
  };

  const filteredReports = reports.filter(report =>
    report.title?.toLowerCase().includes(search.toLowerCase()) ||
    report.description?.toLowerCase().includes(search.toLowerCase()) ||
    report.status?.toLowerCase().includes(search.toLowerCase()) ||
    report.category?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    } else {
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    }
  });

  const paginatedReports = sortedReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const SortableHeader = ({ label, sortKey }) => (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
      onClick={() => handleSort(sortKey)}
    >
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>
      {sortConfig.key === sortKey ? (
        sortConfig.direction === 'asc' ? (
          <ArrowUpward sx={{ fontSize: 14 }} />
        ) : (
          <ArrowDownward sx={{ fontSize: 14 }} />
        )
      ) : null}
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Reports ({reports.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40%">
                  <SortableHeader label="Title" sortKey="title" />
                </TableCell>
                <TableCell>
                  <SortableHeader label="Category" sortKey="category" />
                </TableCell>
                <TableCell>
                  <SortableHeader label="Status" sortKey="status" />
                </TableCell>
                <TableCell>
                  <SortableHeader label="Date" sortKey="createdAt" />
                </TableCell>
                {showActions && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report) => (
                  <TableRow
                    key={report._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/reports/${report._id}`)}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          {report.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                          {report.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{getCategoryIcon(report.category)}</span>
                            <span>{getCategoryLabel(report.category)}</span>
                          </Box>
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(report.status)}
                        size="small"
                        color={getStatusColor(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(report.createdAt), 'hh:mm a')}
                      </Typography>
                    </TableCell>
                    {showActions && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, report);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showActions ? 5 : 4}>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No reports found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {search ? 'Try changing your search criteria' : 'Start by creating your first report'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredReports.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            navigate(`/reports/${selectedReport?._id}`);
            handleMenuClose();
          }}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit Report
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: theme.palette.error.main }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete Report
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ReportList;