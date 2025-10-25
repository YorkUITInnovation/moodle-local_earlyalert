import { AzureOpenAI } from 'openai';

class AzureOpenAIService {
  constructor() {
    this.client = null;
    this.deploymentName = null;
    this.modelName = null;
    this.config = null;
    this.configLoaded = false;
    this.configPromise = null;
  }

  async loadConfiguration() {
    if (this.configLoaded) {
      return this.config;
    }

    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = (async () => {
      try {
        console.log('🔄 Loading Azure OpenAI configuration from app_env.php...');
        const timestamp = new Date().getTime();
        const response = await fetch(`/local/earlyalert/react/dashboard/app_env.php?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Configuration loaded from app_env.php:', {
          success: data.success,
          configured: data.configured,
          hasApiKey: !!data.azure_openai?.api_key,
          hasEndpoint: !!data.azure_openai?.endpoint,
          hasDeployment: !!data.azure_openai?.deployment_name
        });

        if (!data.success || !data.configured) {
          console.warn('⚠️ Azure OpenAI is not fully configured in Moodle settings.');
          this.config = null;
          this.configLoaded = true;
          return null;
        }

        this.config = data.azure_openai;
        this.deploymentName = data.azure_openai.deployment_name;
        this.modelName = data.azure_openai.deployment_name; // Use deployment name as model name for GPT-5
        this.configLoaded = true;

        // Initialize client with loaded configuration
        await this.initializeClient();

        return this.config;
      } catch (error) {
        console.error('❌ Failed to load Azure OpenAI configuration:', error);
        this.config = null;
        this.configLoaded = true;
        return null;
      }
    })();

    return this.configPromise;
  }

  async initializeClient() {
    if (!this.config) {
      console.warn('Cannot initialize client: Configuration not loaded or incomplete.');
      return;
    }

    const { endpoint, api_key, deployment_name, api_version } = this.config;

    console.log('Initializing Azure OpenAI client with configuration from Moodle:', {
      endpoint: endpoint ? 'Set' : 'Missing',
      apiKey: api_key ? 'Set' : 'Missing',
      deploymentName: deployment_name ? 'Set' : 'Missing',
      apiVersion: api_version
    });

    if (!endpoint || !api_key || !deployment_name) {
      console.warn('Azure OpenAI configuration is incomplete. Please check your Moodle plugin settings.');
      return;
    }

    try {
      // GPT-5 style initialization with options object
      const options = {
        endpoint: endpoint,
        apiKey: api_key,
        deployment: deployment_name,
        apiVersion: api_version,
        dangerouslyAllowBrowser: true
      };

      console.log('Setting up AzureOpenAI client with options:', {
        endpoint: options.endpoint,
        deployment: options.deployment,
        apiVersion: options.apiVersion
      });

      this.client = new AzureOpenAI(options);

      console.log('Azure OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
    }
  }

  async isConfigured() {
    // Ensure configuration is loaded
    await this.loadConfiguration();

    const configured = !!(this.config && this.config.api_key && this.config.endpoint && this.config.deployment_name && this.client);
    console.log('Configuration check:', {
      hasConfig: !!this.config,
      endpoint: !!this.config?.endpoint,
      apiKey: !!this.config?.api_key,
      deploymentName: !!this.config?.deployment_name,
      client: !!this.client,
      overall: configured
    });
    
    return configured;
  }

  async sendMessage(message, studentData, dashboardContext) {
    console.log('sendMessage called with:', { message, hasClient: !!this.client });
    
    // Ensure configuration is loaded and client is initialized
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }

    if (!this.client) {
      throw new Error('Azure OpenAI is not configured. Please configure Azure OpenAI settings in Moodle plugin settings (Site administration > Plugins > Local plugins > Early Alert > Plugin Settings).');
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
        max_completion_tokens: 16384,
        model: this.modelName
      });

      console.log('Received response from Azure OpenAI:', response);

      // Check for errors in response (GPT-5 pattern)
      if (response?.error !== undefined && response.status !== "200") {
        throw response.error;
      }

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
    
    // Top faculties by alerts - filter out "Unknown" faculty and show all identified faculties
    const knownFaculties = facultyData ? facultyData.filter(f => f.name && f.name !== 'Unknown' && f.name.trim() !== '') : [];
    const unknownFacultyCount = facultyData ? facultyData.filter(f => !f.name || f.name === 'Unknown' || f.name.trim() === '').reduce((sum, f) => sum + (f.alerts || 0), 0) : 0;
    const allFaculties = knownFaculties.sort((a, b) => b.alerts - a.alerts);
    const topFaculties = allFaculties.slice(0, 10); // Show top 10 faculties

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

FACULTY BREAKDOWN (All Identified Faculties):
${topFaculties.length > 0 ? topFaculties.map((item, i) => `${i + 1}. ${item.name}: ${item.alerts} alerts (${totalAlerts > 0 ? ((item.alerts / totalAlerts) * 100).toFixed(1) : 0}% of total)`).join('\n') : '• No faculty data available'}
${unknownFacultyCount > 0 ? `\nNote: ${unknownFacultyCount} alerts have unidentified faculty (missing data in student records)` : ''}
${allFaculties.length > 10 ? `\n(Showing top 10 of ${allFaculties.length} faculties)` : ''}

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
