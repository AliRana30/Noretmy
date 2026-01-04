import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect, useContext } from "react";
  import { getNotifications, getNotificationColumns } from "../../datatablesource";
  import { deleteNotification } from "../../utils/adminApi";
  import { useNavigate } from "react-router-dom";
  import { useLocalization } from "../../context/LocalizationContext.jsx";
  import { DarkModeContext } from "../../context/darkModeContext.jsx";
  import listTranslations from "../../localization/list.json";
  import commonTranslations from "../../localization/common.json";
  import { LoadingSpinner, ErrorMessage } from "../../components/ui";
  import { Bell, RefreshCw } from 'lucide-react';
  import toast from 'react-hot-toast';

  const ListMessages = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getTranslation } = useLocalization();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const notifications = await getNotifications();
      setData(notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setData((prevData) => prevData.filter((item) => item._id !== id));
      toast.success('Notification deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notification');
    }
  };

  const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== 'production' && (
            <div 
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              onClick={() => handleDelete(params.row._id)}
            >
              {getTranslation(commonTranslations, "delete")}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <Bell className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              All Notifications
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              View all system notifications
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message={getTranslation(commonTranslations, "loading")} />
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage 
          message={`${getTranslation(commonTranslations, "error")}: ${error}`}
          onRetry={loadData}
          retryText="Retry"
        />
      )}

      {/* Main Content */}
      {!loading && !error && (
        <Datatable 
          data={data} 
          columns={getNotificationColumns(getTranslation).concat(actionColumn)} 
          title="allNotifications" 
          showAddButton={false}
        />
      )}
    </div>
  );
};

export default ListMessages;

