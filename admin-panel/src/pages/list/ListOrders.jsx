import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect, useContext } from "react";
import { getOrders, getOrdersColumns } from "../../datatablesource";
import { Link } from "react-router-dom";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { Trash2, X, Eye, RefreshCw, Package } from 'lucide-react';
import { deleteAdminOrder } from "../../utils/adminApi";
import toast from "react-hot-toast";

const List = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { getTranslation } = useLocalization();

  const loadData = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();
      setData(orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (order) => {
    setOrderToDelete(order);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    
    try {
      setDeleting(true);
      await deleteAdminOrder(orderToDelete._id, deleteReason || 'Removed by admin');
      setData((prevData) => prevData.filter((item) => item._id !== orderToDelete._id));
      toast.success('Order deleted successfully');
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 100,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/orders/${params.row._id}`}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
            title={getTranslation(commonTranslations, "view")}
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="w-full">
        
        {/* Loading State */}
        {loading && (
          <LoadingSpinner message={getTranslation(commonTranslations, "loading")} />
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={`${getTranslation(commonTranslations, "error")}: ${error}`}
            onRetry={() => window.location.reload()}
            retryText="Retry"
          />
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-12 rounded-2xl ${darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <div className={`p-4 rounded-full w-16 h-16 mb-4 flex items-center justify-center ${darkMode ? 'bg-white/10' : 'bg-gray-50'}`}>
              <Package className={`w-8 h-8 ${darkMode ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No Orders Found
            </h3>
            <p className={`text-sm text-center max-w-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              There are no orders to display at the moment.
            </p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <Datatable 
            data={data} 
            columns={getOrdersColumns(getTranslation).concat(actionColumn)} 
            title="allOrders" 
            showAddButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default List;
