import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect } from "react";
import { fetchData, getUserColumns, deleteUser } from "../../datatablesource";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";

const List = () => {
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUser(id);
        setData((prevData) => prevData.filter((item) => item.id !== id && item._id !== id));
        toast.success("User deleted successfully");
      } catch (err) {
        toast.error(err.message || "Failed to delete user");
      }
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
            to={{
              pathname: `/users/${params.row.id}`,
            }}
            state={{ userData: params.row }}
            className="px-3 py-1 bg-gradient-to-r from-amber-200 to-pink-200 hover:from-amber-300 hover:to-pink-300 text-gray-800 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
          >
            {getTranslation(commonTranslations, "view")}
          </Link>
          <div 
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
            onClick={() => handleDelete(params.row.id)}
          >
            {getTranslation(commonTranslations, "delete")}
          </div>
        </div>
      ),
    },
  ];

  if (loading) return <div>{getTranslation(commonTranslations, "loading")}</div>;
  if (error) return <div>{getTranslation(commonTranslations, "error")}: {error}</div>;

  return (
    <div className="w-full">
      <div className="w-full">
        <Datatable data={data} columns={getUserColumns(getTranslation).concat(actionColumn)} showAddButton={false} />
      </div>
    </div>
  );
};

export default List;
