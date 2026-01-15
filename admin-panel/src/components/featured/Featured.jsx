import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { TrendingUp, TrendingDown, MoreVertical } from "lucide-react";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import featuredTranslations from "../../localization/featured.json";

const Featured = ({ totalSalesToday, salesLastWeek, salesLastMonth, title, darkMode }) => {
  const { getTranslation } = useLocalization();
  
  const target = 5000;
  const percentage = Math.min(Math.round((totalSalesToday / target) * 100), 100);
  
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title || getTranslation(featuredTranslations, "totalRevenue") || "Total Revenue"}
        </h2>
        <button className={`p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        }`}>
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        {/* Progress Circle */}
        <div className="w-32 h-32">
          <CircularProgressbar 
            value={percentage} 
            text={`${percentage}%`} 
            strokeWidth={8}
            styles={buildStyles({
              pathColor: '#f97316',
              textColor: darkMode ? '#fff' : '#1f2937',
              trailColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
              textSize: '1.5rem',
            })}
          />
        </div>
        
        {/* Today's Sales */}
        <div className="text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTranslation(featuredTranslations, "totalSalesMadeToday") || "Total Sales Made Today"}
          </p>
          <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ${totalSalesToday?.toLocaleString() || 0}
          </p>
        </div>
        
        <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {getTranslation(featuredTranslations, "previousTransactionsProcessing") || "Previous transactions processing. Last payments may not be included."}
        </p>
        
        {/* Stats Row */}
        <div className="w-full grid grid-cols-3 gap-4 mt-2">
          {/* Target */}
          <div className={`p-3 rounded-xl text-center ${
            darkMode ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTranslation(featuredTranslations, "target") || "Target"}
            </p>
            <div className="flex items-center justify-center gap-1 text-red-500">
              <TrendingDown className="w-4 h-4" />
              <span className="font-semibold">${target.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Last Week */}
          <div className={`p-3 rounded-xl text-center ${
            darkMode ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTranslation(featuredTranslations, "lastWeek") || "Last Week"}
            </p>
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">${salesLastWeek?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          {/* Last Month */}
          <div className={`p-3 rounded-xl text-center ${
            darkMode ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTranslation(featuredTranslations, "lastMonth") || "Last Month"}
            </p>
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">${salesLastMonth?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Featured;
