import React from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Download, RefreshCw } from 'lucide-react';

const DynamicChart = ({ 
  chartConfig, 
  onDownload = null, 
  isDownloading = false,
  height = 300,
  showTitle = true,
  showLegend = true 
}) => {
  if (!chartConfig || !chartConfig.data || chartConfig.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No data available for visualization</p>
        </div>
      </div>
    );
  }

  const { chartType, data, suggestedTitle, confidence } = chartConfig;

  const getChartIcon = () => {
    switch (chartType) {
      case 'pie': return <PieChartIcon className="w-4 h-4" />;
      case 'line': return <TrendingUp className="w-4 h-4" />;
      case 'area': return <Activity className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#E31837"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || `hsl(${index * 45}, 70%, 50%)`} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#E31837" 
              strokeWidth={2}
              dot={{ fill: '#E31837', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#E31837', strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E31837" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#E31837" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#E31837" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        );

      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {showTitle && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getChartIcon()}
              <h3 className="text-lg font-semibold text-gray-900">
                {suggestedTitle || 'Generated Visualization'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {confidence && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {Math.round(confidence * 100)}% confidence
                </span>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:text-gray-300 transition-colors"
                  title={isDownloading ? "Downloading..." : "Download chart"}
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart insights */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500">
          <strong>{data.length}</strong> data points • 
          <strong className="ml-1">{chartType}</strong> chart • 
          Generated from your query
        </div>
      </div>
    </div>
  );
};

export default DynamicChart;
