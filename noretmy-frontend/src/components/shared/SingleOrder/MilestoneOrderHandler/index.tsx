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
    FaShieldAlt,
    FaPaperPlane,
    FaHistory,
    FaCalendarAlt,
    FaEye,
} from 'react-icons/fa';

import { useSelector } from 'react-redux';
// import OrderDetails from '../Actions/OrderCreated';
import axios from 'axios';
import OrderDetails from '../../Order-Details-Buyer/Actions/OrderCreated';
import SubmitRequirements from '../../Order-Details-Buyer/Actions/SubmitRequirements';
import ViewRequirements from '../../Order-Details-Buyer/Actions/ViewRequirements';
import SubmitDelivery from '../../Order-Details-Buyer/Actions/SubmitDelivery';
import RequestRevision from '../../Order-Details-Buyer/Actions/RequestRevision';
import ViewReview from '../../Order-Details-Buyer/Actions/ViewReview';
import OrderCard from '../../Order-Details-Buyer/OrderCard';
import { Download, Milestone, Paperclip, Truck } from 'lucide-react';
import { useCountdown } from '@/util/time';
import { showError, showSuccess } from '@/util/toast';
import ReviewForm from '../../Order-Details-Buyer/Actions/reviewSeller';
// import SubmitDelivery from '../Actions/SubmitDelivery';

interface SingleOrderSectionProps {
    sellerName: string;
    sellerUsername: string;
    sellerImage: string;
    orderDetails: any;
    selectedMilestone: any,
    onOperationComplete: () => void;
    canReview : boolean;
    reviewDetails: any;

}

type HistoryItem = {
    _id: string;
    status: string; // Adjust this type based on the possible statusesOO
};

const SingleOrderSection: React.FC<SingleOrderSectionProps> = ({
    sellerName,
    sellerUsername,
    sellerImage,
    selectedMilestone,
    orderDetails,
    reviewDetails,
    onOperationComplete,
    canReview,
}) => {

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showRequestRevision, setShowRequestRevision] = useState(false);
    const [activeTab, setActiveTab] = useState<'order' | 'chat'>('order');
    const { orderStatus, requirements, attachments } =
        orderDetails;
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;



        let { statusHistory = [] } = selectedMilestone;

        if (canReview) {
            const reviewStatus = { status: "waitingReview", timestamp: new Date().toISOString() };
            statusHistory = [...statusHistory, reviewStatus];  
        }


    const [showSubmitDelivery, setShowSubmitDelivery] = useState(false);

    const user = useSelector((state: any) => state.auth?.user);
    const isSeller = user?.isSeller;

    const statusConfig = {
        approved: {
            label: 'Milstone Completed',
            icon: <FaCheckCircle className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'All deliverables have been completed and accepted',
        },
        waitingReview: {
            label: 'Awaiting Review',
            icon: <FaStar className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'Waiting for buyer to leave a review',
        },
        requestedRevision: {
            label: 'Revision Requested',
            icon: <FaSync className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'Buyer has requested changes to the delivery',
        },
        delivered: {
            label: 'Delivery Submitted',
            icon: <FaTruck className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'Seller has submitted deliverables for review',
        },
        started: {
            label: 'Order In Progress',
            icon: <FaPlayCircle className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'Seller is actively working on your order',
        },
        requirementsSubmitted: {
            label: 'Requirements Submitted',
            icon: <FaFileAlt className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'Project specifications have been provided',
        },
        created: {
            label: 'Order Created',
            icon: <FaPlusCircle className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-card',
            borderColor: 'border-gray-200',
            description: 'Initial order has been placed',
        },
        pending: {
            label: 'Milestone pending',
            icon: <FaCheckCircle className="w-5 h-5" />,
            color: 'text-black',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-200',
            description: 'All deliverables have been completed and accepted',
        },
    };

    const statusOrder = [
        'pending',
        'started',
        'delivered',
        'requestedRevision',
        'waitingReview',
        'approved'
    ];

    // Calculate progress percentage for progress bar
    const progressPercentage = useMemo(() => {
        const currentIndex = statusOrder.findIndex(
            (status) => status === orderStatus,
        );
        return currentIndex >= 0
            ? Math.min(
                Math.round((currentIndex / (statusOrder.length - 1)) * 100),
                100,
            )
            : 0;
    }, [orderStatus]);

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

    console.log(filteredDropdownItems);

    const handleApiRequest = async (endpoint: string, data?: any) => {
        try {
            const res = await axios.put(
                `${BACKEND_URL}/orders/${endpoint}`,
                data,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Set correct content type for file uploads
                    },  
                    withCredentials: true, 
                },
            );

            if (res.status === 200) {
                showSuccess(res.data.message);
                onOperationComplete();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    //   const  handleRequirementsSubmission =  async (requirements:string)=>{

    //     try {
    //         console.log("Requirements are submitted succesfully!")
    //         const response = await axios.put("https://api.noretmy.com/api/orders/requirements-submit",{requirements,orderId:orderDetails.orderId},{withCredentials:true});

    //         if(response.status==200){
    //           // showToast('success', 'Requirements Submission', 'Requirements submitted successfully!');
    //           console.log("Order Requiremnets succesfully submitted")
    //           onOperationComplete();
    //         }

    //     } catch (error) {
    //         console.log("Error in submitting the requirments!",error)
    //     }
    //  }

    // eslint-disable-next-line @typescript-eslint/no-shadow

    const handleRequirementsSubmission = (
        requirements: string,
        files: File[],
    ) => {
        const formData = new FormData();
        formData.append('orderId', orderDetails.orderId);
        formData.append('requirements', requirements);

        // Append each file
        files.forEach((file) => {
            formData.append('files', file);
        });

        handleApiRequest('requirements-submit', formData);
    };



    const handleOrderStarted = () => {
        // const formData = new FormData();
        // formData.append('orderId', orderDetails.orderId);
        handleApiRequest('start', { orderId: orderDetails.orderId });

        
    };
    const handleOrderSubmit = (deliveryDescription: string) =>
        handleApiRequest('deliver', {
            orderId: orderDetails.orderId,
            deliveryDescription,
        });
    const handleAcceptDelivery = () =>
        handleApiRequest('accept', { orderId: orderDetails.orderId });
    const handleRequestRevisionSubmit = (reason: string) =>
        handleApiRequest('revision-request', {
            orderId: orderDetails.orderId,
            reason,
        });


        const handleSubmitReview = async (rating: number, desc: string) => {
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
          
              console.log("Review submitted successfully:", response.data);
        
              if(response.status==200){
                showSuccess("Review submitted successfully!")
              }
            } catch (error) {
              console.error("Something went wrong while submitting the review:", error);
              // Optionally show an error toast
              showError(error)
            }
          };

    // Calculate key metrics
    const metrics = useMemo(() => {
        const startDate = new Date(orderDetails.createdAt);
        const currentDate = new Date();
        const daysPassed = Math.floor(
            (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
            daysSinceCreation: daysPassed,
            timeLeft: orderDetails.deadline
                ? Math.max(
                    0,
                    Math.floor(
                        (new Date(orderDetails.deadline).getTime() -
                            currentDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                )
                : 'N/A',
            totalRevisions: statusHistory.filter(
                (h: HistoryItem) => h.status === 'requestedRevision',
            ).length,
            isLate:
                orderDetails.deadline && new Date(orderDetails.deadline) < currentDate,
        };
    }, [orderDetails, statusHistory]);

    const handleStart = async (
        status?: string,
        deliveryDescription?: string,
        files?: File[],
        reason?: string
    ) => {
        try {
            if (!selectedMilestone || !orderDetails) {
                console.error("Milestone or order details are missing!");
                return;
            }

            console.log(files);

            const formData = new FormData();

            // Append only provided values
            if (files && files.length > 0) {
                files.forEach((file) => formData.append("files", file));
            }

            if (orderDetails?.orderId) formData.append("orderId", orderDetails.orderId);
            if (selectedMilestone?._id) formData.append("milestoneId", selectedMilestone._id);
            if (status) formData.append("newStatus", status);
            if (deliveryDescription) formData.append("deliveryDescription", deliveryDescription);
            if (reason) formData.append("reason", reason);

            console.log("Submitting milestone order data:", {
                orderId: orderDetails?.orderId,
                milestoneId: selectedMilestone?._id,
                newStatus: status,
                deliveryDescription,
                reason,
                files,
            });

            const response = await axios.put(
                `${BACKEND_URL}/orders/milestone`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.status == 200 || response.status == 201 || response.status == 204) {
                console.log("Status changed successfully!");
                showSuccess(response.data.message);
                onOperationComplete();
            }
        } catch (error: any) {
            console.error("Error in submitting the order!", error.response?.data || error.message);
        }
    };



    const handleDownload = (fileUrl: string, fileName: string) => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    console.log()


    const renderActions = (status: string, currentStatusData: any) => {
        switch (status) {
            case 'pending':
                return (
                    <div>
                        <OrderDetails orderDate={orderDetails.orderDate} deliveryDate={selectedMilestone.deliveryDate} sellerName={sellerUsername} price={orderDetails.orderPrice} />
                        {/* {!isSeller && orderStatus === 'created' && (
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
                                    onClose={() => console.log('On Close clicked')}
                                />
                            </div>
                        )} */}


                        {isSeller && selectedMilestone.status === 'pending' && (
                            <button
                                onClick={() => {
                                    console.log("started")
                                    handleStart("started")
                                }} // Replace with your function to start the order
                                className="mt-4 bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-900 transition-all"
                            >
                                Start Order
                            </button>
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
                            onClose={() => console.log('Clicked on close')}
                        // orderStatus={orderStatus}
                        />

                        {/* Start Button */}
                        {isSeller && orderStatus === 'requirementsSubmitted' && (
                            <button
                                onClick={handleOrderStarted} // Replace with your function to start the order
                                className="mt-4 bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-900 transition-all"
                            >
                                Start Order
                            </button>
                        )}
                    </div>
                );

            case 'started':
                return (
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <button className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium">
                                <FaComments className="h-5 w-5" />
                                Message {isSeller ? 'Buyer' : 'Seller'}
                            </button>

                            {isSeller && (
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
                                    onSubmit={(data, files) => {
                                        console.log("Files", files);
                                        handleStart("delivered", data, files)
                                    }}
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
                                {/* <div className="flex space-x-2 mt-2">

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
                                        <span className="ml-1 text-gray-800">days</span>
                                        {metrics.isLate && (
                                            <span className="ml-3 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                                                <FaExclamationCircle className="mr-1" /> Overdue
                                            </span>
                                        )}
                                    </div> */}
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
                                    <Truck className="w-5 h-5" />
                                </div>
                                Delivery Message
                            </h3>

                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-inner">
                                <p className="text-gray-700 whitespace-pre-line mb-4">
                                    {currentStatusData.deliveryDescription}
                                </p>

                                {/* Attachments Section */}
                                {/* {currentStatusData.length > 0 && ( */}
                                <div className="mt-4 border-t pt-4 border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                                        <Paperclip className="mr-2 h-4 w-4" />
                                        Attachments
                                    </h4>
                                    <div className="space-y-2">
                                        {currentStatusData.attachmentUrls.map((fileUrl, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                                            >
                                                <span className="text-gray-700 truncate max-w-[70%]">
                                                    {fileUrl.split('/').pop()} {/* Extract the file name from the URL */}
                                                </span>
                                                <button
                                                    onClick={() => handleDownload(fileUrl, "Dummy File")}
                                                    className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                                                    title="Download file"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>


                        {!isSeller && currentStatusData.status === 'delivered' && (
                            <div className="flex flex-col sm:flex-row gap-3 mt-5">
                                <button
                                    className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-4 px-5 rounded-lg shadow-md flex items-center justify-center gap-3 font-medium"
                                    onClick={() => handleStart("approved",)}
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
                                    onRevisionSubmit={(reason, files) => handleStart("requestedRevision", "", files, reason)}
                                    onClose={() => console.log('Clicked on close')}
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
                                    {currentStatusData.attachmentUrls.map((fileUrl, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                                        >
                                            <span className="text-gray-700 truncate max-w-[70%]">
                                                {fileUrl.split('/').pop()} {/* Extract the file name from the URL */}
                                            </span>
                                            <button
                                                onClick={() => handleDownload(fileUrl, "Dummy File")}
                                                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                                                title="Download file"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {isSeller && (
                            <button
                                onClick={() => setShowSubmitDelivery(!showSubmitDelivery)}
                                className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium"
                            >
                                <FaPaperPlane className="h-5 w-5" />
                                Submit Delivery
                            </button>
                        )}


                        {/* Render SubmitDelivery under the buttons when clicked */}
                        {showSubmitDelivery && (
                            <div className="mt-4">
                                <SubmitDelivery
                                    onSubmit={(data, files) => {
                                        console.log("Files", files);
                                        handleStart("delivered", data, files)
                                    }}
                                    onClose={() => setShowSubmitDelivery(false)}
                                />
                            </div>
                        )}

                    </div>
                );
            case 'approved':
                return (
                    <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                        <div className="bg-gray-800 p-4 rounded-full mb-6 shadow-lg">
                            <FaCheckCircle className="text-white h-12 w-12" />
                        </div>
                        <h3 className="text-gray-800 font-bold text-2xl mb-2">
                            🎉 Your milestone is marked as completed ! 🎉
                        </h3>
                        <p className="text-gray-600 mb-6 text-center max-w-md">
                            All requirements have been met and the milestone has been marked as
                            complete. Thank you for using our platform.
                        </p>
                        <div className="flex items-center justify-center bg-white p-3 rounded-full shadow-sm">
                            <div className="bg-gray-100 p-2 rounded-full mr-2">
                                <FaShieldAlt className="text-black h-5 w-5" />
                            </div>
                            <span className="text-gray-700 font-medium">Order Protected</span>
                        </div>

                        
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
                          !isSeller && (
                            <div className="bg-white p-6 rounded-lg border-l-4 border border-gray-300 shadow-sm hover:shadow-md transition-all">
                              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                                  <FaStar className="w-5 h-5" />
                                </div>
                                Share Your Experience
                              </h3>
                              <ReviewForm onSubmit={handleSubmitReview} />
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
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50">
                <div className="flex p-6">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Order #{orderDetails.orderId}
                            </h1>
                            <div
                                className={`ml-4 px-3 py-1 rounded-full text-xs font-medium 
                      ${statusConfig[orderStatus as keyof typeof statusConfig]?.bgColor} 
                      ${statusConfig[orderStatus as keyof typeof statusConfig]?.color}`}
                            >
                                {statusConfig[orderStatus as keyof typeof statusConfig]?.label}
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 flex items-center">
                            <span className="mr-2">
                                {statusConfig[orderStatus as keyof typeof statusConfig]?.icon}
                            </span>
                            {
                                statusConfig[orderStatus as keyof typeof statusConfig]
                                    ?.description
                            }
                        </div>
                    </div>
                    <div className="hidden md:flex items-center">
                        <span
                            className={`px-6 py-3 rounded-lg text-sm font-medium shadow-md 
                      ${statusConfig[orderStatus as keyof typeof statusConfig]?.bgColor} 
                      ${statusConfig[orderStatus as keyof typeof statusConfig]?.color}
                      border ${statusConfig[orderStatus as keyof typeof statusConfig]?.borderColor}`}
                        >
                            <div className="flex items-center">
                                {statusConfig[orderStatus as keyof typeof statusConfig]?.icon}
                                <span className="ml-2">
                                    {
                                        statusConfig[orderStatus as keyof typeof statusConfig]
                                            ?.label
                                    }
                                </span>
                            </div>
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-t border-gray-200">
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-all ${activeTab === 'order'
                            ? 'text-black border-b-2 border-black bg-gray-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('order')}
                    >
                        <span className="flex items-center justify-center">
                            <FaHistory className="mr-2" />
                            Order Timeline
                        </span>
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-all ${activeTab === 'chat'
                            ? 'text-black border-b-2 border-black bg-gray-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <span className="flex items-center justify-center">
                            <FaComments className="mr-2" />
                            Message Center
                        </span>
                    </button>
                </div>
            </div>

            {activeTab === 'order' && (
                <div className="p-6">
                    {/* Order Summary - Card with improved design */}
                    {/* <div className="mb-8 p-6 border border-gray-200 rounded-xl shadow-md bg-white hover:shadow-lg transition-all">
                        <OrderCard
                            orderId={orderDetails.orderId}
                            gigTitle={orderDetails.gigTitle}
                            sellerImage={sellerImage}
                            sellerUsername={sellerUsername}
                            orderPrice={orderDetails.orderPrice}
                        />
                    </div> */}

                    {/* Order Timeline - Vertical with improved visual design */}
                    <div className="mt-10">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <div className="bg-gray-100 p-2 rounded-full mr-3 text-black">
                                <FaHistory className="w-5 h-5" />
                            </div>
                            Order Timeline
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
                                                                    Active
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

                    {/* Key Metrics Footer with improved design */}
                    {/* <div className="mt-10 p-5 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-b-lg">
            <h3 className="text-gray-800 font-medium mb-4 flex items-center">
              <FaChartLine className="mr-2 text-indigo-600" />
              Order Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-md bg-indigo-100 mr-3">
                    <FaCalendarAlt className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Time Elapsed</div>
                    <div className="font-semibold text-gray-800">
                      {metrics.daysSinceCreation} days
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-md bg-indigo-100 mr-3">
                    <FaClock className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                    <div
                      className={`font-semibold ${metrics.isLate ? 'text-red-600' : 'text-gray-800'}`}
                    >
                      {metrics.timeLeft === 'N/A'
                        ? 'N/A'
                        : `${metrics.timeLeft} days`}
                      {metrics.isLate && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full shadow-sm">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-md bg-indigo-100 mr-3">
                    <FaSync className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Revisions</div>
                    <div className="font-semibold text-gray-800">
                      {metrics.totalRevisions}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-md bg-indigo-100 mr-3">
                    <FaPercent className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Completion</div>
                    <div className="font-semibold text-gray-800">
                      {progressPercentage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="text-center max-w-lg p-6">
                            <div className="mb-4 bg-indigo-100 text-indigo-600 p-3 rounded-full inline-flex">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-gray-800 font-medium text-xl mb-3">
                                Your Messages with {sellerName}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Messages related to this order will appear here. You can discuss
                                requirements, ask questions, or request updates.
                            </p>
                            <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md flex items-center justify-center mx-auto">
                                <FaComments className="inline-block mr-2" />
                                Start Conversation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleOrderSection;
