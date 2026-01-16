import axios from "axios";
import { API_CONFIG, getApiUrl, getAuthHeaders } from "./config/api";
import datatableColumnsTranslations from "./localization/datatableColumns.json";

const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    
    if (status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    } else if (status === 403) {
      throw new Error('Access denied. You don\'t have permission to access this data.');
    } else if (status === 404) {
      throw new Error('The requested data was not found.');
    } else if (status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(serverMessage || `Request failed with status ${status}`);
    }
  } else if (error.request) {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  } else {
    throw new Error(error.message || 'An unexpected error occurred.');
  }
};

const getTranslatedHeader = (getTranslation, key) => {
  return getTranslation(datatableColumnsTranslations, key);
};

export const getUserColumns = (getTranslation) => {
  return [
    { field: "id", headerName: getTranslatedHeader(getTranslation, "id"), width: 70 },
    {
      field: "user",
      headerName: getTranslatedHeader(getTranslation, "user"),
      width: 230,
      renderCell: (params) => (
        <div className="cellWithImg">
          <img className="cellImg" src={params.row.img} alt="avatar" />
          {params.row.username}
        </div>
      ),
    },
    {
      field: "email",
      headerName: getTranslatedHeader(getTranslation, "email"),
      width: 230,
    },
    {
      field: "isSeller",
      headerName: getTranslatedHeader(getTranslation, "isSeller"),
      width: 100,
    },
    {
      field: "isVerified",
      headerName: getTranslatedHeader(getTranslation, "isVerified"),
      width: 160,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.status}`}>
          {params.row.status}
        </div>
      ),
    },
  ];
};


export const getDocumentsColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "id"), width: 120 },
    { field: "fullName", headerName: getTranslatedHeader(getTranslation, "fullName"), width: 200 },
    {
      field: "isCompany",
      headerName: getTranslatedHeader(getTranslation, "sellerType"),
      width: 90,  
      renderCell: (params) => {
        return params.value ? getTranslatedHeader(getTranslation, "company") : getTranslatedHeader(getTranslation, "individual");
      }
    },
    {
      field: "documentUrl",
      headerName: getTranslatedHeader(getTranslation, "document"),
      width: 100,
      renderCell: (params) => (
        <div className="cellWithImg">
          <img className="cellImg" src={params.row.img} alt="avatar" />
          {params.row.username}
        </div>
      ),
    },
    {
      field: "isWarned",
      headerName: getTranslatedHeader(getTranslation, "isWarned"),
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isWarned ? 'warned' : 'active'}`}>
          {params.row.isWarned ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
    {
      field: "isBlocked",
      headerName: getTranslatedHeader(getTranslation, "isBlocked"),
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isBlocked ? 'blocked' : 'active'}`}>
          {params.row.isBlocked ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
  ];
};


export const getOrdersColumns = (getTranslation) => {
  return [
    { field: "gigId", headerName: getTranslatedHeader(getTranslation, "gigId"), width: 150 },
    {
      field: "price",
      headerName: getTranslatedHeader(getTranslation, "price"),
      width: 100,
      renderCell: (params) => `$${params.row.price}`, // Format price with a dollar sign
    },
    {
      field: "sellerId",
      headerName: getTranslatedHeader(getTranslation, "sellerId"),
      width: 200,
    },
    {
      field: "buyerId",
      headerName: getTranslatedHeader(getTranslation, "buyerId"),
      width: 200,
    },
    {
      field: "isCompleted",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isCompleted ? "completed" : "pending"}`}>
          {params.row.isCompleted ? getTranslatedHeader(getTranslation, "completed") : getTranslatedHeader(getTranslation, "pending")}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
  ];
};


export const getJobsColumns = (getTranslation) => {
  return [
    { field: "id", headerName: getTranslatedHeader(getTranslation, "jobId"), width: 150 },
    {
      field: "title",
      headerName: getTranslatedHeader(getTranslation, "title"),
      width: 100,
    },
    {
      field: "sellerId",
      headerName: getTranslatedHeader(getTranslation, "sellerId"),
      width: 200,
    },
    {
      field: "location",
      headerName: getTranslatedHeader(getTranslation, "location"),
      width: 100,
    },
    {
      field: "jobStatus",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => {
        const status = params.row.jobStatus && params.row.jobStatus.toLowerCase() === "active" ? "active" : "not active";
        
        return (
          <div className={`cellWithStatus ${status}`}>
            {status === "active" ? getTranslatedHeader(getTranslation, "active") : getTranslatedHeader(getTranslation, "notActive")}
          </div>
        );
      },
    },
    {
      field: "upgradeOption",
      headerName: getTranslatedHeader(getTranslation, "upgradePlan"),
      width: 130,
    },
    {
      field: "date",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
    },
  ];
};


export const getSensitiveColumns = (getTranslation) => {
  return [
    { field: "userId", headerName: getTranslatedHeader(getTranslation, "userId"), width: 200 },
    { field: "desc", headerName: getTranslatedHeader(getTranslation, "message"), width: 600 },
  ];
};


export const getWithdrawalRequestsColumns = (getTranslation) => {
  return [
    { field:"_id", headerName: getTranslatedHeader(getTranslation, "requestId"), width: 200 },
    {
      field: "userId",
      headerName: getTranslatedHeader(getTranslation, "userId"),
      width: 200,
    },
    {
      field: "username",
      headerName: getTranslatedHeader(getTranslation, "username"),
      width: 150,
    },
    {
      field: "amount",
      headerName: getTranslatedHeader(getTranslation, "requestedAmount"),
      width: 150,
      renderCell: (params) => `$${params.row.amount}`,
    },
    {
      field: "withdrawalMethod",
      headerName: getTranslatedHeader(getTranslation, "withdrawalMethod"),
      width: 200,
      renderCell: (params) => (
        <span>{params.row.withdrawalMethod}</span>
      ),
    },
    {
      field: "status",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => {
        const statusRaw = params.row.status || 'pending';
        const status = String(statusRaw).toLowerCase();
        return (
          <div className={`cellWithStatus ${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "createdAt"),
      width: 200,
      renderCell: (params) =>
        new Date(params.row.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];
};


const handleApprove = (requestId) => {
};

const handleReject = (requestId) => {
};

export const getNotificationColumns = (getTranslation) => {
  return [
    { field: "userFullName", headerName: getTranslatedHeader(getTranslation, "user"), width: 150 },
    { field: "type", headerName: getTranslatedHeader(getTranslation, "type"), width: 100,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          params.value === 'order' ? 'bg-blue-100 text-blue-800' :
          params.value === 'promotion' ? 'bg-purple-100 text-purple-800' :
          params.value === 'system' ? 'bg-gray-100 text-gray-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {params.value}
        </span>
      )
    },
    { field: "message", headerName: getTranslatedHeader(getTranslation, "message"), width: 400 },
    { field: "isRead", headerName: getTranslatedHeader(getTranslation, "status"), width: 100,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'
        }`}>
          {params.value ? 'Read' : 'Unread'}
        </span>
      )
    },
    { field: "createdAt", headerName: getTranslatedHeader(getTranslation, "date"), width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString()
    },
  ];
};


const handleWarn = (userId) => {
  };

const handleBlock = (userId) => {
  };


export const getAdminUserColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "id"), width: 120 },
    {
      field: "username",
      headerName: getTranslatedHeader(getTranslation, "user"),
      width: 230,
      renderCell: (params) => (
        <div className="cellWithImg">
          <img className="cellImg" src={params.row.img || params.row.profilePicture} alt="avatar" />
          {params.row.username}
        </div>
      ),
    },
    { field: "email", headerName: getTranslatedHeader(getTranslation, "email"), width: 230 },
    { field: "fullName", headerName: getTranslatedHeader(getTranslation, "fullName"), width: 200 },
    { field: "role", headerName: getTranslatedHeader(getTranslation, "role"), width: 120 },
    {
      field: "status",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.status?.toLowerCase() || 'active'}`}>
          {params.row.status || 'Active'}
        </div>
      ),
    },
    {
      field: "isVerified",
      headerName: getTranslatedHeader(getTranslation, "isVerified"),
      width: 120,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isVerified ? 'active' : 'inactive'}`}>
          {params.row.isVerified ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
    {
      field: "warningCount",
      headerName: getTranslation(datatableColumnsTranslations, "warningCount") || "Warnings",
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.warningCount > 0 ? 'warned' : 'active'}`}>
          {params.row.warningCount || 0}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};


export const getAdminJobsColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "jobId"), width: 150 },
    { field: "title", headerName: getTranslatedHeader(getTranslation, "title"), width: 200 },
    { field: "sellerName", headerName: getTranslatedHeader(getTranslation, "seller"), width: 150 },
    { field: "sellerEmail", headerName: getTranslatedHeader(getTranslation, "sellerEmail"), width: 200 },
    { field: "category", headerName: getTranslatedHeader(getTranslation, "category"), width: 120 },
    {
      field: "price",
      headerName: getTranslatedHeader(getTranslation, "price"),
      width: 100,
      renderCell: (params) => `$${params.row.price || 0}`,
    },
    {
      field: "status",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 120,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.status || params.row.jobStatus}`}>
          {params.row.status || params.row.jobStatus || 'active'}
        </div>
      ),
    },
    {
      field: "isFeatured",
      headerName: getTranslatedHeader(getTranslation, "featured"),
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isFeatured ? 'active' : 'inactive'}`}>
          {params.row.isFeatured ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt || params.row.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};

export const getAdminOrdersColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "orderId"), width: 150 },
    { field: "gigId", headerName: getTranslatedHeader(getTranslation, "gigId"), width: 150 },
    { field: "gigTitle", headerName: getTranslatedHeader(getTranslation, "gigTitle"), width: 200 },
    {
      field: "price",
      headerName: getTranslatedHeader(getTranslation, "price"),
      width: 100,
      renderCell: (params) => `$${params.row.price}`,
    },
    { field: "sellerName", headerName: getTranslatedHeader(getTranslation, "seller"), width: 150 },
    { field: "buyerName", headerName: getTranslatedHeader(getTranslation, "buyer"), width: 150 },
    {
      field: "status",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isCompleted ? "completed" : "pending"}`}>
          {params.row.isCompleted ? getTranslatedHeader(getTranslation, "completed") : getTranslatedHeader(getTranslation, "pending")}
        </div>
      ),
    },
    {
      field: "paymentStatus",
      headerName: getTranslatedHeader(getTranslation, "paymentStatus"),
      width: 140,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.paymentStatus || 'pending'}`}>
          {params.row.paymentStatus || 'pending'}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};

export const getAdminWithdrawalColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "requestId"), width: 200 },
    { field: "username", headerName: getTranslatedHeader(getTranslation, "username"), width: 150 },
    { field: "userEmail", headerName: getTranslatedHeader(getTranslation, "email"), width: 200 },
    { field: "userFullName", headerName: getTranslatedHeader(getTranslation, "fullName"), width: 180 },
    {
      field: "amount",
      headerName: getTranslatedHeader(getTranslation, "amount"),
      width: 120,
      renderCell: (params) => `$${params.row.amount}`,
    },
    { field: "withdrawalMethod", headerName: getTranslatedHeader(getTranslation, "method"), width: 150 },
    {
      field: "status",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 120,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.status?.toLowerCase()}`}>
          {params.row.status}
        </div>
      ),
    },
    { field: "processedBy", headerName: getTranslatedHeader(getTranslation, "processedBy"), width: 150 },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};

export const getAdminSensitiveColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "messageId"), width: 150 },
    { field: "senderName", headerName: getTranslatedHeader(getTranslation, "sender"), width: 150 },
    { field: "senderEmail", headerName: getTranslatedHeader(getTranslation, "senderEmail"), width: 200 },
    { field: "receiverName", headerName: getTranslatedHeader(getTranslation, "receiver"), width: 150 },
    { field: "content", headerName: getTranslatedHeader(getTranslation, "message"), width: 400 },
    { field: "flagReason", headerName: getTranslatedHeader(getTranslation, "flagReason"), width: 150 },
    {
      field: "isFlagged",
      headerName: getTranslatedHeader(getTranslation, "flagged"),
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isFlagged ? 'warned' : 'active'}`}>
          {params.row.isFlagged ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};

export const getAdminContactColumns = (getTranslation) => {
  return [
    { field: "_id", headerName: getTranslatedHeader(getTranslation, "contactId"), width: 150 },
    { field: "name", headerName: getTranslatedHeader(getTranslation, "name"), width: 150 },
    { field: "email", headerName: getTranslatedHeader(getTranslation, "email"), width: 200 },
    { field: "subject", headerName: getTranslatedHeader(getTranslation, "subject"), width: 200 },
    { field: "message", headerName: getTranslatedHeader(getTranslation, "message"), width: 300 },
    {
      field: "isRead",
      headerName: getTranslatedHeader(getTranslation, "read"),
      width: 100,
      renderCell: (params) => (
        <div className={`cellWithStatus ${params.row.isRead ? 'active' : 'pending'}`}>
          {params.row.isRead ? getTranslatedHeader(getTranslation, "yes") : getTranslatedHeader(getTranslation, "no")}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: getTranslatedHeader(getTranslation, "date"),
      width: 200,
      renderCell: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
};

export const fetchData = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.USERS), {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    return response.data.map((user, index) => ({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      img: user.img || user.profilePicture || "https://via.placeholder.com/40",
      email: user.email,
      status: user.isBlocked ? "blocked" : user.isVerified ? "active" : "unverified",
      role: user.role || (user.isSeller ? 'freelancer' : 'client'), // Include role with fallback
      isSeller: user.isSeller,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      isWarned: user.isWarned,
      warningCount: user.warningCount || 0,
      createdAt: user.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching data:", error);
    handleApiError(error);
  }
};

export const fetchDocumentsData = async () => {
  try {
    const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_USERS)}?isVerified=false&role=freelancer&limit=1000`, {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    const users = response.data?.data || response.data || [];
    
    const mapped = users.map((user) => ({
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      img: user.img || user.profilePicture || user.profileImage || user.profileImg || user.avatar || "https://via.placeholder.com/40",
      profilePicture: user.img || user.profilePicture || "https://via.placeholder.com/40",
      isCompany: user.isCompany,
      documentUrl: user.documentImages?.[0] || user.documentVerify || user.documentUrl || "",
      isWarned: user.isWarned,
      warningCount: user.warningCount || 0,
      isBlocked: user.isBlocked,
      isVerified: !!user.isVerified,
      isSeller: user.isSeller,
      role: user.role,
      status: user.isBlocked ? "blocked" : user.isVerified ? "active" : "pending",
    }));

    // Show all users who are sellers/freelancers and not yet verified
    return mapped.filter((u) => (u.isSeller || u.role === 'freelancer') && !u.isVerified);
  } catch (error) {
    console.error("Error fetching documents data:", error);
    handleApiError(error);
    return [];
  }
};

export const getOrders = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.ORDERS), {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    const sortedOrders = response.data.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sortedOrders; // Return the raw sorted data
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const getJobs = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.JOBS), {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    const sortedJobs = response.data.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    return sortedJobs.map((job) => {
      let formattedDate = 'N/A';
      if (job.createdAt) {
        const dateObj = new Date(job.createdAt);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }

      let status = job.jobStatus || 'Active';
      if (status.toLowerCase() === 'available') status = 'Active';
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      return {
        _id: job._id,
        title: job.title,
        sellerId: job.sellerId,
        buyerId: job.buyerId,
        jobStatus: status,
        location: job.subCat || job.cat || 'No Category',
        category: job.cat,
        subCategory: job.subCat,
        upgradeOption: job.upgradeOption || 'Free',
        date: formattedDate,
        createdAt: job.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    handleApiError(error);
  }
};

export const getUserJobs = async (userId) => {
  try {
    const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.JOBS), {
      userId: userId,
    }, {
      headers: getAuthHeaders(),
      withCredentials: true
    });

    if (response.status === 404) {
      console.error("No jobs found for the provided userId.");
      return []; // Return an empty array or handle it as needed
    }

    const sortedJobs = response.data.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sortedJobs.map((job) => ({
      id: job._id, // Assuming _id is the ID
      title: job.title,
      sellerId: job.sellerId,
      buyerId: job.buyerId,
      jobStatus: job.jobStatus, // Fixed typo: jobSatus to jobStatus
      location: job.location,
      upgradeOption: job.upgradeOption,
      date: new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }), // Format date to 'Month Day, Year'
    }));
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    handleApiError(error);
  }
};

export const getSensitiveMessages = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.SENSITIVE_MESSAGES), {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    const sortedMessages = response.data.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sortedMessages.map((message) => ({
      _id: message._id, 
      conversationId:message.conversationId,
      userId : message.userId,
      desc : message.desc,

    }));
  } catch (error) {
    console.error("Error fetching sensitive messages:", error);
    handleApiError(error);
  }
};

export const getNotifications = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_NOTIFICATIONS) + '?limit=100', {
      withCredentials: true,
      headers: getAuthHeaders()
    });

    const notifications = response.data?.data || response.data?.notifications || response.data || [];

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    handleApiError(error);
    return [];
  }
};

export const getAllWithdrawalRequests = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.WITHDRAWALS), {
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    handleApiError(error);
  }
};

export const getFaqColumns = (getTranslation) => {
  return [
    { field: 'id', headerName: getTranslatedHeader(getTranslation, 'id'), width: 70 },
    { field: 'question', headerName: getTranslatedHeader(getTranslation, 'question'), width: 230 },
    { field: 'answer', headerName: getTranslatedHeader(getTranslation, 'answer'), width: 230 },
    { field: 'category', headerName: getTranslatedHeader(getTranslation, 'category'), width: 150 },
  ];
};

export const getPrivacyPolicyColumns = (getTranslation) => {
  return [
    { field: 'id', headerName: getTranslatedHeader(getTranslation, 'id'), width: 70 },
    { field: 'title', headerName: getTranslatedHeader(getTranslation, 'title'), width: 230 },
    { field: 'description', headerName: getTranslatedHeader(getTranslation, 'description'), width: 400 },
  ];
};


export const getFaqs = async () => {
  return [
    { _id: 1, question: 'What is your refund policy?', answer: 'Our refund policy...', category: 'Client' },
    { _id: 2, question: 'How do I update my profile?', answer: 'To update your profile...', category: 'Freelancer' },
  ];
};

export const getPrivacyPolicy = async () => {
  return [
    { id: 1, title: 'Data Collection', description: 'We collect data to improve services...' },
    { id: 2, title: 'Data Sharing', description: 'We do not share your data without consent...' },
  ];
};