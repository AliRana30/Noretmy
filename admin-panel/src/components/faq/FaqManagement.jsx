import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import FaqStatsCards from './FaqStatsCards';
import FaqFilters from './FaqFilters';
import FaqBulkActions from './FaqBulkActions';
import FaqDataGrid from './FaqDataGrid';
import FaqFormDialog from './FaqFormDialog';

const FaqManagement = ({
  // Data
  faqs,
  categories,
  stats,
  loading,
  
  // Form
  control,
  errors,
  handleSubmit,
  
  // States
  filters,
  pagination,
  selectedRows,
  bulkAction,
  openDialog,
  dialogMode,
  
  // Handlers
  onFilterChange,
  onRefresh,
  onBulkActionChange,
  onApplyBulkAction,
  onSelectionChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onCloseDialog,
  onSubmit,
  onCreate
}) => {
  return (
    <Box>
      {/* Header with Add Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        color: 'white'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            FAQ Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Manage and organize your frequently asked questions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{ 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Add New FAQ
        </Button>
      </Box>

      {/* Stats Cards */}
      <FaqStatsCards stats={stats} />

      {/* Filters */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #e9ecef'
      }}>
        <FaqFilters 
          filters={filters}
          onFilterChange={onFilterChange}
          categories={categories}
          onRefresh={onRefresh}
        />
      </Paper>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}>
          <FaqBulkActions 
            selectedRows={selectedRows}
            bulkAction={bulkAction}
            onBulkActionChange={onBulkActionChange}
            onApplyBulkAction={onApplyBulkAction}
          />
        </Paper>
      )}

      {/* DataGrid */}
      <Paper sx={{ 
        height: 500, 
        width: '100%', 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <FaqDataGrid 
          faqs={faqs}
          loading={loading}
          pagination={pagination}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Paper>

      {/* Form Dialog */}
      <FaqFormDialog 
        open={openDialog}
        onClose={onCloseDialog}
        mode={dialogMode}
        control={control}
        errors={errors}
        categories={categories}
        onSubmit={handleSubmit(onSubmit)}
      />
    </Box>
  );
};

export default FaqManagement;
