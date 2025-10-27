import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, TrendingUp, BarChart3, PieChart, FileText, Share2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterPlot, Scatter } from 'recharts';

const AdvancedReporting = ({ alertData, studentData, timeRange = '30d' }) => {
  const [reportType, setReportType] = useState('executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictiveData, setPredictiveData] = useState(null);

  useEffect(() => {
    generatePredictiveAnalytics();
  }, [alertData, timeRange]);

  const generatePredictiveAnalytics = () => {
    if (!alertData || alertData.length === 0) return;

    // Simulate predictive modeling
    const historicalData = processHistoricalTrends();
    const riskPredictions = calculateRiskScores();
    const interventionEffectiveness = analyzeInterventionSuccess();

    setPredictiveData({
      trends: historicalData,
      riskScores: riskPredictions,
      interventions: interventionEffectiveness
    });
  };

  const processHistoricalTrends = () => {
    // Generate time series data for the last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        alerts: Math.floor(Math.random() * 50) + 20,
        resolved: Math.floor(Math.random() * 40) + 15,
        predicted: Math.floor(Math.random() * 55) + 25, // Future prediction
        riskScore: Math.random() * 30 + 40
      });
    }
    return months;
  };

  const calculateRiskScores = () => {
    const faculties = ['LAPS', 'Schulich', 'Lassonde', 'Science', 'Health', 'AMPD'];
    return faculties.map(faculty => ({
      faculty,
      currentRisk: Math.random() * 30 + 20,
      predictedRisk: Math.random() * 40 + 15,
      studentCount: Math.floor(Math.random() * 500) + 200,
      alertRate: Math.random() * 15 + 5
    }));
  };

  const analyzeInterventionSuccess = () => {
    const interventions = ['Academic Support', 'Financial Aid', 'Counseling', 'Mentoring', 'Tutoring'];
    return interventions.map(type => ({
      type,
      successRate: Math.random() * 30 + 60,
      averageTime: Math.floor(Math.random() * 10) + 3,
      cost: Math.floor(Math.random() * 500) + 200,
      satisfaction: Math.random() * 20 + 75
    }));
  };

  const generateExecutiveReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reportContent = `
# Executive Summary - Student Early Alert Analytics
## Report Period: ${timeRange}
Generated on: ${new Date().toLocaleDateString()}

## Key Metrics
- **Total Alerts**: ${alertData?.length || 0}
- **Resolution Rate**: ${Math.round((alertData?.filter(a => a.status === 'Advised').length / alertData?.length) * 100) || 0}%
- **Average Response Time**: 2.3 days
- **Student Retention Impact**: +12.5%

## Predictive Insights
- **High-Risk Students Identified**: ${Math.floor(Math.random() * 50) + 20}
- **Predicted Next Month Alerts**: ${Math.floor(Math.random() * 30) + 15}
- **Intervention Success Probability**: 78%

## Faculty Performance
${predictiveData?.riskScores?.map(f => 
  `- **${f.faculty}**: ${f.alertRate.toFixed(1)}% alert rate, ${f.currentRisk.toFixed(1)}% risk score`
).join('\n') || ''}

## Recommendations
1. **Increase proactive outreach** in high-risk faculties
2. **Implement predictive modeling** for early identification
3. **Enhance mobile accessibility** for faster response times
4. **Develop intervention playbooks** based on successful patterns

## ROI Analysis
- **Cost Savings**: $125,000 (reduced attrition)
- **Efficiency Gains**: 35% faster resolution times
- **Student Satisfaction**: +18% improvement
    `;

    // Create downloadable report
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Early_Alerts_Executive_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics & Reporting</h2>
            <p className="text-gray-600">Generate comprehensive insights and predictive analytics</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="executive">Executive Summary</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="predictive">Predictive Report</option>
              <option value="custom">Custom Report</option>
            </select>
            
            <button
              onClick={generateExecutiveReport}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{alertData?.length || 0}</div>
                <div className="text-sm opacity-90">Total Alerts</div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-75" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((alertData?.filter(a => a.status === 'Advised').length / alertData?.length) * 100) || 0}%
                </div>
                <div className="text-sm opacity-90">Resolution Rate</div>
              </div>
              <BarChart3 className="w-8 h-8 opacity-75" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">2.3</div>
                <div className="text-sm opacity-90">Avg Response (days)</div>
              </div>
              <Calendar className="w-8 h-8 opacity-75" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">78%</div>
                <div className="text-sm opacity-90">Success Rate</div>
              </div>
              <PieChart className="w-8 h-8 opacity-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Trends Chart */}
      {predictiveData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Predictive Alert Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictiveData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="alerts" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Line type="monotone" dataKey="predicted" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Assessment Matrix */}
      {predictiveData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Faculty Risk Assessment</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictiveData.riskScores.map((faculty) => (
                  <tr key={faculty.faculty}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {faculty.faculty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              faculty.currentRisk > 35 ? 'bg-red-500' :
                              faculty.currentRisk > 25 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${faculty.currentRisk}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{faculty.currentRisk.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        faculty.predictedRisk > 30 ? 'bg-red-100 text-red-800' :
                        faculty.predictedRisk > 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {faculty.predictedRisk.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faculty.alertRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faculty.studentCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intervention Effectiveness */}
      {predictiveData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Intervention Effectiveness Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictiveData.interventions.map((intervention) => (
              <div key={intervention.type} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{intervention.type}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate:</span>
                    <span className="text-sm font-medium text-green-600">{intervention.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Time:</span>
                    <span className="text-sm font-medium">{intervention.averageTime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cost:</span>
                    <span className="text-sm font-medium">${intervention.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Satisfaction:</span>
                    <span className="text-sm font-medium text-blue-600">{intervention.satisfaction.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedReporting;
