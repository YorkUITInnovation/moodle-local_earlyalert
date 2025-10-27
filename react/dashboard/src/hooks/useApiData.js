// React hook for API data management
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

// Mock data for when API is not available
const mockStudents = [
  {
    id: 1,
    sisId: "100200001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@my.yorku.ca",
    homeFaculty: "LAPS",
    campus: "Keele",
    program: "Computer Science",
    studyLevel: "Undergraduate",
    ogpa: 3.5,
    academicDecision: "Good Standing",
    immigrationStatus: "Domestic",
    osapFlag: true,
    eslFlag: false,
    varsityFlag: false,
    scholarshipFlag: true
  },
  {
    id: 2,
    sisId: "100200002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@my.yorku.ca",
    homeFaculty: "Schulich",
    campus: "Keele",
    program: "Business Administration",
    studyLevel: "Undergraduate",
    ogpa: 3.8,
    academicDecision: "Good Standing",
    immigrationStatus: "International",
    osapFlag: false,
    eslFlag: true,
    varsityFlag: false,
    scholarshipFlag: false
  },
  {
    id: 3,
    sisId: "100200003",
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@my.yorku.ca",
    homeFaculty: "Lassonde",
    campus: "Keele",
    program: "Engineering",
    studyLevel: "Undergraduate",
    ogpa: 2.8,
    academicDecision: "Academic Warning",
    immigrationStatus: "Domestic",
    osapFlag: true,
    eslFlag: false,
    varsityFlag: true,
    scholarshipFlag: false
  }
];

const mockAlerts = [
  {
    id: 1,
    studentId: 1,
    studentName: "John Doe",
    email: "john.doe@my.yorku.ca",
    faculty: "LAPS",
    campus: "Keele",
    alertType: "Academic Performance",
    course: "EECS 1012",
    professor: "Dr. Smith",
    dateRaised: new Date('2024-01-15'),
    lastUpdated: new Date('2024-01-20'),
    priority: "High",
    status: "In Progress",
    description: "Student struggling with coursework",
    student: mockStudents[0],
    program: "Computer Science",
    studyLevel: "Undergraduate",
    ogpa: 3.5,
    academicDecision: "Good Standing",
    immigrationStatus: "Domestic"
  },
  {
    id: 2,
    studentId: 2,
    studentName: "Jane Smith",
    email: "jane.smith@my.yorku.ca",
    faculty: "Schulich",
    campus: "Keele",
    alertType: "Attendance",
    course: "ADMS 2500",
    professor: "Dr. Johnson",
    dateRaised: new Date('2024-01-10'),
    lastUpdated: new Date('2024-01-25'),
    priority: "Medium",
    status: "Resolved",
    description: "Poor attendance record",
    student: mockStudents[1],
    program: "Business Administration",
    studyLevel: "Undergraduate",
    ogpa: 3.8,
    academicDecision: "Good Standing",
    immigrationStatus: "International"
  },
  {
    id: 3,
    studentId: 3,
    studentName: "Michael Johnson",
    email: "michael.johnson@my.yorku.ca",
    faculty: "Lassonde",
    campus: "Keele",
    alertType: "Academic Performance",
    course: "EECS 2030",
    professor: "Dr. Brown",
    dateRaised: new Date('2024-01-20'),
    lastUpdated: new Date('2024-01-22'),
    priority: "High",
    status: "Unadvised",
    description: "Failing multiple assignments",
    student: mockStudents[2],
    program: "Engineering",
    studyLevel: "Undergraduate",
    ogpa: 2.8,
    academicDecision: "Academic Warning",
    immigrationStatus: "Domestic"
  }
];

const mockMetrics = {
  totalAlerts: 3,
  activeAlerts: 2,
  resolvedAlerts: 1,
  highPriority: 2,
  mediumPriority: 1,
  lowPriority: 0,
  uniqueStudents: 3,
  resolutionRate: 33.33
};

const mockChartData = {
  alert_types: [
    { name: "Academic Performance", value: 2, color: "#E31837" },
    { name: "Attendance", value: 1, color: "#B91C1C" }
  ],
  faculty_distribution: [
    { name: "LAPS", value: 1, color: "#E31837" },
    { name: "Schulich", value: 1, color: "#B91C1C" },
    { name: "Lassonde", value: 1, color: "#991B1B" }
  ],
  status_distribution: [
    { name: "Unadvised", value: 1, color: "#E31837" },
    { name: "Advised", value: 2, color: "#22C55E" }
  ],
  priority_distribution: [
    { name: "High", value: 2, color: "#E31837" },
    { name: "Medium", value: 1, color: "#F59E0B" }
  ]
};

export const useApiData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Load initial data
  const loadData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load alerts and students (the critical data)
      let alertsData, studentsData, metricsData, chartsData;
      
      try {
        [alertsData, studentsData] = await Promise.all([
          apiService.getAlerts(filters.alerts || {}),
          apiService.getStudents(filters.students || {})
        ]);
      } catch (coreErr) {
        console.error('❌ useApiData - Failed to load core data:', coreErr.message);
        throw coreErr; // Re-throw to fall back to mock data
      }
      
      // Try to load metrics and charts (non-critical, can fail gracefully)
      try {
        [metricsData, chartsData] = await Promise.all([
          apiService.getDashboardMetrics(),
          apiService.getChartData()
        ]);
      } catch (metricsErr) {
        console.warn('⚠️ useApiData - Metrics/charts failed, using defaults:', metricsErr.message);
        metricsData = mockMetrics;
        chartsData = mockChartData;
      }
      
      const transformedStudents = apiService.transformStudentsForDashboard(studentsData);
      const transformedAlerts = apiService.transformAlertsForDashboard(alertsData);
      
      setAlerts(transformedAlerts);
      setStudents(transformedStudents);
      setMetrics(metricsData);
      setChartData(chartsData);
      setUsingMockData(false);
      
    } catch (err) {
      console.warn('⚠️ useApiData - API not available, using mock data:', err.message);
      
      // Fall back to mock data only if API is truly unavailable
      setAlerts(mockAlerts);
      setStudents(mockStudents);
      setMetrics(mockMetrics);
      setChartData(mockChartData);
      setUsingMockData(true);
      setError(null); // Clear error since we're using mock data
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data
  const refreshAlerts = useCallback(async (filters = {}) => {
    if (usingMockData) {
      setAlerts(mockAlerts);
      return;
    }
    
    try {
      const alertsData = await apiService.getAlerts(filters);
      setAlerts(apiService.transformAlertsForDashboard(alertsData));
    } catch (err) {
      console.warn('⚠️ useApiData - Refresh failed, using mock data');
      setAlerts(mockAlerts);
      setUsingMockData(true);
    }
  }, [usingMockData]);

  const refreshMetrics = useCallback(async () => {
    if (usingMockData) {
      setMetrics(mockMetrics);
      return;
    }
    
    try {
      const metricsData = await apiService.getDashboardMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.warn('⚠️ useApiData - Metrics refresh failed, using mock data');
      setMetrics(mockMetrics);
      setUsingMockData(true);
    }
  }, [usingMockData]);

  const refreshChartData = useCallback(async () => {
    if (usingMockData) {
      setChartData(mockChartData);
      return;
    }
    
    try {
      const chartsData = await apiService.getChartData();
      setChartData(chartsData);
    } catch (err) {
      console.warn('⚠️ useApiData - Chart data refresh failed, using mock data');
      setChartData(mockChartData);
      setUsingMockData(true);
    }
  }, [usingMockData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update alert status
  const updateAlertStatus = useCallback(async (alertId, statusUpdate) => {
    if (usingMockData) {
      // Update mock data
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, ...statusUpdate, lastUpdated: new Date() }
            : alert
        )
      );
      return;
    }
    
    try {
      const updatedAlert = await apiService.updateAlert(alertId, statusUpdate);
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, ...statusUpdate, lastUpdated: new Date() }
            : alert
        )
      );
      
      // Refresh metrics to reflect changes
      refreshMetrics();
      
      return updatedAlert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [usingMockData, refreshMetrics]);

  // Create new alert
  const createAlert = useCallback(async (alertData) => {
    if (usingMockData) {
      // Add to mock data
      const newAlert = {
        ...alertData,
        id: Date.now(),
        dateRaised: new Date(),
        lastUpdated: new Date()
      };
      setAlerts(prevAlerts => [...prevAlerts, newAlert]);
      return newAlert;
    }
    
    try {
      const newAlert = await apiService.createAlert(alertData);
      
      // Refresh alerts and metrics
      await Promise.all([
        refreshAlerts(),
        refreshMetrics()
      ]);
      
      return newAlert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [usingMockData, refreshAlerts, refreshMetrics]);

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      await apiService.healthCheck();
      return true;
    } catch (err) {
      console.warn('⚠️ useApiData - API health check failed');
      return false;
    }
  }, []);

  return {
    // Data
    students,
    alerts,
    metrics,
    chartData,
    
    // State
    loading,
    error,
    usingMockData,
    
    // Actions
    loadData,
    refreshAlerts,
    refreshMetrics,
    refreshChartData,
    updateAlertStatus,
    createAlert,
    checkHealth,
    
    // Clear error
    clearError: () => setError(null)
  };
};
