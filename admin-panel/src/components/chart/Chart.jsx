import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Chart = ({ aspect, title, data, darkMode }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-4 py-3 rounded-xl shadow-lg ${
          darkMode 
            ? 'bg-[#1a1a2e] border border-white/10' 
            : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </p>
          <p className="text-orange-500 font-bold text-lg">
            ${payload[0].value?.toLocaleString() || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full">
      <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      <ResponsiveContainer width="100%" aspect={aspect}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke={darkMode ? '#6b7280' : '#9ca3af'}
            tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis 
            stroke={darkMode ? '#6b7280' : '#9ca3af'}
            tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Total"
            stroke="#f97316"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#f97316', 
              stroke: darkMode ? '#1a1a2e' : '#fff',
              strokeWidth: 2 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
