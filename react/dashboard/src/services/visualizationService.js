/**
 * Dynamic Visualization Service
 * Generates chart configurations based on natural language queries and dashboard data
 */

class VisualizationService {
  constructor() {
    this.chartPatterns = this.initializeChartPatterns();
  }

  initializeChartPatterns() {
    return {
      // Bar Charts - for comparisons and categorical distributions
      bar: {
        // Comparison intent keywords
        intentKeywords: ['compare', 'versus', 'vs', 'difference', 'contrast', 'between'],
        // Distribution/breakdown keywords
        distributionKeywords: ['breakdown', 'distribution', 'by', 'across', 'among', 'split'],
        // Ranking keywords
        rankingKeywords: ['most', 'least', 'top', 'bottom', 'highest', 'lowest', 'best', 'worst'],
        // Category keywords
        categoryKeywords: ['faculty', 'department', 'campus', 'type', 'category', 'group'],
        // Question patterns
        questionPatterns: ['how many', 'which', 'what are the'],
        chartType: 'bar',
        weight: 1
      },
      
      // Pie Charts - for proportions and part-to-whole relationships
      pie: {
        // Explicit pie chart keywords
        explicitKeywords: ['pie', 'donut', 'circle'],
        // Proportion keywords
        proportionKeywords: ['percentage', 'percent', '%', 'proportion', 'share', 'portion', 'distribution'],
        // Composition keywords
        compositionKeywords: ['composition', 'makeup', 'consists of', 'made up of', 'breakdown'],
        // Part-to-whole keywords
        partWholeKeywords: ['out of', 'total', 'whole', 'all', 'split'],
        // Priority-specific keywords (since priority data works well with pie charts)
        priorityKeywords: ['priority', 'priorities', 'urgent', 'critical', 'low', 'medium', 'high'],
        // Question patterns
        questionPatterns: ['what percent', 'how much of', 'what portion', 'show priorities'],
        chartType: 'pie',
        weight: 1.3
      },
      
      // Line Charts - for trends and time-based data
      line: {
        // Temporal keywords
        temporalKeywords: ['over time', 'timeline', 'trend', 'time', 'history', 'chronological'],
        // Change keywords
        changeKeywords: ['change', 'growth', 'increase', 'decrease', 'rise', 'fall', 'progress'],
        // Time period keywords
        periodKeywords: ['daily', 'weekly', 'monthly', 'yearly', 'semester', 'quarter'],
        // Question patterns
        questionPatterns: ['how has', 'when did', 'over the'],
        chartType: 'line',
        weight: 1.3
      },
      
      // Area Charts - for cumulative and volume data
      area: {
        // Cumulative keywords
        cumulativeKeywords: ['cumulative', 'total', 'running total', 'accumulation', 'build up'],
        // Volume keywords
        volumeKeywords: ['volume', 'amount', 'quantity', 'sum'],
        // Stacking keywords
        stackingKeywords: ['stacked', 'combined', 'together'],
        chartType: 'area',
        weight: 1.1
      }
    };
  }

  /**
   * Detects when user explicitly requests a specific chart type
   */
  detectExplicitChartType(query) {
    // Explicit chart type patterns with high priority
    const chartTypePatterns = {
      'pie': ['pie chart', 'pie graph', 'donut chart', 'circle chart'],
      'bar': ['bar chart', 'bar graph', 'column chart', 'histogram'],
      'line': ['line chart', 'line graph', 'trend chart', 'timeline chart'],
      'area': ['area chart', 'area graph', 'filled chart', 'area plot']
    };
    
    // Check for exact matches first
    for (const [chartType, patterns] of Object.entries(chartTypePatterns)) {
      for (const pattern of patterns) {
        if (query.includes(pattern)) {
          return chartType;
        }
      }
    }
    
    // Check for single word matches with chart context
    if (query.includes('chart') || query.includes('graph')) {
      if (query.includes('pie')) return 'pie';
      if (query.includes('bar')) return 'bar';
      if (query.includes('line')) return 'line';
      if (query.includes('area')) return 'area';
    }
    
    return null;
  }

  /**
   * Advanced query analysis with intelligent chart type determination
   */
  analyzeQuery(query, dashboardContext) {
    const lowerQuery = query.toLowerCase();
    const { filteredAlerts, students, metrics } = dashboardContext;
    
    // First check for explicit chart type requests
    const explicitChartType = this.detectExplicitChartType(lowerQuery);
    if (explicitChartType) {
      // If user explicitly requests a chart type, honor it with high confidence
      const dataGrouping = this.determineDataGrouping(lowerQuery, explicitChartType);
      return {
        chartType: explicitChartType,
        confidence: 0.95, // High confidence for explicit requests
        reasoning: [`Explicit ${explicitChartType} chart requested`],
        suggestedTitle: this.generateSmartTitle(query, explicitChartType, dataGrouping),
        dataGrouping: dataGrouping,
        data: this.generateChartData(explicitChartType, lowerQuery, dashboardContext, dataGrouping)
      };
    }
    
    // Analyze different aspects of the query
    const timeAnalysis = this.analyzeTemporalIntent(lowerQuery);
    const dataAnalysis = this.analyzeDataType(lowerQuery);
    const intentAnalysis = this.analyzeIntent(lowerQuery);
    
    // Score each chart type based on multiple factors
    const chartScores = {};
    
    Object.entries(this.chartPatterns).forEach(([chartType, pattern]) => {
      let score = 0;
      let reasons = [];
      
      // Check each keyword category for this chart type
      Object.entries(pattern).forEach(([category, keywords]) => {
        if (Array.isArray(keywords)) {
          const matches = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
          if (matches > 0) {
            const categoryWeight = this.getCategoryWeight(category);
            score += matches * categoryWeight * (pattern.weight || 1);
            reasons.push(`${matches} ${category} match(es)`);
          }
        }
      });
      
      // Boost score based on data type appropriateness
      if (timeAnalysis.hasTimeComponent && chartType === 'line') {
        score += 3;
        reasons.push('time component detected');
      } else if (timeAnalysis.hasCumulativeIntent && chartType === 'area') {
        score += 3;
        reasons.push('cumulative intent detected');
      } else if (intentAnalysis.isComparison && chartType === 'bar') {
        score += 2;
        reasons.push('comparison intent detected');
      } else if (intentAnalysis.isProportional && chartType === 'pie') {
        score += 2;
        reasons.push('proportional intent detected');
      }
      
      // Penalize inappropriate combinations
      if (!timeAnalysis.hasTimeComponent && (chartType === 'line' || chartType === 'area')) {
        score -= 1;
        reasons.push('no time component for temporal chart');
      }
      
      chartScores[chartType] = { score, reasons };
    });
    
    // Find the best match
    const bestMatch = Object.entries(chartScores).reduce((best, [type, data]) => {
      return data.score > best.score ? { type, ...data } : best;
    }, { type: 'bar', score: 0, reasons: [] });
    
    // Determine data grouping based on query
    const dataGrouping = this.determineDataGrouping(lowerQuery, bestMatch.type);
    
    return {
      chartType: bestMatch.type,
      confidence: Math.min(bestMatch.score / 5, 1), // Normalize confidence
      reasoning: bestMatch.reasons,
      suggestedTitle: this.generateSmartTitle(query, bestMatch.type, dataGrouping),
      dataGrouping: dataGrouping,
      data: this.generateChartData(bestMatch.type, lowerQuery, dashboardContext, dataGrouping)
    };
  }

  analyzeTemporalIntent(query) {
    const timeKeywords = ['time', 'timeline', 'trend', 'over', 'during', 'since', 'until', 'history', 'progress'];
    const periodKeywords = ['daily', 'weekly', 'monthly', 'yearly', 'semester', 'quarter'];
    const cumulativeKeywords = ['cumulative', 'total', 'running', 'accumulation'];
    
    return {
      hasTimeComponent: timeKeywords.some(keyword => query.includes(keyword)) || 
                       periodKeywords.some(keyword => query.includes(keyword)),
      hasCumulativeIntent: cumulativeKeywords.some(keyword => query.includes(keyword))
    };
  }

  analyzeDataType(query) {
    const categoricalKeywords = ['faculty', 'department', 'campus', 'type', 'category', 'status', 'priority'];
    const numericalKeywords = ['count', 'number', 'amount', 'total', 'sum'];
    
    return {
      isCategorical: categoricalKeywords.some(keyword => query.includes(keyword)),
      isNumerical: numericalKeywords.some(keyword => query.includes(keyword))
    };
  }

  analyzeIntent(query) {
    const comparisonKeywords = ['compare', 'versus', 'vs', 'difference', 'between', 'against'];
    const proportionKeywords = ['percent', 'percentage', 'proportion', 'share', 'portion', 'makeup'];
    const rankingKeywords = ['most', 'least', 'top', 'bottom', 'highest', 'lowest', 'best', 'worst'];
    
    return {
      isComparison: comparisonKeywords.some(keyword => query.includes(keyword)),
      isProportional: proportionKeywords.some(keyword => query.includes(keyword)),
      isRanking: rankingKeywords.some(keyword => query.includes(keyword))
    };
  }

  getCategoryWeight(category) {
    const weights = {
      'explicitKeywords': 5.0,        // Highest priority for explicit chart type requests
      'intentKeywords': 2.0,
      'proportionKeywords': 2.5,
      'temporalKeywords': 3.0,
      'cumulativeKeywords': 2.5,
      'distributionKeywords': 2.0,    // Increased for pie charts
      'priorityKeywords': 2.5,        // New category for priority-related queries
      'questionPatterns': 1.0,
      'categoryKeywords': 1.2
    };
    return weights[category] || 1.0;
  }

  determineDataGrouping(query, chartType) {
    // Priority order based on keywords in query
    if (query.includes('faculty') || query.includes('department')) return 'faculty';
    if (query.includes('priority')) return 'priority';
    if (query.includes('status')) return 'status';
    if (query.includes('type') || query.includes('alert type')) return 'alertType';
    if (query.includes('campus')) return 'campus';
    if (query.includes('time') || query.includes('date') || chartType === 'line' || chartType === 'area') return 'timeline';
    
    // Default based on chart type
    if (chartType === 'pie') return 'priority'; // Most meaningful for pie charts
    if (chartType === 'line' || chartType === 'area') return 'timeline';
    return 'faculty'; // Default for bar charts
  }

  generateSmartTitle(query, chartType, dataGrouping) {
    // Extract the core intent from the query
    let title = query
      .replace(/^(show|display|generate|create|make|give|get)\s+/i, '')
      .replace(/\b(me|a|an|the)\b/gi, '')
      .trim();
    
    // Add chart type context if not explicit
    if (!title.toLowerCase().includes('chart') && !title.toLowerCase().includes('graph')) {
      const chartTypeNames = {
        'bar': 'Bar Chart',
        'pie': 'Distribution',
        'line': 'Trend',
        'area': 'Cumulative View'
      };
      title = `${chartTypeNames[chartType]}: ${title}`;
    }
    
    // Capitalize properly
    return title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generates chart data based on the determined chart type and user query
   */
  generateChartData(chartType, query, dashboardContext, dataGrouping) {
    const { filteredAlerts, students, metrics } = dashboardContext;
    
    switch (chartType) {
      case 'bar':
        return this.generateBarChartData(dataGrouping, filteredAlerts, students);
      case 'pie':
        return this.generatePieChartData(dataGrouping, filteredAlerts);
      case 'line':
        return this.generateLineChartData(dataGrouping, filteredAlerts);
      case 'area':
        return this.generateAreaChartData(dataGrouping, filteredAlerts);
      default:
        return this.generateBarChartData(dataGrouping, filteredAlerts, students);
    }
  }

  generateBarChartData(dataGrouping, alerts, students) {
    switch (dataGrouping) {
      case 'faculty':
        return this.groupByFaculty(alerts);
      case 'priority':
        return this.groupByPriority(alerts);
      case 'status':
        return this.groupByStatus(alerts);
      case 'alertType':
        return this.groupByAlertType(alerts);
      case 'campus':
        return this.groupByCampus(alerts);
      case 'timeline':
        return this.generateTimelineData(alerts, false);
      default:
        return this.groupByFaculty(alerts);
    }
  }

  generatePieChartData(dataGrouping, alerts) {
    switch (dataGrouping) {
      case 'priority':
        return this.groupByPriority(alerts, true);
      case 'status':
        return this.groupByStatus(alerts, true);
      case 'faculty':
        return this.groupByFaculty(alerts, true);
      case 'alertType':
        return this.groupByAlertType(alerts, true);
      case 'campus':
        return this.groupByCampus(alerts, true);
      default:
        return this.groupByPriority(alerts, true);
    }
  }

  generateLineChartData(dataGrouping, alerts) {
    if (dataGrouping === 'timeline' || dataGrouping === 'time') {
      return this.generateTimelineData(alerts, false);
    }
    // For non-timeline data, convert to timeline
    return this.generateTimelineData(alerts, false);
  }

  generateAreaChartData(dataGrouping, alerts) {
    const lineData = this.generateTimelineData(alerts, false);
    let cumulative = 0;
    
    return lineData.map(item => ({
      ...item,
      value: cumulative += item.value
    }));
  }

  generateTimelineData(alerts, cumulative = false) {
    // Group alerts by date
    const dateGroups = {};
    
    alerts.forEach(alert => {
      const date = new Date(alert.dateRaised).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });
    
    const sortedData = Object.entries(dateGroups)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: count,
        date: date,
        fullDate: new Date(date).toLocaleDateString()
      }));

    if (cumulative) {
      let running = 0;
      return sortedData.map(item => ({
        ...item,
        value: running += item.value
      }));
    }

    return sortedData;
  }

  // Helper methods for grouping data
  groupByFaculty(alerts, forPie = false) {
    const facultyMap = {
      'LAPS': 'Liberal Arts & Professional Studies',
      'AMPD': 'Arts, Media, Performance & Design',
      'EDU': 'Education',
      'ENG': 'Engineering',
      'ES': 'Environmental Studies',
      'GLENDON': 'Glendon',
      'GS': 'Graduate Studies',
      'HEALTH': 'Health',
      'LAW': 'Law',
      'SCI': 'Science',
      'SCHULICH': 'Schulich School of Business'
    };

    const groups = {};
    alerts.forEach(alert => {
      const faculty = alert.faculty || 'Unknown';
      const displayName = facultyMap[faculty] || faculty;
      groups[displayName] = (groups[displayName] || 0) + 1;
    });

    const data = Object.entries(groups).map(([name, value]) => ({ name, value }));
    
    if (forPie) {
      // Add colors for pie charts
      const colors = ['#E31837', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'];
      return data.map((item, index) => ({
        ...item,
        fill: colors[index % colors.length]
      }));
    }
    
    return data;
  }

  groupByPriority(alerts, forPie = false) {
    const priorities = { 'High': 0, 'Medium': 0, 'Low': 0 };
    
    alerts.forEach(alert => {
      const priority = alert.priority || 'Medium';
      priorities[priority] = (priorities[priority] || 0) + 1;
    });

    const data = Object.entries(priorities).map(([name, value]) => ({ name, value }));
    
    if (forPie) {
      const colors = { 'High': '#DC2626', 'Medium': '#F59E0B', 'Low': '#10B981' };
      return data.map(item => ({
        ...item,
        fill: colors[item.name] || '#6B7280'
      }));
    }
    
    return data;
  }

  groupByStatus(alerts, forPie = false) {
    const statuses = {};
    
    alerts.forEach(alert => {
      const status = alert.status || 'Open';
      statuses[status] = (statuses[status] || 0) + 1;
    });

    const data = Object.entries(statuses).map(([name, value]) => ({ name, value }));
    
    if (forPie) {
      const colors = ['#E31837', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6'];
      return data.map((item, index) => ({
        ...item,
        fill: colors[index % colors.length]
      }));
    }
    
    return data;
  }

  groupByAlertType(alerts, forPie = false) {
    const types = {};
    
    alerts.forEach(alert => {
      const type = alert.alertType || 'Academic';
      types[type] = (types[type] || 0) + 1;
    });

    const data = Object.entries(types).map(([name, value]) => ({ name, value }));
    
    if (forPie) {
      const colors = ['#E31837', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EC4899'];
      return data.map((item, index) => ({
        ...item,
        fill: colors[index % colors.length]
      }));
    }
    
    return data;
  }

  groupByCampus(alerts, forPie = false) {
    const campuses = {};
    
    alerts.forEach(alert => {
      const campus = alert.campus || 'Keele';
      campuses[campus] = (campuses[campus] || 0) + 1;
    });

    const data = Object.entries(campuses).map(([name, value]) => ({ name, value }));
    
    if (forPie) {
      const colors = ['#E31837', '#B91C1C', '#991B1B', '#7F1D1D'];
      return data.map((item, index) => ({
        ...item,
        fill: colors[index % colors.length]
      }));
    }
    
    return data;
  }

  /**
   * Generates intelligent visualization suggestions based on the current data
   */
  generateSuggestions(dashboardContext) {
    const { filteredAlerts, metrics } = dashboardContext;
    
    // Base suggestions that showcase different chart types
    const suggestions = [
      // Bar chart examples (comparisons)
      "Compare alerts by faculty",
      "Show top departments with most alerts",
      "Breakdown of alerts by status",
      
      // Pie chart examples (proportions)
      "What percentage are high priority alerts?",
      "Show the composition of alert types",
      "Display priority distribution",
      
      // Line chart examples (trends)
      "Show alert trends over time",
      "How have alerts changed this semester?",
      "Timeline of alerts this month",
      
      // Area chart examples (cumulative)
      "Cumulative alerts over time",
      "Running total of resolved alerts",
      "Show total alert volume growth"
    ];
    
    // Add contextual suggestions based on current data
    if (metrics?.uniqueStudents > 100) {
      suggestions.push("Compare student alert rates by faculty");
    }
    
    if (filteredAlerts?.length > 50) {
      suggestions.push("What's the trend in recent alerts?");
    }
    
    return suggestions;
  }
}

export default new VisualizationService();
