import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect } from "react";
import { fetchData, getUserColumns } from "../../datatablesource";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";
import { Link } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";

const ListPrivacy = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getTranslation } = useLocalization();

  useEffect(() => {
    const loadData = async () => {
      try {
        const users = await fetchData();
        setData(users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = (id) => {
    setData((prevData) => prevData.filter((item) => item.id !== id));
  };

  const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link
            to={{
              pathname: `/users/${params.row.id}`,
            }}
            state={{ userData: params.row }}
            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            {getTranslation(commonTranslations, "view")}
          </Link>
          {process.env.NODE_ENV !== 'production' && (
            <div 
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              onClick={() => handleDelete(params.row.id)}
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
          <Datatable data={data} columns={getUserColumns(getTranslation).concat(actionColumn)} title="allPrivacy" />
        )}
      </div>
    </div>
  );
};

export default ListPrivacy;
