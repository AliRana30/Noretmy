import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { getAdminOrderDetail, updateOrderStatus } from "../../utils/adminApi";
import { DarkModeContext } from "../../context/darkModeContext";
import { useLocalization } from "../../context/LocalizationContext";
import singleTranslations from "../../localization/single.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { ArrowLeft, Package, User, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const SingleOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  const t = (key) => getTranslation(singleTranslations, key);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminOrderDetail(orderId);
        if (response?.data?.order) {
          setOrderData(response.data);
        } else if (response?.data) {
          setOrderData(response.data);
        } else if (response?.order) {
          setOrderData(response);
        } else if (response) {
          setOrderData({ order: response });
        } else {
          throw new Error("Order not found");
        }
      } catch (err) {
        console.error("Error loading order:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, newStatus, `Status changed to ${newStatus} by admin`);
      setOrderData(prev => ({
        ...prev,
        order: { ...prev.order, status: newStatus }
      }));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-slate-600/20 text-slate-600 border-slate-600/30';
      case 'in_progress': case 'in progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'cancelled': case 'disputed': return 'bg-slate-400/20 text-slate-500 border-slate-400/30';
      case 'delivered': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': case 'disputed': return <XCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <LoadingSpinner message="Loading order details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <ErrorMessage 
          message={`Error loading order: ${error}`}
          onRetry={() => window.location.reload()}
          retryText="Retry"
        />
      </div>
    );
  }

  const order = orderData?.order || orderData;
  const buyer = order?.buyerId || {};
  const seller = order?.sellerId || {};
  const job = order?.jobId || {};

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className={`p-2 rounded-lg transition-all ${
            darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('orderDetails')}
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Order ID: {order?._id || orderId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Info */}
        <div className={`lg:col-span-2 p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          {/* Status Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl mb-6 ${getStatusColor(order?.status)}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(order?.status)}
              <div>
                <p className="font-semibold capitalize">{order?.status?.replace('_', ' ') || 'Unknown'}</p>
                <p className="text-sm opacity-80">Current order status</p>
              </div>
            </div>
            
            {/* Quick Status Actions */}
            <div className="flex gap-2">
              <select
                value={order?.status || ''}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updatingStatus}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  darkMode 
                    ? 'bg-black/30 border border-white/20 text-white' 
                    : 'bg-white border border-gray-200 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          {/* Order Details */}
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <Package className="w-5 h-5 inline mr-2" />
            {t('orderInformation')}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Job/Gig</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {job?.title || 'N/A'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Package</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {order?.package || order?.tier || 'Standard'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Price
              </p>
              <p className={`text-xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                ${order?.totalPrice?.toFixed(2) || order?.price?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Created
              </p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {order?.deliveryDate && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Delivery Date</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {order?.revisions !== undefined && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revisions</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {order.revisionsUsed || 0} / {order.revisions}
                </p>
              </div>
            )}
          </div>

          {/* Requirements/Description */}
          {order?.requirements && (
            <div className="mb-6">
              <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Requirements
              </h3>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {order.requirements}
                </p>
              </div>
            </div>
          )}

          {/* Admin Note */}
          {order?.adminNote && (
            <div className="mb-6">
              <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Admin Note
              </h3>
              <div className={`p-4 rounded-xl bg-orange-500/10 border border-orange-500/20`}>
                <p className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                  {order.adminNote}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Buyer & Seller Info */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <div className={`p-6 rounded-2xl ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <User className="w-5 h-5 inline mr-2" />
              Buyer
            </h2>
            <div className="flex items-center gap-3 mb-4">
              {buyer.profilePicture || buyer.img ? (
                <img
                  src={buyer.profilePicture || buyer.img}
                  alt={buyer.fullName || 'Buyer'}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-blue-500 text-white ${buyer.profilePicture || buyer.img ? 'hidden' : ''}`}
              >
                {(buyer.fullName || buyer.username || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                  {buyer.fullName || buyer.username || 'N/A'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} break-all truncate`} title={buyer.email}>
                  {buyer.email || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/users/${buyer._id}`)}
              disabled={!buyer._id}
              className="w-full px-4 py-2 bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
            >
              View Buyer Profile
            </button>
          </div>

          {/* Seller Info */}
          <div className={`p-6 rounded-2xl ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <User className="w-5 h-5 inline mr-2" />
              Seller
            </h2>
            <div className="flex items-center gap-3 mb-4">
              {seller.profilePicture || seller.img ? (
                <img
                  src={seller.profilePicture || seller.img}
                  alt={seller.fullName || 'Seller'}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-orange-500 text-white ${seller.profilePicture || seller.img ? 'hidden' : ''}`}
              >
                {(seller.fullName || seller.username || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                  {seller.fullName || seller.username || 'N/A'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} break-all truncate`} title={seller.email}>
                  {seller.email || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/users/${seller._id}`)}
              disabled={!seller._id}
              className="w-full px-4 py-2 bg-orange-500/20 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-all disabled:opacity-50"
            >
              View Seller Profile
            </button>
          </div>

          {/* Payment Info */}
          <div className={`p-6 rounded-2xl ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <DollarSign className="w-5 h-5 inline mr-2" />
              Payment
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  ${(order?.baseAmount || order?.price || 0).toFixed(2)}
                </span>
              </div>
              
              {/* Platform Fee */}
              <div className="flex justify-between">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Platform Fee {order?.platformFeeRate ? `(${(order.platformFeeRate * 100).toFixed(0)}%)` : '(5%)'}
                </span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  ${(order?.platformFee || order?.feeAndTax || ((order?.baseAmount || order?.price || 0) * 0.05)).toFixed(2)}
                </span>
              </div>
              
              {/* VAT */}
              {(order?.vatAmount > 0 || order?.vatRate > 0) && (
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    VAT {order?.vatRate ? `(${(order.vatRate * 100).toFixed(0)}%)` : ''} {order?.clientCountry ? `- ${order.clientCountry}` : ''}
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    ${(order?.vatAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total</span>
                <span className={`font-bold text-lg ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  ${(order?.totalAmount || order?.totalPrice || ((order?.baseAmount || order?.price || 0) + (order?.platformFee || order?.feeAndTax || 0) + (order?.vatAmount || 0))).toFixed(2)}
                </span>
              </div>
              
              {/* Payment Status */}
              <div className="flex justify-between pt-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  order?.isPaid || order?.paymentStatus === 'paid' ||  order?.stripeChargeId
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {order?.isPaid || order?.stripeChargeId ? 'Paid' : order?.paymentStatus || 'Pending'}
                </span>
              </div>
              
              {/* Seller Earnings */}
              {(order?.isPaid || order?.stripeChargeId) && (
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seller Earnings</span>
                  <span className={`font-medium text-green-500`}>
                    ${((order?.baseAmount || order?.price || 0) - (order?.platformFee || ((order?.baseAmount || order?.price || 0) * 0.05))).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
