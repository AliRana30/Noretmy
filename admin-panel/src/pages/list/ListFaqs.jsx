import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllFaqs, 
  getFaqStats, 
  createFaq, 
  updateFaq, 
  deleteFaq, 
  bulkUpdateFaqs, 
  bulkDeleteFaqs,
  getCategoryDisplayName
} from '../../utils/adminApi';
import { FAQ_CATEGORIES } from '../../config/api';
import { DataGrid } from '@mui/x-data-grid';
import { LoadingSpinner, ErrorMessage } from '../../components/ui';
import { 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Checkbox,
  FormGroup
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

const ListFaqs = () => {
  const { getTranslation } = useLocalization();
  const { isAdmin, hasPermission } = useAuth();
  
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedFaq, setSelectedFaq] = useState(null);
  
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    isActive: true,
    order: 0
  });
  
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== '' && { isActive: filters.isActive === 'true' }),
        ...(filters.search && { search: filters.search })
      };
      
      const [faqsResponse, statsResponse] = await Promise.all([
        getAllFaqs(params),
        getFaqStats()
      ]);
      
      setFaqs(faqsResponse.data || []);
      setStats(statsResponse.data);
      setPagination(prev => ({
        ...prev,
        total: faqsResponse.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError(error.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, [pagination.page, pagination.limit, filters]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedFaq(null);
    setFormData({
      category: '',
      question: '',
      answer: '',
      isActive: true,
      order: 0
    });
    setOpenDialog(true);
  };

  const handleEdit = (faq) => {
    setDialogMode('edit');
    setSelectedFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      order: faq.order || 0
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await createFaq(formData);
        setSnackbar({
          open: true,
          message: 'FAQ created successfully!',
          severity: 'success'
        });
      } else {
        await updateFaq(selectedFaq._id, formData);
        setSnackbar({
          open: true,
          message: 'FAQ updated successfully!',
          severity: 'success'
        });
      }
      
      setOpenDialog(false);
      loadFaqs();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Operation failed',
        severity: 'error'
      });
    }
  };

  const handleDelete = (id) => {
    setFaqToDelete(id);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!faqToDelete) return;
    
    try {
      await deleteFaq(faqToDelete);
      setSnackbar({
        open: true,
        message: 'FAQ deleted successfully!',
        severity: 'success'
      });
      loadFaqs();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Delete failed',
        severity: 'error'
      });
    } finally {
      setDeleteModalOpen(false);
      setFaqToDelete(null);
    }
  };

  const handleBulkAction = async () => {
    if (!selectedRows.length || !bulkAction) return;
    
    try {
      if (bulkAction === 'delete') {
        setBulkDeleteModalOpen(true);
        return; // Wait for modal confirmation
      } else if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        await bulkUpdateFaqs(selectedRows, {
          isActive: bulkAction === 'activate'
        });
        setSnackbar({
          open: true,
          message: `${selectedRows.length} FAQs updated successfully!`,
          severity: 'success'
        });
      }
      
      setSelectedRows([]);
      setBulkAction('');
      loadFaqs();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Bulk operation failed',
        severity: 'error'
      });
    }
  };
  
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteFaqs(selectedRows);
      setSnackbar({
        open: true,
        message: `${selectedRows.length} FAQs deleted successfully!`,
        severity: 'success'
      });
      setSelectedRows([]);
      setBulkAction('');
      loadFaqs();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Bulk delete failed',
        severity: 'error'
      });
    } finally {
      setBulkDeleteModalOpen(false);
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      renderCell: (params) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {params.value.substring(0, 8)}...
        </span>
      )
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 200,
      renderCell: (params) => (
        <Chip 
          label={getCategoryDisplayName(params.value)}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'question',
      headerName: 'Question',
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <div style={{ 
          maxWidth: '100%', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value}
        </div>
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'order',
      headerName: 'Order',
      width: 100,
      type: 'number'
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      type: 'date',
      valueGetter: (params) => new Date(params.value)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => handleEdit(params.row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const StatsCard = ({ title, value, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (!isAdmin() || !hasPermission(['content_management'])) {
    return (
      <div className="list">
        <div className="listContainer">
          <div className="listTitle">Access Denied</div>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list">
      <div className="listContainer">
        <div className="listTitle">
          FAQ Management
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            style={{ marginLeft: 'auto' }}
          >
            Add New FAQ
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingSpinner message="Loading FAQs..." />
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={`Error: ${error}`}
            onRetry={() => window.location.reload()}
            retryText="Retry"
          />
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Stats Cards */}
            {stats && (
          <Grid container spacing={2} style={{ marginBottom: 20 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard title="Total FAQs" value={stats.total} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard title="Active FAQs" value={stats.active} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard title="Inactive FAQs" value={stats.inactive} color="warning" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard title="Categories" value={stats.categoryStats?.length || 0} color="info" />
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Card style={{ marginBottom: 20 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search questions and answers..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {FAQ_CATEGORIES.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.display}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadFaqs}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <Card style={{ marginBottom: 20 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Typography variant="body2">
                    {selectedRows.length} FAQ(s) selected
                  </Typography>
                </Grid>
                <Grid item>
                  <FormControl size="small">
                    <InputLabel>Bulk Action</InputLabel>
                    <Select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      label="Bulk Action"
                    >
                      <MenuItem value="">Select Action</MenuItem>
                      <MenuItem value="activate">Activate</MenuItem>
                      <MenuItem value="deactivate">Deactivate</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    color={bulkAction === 'delete' ? 'error' : 'primary'}
                  >
                    Apply
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* DataGrid */}
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={faqs}
            columns={columns}
            pageSize={pagination.limit}
            page={pagination.page - 1}
            rowCount={pagination.total}
            loading={loading}
            checkboxSelection
            onSelectionModelChange={(newSelection) => {
              setSelectedRows(newSelection);
            }}
            onPageChange={(newPage) => {
              setPagination(prev => ({ ...prev, page: newPage + 1 }));
            }}
            onPageSizeChange={(newPageSize) => {
              setPagination(prev => ({ ...prev, limit: newPageSize, page: 1 }));
            }}
            paginationMode="server"
            disableSelectionOnClick
            getRowId={(row) => row.id}
          />
        </div>
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogMode === 'create' ? 'Create New FAQ' : 'Edit FAQ'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} style={{ marginTop: 10 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    label="Category"
                    required
                  >
                    {FAQ_CATEGORIES.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.display}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleFormChange('order', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Question"
                  value={formData.question}
                  onChange={(e) => handleFormChange('question', e.target.value)}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Answer"
                  value={formData.answer}
                  onChange={(e) => handleFormChange('answer', e.target.value)}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmDelete} 
              variant="contained" 
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog
          open={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Bulk Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {selectedRows.length} selected FAQ(s)? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmBulkDelete} 
              variant="contained" 
              color="error"
            >
              Delete All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default ListFaqs;
