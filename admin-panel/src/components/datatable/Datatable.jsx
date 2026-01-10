import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { useContext } from "react";
import { DarkModeContext } from "../../context/darkModeContext";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import datatableTranslations from "../../localization/datatable.json";
import { Plus } from "lucide-react";

const Datatable = ({ data, columns, title = "allUsers", showAddButton = true, addNewPath = "/content/faqs/addnewfaq" }) => {
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  
  return (
    <div className={`rounded-2xl overflow-hidden ${
      darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          {title ? (
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {getTranslation(datatableTranslations, title)}
            </h2>
          ) : (
            <div />
          )}
          {showAddButton && addNewPath && (
            <Link 
              to={addNewPath}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              {getTranslation(datatableTranslations, "addNew")}
            </Link>
          )}
        </div>
        
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={data}
            columns={columns}
            getRowId={(row) => (row?._id?.toString ? row._id.toString() : String(row?._id))}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9',
                color: darkMode ? '#fff' : '#1f2937',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                borderBottom: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                color: darkMode ? '#9ca3af' : '#64748b',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: darkMode ? 'rgba(249, 115, 22, 0.05)' : 'rgba(249, 115, 22, 0.03)',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#fafafa',
              },
              '& .MuiTablePagination-root': {
                color: darkMode ? '#9ca3af' : '#64748b',
              },
              '& .MuiCheckbox-root': {
                color: darkMode ? '#6b7280' : '#9ca3af',
              },
              '& .MuiCheckbox-root.Mui-checked': {
                color: '#f97316',
              },
              '& .MuiDataGrid-columnSeparator': {
                display: 'none',
              },
              '& .MuiDataGrid-menuIcon': {
                color: darkMode ? '#9ca3af' : '#64748b',
              },
              '& .MuiDataGrid-sortIcon': {
                color: darkMode ? '#9ca3af' : '#64748b',
              },
              '& .MuiDataGrid-cellWithStatus': {
                padding: '0.5rem',
              },
              // Custom status cell styles
              '& .cellWithStatus': {
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              },
              '& .cellWithStatus.active, & .cellWithStatus.completed': {
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
              },
              '& .cellWithStatus.pending': {
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
              },
              '& .cellWithStatus.blocked, & .cellWithStatus.rejected': {
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
              },
              '& .cellWithStatus.warned': {
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
              },
              '& .cellWithStatus.inactive': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: darkMode ? '#9ca3af' : '#6b7280',
              },
              '& .cellWithImg': {
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              },
              '& .cellImg': {
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Datatable;
