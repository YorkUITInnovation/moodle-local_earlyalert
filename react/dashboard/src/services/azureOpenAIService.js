import OpenAI from 'openai';

class AzureOpenAIService {
  constructor() {
    this.client = null;
    this.deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    this.initializeClient();
  }

  initializeClient() {
    const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION || '2024-06-01';

    console.log('Initializing Azure OpenAI client with:', {
      endpoint: endpoint ? 'Set' : 'Missing',
      apiKey: apiKey ? 'Set' : 'Missing',
      deploymentName: deploymentName ? 'Set' : 'Missing',
      apiVersion
    });

    if (!endpoint || !apiKey || !deploymentName) {
      console.warn('Azure OpenAI configuration is incomplete. Please check your environment variables.');
      return;
    }

    try {
      // Your endpoint format: https://aura-openai-administration.openai.azure.com/openai/deployments/gpt-4o-mini-administration/chat/completions?api-version=2025-01-01-preview
      // We need to extract the base URL properly
      
      let baseURL;
      if (endpoint.includes('/chat/completions')) {
        // Extract base URL from your full endpoint
        baseURL = endpoint.split('/chat/completions')[0];
      } else if (endpoint.includes('/openai/deployments/')) {
        // If it's a partial endpoint, use as-is
        baseURL = endpoint;
      } else {
        // Standard format
        baseURL = `${endpoint}/openai/deployments/${deploymentName}`;
      }

      console.log('Setting up OpenAI client with baseURL:', baseURL);

      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: {
          'api-key': apiKey,
        },
        dangerouslyAllowBrowser: true
      });

      console.log('Azure OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
    }
  }

  isConfigured() {
    const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    
    const configured = !!(endpoint && apiKey && deploymentName && this.client);
    console.log('Configuration check:', {
      endpoint: !!endpoint,
      apiKey: !!apiKey,
      deploymentName: !!deploymentName,
      client: !!this.client,
      overall: configured
    });
    
    return configured;
  }

  async sendMessage(message, studentData, dashboardContext) {
    console.log('sendMessage called with:', { message, hasClient: !!this.client });
    
    if (!this.client) {
      throw new Error('Azure OpenAI client is not configured. Please check your environment variables.');
    }

    try {
      // Prepare context from student data
      const dataContext = this.prepareDataContext(studentData, dashboardContext);
      
      console.log('Prepared data context length:', dataContext.length);
      
      // Create system prompt with data context
      const systemPrompt = `You are an AI Analytics Assistant for the York University Early Alert Analytics Dashboard. 

Your role is to provide conversational analytics and insights based on the current dashboard data. You can analyze trends, identify patterns, make recommendations, and answer questions about student alert data.

CAPABILITIES:
- Analyze student alert patterns and trends
- Identify at-risk student populations
- Provide faculty and campus-specific insights
- Suggest intervention strategies
- Compare performance metrics
- Highlight concerning patterns or positive trends

CURRENT DASHBOARD DATA:
${dataContext}

INSTRUCTIONS:
- Always ground your responses in the actual data provided above
- Be specific with numbers, percentages, and trends
- Provide actionable insights that can help improve student outcomes
- When asked about specific students, provide general insights while respecting privacy
- Focus on data-driven recommendations for administrators and faculty
- Highlight both problems and successes in the data
- Use clear, professional language suitable for university administrators

RESPONSE STYLE:
- Start with key insights or direct answers
- Support with specific data points
- End with actionable recommendations when appropriate
- Keep responses concise but comprehensive
- Use bullet points for clarity when listing multiple insights

Answer the user's question based on the current dashboard data context.`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ];

      console.log('Sending request to Azure OpenAI...');

      const response = await this.client.chat.completions.create({
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
      });

      console.log('Received response from Azure OpenAI:', response);

      return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  prepareDataContext(studentData, dashboardContext) {
    const { 
      metrics, 
      filteredAlerts, 
      facultyData, 
      alertTypeData, 
      campusAnalysisData, 
      timelineData,
      interventionData,
      currentFilters,
      allAlerts 
    } = dashboardContext;
    
    // Calculate additional insights
    const totalAlerts = filteredAlerts?.length || 0;
    const totalStudents = studentData?.length || 0;
    const uniqueStudentsWithAlerts = filteredAlerts ? new Set(filteredAlerts.map(a => a.studentId)).size : 0;
    
    // Top faculties by alerts
    const topFaculties = facultyData ? [...facultyData].sort((a, b) => b.alerts - a.alerts).slice(0, 5) : [];
    
    // Top alert types
    const topAlertTypes = alertTypeData ? [...alertTypeData].sort((a, b) => b.value - a.value).slice(0, 5) : [];
    
    // Status breakdown
    const statusBreakdown = interventionData || [];
    
    // Current filters applied
    const activeFilters = currentFilters ? Object.entries(currentFilters)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => `${key}: ${value}`) : [];
    
    // Recent trends (last 7 days of data)
    const recentTimelineData = timelineData ? timelineData.slice(-7) : [];
    const recentTrend = recentTimelineData.length > 1 ? 
      (recentTimelineData[recentTimelineData.length - 1]?.alerts || 0) - (recentTimelineData[0]?.alerts || 0) : 0;
    
    // Risk assessment
    const highPriorityAlerts = filteredAlerts ? filteredAlerts.filter(a => a.priority === 'High').length : 0;
    const unresolvedAlerts = filteredAlerts ? filteredAlerts.filter(a => a.status !== 'Resolved').length : 0;
    
    // Comprehensive data summary
    const summary = `
CURRENT DASHBOARD OVERVIEW:
===========================
• Total Students in System: ${totalStudents}
• Students with Active Alerts: ${uniqueStudentsWithAlerts}
• Total Alerts (current view): ${totalAlerts}
• High Priority Alerts: ${highPriorityAlerts}
• Unresolved Alerts: ${unresolvedAlerts}
• Overall Resolution Rate: ${metrics?.resolutionRate || 0}%

ACTIVE FILTERS:
${activeFilters.length > 0 ? activeFilters.map(f => `• ${f}`).join('\n') : '• None (showing all data)'}

TOP ALERT TYPES:
${topAlertTypes.map((item, i) => `${i + 1}. ${item.name}: ${item.value} alerts`).join('\n')}

FACULTY BREAKDOWN:
${topFaculties.map((item, i) => `${i + 1}. ${item.name}: ${item.alerts} alerts`).join('\n')}

STATUS DISTRIBUTION:
${statusBreakdown.map(status => `• ${status.name}: ${status.value} (${((status.value / totalAlerts) * 100).toFixed(1)}%)`).join('\n')}

CAMPUS ANALYSIS:
${campusAnalysisData ? campusAnalysisData.map(campus => 
  `• ${campus.name}: ${campus.totalAlerts} alerts, ${campus.uniqueStudents} students`
).join('\n') : 'No campus data available'}

RECENT TREND ANALYSIS:
${recentTimelineData.length > 0 ? 
  `• Last 7 days: ${recentTrend >= 0 ? 'Increasing' : 'Decreasing'} trend (${recentTrend > 0 ? '+' : ''}${recentTrend} alerts)` : 
  '• No recent timeline data available'
}

KEY PERFORMANCE INDICATORS:
• Email Open Rate: ${metrics?.emailOpenRate || 0}%
• Follow-up Rate: ${metrics?.followUpRate || 0}%
• Students with Multiple Alerts: ${metrics?.multipleAlertsStudents || 0}

RISK INDICATORS:
• High Priority Percentage: ${totalAlerts > 0 ? ((highPriorityAlerts / totalAlerts) * 100).toFixed(1) : 0}%
• Unresolved Percentage: ${totalAlerts > 0 ? ((unresolvedAlerts / totalAlerts) * 100).toFixed(1) : 0}%
• Alert-to-Student Ratio: ${uniqueStudentsWithAlerts > 0 ? (totalAlerts / uniqueStudentsWithAlerts).toFixed(1) : 0}

RECOMMENDATIONS CONTEXT:
• Total system capacity: ${allAlerts?.length || 0} total alerts
• Current filtered view: ${totalAlerts} alerts
• Data freshness: ${new Date().toLocaleString()}
`;

    return summary;
  }
}

const azureOpenAIService = new AzureOpenAIService();
export default azureOpenAIService;
