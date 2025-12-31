import React from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';

const FaqBulkActions = ({ 
  selectedRows, 
  bulkAction, 
  onBulkActionChange, 
  onApplyBulkAction 
}) => {
  if (selectedRows.length === 0) return null;

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item>
        <Typography variant="body2">
          {selectedRows.length} FAQ(s) selected
        </Typography>
      </Grid>
      <Grid item>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: 'white' }}>Bulk Action</InputLabel>
          <Select
            value={bulkAction}
            onChange={(e) => onBulkActionChange(e.target.value)}
            label="Bulk Action"
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
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
          onClick={onApplyBulkAction}
          disabled={!bulkAction}
          color={bulkAction === 'delete' ? 'error' : 'primary'}
          size="small"
        >
          Apply
        </Button>
      </Grid>
    </Grid>
  );
};

export default FaqBulkActions;
