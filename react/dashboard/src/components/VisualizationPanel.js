import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, X, Sparkles, Download, RefreshCw } from 'lucide-react';
import DynamicChart from './DynamicChart';
import visualizationService from '../services/visualizationService';

const VisualizationPanel = ({ 
  dashboardContext, 
  studentData, 
  isVisible = true,
  onToggle = null 
}) => {
  const [charts, setCharts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [downloadingChart, setDownloadingChart] = useState(null);

  useEffect(() => {
    if (dashboardContext) {
      setSuggestions(visualizationService.generateSuggestions(dashboardContext));
    }
  }, [dashboardContext]);

  const generateVisualization = async (query) => {
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const chartConfig = visualizationService.analyzeQuery(query, { 
        ...dashboardContext, 
        students: studentData 
      });
      
      const newChart = {
        id: Date.now(),
        query: query,
        config: chartConfig,
        timestamp: new Date()
      };
      
      setCharts(prev => [newChart, ...prev]);
      setInputQuery('');
    } catch (error) {
      console.error('Error generating visualization:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateVisualization(inputQuery);
    }
  };

  const removeChart = (chartId) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const handleSuggestionClick = (suggestion) => {
    setInputQuery(suggestion);
    generateVisualization(suggestion);
  };

  const downloadChart = async (chart) => {
    if (downloadingChart === chart.id) return; // Prevent multiple downloads
    
    setDownloadingChart(chart.id);
    try {
      // Find the chart element to capture
      const chartElement = document.querySelector(`[data-chart-id="${chart.id}"]`);
      if (!chartElement) {
        console.error('Chart element not found for download');
        return;
      }

      // Dynamically import html2canvas (install if needed)
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch (error) {
        // Fallback: create a simple JSON download
        console.warn('html2canvas not available, downloading data as JSON');
        downloadChartData(chart);
        return;
      }

      // Capture the chart as canvas
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chart-${chart.query.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (error) {
      console.error('Error downloading chart:', error);
      // Fallback to data download
      downloadChartData(chart);
    } finally {
      setDownloadingChart(null);
    }
  };

  const downloadChartData = (chart) => {
    // Fallback: download chart data as JSON
    const dataToDownload = {
      query: chart.query,
      chartType: chart.config.chartType,
      data: chart.config.data,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-data-${chart.query.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-[#E31837] to-[#B91C1C] text-white rounded-t-lg">
        <div className="p-1.5 bg-white bg-opacity-20 rounded-full">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Dynamic Visualizations</h2>
          <p className="text-xs text-red-100">Generate charts from natural language queries</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-4 py-2 border-b bg-white">
        <div className="flex gap-6 w-full">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for a visualization (e.g., 'Show me alerts by faculty', 'Create a priority pie chart')"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E31837] focus:border-transparent text-base"
            style={{ width: '100%' }}
            disabled={isGenerating}
          />
          <button
            onClick={() => generateVisualization(inputQuery)}
            disabled={!inputQuery.trim() || isGenerating}
            className="flex-shrink-0 px-6 py-3 bg-[#E31837] text-white rounded-lg hover:bg-[#B91C1C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate
              </>
            )}
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && charts.length === 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Try these suggestions:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                  disabled={isGenerating}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="p-4">
        {isGenerating && charts.length === 0 && (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-[#E31837] mx-auto mb-2 animate-spin" />
              <p className="text-gray-600 font-medium">Generating your visualization...</p>
              <p className="text-sm text-gray-500">Analyzing data and creating chart</p>
            </div>
          </div>
        )}

        {charts.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">No visualizations yet</p>
              <p className="text-sm text-gray-500">Type a query above to generate your first chart</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map((chart) => (
            <div key={chart.id} className="relative group" data-chart-id={chart.id}>
              <DynamicChart
                chartConfig={chart.config}
                height={250}
                onDownload={() => downloadChart(chart)}
                isDownloading={downloadingChart === chart.id}
              />
              
              {/* Chart metadata */}
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      "{chart.query}"
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated {chart.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeChart(chart.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                    title="Remove chart"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more suggestions after generating charts */}
        {charts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Generate more visualizations:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.filter(s => !charts.some(c => c.query === s)).slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                  disabled={isGenerating}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
