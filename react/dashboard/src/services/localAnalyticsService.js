// Local Analytics Service - Handle simple calculations without AI
class LocalAnalyticsService {
  constructor() {
    this.patterns = {
      // More specific patterns first
      countByPriority: /how many.*priority.*['"]?(critical|high|medium|low)['"]?|count.*priority.*['"]?(critical|high|medium|low)['"]?|students.*priority.*['"]?(critical|high|medium|low)['"]?|students.*with.*['"]?(critical|high|medium|low)['"]?.*priority/i,
      countByFaculty: /how many.*faculty.*['"]?([^'"]+)['"]?|count.*faculty.*['"]?([^'"]+)['"]?|students.*in.*['"]?([^'"]+)['"]?.*faculty/i,
      countByStatus: /how many.*status.*['"]?(pending|resolved|in progress|closed)['"]?|count.*status.*['"]?(pending|resolved|in progress|closed)['"]?|alerts.*['"]?(pending|resolved|in progress|closed)['"]?/i,
      countByType: /how many.*type.*['"]?([^'"]+)['"]?|count.*type.*['"]?([^'"]+)['"]?/i,
      
      // General count patterns (more flexible)
      countStudents: /how many students|count.*students|number of students|total.*students|students.*total/i,
      countAlerts: /how many alerts|count.*alerts|number of alerts|total.*alerts|alerts.*total/i,
      
      // Distribution patterns
      distributionByPriority: /distribution.*priority|breakdown.*priority|priority.*breakdown|priority.*distribution/i,
      distributionByFaculty: /distribution.*faculty|breakdown.*faculty|faculty.*breakdown|faculty.*distribution/i,
      distributionByStatus: /distribution.*status|breakdown.*status|status.*breakdown|status.*distribution/i,
      
      // Percentage patterns
      percentageByPriority: /percentage.*priority|percent.*priority|% of.*priority|what.*percent.*priority/i,
      percentageByFaculty: /percentage.*faculty|percent.*faculty|% of.*faculty|what.*percent.*faculty/i,
      
      // Simple stats (more variations)
      totalStudents: /^total students$|^how many students total$|^students total$|^student count$/i,
      totalAlerts: /^total alerts$|^how many alerts total$|^alerts total$|^alert count$/i,
      averageGPA: /average gpa|mean gpa|gpa average/i,
      
      // Common variations for demo
      showStats: /show.*stats|show.*statistics|dashboard.*stats|give.*overview/i,
      quickSummary: /quick.*summary|overview|summary/i,
    };
  }

  canHandleQuery(query) {
    const queryLower = query.toLowerCase();
    console.log('🔍 Local Analytics - Checking query:', queryLower);
    
    // Check if it's a simple calculation query
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(queryLower)) {
        console.log('✅ Local Analytics - Pattern matched:', patternName);
        return {
          canHandle: true,
          type: patternName,
          pattern: pattern
        };
      }
    }
    
    console.log('❌ Local Analytics - No pattern matched');
    return { canHandle: false };
  }

  async processQuery(query, data) {
    console.log('🔍 Local Analytics - Processing query:', query);
    console.log('🔍 Local Analytics - Data received:', {
      studentsCount: data.students?.length,
      alertsCount: data.alerts?.length,
      sampleAlert: data.alerts?.[0]
    });
    
    const analysis = this.canHandleQuery(query);
    console.log('🔍 Local Analytics - Query analysis:', analysis);
    
    if (!analysis.canHandle) {
      console.log('❌ Local Analytics - Cannot handle query, returning null');
      return null;
    }

    const { students, alerts } = data;
    
    console.log('✅ Local Analytics - Processing with type:', analysis.type);
    
    switch (analysis.type) {
      case 'countStudents':
        return this.formatResponse(`There are **${students.length}** students in the database.`);
      
      case 'countAlerts':
        return this.formatResponse(`There are **${alerts.length}** alerts in the database.`);
      
      case 'countByPriority':
        return this.handlePriorityCount(query, alerts);
      
      case 'countByFaculty':
        return this.handleFacultyCount(query, students, alerts);
      
      case 'countByStatus':
        return this.handleStatusCount(query, alerts);
      
      case 'countByType':
        return this.handleTypeCount(query, alerts);
      
      case 'distributionByPriority':
        return this.handlePriorityDistribution(alerts);
      
      case 'distributionByFaculty':
        return this.handleFacultyDistribution(students, alerts);
      
      case 'distributionByStatus':
        return this.handleStatusDistribution(alerts);
      
      case 'percentageByPriority':
        return this.handlePriorityPercentage(query, alerts);
      
      case 'totalStudents':
        return this.formatResponse(`Total students: **${students.length}**`);
      
      case 'totalAlerts':
        return this.formatResponse(`Total alerts: **${alerts.length}**`);
      
      case 'averageGPA':
        return this.handleAverageGPA(students);
      
      case 'showStats':
        return this.handleShowStats(students, alerts);
      
      case 'quickSummary':
        return this.handleQuickSummary(students, alerts);
      
      default:
        return null;
    }
  }

  handlePriorityCount(query, alerts) {
    const priorityMatch = query.match(/['"]?(critical|high|medium|low)['"]?/i);
    if (!priorityMatch) return null;
    
    const targetPriority = priorityMatch[1].toLowerCase();
    const priorityMap = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    
    const correctPriority = priorityMap[targetPriority];
    const matchingAlerts = alerts.filter(alert => 
      alert.priority && alert.priority.toLowerCase() === targetPriority
    );
    
    const uniqueStudents = new Set(matchingAlerts.map(alert => alert.student_id));
    
    return this.formatResponse(
      `**${uniqueStudents.size}** students have alerts with **${correctPriority}** priority.\n\n` +
      `📊 Details:\n` +
      `• Total ${correctPriority} priority alerts: ${matchingAlerts.length}\n` +
      `• Unique students affected: ${uniqueStudents.size}\n` +
      `• Percentage of all alerts: ${((matchingAlerts.length / alerts.length) * 100).toFixed(1)}%`
    );
  }

  handleFacultyCount(query, students, alerts) {
    // Extract faculty name from query
    const facultyMatch = query.match(/faculty.*['"]?([^'"]+)['"]?/i);
    if (!facultyMatch) return null;
    
    const targetFaculty = facultyMatch[1].trim();
    const facultyStudents = students.filter(student => 
      student.home_faculty && student.home_faculty.toLowerCase().includes(targetFaculty.toLowerCase())
    );
    
    const facultyAlerts = alerts.filter(alert => 
      alert.student?.home_faculty && alert.student.home_faculty.toLowerCase().includes(targetFaculty.toLowerCase())
    );
    
    return this.formatResponse(
      `**${facultyStudents.length}** students are in faculties matching "${targetFaculty}".\n\n` +
      `📊 Details:\n` +
      `• Students: ${facultyStudents.length}\n` +
      `• Alerts from these students: ${facultyAlerts.length}\n` +
      `• Alert rate: ${facultyStudents.length > 0 ? ((facultyAlerts.length / facultyStudents.length) * 100).toFixed(1) : 0}%`
    );
  }

  handleStatusCount(query, alerts) {
    const statusMatch = query.match(/['"]?(pending|resolved|in progress|closed)['"]?/i);
    if (!statusMatch) return null;
    
    const targetStatus = statusMatch[1].toLowerCase();
    const statusMap = {
      'pending': 'Pending',
      'resolved': 'Resolved',
      'in progress': 'In Progress',
      'closed': 'Closed'
    };
    
    const correctStatus = statusMap[targetStatus];
    const matchingAlerts = alerts.filter(alert => 
      alert.status && alert.status.toLowerCase() === targetStatus
    );
    
    const uniqueStudents = new Set(matchingAlerts.map(alert => alert.student_id));
    
    return this.formatResponse(
      `**${matchingAlerts.length}** alerts have **${correctStatus}** status.\n\n` +
      `📊 Details:\n` +
      `• Total ${correctStatus} alerts: ${matchingAlerts.length}\n` +
      `• Students affected: ${uniqueStudents.size}\n` +
      `• Percentage of all alerts: ${((matchingAlerts.length / alerts.length) * 100).toFixed(1)}%`
    );
  }

  handleTypeCount(query, alerts) {
    const typeMatch = query.match(/type.*['"]?([^'"]+)['"]?/i);
    if (!typeMatch) return null;
    
    const targetType = typeMatch[1].trim();
    const matchingAlerts = alerts.filter(alert => 
      alert.alert_type && alert.alert_type.toLowerCase().includes(targetType.toLowerCase())
    );
    
    const uniqueStudents = new Set(matchingAlerts.map(alert => alert.student_id));
    
    return this.formatResponse(
      `**${matchingAlerts.length}** alerts match the type "${targetType}".\n\n` +
      `📊 Details:\n` +
      `• Total matching alerts: ${matchingAlerts.length}\n` +
      `• Students affected: ${uniqueStudents.size}\n` +
      `• Percentage of all alerts: ${((matchingAlerts.length / alerts.length) * 100).toFixed(1)}%`
    );
  }

  handlePriorityDistribution(alerts) {
    const priorityStats = {};
    
    alerts.forEach(alert => {
      const priority = alert.priority || 'Unknown';
      if (!priorityStats[priority]) {
        priorityStats[priority] = { count: 0, students: new Set() };
      }
      priorityStats[priority].count++;
      priorityStats[priority].students.add(alert.student_id);
    });
    
    const sortedPriorities = Object.entries(priorityStats)
      .sort(([,a], [,b]) => b.count - a.count);
    
    let response = `**Priority Distribution:**\n\n`;
    sortedPriorities.forEach(([priority, stats]) => {
      const percentage = ((stats.count / alerts.length) * 100).toFixed(1);
      response += `• **${priority}**: ${stats.count} alerts (${percentage}%) - ${stats.students.size} students\n`;
    });
    
    return this.formatResponse(response);
  }

  handleFacultyDistribution(students, alerts) {
    const facultyStats = {};
    
    // Count students by faculty
    students.forEach(student => {
      const faculty = student.home_faculty || 'Unknown';
      if (!facultyStats[faculty]) {
        facultyStats[faculty] = { students: 0, alerts: 0 };
      }
      facultyStats[faculty].students++;
    });
    
    // Count alerts by faculty
    alerts.forEach(alert => {
      const faculty = alert.student?.home_faculty || 'Unknown';
      if (facultyStats[faculty]) {
        facultyStats[faculty].alerts++;
      }
    });
    
    const sortedFaculties = Object.entries(facultyStats)
      .sort(([,a], [,b]) => b.students - a.students);
    
    let response = `**Faculty Distribution:**\n\n`;
    sortedFaculties.forEach(([faculty, stats]) => {
      const alertRate = stats.students > 0 ? ((stats.alerts / stats.students) * 100).toFixed(1) : 0;
      response += `• **${faculty}**: ${stats.students} students, ${stats.alerts} alerts (${alertRate}% alert rate)\n`;
    });
    
    return this.formatResponse(response);
  }

  handleStatusDistribution(alerts) {
    const statusStats = {};
    
    alerts.forEach(alert => {
      const status = alert.status || 'Unknown';
      if (!statusStats[status]) {
        statusStats[status] = { count: 0, students: new Set() };
      }
      statusStats[status].count++;
      statusStats[status].students.add(alert.student_id);
    });
    
    const sortedStatuses = Object.entries(statusStats)
      .sort(([,a], [,b]) => b.count - a.count);
    
    let response = `**Status Distribution:**\n\n`;
    sortedStatuses.forEach(([status, stats]) => {
      const percentage = ((stats.count / alerts.length) * 100).toFixed(1);
      response += `• **${status}**: ${stats.count} alerts (${percentage}%) - ${stats.students.size} students\n`;
    });
    
    return this.formatResponse(response);
  }

  handlePriorityPercentage(query, alerts) {
    const priorityMatch = query.match(/['"]?(critical|high|medium|low)['"]?/i);
    if (!priorityMatch) return null;
    
    const targetPriority = priorityMatch[1].toLowerCase();
    const priorityMap = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    
    const correctPriority = priorityMap[targetPriority];
    const matchingAlerts = alerts.filter(alert => 
      alert.priority && alert.priority.toLowerCase() === targetPriority
    );
    
    const percentage = ((matchingAlerts.length / alerts.length) * 100).toFixed(1);
    
    return this.formatResponse(
      `**${percentage}%** of alerts have **${correctPriority}** priority.\n\n` +
      `📊 Details:\n` +
      `• ${correctPriority} priority alerts: ${matchingAlerts.length}\n` +
      `• Total alerts: ${alerts.length}\n` +
      `• Percentage: ${percentage}%`
    );
  }

  handleAverageGPA(students) {
    const studentsWithGPA = students.filter(student => 
      student.ogpa !== null && student.ogpa !== undefined && !isNaN(student.ogpa)
    );
    
    if (studentsWithGPA.length === 0) {
      return this.formatResponse("No GPA data available for students.");
    }
    
    const totalGPA = studentsWithGPA.reduce((sum, student) => sum + parseFloat(student.ogpa), 0);
    const averageGPA = (totalGPA / studentsWithGPA.length).toFixed(2);
    
    return this.formatResponse(
      `**Average GPA**: ${averageGPA}\n\n` +
      `📊 Details:\n` +
      `• Students with GPA data: ${studentsWithGPA.length}\n` +
      `• Total students: ${students.length}\n` +
      `• Average GPA: ${averageGPA}`
    );
  }

  formatResponse(content) {
    return {
      isLocal: true,
      content: content,
      timestamp: new Date().toISOString()
    };
  }

  handleShowStats(students, alerts) {
    const uniqueStudentsWithAlerts = new Set(alerts.map(alert => alert.student_id)).size;
    const priorityBreakdown = this.getPriorityBreakdown(alerts);
    const statusBreakdown = this.getStatusBreakdown(alerts);
    
    return this.formatResponse(
      `📊 **Dashboard Statistics**\n\n` +
      `**Overview:**\n` +
      `• Total Students: **${students.length}**\n` +
      `• Total Alerts: **${alerts.length}**\n` +
      `• Students with Alerts: **${uniqueStudentsWithAlerts}**\n` +
      `• Coverage: **${((uniqueStudentsWithAlerts / students.length) * 100).toFixed(1)}%**\n\n` +
      `**Priority Breakdown:**\n` +
      `${Object.entries(priorityBreakdown).map(([p, c]) => `• ${p}: ${c} alerts`).join('\n')}\n\n` +
      `**Status Breakdown:**\n` +
      `${Object.entries(statusBreakdown).map(([s, c]) => `• ${s}: ${c} alerts`).join('\n')}`
    );
  }

  handleQuickSummary(students, alerts) {
    const uniqueStudentsWithAlerts = new Set(alerts.map(alert => alert.student_id)).size;
    const highPriorityAlerts = alerts.filter(alert => 
      alert.priority && (alert.priority.toLowerCase() === 'high' || alert.priority.toLowerCase() === 'critical')
    ).length;
    const unresolvedAlerts = alerts.filter(alert => 
      alert.status && alert.status.toLowerCase() !== 'resolved'
    ).length;

    return this.formatResponse(
      `⚡ **Quick Summary**\n\n` +
      `• **${students.length}** total students\n` +
      `• **${alerts.length}** total alerts\n` +
      `• **${uniqueStudentsWithAlerts}** students with alerts\n` +
      `• **${highPriorityAlerts}** high/critical priority alerts\n` +
      `• **${unresolvedAlerts}** unresolved alerts\n\n` +
      `**Key Metrics:**\n` +
      `• Alert rate: ${((uniqueStudentsWithAlerts / students.length) * 100).toFixed(1)}%\n` +
      `• High priority rate: ${((highPriorityAlerts / alerts.length) * 100).toFixed(1)}%\n` +
      `• Resolution rate: ${(((alerts.length - unresolvedAlerts) / alerts.length) * 100).toFixed(1)}%`
    );
  }

  getPriorityBreakdown(alerts) {
    return alerts.reduce((acc, alert) => {
      const priority = alert.priority || 'Normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  }

  getStatusBreakdown(alerts) {
    return alerts.reduce((acc, alert) => {
      const status = alert.status || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }
}

const localAnalyticsService = new LocalAnalyticsService();
export default localAnalyticsService;
