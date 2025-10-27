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

      this.client = new AzureOpenAI(options);
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
    }
  }

  async isConfigured() {
    // Ensure configuration is loaded
    await this.loadConfiguration();

    const configured = !!(this.config && this.config.api_key && this.config.endpoint && this.config.deployment_name && this.client);

    return configured;
  }

  async sendMessage(message, studentData, dashboardContext) {
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
      
      // Create system prompt with data context
      const systemPrompt = `You are an AI Analytics Assistant for the York University Early Alert Analytics Dashboard. 

Your role is to provide conversational analytics and insights based on the current dashboard data. You can analyze trends, identify patterns, make recommendations, and answer questions about student alert data.

CAPABILITIES:
- Analyze student alert patterns and trends across all 8 filter dimensions
- Identify at-risk student populations based on multiple factors
- Provide faculty and campus-specific insights
- Suggest targeted intervention strategies
- Compare performance metrics across different student populations
- Highlight concerning patterns or positive trends
- Cross-reference data between different filter types (e.g., international students in specific faculties)

CURRENT DASHBOARD DATA:
${dataContext}

IMPORTANT TERMINOLOGY - 8 FILTER TYPES AVAILABLE:

1. STUDENT TYPE (Immigration Status):
   - Based on official immigration status codes
   - "Domestic" = Canadian citizens (C) or Landed Immigrants/Permanent Residents (L)
   - "International" = All other visa/permit holders (R, V, P, U, G, etc.)
   - Key consideration: International students may face unique challenges (language, cultural adjustment, visa requirements)

2. FACULTY:
   - Student's home faculty/school (e.g., LAPS, Schulich, Lassonde, Science, etc.)
   - Represents academic division and program area
   - Different faculties may have different support resources and academic standards

3. STATUS:
   - Current state of the alert intervention
   - Common values: Open, In Progress, Resolved, Follow-up Required, etc.
   - Tracks the lifecycle of each alert and intervention effectiveness

4. TEMPLATE TYPE:
   - The type of alert/notification sent to the student
   - Examples: Low Grade Alert, Missed Assignment, Attendance Warning, Academic Performance, etc.
   - Indicates the specific academic concern triggering the alert

5. CAMPUS:
   - Physical campus location (Keele, Glendon, Markham, etc.)
   - Different campuses may have different resources, demographics, and support services

6. ALERT TYPE:
   - Category of the academic concern
   - Examples: Academic Performance, Attendance, Assignment, Exam, Behavioral, etc.
   - Helps classify the nature of the student's difficulty

7. ACADEMIC STATUS:
   - Student's current academic standing
   - Examples: Good Standing, Academic Warning, Academic Probation, etc.
   - Critical indicator of academic risk level

8. STUDY LEVEL:
   - Student's year/level in program
   - Examples: Undergraduate - Year 1, Undergraduate - Year 2, Graduate, etc.
   - Different years may face different challenges (Year 1 = transition issues, upper years = advanced coursework)

INSTRUCTIONS:
- Always ground your responses in the actual data provided above
- Be specific with numbers, percentages, and trends from the filter breakdowns
- When users ask about any of the 8 filter types, refer to the corresponding breakdown section
- Identify cross-filter patterns (e.g., "International students in Year 1 with low grade alerts")
- Provide actionable insights that can help improve student outcomes
- Consider how multiple filters interact (e.g., campus + faculty + student type)
- When asked about specific students, provide general insights while respecting privacy
- Focus on data-driven recommendations for administrators and faculty
- Highlight both problems and successes in the data
- Use clear, professional language suitable for university administrators

RESPONSE STYLE:
- Start with key insights or direct answers
- Support with specific data points from filter breakdowns
- Reference specific filter types when relevant (e.g., "Looking at Filter 3 (Status)...")
- End with actionable recommendations when appropriate
- Keep responses concise but comprehensive
- Use bullet points for clarity when listing multiple insights
- When comparing groups, always provide context and percentages

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

      const response = await this.client.chat.completions.create({
        messages: messages,
        max_completion_tokens: 16384,
        model: this.modelName
      });


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
    
    // Student demographics analysis
    const studentsWithAlertIds = filteredAlerts ? new Set(filteredAlerts.map(a => a.studentId)) : new Set();
    const studentsWithAlerts = studentData ? studentData.filter(s => studentsWithAlertIds.has(s.id)) : [];
    
    // FILTER TYPE 1: Immigration Status / Student Type (Domestic vs International)
    const domesticStudents = studentsWithAlerts.filter(s => s.immigrationStatus === 'Domestic').length;
    const internationalStudents = studentsWithAlerts.filter(s => s.immigrationStatus === 'International').length;
    const unknownImmigrationStatus = studentsWithAlerts.filter(s => !s.immigrationStatus || s.immigrationStatus === 'Unknown').length;
    
    // Additional student flags
    const osapStudents = studentsWithAlerts.filter(s => s.osapFlag).length;
    const eslStudents = studentsWithAlerts.filter(s => s.eslFlag).length;
    const varsityStudents = studentsWithAlerts.filter(s => s.varsityFlag).length;
    const scholarshipStudents = studentsWithAlerts.filter(s => s.scholarshipFlag).length;
    
    // FILTER TYPE 2: Faculty breakdown from alerts
    const facultyBreakdownMap = new Map();
    filteredAlerts?.forEach(alert => {
      const faculty = alert.faculty || 'Unknown';
      facultyBreakdownMap.set(faculty, (facultyBreakdownMap.get(faculty) || 0) + 1);
    });

    // FILTER TYPE 3: Status breakdown from alerts
    const statusBreakdownMap = new Map();
    filteredAlerts?.forEach(alert => {
      const status = alert.status || 'Unknown';
      statusBreakdownMap.set(status, (statusBreakdownMap.get(status) || 0) + 1);
    });

    // FILTER TYPE 4: Template Type breakdown
    const templateTypeMap = new Map();
    filteredAlerts?.forEach(alert => {
      const templateType = alert.template_type || 'Unknown';
      templateTypeMap.set(templateType, (templateTypeMap.get(templateType) || 0) + 1);
    });

    // FILTER TYPE 5: Campus breakdown from alerts
    const campusBreakdownMap = new Map();
    filteredAlerts?.forEach(alert => {
      const campus = alert.campus || 'Unknown';
      campusBreakdownMap.set(campus, (campusBreakdownMap.get(campus) || 0) + 1);
    });

    // FILTER TYPE 6: Alert Type breakdown
    const alertTypeBreakdownMap = new Map();
    filteredAlerts?.forEach(alert => {
      const alertType = alert.alertType || 'Unknown';
      alertTypeBreakdownMap.set(alertType, (alertTypeBreakdownMap.get(alertType) || 0) + 1);
    });

    // FILTER TYPE 7: Academic Status breakdown
    const academicStatusMap = new Map();
    filteredAlerts?.forEach(alert => {
      const academicStatus = alert.academicStatus || 'Unknown';
      academicStatusMap.set(academicStatus, (academicStatusMap.get(academicStatus) || 0) + 1);
    });

    // FILTER TYPE 8: Study Level breakdown
    const studyLevelMap = new Map();
    filteredAlerts?.forEach(alert => {
      const studyLevel = alert.studyLevel || 'Unknown';
      studyLevelMap.set(studyLevel, (studyLevelMap.get(studyLevel) || 0) + 1);
    });

    // Academic standing breakdown (for students with alerts)
    const academicStandingMap = new Map();
    studentsWithAlerts.forEach(s => {
      if (s.academicDecision) {
        const standing = s.academicDecision;
        academicStandingMap.set(standing, (academicStandingMap.get(standing) || 0) + 1);
      }
    });
    
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
    const unresolvedAlerts = filteredAlerts ? filteredAlerts.filter(a => a.status !== 'Advised').length : 0;

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

═══════════════════════════════════════════════════════════
COMPREHENSIVE FILTER BREAKDOWNS (All 8 Filter Types):
═══════════════════════════════════════════════════════════

FILTER 1: STUDENT TYPE (Immigration Status):
${uniqueStudentsWithAlerts > 0 ? `• Domestic Students: ${domesticStudents} students (${((domesticStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)
• International Students: ${internationalStudents} students (${((internationalStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)${unknownImmigrationStatus > 0 ? `\n• Unknown Status: ${unknownImmigrationStatus} students (${((unknownImmigrationStatus / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)` : ''}` : '• No data available'}

FILTER 2: FACULTY:
${facultyBreakdownMap.size > 0 ? Array.from(facultyBreakdownMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([faculty, count]) => `• ${faculty}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No faculty data available'}

FILTER 3: STATUS:
${statusBreakdownMap.size > 0 ? Array.from(statusBreakdownMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([status, count]) => `• ${status}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No status data available'}

FILTER 4: TEMPLATE TYPE:
${templateTypeMap.size > 0 ? Array.from(templateTypeMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([templateType, count]) => `• ${templateType}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No template type data available'}

FILTER 5: CAMPUS:
${campusBreakdownMap.size > 0 ? Array.from(campusBreakdownMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([campus, count]) => `• ${campus}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No campus data available'}

FILTER 6: ALERT TYPE:
${alertTypeBreakdownMap.size > 0 ? Array.from(alertTypeBreakdownMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([alertType, count]) => `• ${alertType}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No alert type data available'}

FILTER 7: ACADEMIC STATUS:
${academicStatusMap.size > 0 ? Array.from(academicStatusMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([academicStatus, count]) => `• ${academicStatus}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No academic status data available'}

FILTER 8: STUDY LEVEL:
${studyLevelMap.size > 0 ? Array.from(studyLevelMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([studyLevel, count]) => `• ${studyLevel}: ${count} alerts (${((count / totalAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No study level data available'}

═══════════════════════════════════════════════════════════
ADDITIONAL STUDENT INSIGHTS:
═══════════════════════════════════════════════════════════

Student Support Flags (for students with alerts):
${uniqueStudentsWithAlerts > 0 ? `• OSAP Recipients: ${osapStudents} (${((osapStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)
• ESL Students: ${eslStudents} (${((eslStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)
• Varsity Athletes: ${varsityStudents} (${((varsityStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)
• Scholarship Holders: ${scholarshipStudents} (${((scholarshipStudents / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)` : '• No data available'}

Academic Standing Distribution (for students with alerts):
${academicStandingMap.size > 0 ? Array.from(academicStandingMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([standing, count]) => `• ${standing}: ${count} students (${((count / uniqueStudentsWithAlerts) * 100).toFixed(1)}%)`)
  .join('\n') : '• No academic standing data available'}

CAMPUS ANALYSIS (Detailed):
${campusAnalysisData ? campusAnalysisData.map(campus => 
  `• ${campus.name}: ${campus.totalAlerts} alerts, ${campus.uniqueStudents} students`
).join('\n') : '• No campus data available'}


═══════════════════════════════════════════════════════════
TRENDS & PERFORMANCE METRICS:
═══════════════════════════════════════════════════════════

Recent Trend Analysis:
${recentTimelineData.length > 0 ? 
  `• Last 7 days: ${recentTrend >= 0 ? 'Increasing' : 'Decreasing'} trend (${recentTrend > 0 ? '+' : ''}${recentTrend} alerts)` : 
  '• No recent timeline data available'
}

Key Performance Indicators:
• Email Open Rate: ${metrics?.emailOpenRate || 0}%
• Follow-up Rate: ${metrics?.followUpRate || 0}%
• Students with Multiple Alerts: ${metrics?.multipleAlertsStudents || 0}

Risk Indicators:
• High Priority Percentage: ${totalAlerts > 0 ? ((highPriorityAlerts / totalAlerts) * 100).toFixed(1) : 0}%
• Unresolved Percentage: ${totalAlerts > 0 ? ((unresolvedAlerts / totalAlerts) * 100).toFixed(1) : 0}%
• Alert-to-Student Ratio: ${uniqueStudentsWithAlerts > 0 ? (totalAlerts / uniqueStudentsWithAlerts).toFixed(1) : 0}

═══════════════════════════════════════════════════════════
CONTEXT & METADATA:
═══════════════════════════════════════════════════════════
• Total system capacity: ${allAlerts?.length || 0} total alerts across all time
• Current filtered view: ${totalAlerts} alerts (based on active filters)
• Data freshness: ${new Date().toLocaleString()}
• Filter coverage: ${activeFilters.length > 0 ? `${activeFilters.length} filter(s) applied` : 'No filters - showing all data'}
`;

    return summary;
  }
}

const azureOpenAIService = new AzureOpenAIService();
export default azureOpenAIService;
