import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect, useContext } from "react";
import { getOrders, getOrdersColumns } from "../../datatablesource";
import { Link } from "react-router-dom";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const List = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingDelete, setProcessingDelete] = useState(false);
  const { getTranslation } = useLocalization();

  useEffect(() => {
    const loadData = async () => {
      try {
        const orders = await getOrders();
        setData(orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const openDeleteModal = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    
    setProcessingDelete(true);
    try {
      const { deleteAdminOrder } = await import("../../utils/adminApi");
      await deleteAdminOrder(selectedOrder._id);
      setData((prevData) => prevData.filter((item) => item._id !== selectedOrder._id));
      toast.success('Order deleted successfully');
      setShowDeleteModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingDelete(false);
    }
  };

  const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/orders/${params.row._id}`}
            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            {getTranslation(commonTranslations, "view")}
          </Link>
          <div 
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
            onClick={() => openDeleteModal(params.row)}
          >
            {getTranslation(commonTranslations, "delete")}
          </div>
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

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <Datatable 
            data={data} 
            columns={getOrdersColumns(getTranslation).concat(actionColumn)} 
            title="allOrders" 
            showAddButton={false}
          />
        )}
      </div>

      {/* Delete Order Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
          }`}>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedOrder(null);
              }}
              className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {getTranslation(commonTranslations, "deleteOrder")}
              </h3>
            </div>
            
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getTranslation(commonTranslations, "confirmDelete")}
            </p>
            
            <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Order ID: <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder._id}</span>
              </p>
              {selectedOrder.title && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Title: <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.title}</span>
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedOrder(null);
                }}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  darkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTranslation(commonTranslations, "cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={processingDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
              >
                {processingDelete ? getTranslation(commonTranslations, "deleting") : getTranslation(commonTranslations, "deleteOrder")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
