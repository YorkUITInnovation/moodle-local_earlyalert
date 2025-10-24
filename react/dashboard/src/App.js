import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { AlertTriangle, Users, TrendingUp, CheckCircle, Filter, Download, Eye, UserCheck, ChevronUp, ChevronDown, Search, RefreshCw, X, FileSpreadsheet, Brain, Send, Bot, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Chatbot from './components/Chatbot';
import PWAManager from './components/PWAManager';
import VisualizationPanel from './components/VisualizationPanel';
import ViewToggle from './components/ViewToggle';
import AdministratorView from './components/AdministratorView';
import AdvisorView from './components/AdvisorView';
import { useApiData } from './hooks/useApiData';
import azureOpenAIService from './services/azureOpenAIService';

// Simple markdown renderer for AI responses
const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    // First, normalize the text by handling different line break patterns
    let normalizedText = text
      // Convert Windows line endings to Unix
      .replace(/\r\n/g, '\n')
      // Handle cases where bullet points are immediately after text without double newlines
      .replace(/([.!?])\s*\n- /g, '$1\n\n- ')
      // Handle cases where headers are immediately after text
      .replace(/([.!?])\s*\n(#{1,3}\s)/g, '$1\n\n$2')
      // Ensure bullet lists have proper spacing
      .replace(/\n- /g, '\n- ')
      .replace(/\n\* /g, '\n* ');
    
    // Split by double newlines to get paragraphs, but also handle single newlines followed by bullets
    const sections = normalizedText.split(/\n\s*\n/);
    
    return sections.map((section, sIndex) => {
      // Skip empty sections
      if (!section.trim()) return null;
      
      // Check if it's a header
      if (section.startsWith('###')) {
        return (
          <h3 key={sIndex} className="text-base font-semibold text-gray-900 mb-2 mt-3">
            {section.replace(/^### /, '')}
          </h3>
        );
      }
      
      if (section.startsWith('##')) {
        return (
          <h2 key={sIndex} className="text-lg font-semibold text-gray-900 mb-2 mt-3">
            {section.replace(/^## /, '')}
          </h2>
        );
      }
      
      if (section.startsWith('#')) {
        return (
          <h1 key={sIndex} className="text-xl font-bold text-gray-900 mb-2 mt-3">
            {section.replace(/^# /, '')}
          </h1>
        );
      }
      
      // Check if this section contains bullet points or numbered lists
      const lines = section.split('\n').filter(line => line.trim());
      const listItems = [];
      const regularLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
          listItems.push(line.replace(/^[\-\*] /, ''));
        } else if (line.match(/^\d+\. /)) {
          listItems.push(line.replace(/^\d+\. /, ''));
        } else {
          // If we have accumulated list items, render them first
          if (listItems.length > 0) {
            regularLines.push(
              <ul key={`list-${i}`} className="list-disc list-inside mb-2 space-y-1">
                {listItems.map((item, itemIndex) => (
                  <li key={itemIndex} className="ml-4">
                    {formatInlineMarkdown(item)}
                  </li>
                ))}
              </ul>
            );
            listItems.length = 0; // Clear the array
          }
          regularLines.push(line);
        }
      }
      
      // Handle any remaining list items
      if (listItems.length > 0) {
        regularLines.push(
          <ul key={`list-end`} className="list-disc list-inside mb-2 space-y-1">
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="ml-4">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }
      
      // If we only have React elements (lists), return them
      if (regularLines.every(line => React.isValidElement(line))) {
        return (
          <div key={sIndex} className="mb-2">
            {regularLines}
          </div>
        );
      }
      
      // Process regular text lines
      const textContent = regularLines.filter(line => typeof line === 'string').join(' ');
      const reactElements = regularLines.filter(line => React.isValidElement(line));
      
      return (
        <div key={sIndex} className="mb-2">
          {textContent && (
            <p className="mb-2 leading-relaxed">
              {formatInlineMarkdown(textContent)}
            </p>
          )}
          {reactElements}
        </div>
      );
    }).filter(Boolean);
  };
  
  const formatInlineMarkdown = (text) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle inline code
    text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };
  
  return (
    <div className="prose prose-sm max-w-none">
      {renderMarkdown(content)}
    </div>
  );
};

const EarlyAlertDashboard = () => {
  // API data hook
  const { 
    loading, 
    error, 
    students, 
    alerts, 
    metrics, 
    chartData,
    usingMockData,
    loadData, 
    refreshAlerts, 
    refreshMetrics,
    refreshChartData
  } = useApiData();

  const [searchTerm, setSearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dateRaised');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemplateType, setFilterTemplateType] = useState('');
  const [filterStudentType, setFilterStudentType] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterAlertType, setFilterAlertType] = useState('');
  const [filterAcademicStatus, setFilterAcademicStatus] = useState('');
  const [filterStudyLevel, setFilterStudyLevel] = useState('');
  const [selectedChartData, setSelectedChartData] = useState(null);
  const [chartFilterType, setChartFilterType] = useState(null);
  const [userRole, setUserRole] = useState('Administrator');
  const [currentView, setCurrentView] = useState('administrator'); // New view state
  const [viewLockedByQuery, setViewLockedByQuery] = useState(false); // Track if view is set by query param
  const [selectedDate, setSelectedDate] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showConversationalAnalytics, setShowConversationalAnalytics] = useState(false);
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI Analytics Assistant for the Early Alert Dashboard. I can help you analyze student data, understand trends, and provide insights based on your current dashboard data. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Read report_type query parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportType = urlParams.get('report_type');

    if (reportType) {
      if (reportType === 'admin') {
        setCurrentView('administrator');
        setViewLockedByQuery(true);
      } else if (reportType === 'advisor') {
        setCurrentView('advisor');
        setViewLockedByQuery(true);
      }
    }
  }, []);

  // Color scheme for charts - Updated with brand color #E31837
  const COLORS = ['#E31837', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#EF4444', '#F87171'];

  // Faculty name mapping for consistent display - York University faculties
  const facultyMapping = {
    'LAPS': 'Liberal Arts & Professional Studies',
    'AP': 'Liberal Arts & Professional Studies', 
    'SC': 'Faculty of Science',
    'LE': 'Lassonde School of Engineering',
    'GL': 'Glendon College',
    'HH': 'Faculty of Health',
    'FA': 'Faculty of Fine Arts',
    'ED': 'Faculty of Education',
    'GS': 'Faculty of Graduate Studies',
    'SB': 'Schulich School of Business',
    'ES': 'Faculty of Environmental & Urban Change',
    'OS': 'Osgoode Hall Law School',
    'Schulich': 'Schulich School of Business',
    'Lassonde': 'Lassonde School of Engineering',
    'Science': 'Faculty of Science',
    'AMPD': 'Faculty of Fine Arts',
    'Health': 'Faculty of Health',
    'Graduate Studies': 'Faculty of Graduate Studies',
    'Glendon': 'Glendon College',
    'Education': 'Faculty of Education',
    'Environment and Urban Change': 'Faculty of Environmental & Urban Change',
    'Osgoode': 'Osgoode Hall Law School'
  };

  // Column configuration for table - updated for real student data
  const availableColumns = [
    { id: 'studentName', label: 'Student Name', required: true },
    { id: 'alertType', label: 'Alert Type', required: true },
    { id: 'dateRaised', label: 'Date Raised', required: true },
    { id: 'status', label: 'Status', required: false },
    { id: 'faculty', label: 'Faculty', required: false },
    { id: 'campus', label: 'Campus', required: false },
    { id: 'course', label: 'Course', required: false },
    { id: 'priority', label: 'Priority', required: false },
    { id: 'professor', label: 'Professor', required: false },
    { id: 'academicDecision', label: 'Academic Decision', required: false },
    { id: 'gpa', label: 'GPA', required: false },
    { id: 'studentType', label: 'Student Type', required: false },
    { id: 'program', label: 'Program', required: false },
    { id: 'studyLevel', label: 'Study Level', required: false },
    { id: 'assignmentName', label: 'Assignment', required: false },
    { id: 'triggerGrade', label: 'Trigger Grade', required: false },
    { id: 'actualGrade', label: 'Actual Grade', required: false }
  ];

  // Initialize data from API
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debug: Log when alerts data changes
  useEffect(() => {
    console.log('🔄 ALERTS DATA UPDATED - Count:', alerts.length);
    if (alerts.length > 0) {
      console.log('📋 First alert sample:', {
        alertType: alerts[0].alertType,
        templateType: alerts[0].template_type,
        student: {
          immigrationStatus: alerts[0].student?.immigrationStatus,
          academicStatus: alerts[0].student?.academicStatus
        }
      });
    }
  }, [alerts]);

  // Filter alerts based on current filter selections
  const filteredAlerts = useMemo(() => {
    console.log('🔍 FILTERING ALERTS - Total alerts:', alerts.length);
    
    // Debug: Log immigration status distribution
    const immigrationStatusCounts = {};
    alerts.forEach(alert => {
      const status = alert.student?.immigrationStatus || 'Missing';
      immigrationStatusCounts[status] = (immigrationStatusCounts[status] || 0) + 1;
    });
    console.log('📊 Immigration Status Distribution:', immigrationStatusCounts);
    console.log('📊 Sample student data:', alerts.slice(0, 3).map(a => ({
      sisId: a.student?.sisId,
      immigrationStatus: a.student?.immigrationStatus
    })));
    
    return alerts.filter(alert => {
      const matchesFaculty = !filterFaculty || alert.faculty === filterFaculty;
      const matchesStatus = !filterStatus || alert.status === filterStatus;
      const matchesTemplateType = !filterTemplateType || alert.template_type === filterTemplateType;
      const matchesStudentType = !filterStudentType || alert.student?.immigrationStatus === filterStudentType;
      const matchesCampus = !filterCampus || alert.campus === filterCampus;
      const matchesAlertType = !filterAlertType || alert.alertType === filterAlertType;
      const matchesAcademicStatus = !filterAcademicStatus || alert.student?.academicStatus === filterAcademicStatus;
      const matchesStudyLevel = !filterStudyLevel || alert.student?.studyLevel === filterStudyLevel;
      
      const matchesChart = !selectedChartData || (
        (chartFilterType === 'alertType' && alert.alertType === selectedChartData) ||
        (chartFilterType === 'faculty' && (facultyMapping[alert.faculty] || alert.faculty) === selectedChartData)
      );

      return matchesFaculty && matchesStatus && matchesTemplateType && matchesStudentType && 
             matchesCampus && matchesAlertType && matchesAcademicStatus && matchesStudyLevel && 
             matchesChart;
    });
  }, [alerts, filterFaculty, filterStatus, filterTemplateType, filterStudentType, filterCampus, 
      filterAlertType, filterAcademicStatus, filterStudyLevel, selectedChartData, chartFilterType, facultyMapping]);

  // Sort filtered alerts
  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties (e.g., student.immigrationStatus)
      if (sortField.includes('.')) {
        const keys = sortField.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }
      
      // Handle date sorting
      if (sortField === 'dateRaised') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAlerts, sortField, sortDirection]);

  // Filter alerts for the table with additional table search
  const tableFilteredAlerts = useMemo(() => {
    return sortedAlerts.filter(alert => {
      const matchesTableSearch = !tableSearchTerm || 
        alert.studentName?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        alert.email?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        alert.alertType?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        alert.course?.toLowerCase().includes(tableSearchTerm.toLowerCase());
      
      return matchesTableSearch;
    });
  }, [sortedAlerts, tableSearchTerm]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Use chart data from API, with fallbacks for when API data is not available
  // But make charts responsive to current filters
  const currentAlertTypeData = useMemo(() => {
    // Define the three alert type categories that should always appear
    const alertTypeCategories = {
      'Low Grade': 0,
      'Missed Assignment': 0,
      'Missed Test/Quiz': 0
    };
    
    // Count alerts by type from filtered alerts
    filteredAlerts.forEach(alert => {
      const type = alert.alertType;
      if (type && alertTypeCategories.hasOwnProperty(type)) {
        alertTypeCategories[type]++;
      }
    });
    
    // Convert to array format for the chart with complementary but distinct colors
    return Object.entries(alertTypeCategories).map(([name, value]) => ({ 
      name, 
      value,
      color: name === 'Low Grade' ? '#E31837' :        // Red (York University red)
             name === 'Missed Assignment' ? '#F59E0B' : // Amber/Orange
             '#6366F1'                                  // Indigo/Purple (Missed Test/Quiz)
    }));
  }, [filteredAlerts]);

  const currentFacultyData = useMemo(() => {
    if (!chartData?.faculty_distribution) return [];
    
    // If no filters are applied, use API data  
    if (!selectedChartData && !filterFaculty && !filterStatus && !filterTemplateType && !filterStudentType && 
        !filterCampus && !filterAlertType && !filterAcademicStatus && !filterStudyLevel && !searchTerm) {
      return chartData.faculty_distribution.map(item => ({
        name: facultyMapping[item.name] || item.name,
        alerts: item.value
      }));
    }
    
    // Calculate from filtered alerts
    const facultyCounts = {};
    filteredAlerts.forEach(alert => {
      const properFacultyName = facultyMapping[alert.faculty] || alert.faculty;
      facultyCounts[properFacultyName] = (facultyCounts[properFacultyName] || 0) + 1;
    });
    
    return Object.entries(facultyCounts).map(([name, alerts]) => ({ name, alerts }));
  }, [chartData, filteredAlerts, selectedChartData, filterFaculty, filterStatus, filterTemplateType, filterStudentType, searchTerm, facultyMapping]);

  const currentTimelineData = useMemo(() => {
    if (!chartData?.timeline_data) return [];
    
    // If no filters are applied, use API data
    if (!selectedChartData && !filterFaculty && !filterStatus && !filterTemplateType && !filterStudentType && 
        !filterCampus && !filterAlertType && !filterAcademicStatus && !filterStudyLevel && !searchTerm) {
      return chartData.timeline_data;
    }
    
    // Calculate from filtered alerts
    const timelineCounts = {};
    filteredAlerts.forEach(alert => {
      const date = new Date(alert.dateRaised).toISOString().split('T')[0];
      timelineCounts[date] = (timelineCounts[date] || 0) + 1;
    });
    
    return Object.entries(timelineCounts)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, alerts]) => ({ date, alerts }));
  }, [chartData, filteredAlerts, selectedChartData, filterFaculty, filterStatus, filterTemplateType, filterStudentType, searchTerm]);

  const currentInterventionData = useMemo(() => {
    if (!chartData?.status_distribution) return [];
    
    // If no filters are applied, use API data
    if (!selectedChartData && !filterFaculty && !filterStatus && !filterTemplateType && !filterStudentType && 
        !filterCampus && !filterAlertType && !filterAcademicStatus && !filterStudyLevel && !searchTerm) {
      return chartData.status_distribution;
    }
    
    // Calculate from filtered alerts
    const statusCounts = {};
    filteredAlerts.forEach(alert => {
      const status = alert.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [chartData, filteredAlerts, selectedChartData, filterFaculty, filterStatus, filterTemplateType, filterStudentType, searchTerm]);

  const currentRiskSegmentationData = chartData?.risk_segmentation || [];
  const currentCampusAnalysisData = useMemo(() => {
    if (!chartData?.campus_analysis) return [];
    
    // If no filters are applied, use API data
    if (!selectedChartData && !filterFaculty && !filterStatus && !filterTemplateType && !filterStudentType && 
        !filterCampus && !filterAlertType && !filterAcademicStatus && !filterStudyLevel && !searchTerm) {
      return chartData.campus_analysis.map(item => ({
        name: item.campus,
        totalAlerts: item.alerts,
        uniqueStudents: item.students
      }));
    }
    
    // Calculate from filtered alerts
    const campusCounts = {};
    const campusStudents = {};
    filteredAlerts.forEach(alert => {
      campusCounts[alert.campus] = (campusCounts[alert.campus] || 0) + 1;
      if (!campusStudents[alert.campus]) campusStudents[alert.campus] = new Set();
      campusStudents[alert.campus].add(alert.studentId);
    });
    
    return Object.entries(campusCounts).map(([name, totalAlerts]) => ({
      name,
      totalAlerts,
      uniqueStudents: campusStudents[name]?.size || 0
    }));
  }, [chartData, filteredAlerts, selectedChartData, filterFaculty, filterStatus, filterTemplateType, filterStudentType, searchTerm]);

  // Get unique faculties from the actual data for the filter dropdown
  const availableFaculties = useMemo(() => {
    const faculties = new Set();
    alerts.forEach(alert => {
      if (alert.faculty) {
        faculties.add(alert.faculty);
      }
    });
    return Array.from(faculties).sort();
  }, [alerts]);

  // Get unique statuses from the actual data
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    alerts.forEach(alert => {
      if (alert.status) {
        statuses.add(alert.status);
      }
    });
    return Array.from(statuses).sort();
  }, [alerts]);

  // Get unique template types from the actual data
  const availableTemplateTypes = useMemo(() => {
    console.log('🔍 Total alerts loaded:', alerts.length);
    console.log('🔍 First 3 alerts:', alerts.slice(0, 3));
    
    const templateTypes = new Set();
    alerts.forEach(alert => {
      if (alert.template_type) {
        templateTypes.add(alert.template_type);
      }
    });
    const result = Array.from(templateTypes).sort();
    console.log('🔍 Available Template Types:', result);
    console.log('📊 Sample alert with template_type:', alerts.find(a => a.template_type));
    console.log('📊 All alerts with template_type:', alerts.filter(a => a.template_type).length, 'out of', alerts.length);
    return result;
  }, [alerts]);

  // Get unique campuses from the actual data
  const availableCampuses = useMemo(() => {
    const campuses = new Set();
    alerts.forEach(alert => {
      if (alert.campus) {
        campuses.add(alert.campus);
      }
    });
    return Array.from(campuses).sort();
  }, [alerts]);

  // Get unique alert types from the actual data
  const availableAlertTypes = useMemo(() => {
    const alertTypes = new Set();
    alerts.forEach(alert => {
      if (alert.alertType) {
        alertTypes.add(alert.alertType);
      }
    });
    const types = Array.from(alertTypes).sort();
    console.log('🎯 Available Alert Types for dropdown:', types);
    return types;
  }, [alerts]);

  // Get unique academic statuses from the actual data
  const availableAcademicStatuses = useMemo(() => {
    const statuses = new Set();
    console.log('🔍 Extracting academic statuses from', alerts.length, 'alerts');
    alerts.forEach(alert => {
      const status = alert.student?.academicStatus;
      if (status) {
        statuses.add(status);
      }
    });
    const statusArray = Array.from(statuses).sort();
    console.log('📊 Available Academic Statuses:', statusArray);
    return statusArray;
  }, [alerts]);

  // Get unique study levels from the actual data
  const availableStudyLevels = useMemo(() => {
    const levels = new Set();
    alerts.forEach(alert => {
      if (alert.student?.studyLevel) {
        levels.add(alert.student.studyLevel);
      }
    });
    return Array.from(levels).sort();
  }, [alerts]);

  // Handle chart click for filtering
  const handleChartClick = (value, type) => {
    setSelectedChartData(value);
    setChartFilterType(type);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // Use the integrated service that handles both local and AI analytics
      console.log('🤖 Processing query with integrated analytics...');
      
      // Send to integrated service - it will automatically choose local or AI
      const response = await azureOpenAIService.sendMessage(message, students, {
        alerts: alerts,
        filteredAlerts: alerts,
        allAlerts: alerts,
        metrics: metrics,
        studentData: students,
        facultyData: [],
        alertTypeData: [],
        campusAnalysisData: [],
        timelineData: [],
        interventionData: [],
        currentFilters: {}
      });
      
      const aiResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setIsChatLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I apologize, but I encountered an error while processing your request: ${error.message}. Please try asking a more specific question or check the browser console for more details.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
      setIsChatLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  // Export filtered data to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export - updated for real student data
      const exportData = tableFilteredAlerts.map((alert, index) => ({
        'Row #': index + 1,
        'Student Name': `${alert.student?.firstName || alert.student?.firstname || ''} ${alert.student?.lastName || alert.student?.lastname || ''}`.trim(),
        'Student ID': alert.student?.sisId || alert.student?.sisid || 'N/A',
        'Email': alert.student?.email || alert.email || 'N/A',
        'Faculty': facultyMapping[alert.faculty] || alert.faculty || 'N/A',
        'Campus': alert.campus || 'N/A',
        'Program': alert.student?.program || alert.program || 'N/A',
        'Student Type': alert.student?.immigrationStatus || alert.immigrationStatus || 'N/A',
        'Study Level': alert.student?.studyLevel || alert.studyLevel || 'N/A',
        'Academic Status': alert.student?.academicStatus || 'N/A',
        'Academic Decision': alert.student?.academicDecision || alert.academicDecision || 'N/A',
        'GPA': alert.student?.ogpa || alert.ogpa || 'N/A',
        'OSAP': alert.student?.osapFlag ? 'Yes' : 'No',
        'ESL': alert.student?.eslFlag ? 'Yes' : 'No',
        'Varsity': alert.student?.varsityFlag ? 'Yes' : 'No',
        'Scholarship': alert.student?.scholarshipFlag ? 'Yes' : 'No',
        'Alert Type': alert.alertType || 'N/A',
        'Course Code': alert.courseCode || alert.course || 'N/A',
        'Course Name': alert.courseName || 'N/A',
        'Professor': alert.professorName || alert.professor || 'N/A',
        'Priority': alert.priority || 'N/A',
        'Status': alert.status || 'N/A',
        'Description': alert.description || 'N/A',
        'Assigned To': alert.assignedTo || 'N/A',
        'Follow-up Notes': alert.followUpNotes || 'N/A',
        'Follow-up Initiated': alert.followUpInitiated ? 'Yes' : 'No',
        'Student Contacted': alert.studentContacted ? 'Yes' : 'No',
        'Date Raised': alert.dateRaised ? new Date(alert.dateRaised).toLocaleDateString() : 'N/A',
        'Last Updated': alert.lastUpdated ? new Date(alert.lastUpdated).toLocaleDateString() : 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 8 },   // Row #
        { wch: 20 },  // Student Name
        { wch: 12 },  // Student ID
        { wch: 25 },  // Email
        { wch: 20 },  // Faculty
        { wch: 25 },  // Program
        { wch: 12 },  // Student Type
        { wch: 15 },  // Study Level
        { wch: 8 },   // GPA
        { wch: 20 },  // Alert Type
        { wch: 12 },  // Course Code
        { wch: 25 },  // Course Name
        { wch: 20 },  // Professor
        { wch: 10 },  // Priority
        { wch: 12 },  // Status
        { wch: 40 },  // Description
        { wch: 20 },  // Assigned To
        { wch: 30 },  // Follow-up Notes
        { wch: 12 },  // Date Raised
        { wch: 12 }   // Last Updated
      ];
      ws['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Early Alerts Data');

      // Generate filename with current date and filters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filterInfo = [];
      if (filterFaculty) filterInfo.push(`Faculty-${filterFaculty}`);
      if (filterStatus) filterInfo.push(`Status-${filterStatus}`);
      if (filterTemplateType) filterInfo.push(`Template-${filterTemplateType}`);
      if (filterStudentType) filterInfo.push(`Type-${filterStudentType}`);
      if (filterCampus) filterInfo.push(`Campus-${filterCampus}`);
      if (filterAlertType) filterInfo.push(`Alert-${filterAlertType.replace(/[^a-zA-Z0-9]/g, '')}`);
      if (filterAcademicStatus) filterInfo.push(`AcadStatus-${filterAcademicStatus.replace(/[^a-zA-Z0-9]/g, '')}`);
      if (filterStudyLevel) filterInfo.push(`StudyLevel-${filterStudyLevel.replace(/[^a-zA-Z0-9]/g, '')}`);
      if (tableSearchTerm) filterInfo.push(`Search-${tableSearchTerm.replace(/[^a-zA-Z0-9]/g, '')}`);
      
      const filterSuffix = filterInfo.length > 0 ? `_${filterInfo.join('_')}` : '';
      const filename = `York_EarlyAlerts_${dateStr}${filterSuffix}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      console.log(`Exported ${exportData.length} records to ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data to Excel. Please try again.');
    }
  };

  // Rest of the component logic would go here...
  // For now, let's just return the basic chart structure

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Manager for install prompt, offline status, and updates */}
      <PWAManager />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">York University Early Alert Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Powered by Llamalytics</p>
          
          <div className="flex items-center gap-4 mt-4" style={{ marginBottom: '0px' }}>
            <button 
              onClick={() => loadData()} 
              disabled={loading}
              style={{
                backgroundColor: '#E31837',
                color: 'white',
                opacity: loading ? 0.75 : 1
              }}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-200 ${
                loading 
                  ? 'cursor-not-allowed' 
                  : 'hover:bg-[#B91C1C]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            
            <button
              onClick={() => {
                console.log('Ask AI button clicked!');
                setShowConversationalAnalytics(!showConversationalAnalytics);
              }}
              className="flex items-center gap-2 px-4 py-2 btn-ask-ai rounded-lg transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: showConversationalAnalytics ? '#B91C1C' : '#E31837',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'none'
              }}
            >
              <Brain className="w-4 h-4" />
              {showConversationalAnalytics ? 'Hide AI' : 'Ask AI'}
            </button>
            
            <button
              onClick={() => {
                console.log('Generate Charts button clicked!');
                setShowVisualizationPanel(!showVisualizationPanel);
              }}
              className="flex items-center gap-2 px-4 py-2 btn-visualize rounded-lg transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: showVisualizationPanel ? '#B91C1C' : '#E31837',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <BarChart3 className="w-4 h-4" />
              {showVisualizationPanel ? 'Hide Charts' : 'Generate Charts'}
            </button>
          </div>
          
          {/* Inline Conversational Analytics */}
          {showConversationalAnalytics && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ marginTop: '0px' }}>
              <div className="p-4 border-b bg-gradient-to-r from-[#E31837] to-[#B91C1C] text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">AI Analytics Assistant</h3>
                    <p className="text-sm text-red-100">Ask questions about your dashboard data</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {/* Messages Area */}
                <div className="h-64 bg-gray-50 rounded-lg border overflow-y-auto p-2">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-[#E31837] text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Assistant</span>
                          </div>
                        )}
                        <div className="text-sm">
                          {message.role === 'assistant' ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="mb-4 text-left">
                      <div className="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4" />
                          <span className="text-sm font-medium">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#E31837]"></div>
                          <span className="text-sm">Analyzing your data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Suggested Questions - only show if no custom messages */}
                {chatMessages.length === 1 && (
                  <div className="mt-2 mb-2">
                    <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
                    <div className="space-y-1">
                      <button 
                        onClick={() => handleSuggestedQuestion("What are the key insights from the current data?")}
                        className="block w-full text-left px-3 py-1.5 text-sm bg-white hover:bg-gray-100 rounded border transition-colors"
                      >
                        What are the key insights from the current data?
                      </button>
                      <button 
                        onClick={() => handleSuggestedQuestion("Which faculty needs the most attention?")}
                        className="block w-full text-left px-3 py-1.5 text-sm bg-white hover:bg-gray-100 rounded border transition-colors"
                      >
                        Which faculty needs the most attention?
                      </button>
                      <button 
                        onClick={() => handleSuggestedQuestion("What are the most common alert types?")}
                        className="block w-full text-left px-3 py-1.5 text-sm bg-white hover:bg-gray-100 rounded border transition-colors"
                      >
                        What are the most common alert types?
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Input Area */}
                <div className="mt-4 -mx-4 px-0 pt-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3 px-4">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                      placeholder="Ask me anything about your dashboard data..."
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:border-[#E31837] text-sm bg-white"
                      style={{ width: '100%' }}
                      disabled={isChatLoading}
                    />
                    <button 
                      onClick={() => handleSendMessage(chatInput)}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="flex-shrink-0 w-12 h-12 bg-[#E31837] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Dynamic Visualization Panel */}
          {showVisualizationPanel && (
            <VisualizationPanel
              dashboardContext={{
                filteredAlerts: filteredAlerts,
                students: students,
                metrics: metrics,
                facultyData: currentFacultyData,
                alertTypeData: currentAlertTypeData,
                campusAnalysisData: currentCampusAnalysisData,
                timelineData: currentTimelineData,
                interventionData: currentInterventionData,
                currentFilters: {
                  faculty: filterFaculty,
                  status: filterStatus,
                  templateType: filterTemplateType,
                  studentType: filterStudentType
                }
              }}
              studentData={students}
              isVisible={showVisualizationPanel}
              onToggle={() => setShowVisualizationPanel(false)}
            />
          )}
        </div>

        {/* View Toggle - Only show if not locked by query parameter */}
        {!viewLockedByQuery && (
          <ViewToggle
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        )}

        {/* Conditional rendering based on current view */}
        {currentView === 'administrator' ? (
          <AdministratorView
            metrics={metrics}
            alerts={alerts}
            students={students}
            chartData={chartData}
            facultyMapping={facultyMapping}
            filteredAlerts={filteredAlerts}
            currentFacultyData={currentFacultyData}
            currentAlertTypeData={currentAlertTypeData}
            currentTimelineData={currentTimelineData}
            currentInterventionData={currentInterventionData}
            currentCampusAnalysisData={currentCampusAnalysisData}
          />
        ) : (
          <AdvisorView
            alerts={alerts}
            students={students}
            metrics={metrics}
            chartData={chartData}
            filteredAlerts={filteredAlerts}
            tableFilteredAlerts={tableFilteredAlerts}
            currentFacultyData={currentFacultyData}
            currentAlertTypeData={currentAlertTypeData}
            currentTimelineData={currentTimelineData}
            currentInterventionData={currentInterventionData}
            currentCampusAnalysisData={currentCampusAnalysisData}
            // Filter states
            tableSearchTerm={tableSearchTerm}
            setTableSearchTerm={setTableSearchTerm}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            filterFaculty={filterFaculty}
            setFilterFaculty={setFilterFaculty}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterTemplateType={filterTemplateType}
            setFilterTemplateType={setFilterTemplateType}
            filterStudentType={filterStudentType}
            setFilterStudentType={setFilterStudentType}
            filterCampus={filterCampus}
            setFilterCampus={setFilterCampus}
            filterAlertType={filterAlertType}
            setFilterAlertType={setFilterAlertType}
            filterAcademicStatus={filterAcademicStatus}
            setFilterAcademicStatus={setFilterAcademicStatus}
            filterStudyLevel={filterStudyLevel}
            setFilterStudyLevel={setFilterStudyLevel}
            // Available options
            availableFaculties={availableFaculties}
            availableStatuses={availableStatuses}
            availableTemplateTypes={availableTemplateTypes}
            availableCampuses={availableCampuses}
            availableAlertTypes={availableAlertTypes}
            availableAcademicStatuses={availableAcademicStatuses}
            availableStudyLevels={availableStudyLevels}
            // Handlers
            handleSort={handleSort}
            handleChartClick={handleChartClick}
            selectedChartData={selectedChartData}
            setSelectedChartData={setSelectedChartData}
            chartFilterType={chartFilterType}
            setChartFilterType={setChartFilterType}
          />
        )}

      </div>
    </div>
  );
};

export default EarlyAlertDashboard;
