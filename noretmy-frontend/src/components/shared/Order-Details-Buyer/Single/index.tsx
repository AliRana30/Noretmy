import { useState, useMemo } from 'react';
import {
  FaCheckCircle,
  FaStar,
  FaTruck,
  FaPlayCircle,
  FaFileAlt,
  FaPlusCircle,
  FaSync,
  FaComments,
  FaExclamationCircle,
  FaClock,
  FaChevronDown,
  FaPercent,
  FaChartLine,
  FaPaperPlane,
  FaHistory,
  FaCalendarAlt,
} from 'react-icons/fa';
import SubmitRequirements from '../Actions/SubmitRequirements';
import ViewRequirements from '../Actions/ViewRequirements';
import RequestRevision from '../Actions/RequestRevision';
import Review from '../Actions/reviewSeller';
import OrderCard from '../OrderCard';
import ViewReview from '../Actions/ViewReview';
import { useSelector } from 'react-redux';
import OrderDetails from '../Actions/OrderCreated';
import axios from 'axios';
import SubmitDelivery from '../Actions/SubmitDelivery';
import { Download, Paperclip } from 'lucide-react';
import { showError, showSuccess } from '@/util/toast';
import { useCountdown } from '@/util/time';
import { startOrFetchConversation } from '@/util/chat';
import { useRouter } from 'next/navigation';
import OrderTimeline from '../../OrderTimeline';
import { useTranslations } from '@/hooks/useTranslations';

interface SingleOrderSectionProps {
  sellerName: string;
  sellerUsername: string;
  sellerImage: string;
  orderDetails: any;
  reviewDetails: any;
  onOperationComplete: () => void;
}

type HistoryItem = {
  _id: string;
  status: string; // Adjust this type based on the possible statusesOO
};

const SingleOrderSection: React.FC<SingleOrderSectionProps> = ({
  sellerName,
  sellerUsername,
  sellerImage,
  orderDetails,
  reviewDetails,
  onOperationComplete,
}) => {

  const { t } = useTranslations('orders');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showRequestRevision, setShowRequestRevision] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'chat'>('order');
  const { orderStatus, requirements, attachments, statusHistory } =
    orderDetails;

  const [showSubmitDelivery, setShowSubmitDelivery] = useState(false);
  const [showExtendTimeline, setShowExtendTimeline] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(1);
  const [extendReason, setExtendReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const timeLeft = useCountdown(orderDetails.deliveryDate);

  const user = useSelector((state: any) => state.auth?.user);
  const isOrderSeller = user?._id === orderDetails?.sellerId || user?.id === orderDetails?.sellerId;
  const isOrderBuyer = user?._id === orderDetails?.buyerId || user?.id === orderDetails?.buyerId;

  const statusConfig = {
    accepted: {
      label: t('details.statusLabels.accepted'),
      icon: <FaCheckCircle className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.accepted'),
    },
    completed: {
      label: t('details.statusLabels.completed'),
      icon: <FaCheckCircle className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.completed'),
    },
    waitingReview: {
      label: t('details.statusLabels.waitingReview'),
      icon: <FaStar className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.waitingReview'),
    },
    requestedRevision: {
      label: t('details.statusLabels.requestedRevision'),
      icon: <FaSync className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.requestedRevision'),
    },
    delivered: {
      label: t('details.statusLabels.delivered'),
      icon: <FaTruck className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.delivered'),
    },
    started: {
      label: t('details.statusLabels.started'),
      icon: <FaPlayCircle className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.started'),
    },
    requirementsSubmitted: {
      label: t('details.statusLabels.requirementsSubmitted'),
      icon: <FaFileAlt className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.requirementsSubmitted'),
    },
    created: {
      label: t('details.statusLabels.created'),
      icon: <FaPlusCircle className="w-5 h-5" />,
      color: 'text-black',
      bgColor: 'bg-card',
      borderColor: 'border-gray-200',
      description: t('details.statusDescriptions.created'),
    },
  };

  const statusOrder = [
    'created',
    'accepted',
    'requirementsSubmitted',
    'started',
    'delivered',
    'requestedRevision',
    'completed',
    'waitingReview',
  ];

  const progressPercentage = useMemo(() => {
    const numericProgress = Number(orderDetails?.progress);
    if (Number.isFinite(numericProgress) && numericProgress >= 0) {
      return Math.min(Math.round(numericProgress), 100);
    }
    const currentIndex = statusOrder.findIndex(
      (status) => status === orderStatus,
    );
    return currentIndex >= 0
      ? Math.min(
        Math.round((currentIndex / (statusOrder.length - 1)) * 100),
        100,
      )
      : 0;
  }, [orderDetails?.progress, orderStatus]);

  const filteredDropdownItems = useMemo(() => {
    return statusHistory
      .map((history: HistoryItem) => {
        const config =
          statusConfig[history.status as keyof typeof statusConfig];
        return config
          ? { ...config, status: history.status, key: history._id }
          : null;
      })
      .filter(Boolean)
      .reverse();
  }, [statusHistory]);


  const handleApiRequest = async (endpoint: string, data?: any) => {

    try {
      const res = await axios.put(
        `${BACKEND_URL}/orders/${endpoint}`,
        data,
        {
          headers: {
            'Content-Type': data?.status === 'start' || data?.status === 'accept' ? 'application/json' : 'multipart/form-data', // Set correct content type for file uploads
          },
          withCredentials: true, // Equivalent to fetch's credentials: "include"
        },
      );


      if (res.status === 200) {
        onOperationComplete();
        showSuccess(res.data.message);

      }
    } catch (error) {
      console.error('Error:', error);
      showError(error)
    }
  };

  const router = useRouter();

  const handleChatClick = async () => {
    const conversationUrl = await startOrFetchConversation({ buyerId: orderDetails.buyerId, sellerId: orderDetails.sellerId });
    if (conversationUrl) {
      router.push(conversationUrl);
    }
  };

  const handleRequirementsSubmission = async (requirements: string, files: File[]) => {
    const formData = new FormData();
    formData.append('orderId', orderDetails.orderId);
    formData.append('requirements', requirements);

    files.forEach((file) => {
      formData.append('files', file);
    });

    handleApiRequest('requirements-submit', formData);
  };

  const handleOrderStarted = () => {
    handleApiRequest('start', { orderId: orderDetails.orderId, status: "start" });
  };

  const handleOrderSubmit = (deliveryDescription: string, files: File[]) => {
    const formData = new FormData();
    formData.append('orderId', orderDetails.orderId);
    formData.append('deliveryDescription', deliveryDescription);
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    handleApiRequest('deliver', formData);
  };

  const handleAcceptDelivery = () =>
    handleApiRequest('accept', { orderId: orderDetails.orderId, status: "accept" });

  const handleExtendTimeline = async () => {
    if (extendDays < 1 || extendDays > 30) {
      showError('Additional days must be between 1 and 30');
      return;
    }

    setIsExtending(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/orders/timeline/extend`,
        {
          orderId: orderDetails.orderId,
          additionalDays: extendDays,
          reason: extendReason
        },
        { withCredentials: true }
      );

      showSuccess(response.data.message || 'Timeline extended successfully!');
      setShowExtendTimeline(false);
      setExtendDays(1);
      setExtendReason('');
      onOperationComplete(); // Refresh the order details
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to extend timeline');
    } finally {
      setIsExtending(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone and will trigger a refund request if payment was already processed.")) {
      return;
    }

    try {
      const response = await axios.put(
        `${BACKEND_URL}/orders/cancel`,
        {
          orderId: orderDetails.orderId,
          reason: "Deadline passed"
        },
        { withCredentials: true }
      );

      showSuccess(response.data.message || 'Order cancelled successfully!');
      onOperationComplete();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleAdvanceOrderStatus = async (targetStatus: string) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/orders/advance-status`,
        {
          orderId: orderDetails.orderId,
          targetStatus
        },
        { withCredentials: true }
      );

      showSuccess(response.data.message || 'Order status updated successfully!');
      onOperationComplete(); // Refresh the order details
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to advance order status');
    }
  };

  const handleRequestRevisionSubmit = (reason: string, files: File[]) => {
    const formData = new FormData();
    formData.append('orderId', orderDetails.orderId);
    formData.append('reason', reason);
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    handleApiRequest('revision-request', formData);
    setShowRequestRevision(false);
  };

  const handleSubmitReview = async (rating: number, desc: string) => {
    setIsSubmittingReview(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/reviews`,
        {
          orderId: orderDetails.orderId,
          desc,
          star: rating,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 || response.status === 201) {
        showSuccess("Review submitted successfully!");
        setShowReviewModal(false);
        onOperationComplete(); // Refresh order details to show the review
      }
    } catch (error) {
      console.error("Something went wrong while submitting the review:", error);
      showError(error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownload = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank'; // Open in new tab
    link.rel = 'noopener noreferrer'; // Security best practice
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = useMemo(() => {
    let daysPassed = 0;

    if (orderDetails.createdAt || orderDetails.orderDate) {
      try {
        const startDate = new Date(orderDetails.createdAt || orderDetails.orderDate);
        const currentDate = new Date();
        if (!isNaN(startDate.getTime())) {
          daysPassed = Math.max(0, Math.floor(
            (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ));
        }
      } catch {
        daysPassed = 0;
      }
    }

    let timeLeftDays: number | string = 0;
    if (orderDetails.deliveryDate || orderDetails.deadline) {
      try {
        const deadlineDate = new Date(orderDetails.deliveryDate || orderDetails.deadline);
        const currentDate = new Date();
        if (!isNaN(deadlineDate.getTime())) {
          timeLeftDays = Math.max(0, Math.floor(
            (deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          ));
        }
      } catch {
        timeLeftDays = 0;
      }
    }

    return {
      daysSinceCreation: daysPassed,
      timeLeft: timeLeftDays,
      totalRevisions: statusHistory?.filter(
        (h: HistoryItem) => h.status === 'requestedRevision'
      ).length || 0,
      isLate: orderDetails.deadline
        ? new Date(orderDetails.deadline) < new Date()
        : orderDetails.deliveryDate
          ? new Date(orderDetails.deliveryDate) < new Date()
          : false,
    };
  }, [orderDetails, statusHistory]);

  const renderActions = (status: string, currentStatusData: any) => {
    switch (status) {
      case 'created':
        return (
          <div>
            <OrderDetails orderDate={orderDetails.orderDate} deliveryDate={orderDetails.deliveryDate} sellerName={sellerUsername} price={orderDetails.orderPrice} />
            {isOrderBuyer && orderStatus === 'created' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-gray-800 font-semibold mb-4 flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                    <FaFileAlt className="w-5 h-5" />
                  </div>
                  Submit Your Requirements
                </h3>
                <SubmitRequirements
                  onSubmit={(data, files) =>
                    handleRequirementsSubmission(data, files)
                  }
                  onClose={() => { }}
                />
              </div>
            )}
          </div>
        );

      case 'requirementsSubmitted':
        return (
          <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-gray-800 font-semibold mb-4 flex items-center">
              <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                <FaFileAlt className="w-5 h-5" />
              </div>
              Project Requirements
            </h3>

            <ViewRequirements
              requirements={requirements}
              attachments={attachments}
              onClose={() => { }}
            />
          </div>
        );

      case 'started':
        return (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium"
                onClick={handleChatClick}>
                <FaComments className="h-5 w-5" />
                Message {isOrderSeller ? 'Buyer' : 'Seller'}
              </button>

              {isOrderSeller && (
                <button
                  onClick={() => setShowSubmitDelivery(!showSubmitDelivery)}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium"
                >
                  <FaPaperPlane className="h-5 w-5" />
                  Submit Delivery
                </button>
              )}
            </div>

            {/* Render SubmitDelivery under the buttons when clicked */}
            {showSubmitDelivery && (
              <div className="mt-4">
                <SubmitDelivery
                  onSubmit={(data, files) => handleOrderSubmit(data, files)}
                  onClose={() => setShowSubmitDelivery(false)}
                />
              </div>
            )}

            <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-100 p-3 rounded-full text-black">
                <FaClock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">
                  Time Remaining
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">
                    <div className="flex space-x-2 mt-2">
                      {[
                        { unit: 'Days', value: timeLeft.days },
                        { unit: 'Hours', value: timeLeft.hours },
                        { unit: 'Minutes', value: timeLeft.minutes },
                        { unit: 'Seconds', value: timeLeft.seconds }
                      ].map(({ unit, value }) => (
                        <div
                          key={unit}
                          className="bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center w-16 h-16 shadow-sm"
                        >
                          <span className="text-2xl font-bold text-gray-800">{value}</span>
                          <span className="text-xs text-gray-500 uppercase">{unit}</span>
                        </div>
                      ))}
                    </div>
                  </span>
                  <span className="ml-1 text-gray-800"></span>
                  {metrics.isLate && (
                    <span className="ml-3 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <FaExclamationCircle className="mr-1" /> Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'delivered':
        return (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                  <FaTruck className="w-5 h-5" />
                </div>
                Delivery Message
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-inner">
                <p className="text-gray-700 whitespace-pre-line">
                  {currentStatusData?.deliveryDescription ||
                    'No delivery message provided.'}
                </p>
              </div>
              <div className="space-y-2 mt-4">
                {currentStatusData?.deliveryAttachments?.map((fileUrl: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-gray-700 truncate max-w-[70%]">
                      {fileUrl.split('/').pop()} {/* Extract the file name from the URL */}
                    </span>
                    <button
                      onClick={() => handleDownload(fileUrl)}
                      className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                      title="Download file"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {isOrderBuyer && orderStatus === 'delivered' && (
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button
                  className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-4 px-5 rounded-lg shadow-md flex items-center justify-center gap-3 font-medium"
                  onClick={handleAcceptDelivery}
                >
                  <FaCheckCircle className="h-5 w-5" />
                  Accept Delivery
                </button>
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 transition-all text-white py-4 px-5 rounded-lg shadow-md flex items-center justify-center gap-3 font-medium"
                  onClick={() => setShowRequestRevision(true)}
                >
                  <FaSync className="h-5 w-5" />
                  Request Revision
                </button>
              </div>
            )}

            {showRequestRevision && (
              <div className="mt-5 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                    <FaSync className="w-5 h-5" />
                  </div>
                  Request Revision
                </h3>
                <RequestRevision
                  onRevisionSubmit={handleRequestRevisionSubmit}
                  onClose={() => setShowRequestRevision(false)}
                />
              </div>
            )}
          </div>
        );

      case 'requestedRevision':
        return (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                  <FaSync className="w-5 h-5" />
                </div>
                Revision Request
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-inner">
                <p className="text-gray-700 whitespace-pre-line">
                  {currentStatusData?.reason || 'No reason provided.'}
                </p>
              </div>
              <div className="mt-4 border-t pt-4 border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attachments
                </h4>
                <div className="space-y-2">
                  {currentStatusData?.deliveryAttachments?.map((fileUrl: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-gray-700 truncate max-w-[70%]">
                        {fileUrl.split('/').pop()} {/* Extract the file name from the URL */}
                      </span>
                      <button
                        onClick={() => handleDownload(fileUrl)}
                        className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                        title="Download file"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {isOrderSeller && (
                    <button
                      onClick={() => setShowSubmitDelivery(!showSubmitDelivery)}
                      className="mt-5 flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium"
                    >
                      <FaPaperPlane className="h-5 w-5" />
                      Submit Delivery
                    </button>
                  )}
                </div>

                {/* Render SubmitDelivery under the buttons when clicked */}
                {showSubmitDelivery && (
                  <div className="mt-4">
                    <SubmitDelivery
                      onSubmit={(data, files) => handleOrderSubmit(data, files)}
                      onClose={() => setShowSubmitDelivery(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <div className="bg-gray-800 p-4 rounded-full mb-6 shadow-lg">
              <FaCheckCircle className="text-white h-12 w-12" />
            </div>
            <h3 className="text-gray-800 font-bold text-2xl mb-2">
              Order Successfully Completed!
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              All requirements have been met and the order has been marked as
              complete. Thank you for using our platform.
            </p>
          </div>
        );

      case 'waitingReview':
        return (
          <>
            {reviewDetails ? (
              <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                    <FaStar className="w-5 h-5" />
                  </div>
                  Buyer's Review
                </h3>
                <ViewReview
                  rating={reviewDetails.rating}
                  desc={reviewDetails.desc}
                />
              </div>
            ) : (
              isOrderBuyer && (
                <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                      <FaStar className="w-5 h-5" />
                    </div>
                    Share Your Experience
                  </h3>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    Review Now
                  </button>
                </div>
              )
            )}
          </>
        );

      default:
        return (
          <p className="text-gray-500 italic text-center p-5">
            No actions available at this stage.
          </p>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 transition-all">
      {/* Header with Progress Bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex p-6 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">{t('details.title')}</h1>
              <div
                className={`ml-4 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700`}
              >
                {statusConfig[orderStatus as keyof typeof statusConfig]?.label}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2 flex items-center">
              <span className="mr-2 text-orange-500">
                {statusConfig[orderStatus as keyof typeof statusConfig]?.icon}
              </span>
              {
                statusConfig[orderStatus as keyof typeof statusConfig]
                  ?.description
              }
            </div>
          </div>
          
          {/* View Profile Button */}
          {isOrderBuyer && orderDetails?.sellerId && (
            <button
              onClick={() => router.push(`/freelancer/${sellerUsername}`)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-all shadow-sm flex-shrink-0"
            >
              View Seller
            </button>
          )}
          {isOrderSeller && orderDetails?.buyerId && (
            <button
              onClick={() => router.push(`/client/${orderDetails.buyerId}`)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-all shadow-sm flex-shrink-0"
            >
              View Client
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Order Summary - Card with improved design */}
        <div className="mb-8 p-6 border border-gray-200 rounded-xl shadow-md bg-white hover:shadow-lg transition-all">
          <OrderCard
            orderId={orderDetails.orderId}
            gigTitle={orderDetails.gigTitle}
            sellerImage={sellerImage}
            sellerUsername={sellerUsername}
            orderPrice={orderDetails.orderPrice}
            createdAt={orderDetails.createdAt || orderDetails.orderDate}
            dueDate={orderDetails.deliveryDate}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Order Progress (full width) */}
          <div className="w-full">
            <OrderTimeline
              status={orderStatus}
              timeline={orderDetails.timeline || []}
              isPaid={orderDetails.isPaid}
              orderDate={orderDetails.createdAt}
              deliveryDate={orderDetails.deliveryDate}
              orderCompletionDate={orderDetails.orderCompletionDate}
              isUserSeller={isOrderSeller}
              isUserBuyer={isOrderBuyer}
              orderId={orderDetails.orderId}
              onApproveDelivery={handleAcceptDelivery}
              onAdvanceStatus={handleAdvanceOrderStatus}
            />

            {/* Action Buttons - Only for buyers on active orders */}
            {isOrderBuyer && ['accepted', 'requirementsSubmitted', 'started', 'halfwayDone', 'delivered', 'requestedRevision'].includes(orderStatus) && (
              <div className="mt-4 flex justify-end gap-3">
                {metrics.isLate && (
                  <button
                    onClick={handleCancelOrder}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                  >
                    <FaExclamationCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setShowExtendTimeline(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                >
                  <FaCalendarAlt className="w-4 h-4" />
                  Extend Timeline
                </button>
              </div>
            )}
          </div>


        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative animate-fadeInUp">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmittingReview}
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <FaSync className="w-4 h-4 rotate-45" />
                </div>
              </button>

              <div className="mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <FaStar className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Review Your Experience</h3>
                <p className="text-gray-600">
                  Your feedback helps {sellerName} improve and assists other buyers in making better decisions.
                </p>
              </div>

              <Review
                onSubmit={handleSubmitReview}
                isSubmitting={isSubmittingReview}
              />

              {!isSubmittingReview && (
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-full mt-4 text-gray-500 font-medium hover:text-gray-700 transition-colors py-2"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        )}

        {/* Extend Timeline Modal */}
        {showExtendTimeline && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaCalendarAlt className="w-5 h-5 mr-2 text-blue-600" />
                Extend Order Timeline
              </h3>
              <p className="text-gray-600 mb-4">
                Add extra days to the delivery deadline. The freelancer will be notified of this extension.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Days (1-30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="Why are you extending the timeline?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowExtendTimeline(false);
                    setExtendDays(1);
                    setExtendReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendTimeline}
                  disabled={isExtending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isExtending ? 'Extending...' : `Extend by ${extendDays} day${extendDays > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Timeline - Vertical with improved visual design */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
              <FaHistory className="w-5 h-5" />
            </div>
            {t('details.timeline.title')}
          </h2>
          <div className="relative">
            {/* Vertical line with gradient */}
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-400 via-gray-400 to-gray-300 rounded-full"></div>

            <div className="space-y-8">
              {filteredDropdownItems.map((item: any) => {
                const isOpen = openDropdown === item.key;
                const currentStatusData = statusHistory.find(
                  (history: HistoryItem) => history._id === item.key,
                );
                const isCurrentStatus = item.status === orderStatus;
                const isCompleted =
                  statusOrder.indexOf(item.status) <
                  statusOrder.indexOf(orderStatus);

                return (
                  <div key={item.key} className="relative pl-16">
                    {/* Timeline dot with animation on hover */}
                    <div
                      className={`absolute left-4 w-6 h-6 rounded-full flex items-center justify-center 
                        transform transition-all duration-300 ${isCurrentStatus
                          ? `${item.bgColor} ring-4 ring-white border ${item.borderColor} scale-125 shadow-md`
                          : isCompleted
                            ? 'bg-gray-800 shadow-md'
                            : 'bg-gray-200'
                        } ${isOpen ? 'scale-125 shadow-lg' : ''}`}
                    >
                      {isCompleted && !isCurrentStatus && (
                        <FaCheckCircle className="text-white text-xs" />
                      )}
                    </div>

                    <div
                      className={`border rounded-xl transition-all duration-300 ${isCurrentStatus
                        ? `border-2 ${item.borderColor} shadow-lg`
                        : 'border-gray-200 hover:shadow-md'
                        } ${isOpen ? 'shadow-lg transform scale-101' : ''}`}
                    >
                      <button
                        className={`flex justify-between items-center w-full p-5 rounded-t-xl focus:outline-none ${isCurrentStatus
                          ? `${item.bgColor}`
                          : 'bg-white hover:bg-gray-50'
                          } transition-all`}
                        onClick={() =>
                          setOpenDropdown(isOpen ? null : item.key)
                        }
                      >
                        <span className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${isCurrentStatus
                              ? 'bg-white bg-opacity-50'
                              : isCompleted
                                ? 'bg-gray-100'
                                : 'bg-gray-100'
                              }`}
                          >
                            <span
                              className={`${isCurrentStatus ? 'text-black' : isCompleted ? 'text-black' : 'text-gray-500'}`}
                            >
                              {item.icon}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`font-semibold text-base ${isCurrentStatus ? 'text-black' : isCompleted ? 'text-gray-700' : 'text-gray-700'}`}
                            >
                              {item.label}
                            </span>
                            {isCurrentStatus && (
                              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-gray-800 shadow-sm">
                                {t('details.timeline.active')}
                              </span>
                            )}
                            {currentStatusData && currentStatusData.date && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <FaCalendarAlt className="mr-1 text-gray-400" />
                                {new Date(
                                  currentStatusData.date,
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        </span>
                        <span
                          className={`transition-all duration-300 transform ${isOpen ? 'rotate-180' : ''} 
                                          bg-white p-2 rounded-full text-gray-500 shadow-sm ${isOpen ? 'bg-gray-100' : ''}`}
                        >
                          <FaChevronDown className="h-4 w-4" />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-5 border-t border-gray-200 bg-white rounded-b-xl transition-all">
                          {renderActions(item.status, currentStatusData)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key Metrics Footer with improved design - Single Row */}
        <div className="mt-10 p-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-lg">
          <h3 className="text-gray-800 font-medium mb-4 flex items-center">
            <FaChartLine className="mr-2 text-gray-600" />
            {t('details.metrics.title')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Time Elapsed Card */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-gray-100 mr-3">
                  <FaCalendarAlt className="text-gray-600 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('details.metrics.timeElapsed')}</div>
                  <div className="font-semibold text-gray-800">
                    {metrics.daysSinceCreation} {metrics.daysSinceCreation === 1 ? t('details.metrics.day') : t('details.metrics.days')}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Remaining Card */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start">
                <div className="p-2 rounded-md bg-gray-100 mr-3 flex-shrink-0">
                  <FaClock className="text-gray-600 h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500 mb-1">{t('details.metrics.timeRemaining')}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-base sm:text-lg text-gray-800">{timeLeft.days}</span>
                    <span className="text-xs text-gray-500">DAYS</span>
                    <span className="font-bold text-base sm:text-lg text-gray-800 ml-1">{timeLeft.hours}</span>
                    <span className="text-xs text-gray-500">HOURS</span>
                    <span className="font-bold text-base sm:text-lg text-gray-800 ml-1">{timeLeft.minutes}</span>
                    <span className="text-xs text-gray-500 hidden sm:inline">MINUTES</span>
                    <span className="text-xs text-gray-500 sm:hidden">MIN</span>
                    <span className="font-bold text-base sm:text-lg text-gray-800 ml-1">{timeLeft.seconds}</span>
                    <span className="text-xs text-gray-500 hidden sm:inline">SECONDS</span>
                    <span className="text-xs text-gray-500 sm:hidden">SEC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Revisions Card */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-gray-100 mr-3">
                  <FaSync className="text-gray-600 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('details.metrics.totalRevisions')}</div>
                  <div className="font-semibold text-gray-800">
                    {metrics.totalRevisions}
                  </div>
                </div>
              </div>
            </div>

            {/* Completion Card */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-gray-100 mr-3">
                  <FaPercent className="text-gray-600 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('details.completion')}</div>
                  <div className="font-semibold text-gray-800">
                    {progressPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrderSection;
