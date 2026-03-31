import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { DarkModeContext } from "../../context/darkModeContext";
import { getAdminJobDetail } from "../../utils/adminApi";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { ArrowLeft, User, Tag, Calendar, Layers, FileText, CheckSquare } from "lucide-react";

const formatMoney = (value) => {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
};

const PlanCard = ({ darkMode, planName, planData }) => {
  if (!planData || typeof planData !== "object") {
    return null;
  }

  const title = String(planName || "Plan");

  return (
    <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-100"}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-semibold capitalize ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h4>
        <span className={`text-sm font-semibold ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
          {formatMoney(planData.price)}
        </span>
      </div>
      <div className={`text-sm space-y-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <p>Delivery: {planData.deliveryTime || "N/A"}</p>
        <p>Revisions: {planData.revisionNumber ?? "N/A"}</p>
        {planData.desc && <p className="wrap-break-word">{planData.desc}</p>}
      </div>
    </div>
  );
};

const SingleJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminJobDetail(jobId);
        const payload = response?.data || response;
        if (!payload?._id) {
          throw new Error("Gig details not found");
        }
        setJob(payload);
      } catch (err) {
        setError(err.message || "Failed to load gig details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  if (loading) {
    return <LoadingSpinner message="Loading gig details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} retryText="Retry" />;
  }

  const sellerDisplayName = job?.seller?.fullName || job?.seller?.username || "Unknown Seller";
  const plans = Object.entries(job?.pricingPlan || {}).filter(([_, value]) => value && typeof value === "object");

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/jobs")}
          className={`p-2 rounded-lg transition-all ${
            darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Gig Details</h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Gig ID: {job?._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-2xl ${
          darkMode ? "bg-[#1a1a2e]/80 border border-white/10" : "bg-white border border-gray-100 shadow-lg"
        }`}>
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>{job?.title || "Untitled Gig"}</h2>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{job?.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Tag className="w-4 h-4 inline mr-1" /> Category
              </p>
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{job?.cat || "N/A"}</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{job?.subCat || "N/A"}</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</p>
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{job?.jobStatus || "N/A"}</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Upgrade: {job?.upgradeOption || "Free"}</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Calendar className="w-4 h-4 inline mr-1" /> Created
              </p>
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                {job?.createdAt ? new Date(job.createdAt).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Keywords</p>
              <p className={`font-medium wrap-break-word ${darkMode ? "text-white" : "text-gray-900"}`}>
                {Array.isArray(job?.keywords) && job.keywords.length ? job.keywords.join(", ") : "N/A"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Layers className="w-5 h-5 inline mr-2" /> Plans
            </h3>
            {plans.length === 0 && (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No pricing plans available.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map(([planName, planData]) => (
                <PlanCard key={planName} darkMode={darkMode} planName={planName} planData={planData} />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <CheckSquare className="w-5 h-5 inline mr-2" /> Why Choose Me
            </h3>
            {Array.isArray(job?.whyChooseMe) && job.whyChooseMe.length > 0 ? (
              <ul className={`list-disc pl-5 space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {job.whyChooseMe.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No highlights provided.</p>
            )}
          </div>

          <div>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <FileText className="w-5 h-5 inline mr-2" /> FAQ
            </h3>
            {Array.isArray(job?.faqs) && job.faqs.length > 0 ? (
              <div className="space-y-3">
                {job.faqs.map((faq, idx) => (
                  <div key={`${faq?.question || idx}-${idx}`} className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{faq?.question || "Question"}</p>
                    <p className={`text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{faq?.answer || "No answer provided."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No FAQ entries available.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl ${
            darkMode ? "bg-[#1a1a2e]/80 border border-white/10" : "bg-white border border-gray-100 shadow-lg"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <User className="w-5 h-5 inline mr-2" /> Seller
            </h2>
            <div className="space-y-2">
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{sellerDisplayName}</p>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Username: {job?.seller?.username || "N/A"}</p>
              <p className={`text-sm break-all ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{job?.seller?.email || "N/A"}</p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${
            darkMode ? "bg-[#1a1a2e]/80 border border-white/10" : "bg-white border border-gray-100 shadow-lg"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Attachments</h2>
            {Array.isArray(job?.photos) && job.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {job.photos.map((photo, idx) => (
                  <a key={`${photo}-${idx}`} href={photo} target="_blank" rel="noreferrer" className="block">
                    <img src={photo} alt={`Gig-${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  </a>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No attachments available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleJob;
