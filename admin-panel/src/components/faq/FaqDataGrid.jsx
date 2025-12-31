import React, { useMemo } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import { getCategoryDisplayName } from '../../utils/adminApi';

const FaqDataGrid = ({ 
  faqs, 
  loading, 
  pagination, 
  selectedRows, 
  onSelectionChange, 
  onPageChange, 
  onPageSizeChange, 
  onEdit, 
  onDelete 
}) => {
  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => (
        <Typography variant="caption" color="textSecondary">
          {params.value.substring(0, 8)}...
        </Typography>
      )
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 180,
      renderCell: (params) => (
        <Chip 
          icon={<CategoryIcon />}
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
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ 
          maxWidth: '100%', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          icon={params.value ? <ToggleOnIcon /> : <ToggleOffIcon />}
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'order',
      headerName: 'Order',
      width: 80,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="textSecondary">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      type: 'date',
      valueGetter: (params) => new Date(params.value),
      renderCell: (params) => (
        <Typography variant="caption" color="textSecondary">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit FAQ">
            <IconButton 
              size="small" 
              onClick={() => onEdit(params.row)}
              color="primary"
              sx={{ '&:hover': { backgroundColor: 'primary.light' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete FAQ">
            <IconButton 
              size="small" 
              onClick={() => onDelete(params.row.id)}
              color="error"
              sx={{ '&:hover': { backgroundColor: 'error.light' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [onEdit, onDelete]);

  return (
    <DataGrid
      rows={faqs}
      columns={columns}
      pageSize={pagination.limit}
      page={pagination.page - 1}
      rowCount={pagination.total}
      loading={loading}
      checkboxSelection
      onSelectionModelChange={onSelectionChange}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      paginationMode="server"
      disableSelectionOnClick
      getRowId={(row) => row.id}
      sx={{
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
        },
      }}
    />
  );
};

export default FaqDataGrid;
