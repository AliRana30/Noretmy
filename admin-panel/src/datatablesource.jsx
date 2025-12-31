import axios from "axios";
import { API_CONFIG, getApiUrl } from "./config/api";
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

// Helper function to get translated column headers
const getTranslatedHeader = (getTranslation, key) => {
  return getTranslation(datatableColumnsTranslations, key);
};

// Function to get user columns with translations
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

// Legacy export for backward compatibility - removed to fix React hooks error
// export const userColumns = getUserColumns();

// Function to get documents columns with translations
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

// Legacy export for backward compatibility - removed to fix React hooks error
// export const documentsColumns = getDocumentsColumns();


// Function to get orders columns with translations
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

// Legacy export for backward compatibility - removed to fix React hooks error
// export const ordersColumns = getOrdersColumns();


// Function to get jobs columns with translations
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
      field: "jobsStatus",
      headerName: getTranslatedHeader(getTranslation, "status"),
      width: 160,
      renderCell: (params) => {
        // Log the jobsStatus value to check what's being passed
        console.log('jobsStatus:', params.row.jobStatus);
    
        // Ensure the jobsStatus is either "active" or "not active"
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

// Legacy export for backward compatibility - removed to fix React hooks error
// export const jobsColumns = getJobsColumns();

// Function to get sensitive messages columns with translations
export const getSensitiveColumns = (getTranslation) => {
  return [
    { field: "userId", headerName: getTranslatedHeader(getTranslation, "userId"), width: 200 },
    { field: "desc", headerName: getTranslatedHeader(getTranslation, "message"), width: 600 },
    // {
    //   field: "actions",
    //   headerName: getTranslatedHeader(getTranslation, "actions"),
    //   width: 200,
    //   renderCell: (params) => (
    //     <div className="actionButtons">
    //       <button onClick={() => handleWarn(params.row.userId)}>Warn</button>
    //       <button onClick={() => handleBlock(params.row.userId)}>Block</button>
    //     </div>
    //   ),
    // },
  ];
};

// Legacy export for backward compatibility - removed to fix React hooks error
// export const SensitiveColumns = getSensitiveColumns();

// Function to get withdrawal requests columns with translations
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
        // Log the status value to check what's being passed
        console.log("status:", params.row.status);

        // Dynamically assign class based on status
        const status = params.row.status.toLowerCase();
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
    // {
    //   field: "actions",
    //   headerName: getTranslatedHeader(getTranslation, "actions"),
    //   width: 250,
    //   renderCell: (params) => (
    //     <div className="actionButtons">
    //       <button
    //         className="approveButton"
    //         onClick={() => handleApprove(params.row.requestId)}
    //       >
    //         Approve
    //       </button>
    //       <button
    //         className="rejectButton"
    //         onClick={() => handleReject(params.row.requestId)}
    //       >
    //         Reject
    //       </button>
    //     </div>
    //   ),
    // },
  ];
};

// Legacy export for backward compatibility - removed to fix React hooks error
// export const withdrawalRequestsColumns = getWithdrawalRequestsColumns();

// Handlers for actions
const handleApprove = (requestId) => {
  console.log(`Approving withdrawal request: ${requestId}`);
  // Add your API call or logic to approve the request
};

const handleReject = (requestId) => {
  console.log(`Rejecting withdrawal request: ${requestId}`);
  // Add your API call or logic to reject the request
};


// Function to get notification columns with translations
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

// Legacy export for backward compatibility - removed to fix React hooks error
// export const NotificationColumns = getNotificationColumns();


const handleWarn = (userId) => {
  // Add your warning logic here
  console.log(`Warn user with ID: ${userId}`);
};

// Function to handle blocking a user
const handleBlock = (userId) => {
  // Add your blocking logic here
  console.log(`Block user with ID: ${userId}`);
};

// ===== ADMIN-SPECIFIC COLUMNS =====

// Function to get admin user columns with enhanced management features
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

// ===== ADMIN-SPECIFIC COLUMNS (ALREADY DEFINED ABOVE) =====

// Function to get admin jobs columns with enhanced management features
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

// Function to get admin orders columns with enhanced management features
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

// Function to get admin withdrawal columns with enhanced management features
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

// Function to get admin sensitive messages columns with enhanced management features
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

// Function to get admin contact columns with enhanced management features
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

// Function to get data from the API and format it for the DataGrid
export const fetchData = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.USERS), {
      withCredentials: true
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
      createdAt: user.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching data:", error);
    handleApiError(error);
  }
};


export const fetchDocumentsData = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VERIFIED_SELLERS), {
      withCredentials: true
    });

    console.log(response)

    return response.data.map((user, index) => ({
      _id: user._id,
      fullName:user.fullName,
      img: user.documentImages && user.documentImages[0] ? user.documentImages[0] : "https://default-avatar-url.com", // Default image if not provided
      status: user.isWarned ? "Warned" : user.isBlocked ? "Blocked" : "Active", // Default status logic
      isWarned: user.isWarned,
      isBlocked: user.isBlocked,
    }));
  } catch (error) {
    console.error("Error fetching data:", error);
    handleApiError(error);
  }
};


export const getOrders = async () => {
  try {
    const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.ORDERS), {
      withCredentials: true
    });

    // Sort orders by date (descending)
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
      withCredentials: true
    });

    // Sort jobs by date (descending)
    const sortedJobs = response.data.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    return sortedJobs.map((job) => {
      // Safely format the date
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

      return {
        _id: job._id,
        title: job.title,
        sellerId: job.sellerId,
        buyerId: job.buyerId,
        jobStatus: job.jobStatus || 'Active',
        // Use category (cat) or subCat instead of location
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
    console.log(userId); // Log the userId for debugging
    const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.JOBS), {
      userId: userId,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });

    // Check if the response status is 404
    if (response.status === 404) {
      console.error("No jobs found for the provided userId.");
      return []; // Return an empty array or handle it as needed
    }

    // Sort jobs by date (descending)
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
      withCredentials: true
    });

    // Sort orders by date (descending)
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
      withCredentials: true
    });

    // Handle different response formats - backend returns { success, data, pagination }
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


// Function to get FAQ columns with translations
export const getFaqColumns = (getTranslation) => {
  return [
    { field: 'id', headerName: getTranslatedHeader(getTranslation, 'id'), width: 70 },
    { field: 'question', headerName: getTranslatedHeader(getTranslation, 'question'), width: 230 },
    { field: 'answer', headerName: getTranslatedHeader(getTranslation, 'answer'), width: 230 },
    { field: 'category', headerName: getTranslatedHeader(getTranslation, 'category'), width: 150 },
  ];
};

// Function to get privacy policy columns with translations
export const getPrivacyPolicyColumns = (getTranslation) => {
  return [
    { field: 'id', headerName: getTranslatedHeader(getTranslation, 'id'), width: 70 },
    { field: 'title', headerName: getTranslatedHeader(getTranslation, 'title'), width: 230 },
    { field: 'description', headerName: getTranslatedHeader(getTranslation, 'description'), width: 400 },
  ];
};

// Legacy exports for backward compatibility - removed to fix React hooks error
// export const faqColumns = getFaqColumns();
// export const privacyPolicyColumns = getPrivacyPolicyColumns();

// Dummy functions to simulate fetching data
export const getFaqs = async () => {
  // Simulated dummy data
  return [
    { _id: 1, question: 'What is your refund policy?', answer: 'Our refund policy...', category: 'Client' },
    { _id: 2, question: 'How do I update my profile?', answer: 'To update your profile...', category: 'Freelancer' },
  ];
};

export const getPrivacyPolicy = async () => {
  // Simulated dummy data
  return [
    { id: 1, title: 'Data Collection', description: 'We collect data to improve services...' },
    { id: 2, title: 'Data Sharing', description: 'We do not share your data without consent...' },
  ];
};