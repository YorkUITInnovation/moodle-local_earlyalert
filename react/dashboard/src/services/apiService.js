// API service to connect React dashboard to real student data and FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    // DO NOT cache real student data - always fetch fresh
  }

  // Load real student data from data.php
  async loadRealStudentData() {
    // Always fetch fresh data, never use cache

    try {
      // Add cache-busting timestamp to force fresh load
      const timestamp = new Date().getTime();
      const response = await fetch(`/local/earlyalert/react/dashboard/data.php?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonResponse = await response.json();

      // Transform the response to match expected format
      const data = {
        metadata: {
          source: 'data.php',
          count: jsonResponse.count || 0,
          date_range: jsonResponse.date_range,
          timestamp: new Date().toISOString()
        },
        alert_logs: jsonResponse.data || []
      };

      return data;
    } catch (error) {
      console.error('❌ Error loading real student data from data.php:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Student endpoints - now uses real student data first, then falls back to API
  async getStudents(filters = {}) {
    try {
      // First, try to use real student data
      const realData = await this.loadRealStudentData();

      if (realData && realData.alert_logs && realData.alert_logs.length > 0) {

        // Extract unique students from alert logs
        const studentMap = new Map();
        
        realData.alert_logs.forEach(log => {
          if (log.sisid && log.firstname && log.surname) {
            const key = log.sisid.toString();
            if (!studentMap.has(key)) {
              studentMap.set(key, {
                id: log.sisid,
                sisid: log.sisid,
                firstname: log.firstname,
                lastname: log.surname,
                email: log.email || `${log.firstname?.toLowerCase()}.${log.surname?.toLowerCase()}@my.yorku.ca`,
                home_faculty: log.progfaculty || 'Unknown',
                campus: log.campus === 'G' ? 'Glendon' : log.campus === 'K' ? 'Keele' : log.campus === 'M' ? 'Markham' : log.campus || 'Unknown',
                program: log.transcripttitle || log.program || 'Unknown Program',
                studylevel: log.studylevel ? log.studylevel.toString() : null,
                study_level: this.mapStudyLevel(log.studylevel),
                ogpa: log.ogpa || 0,
                academic_decision: log.latestacademicdecision || 'Unknown',
                academic_status: log.academicstatus || 'Unknown',
                immigration_status: this.mapImmigrationStatus(log.immigrationstatus),
                language_of_correspondence: log.languagecorrespondence || 'EN',
                osap_flag: log.osapflag === 'Y',
                esl_flag: log.eslflag === 'Y',
                varsity_flag: log.varsityflag === 'Y',
                scholarship_flag: log.scholarshipflag === 'Y',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        });
        
        const students = Array.from(studentMap.values());
        return students;
      }
    } catch (error) {
      console.error('❌ Real student data failed to load:', error.message);
      console.error('❌ getStudents() returning empty array - no data available');
      return []; // Return empty array instead of trying API fallback
    }

    // This code should never be reached if real data loads successfully
    console.warn('⚠️ Unexpected: getStudents() reached end without returning data');
    return [];
  }

  // Helper methods for data mapping
  mapStudyLevel(level) {
    if (!level) return 'Unknown';
    switch(level) {
      case 1: return 'Undergraduate - Year 1';
      case 2: return 'Undergraduate - Year 2';
      case 3: return 'Undergraduate - Year 3';
      case 4: return 'Undergraduate - Year 4+';
      default: return 'Undergraduate';
    }
  }

  mapImmigrationStatus(status) {
    if (!status) return 'Unknown';
    // C = Canadian, L = Landed Immigrant/Permanent Resident = Domestic
    // All others (R, V, P, U, G, etc.) = International
    if (status === 'C' || status === 'L') {
      return 'Domestic';
    } else {
      return 'International';
    }
  }

  async getStudent(studentId) {
    return this.request(`/api/students/${studentId}`);
  }

  async createStudent(studentData) {
    return this.request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(studentId, updateData) {
    return this.request(`/api/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Comprehensive data for AI context
  async getComprehensiveData() {
    try {
      // Fetch all students with no filters and high limit
      const students = await this.getStudents({ limit: 2000 });
      
      // Fetch all alerts with no filters and high limit (API max is 1000)
      const alerts = await this.getAlerts({ limit: 1000 });
      
      // Fetch dashboard metrics for additional context
      const metrics = await this.getDashboardMetrics();
      
      // Fetch chart data for trends
      const chartData = await this.getChartData();
      
      return {
        students,
        alerts,
        metrics,
        chartData,
        totalStudents: students.length,
        totalAlerts: alerts.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error fetching comprehensive data:', error);
      throw error;
    }
  }

  // Alert endpoints - now uses real student data first, then falls back to API  
  async getAlerts(filters = {}) {
    try {
      // First, try to use real student data
      const realData = await this.loadRealStudentData();
      if (realData && realData.alert_logs && realData.alert_logs.length > 0) {
        // Transform alert logs into dashboard format
        let missingFacultyCount = 0;
        const alerts = realData.alert_logs.map((log, index) => {
          const alertDate = log.date_message_sent ? new Date(log.date_message_sent) : new Date();
          
          // Track missing faculty data
          if (!log.progfaculty && !log.faculty_template) {
            missingFacultyCount++;
          }

          return {
            id: log.id || index + 1,
            student_id: log.sisid,
            alert_type: this.extractMessageType(log.name),
            template_type: log.template_type || 'Unknown',
            course_code: log.course || 'N/A',
            course_name: log.course_fullname || log.course_shortname || 'N/A',
            professor_name: `${log.instructor_firstname || ''} ${log.instructor_lastname || ''}`.trim() || 'N/A',
            date_raised: alertDate.toISOString(),
            timecreated: log.timecreated || alertDate.toISOString(), // Add timecreated field
            last_updated: alertDate.toISOString(),
            priority: this.mapPriority(log.trigger_grade, log.actual_grade),
            status: this.mapAlertStatus(log),
            description: log.subject || 'N/A',
            follow_up_notes: log.custom_message || '',
            assigned_to: 'Academic Advisor',
            follow_up_initiated: log.student_advised_by_advisor && log.student_advised_by_advisor !== 0 && log.student_advised_by_advisor !== '0' ? true : false,
            email_opened: false,
            student_contacted: log.student_advised_by_instructor && log.student_advised_by_instructor !== 0 && log.student_advised_by_instructor !== '0' ? true : false,
            issue_resolved: false,
            // Raw advised fields for export
            student_advised_by_advisor: log.student_advised_by_advisor,
            student_advised_by_instructor: log.student_advised_by_instructor,
            // Top-level fields for easy access
            progfaculty: log.progfaculty || 'Unknown',
            faculty_template: log.faculty_template || 'N/A',
            campus_template: log.campus === 'G' ? 'Glendon' : log.campus === 'K' ? 'Keele' : log.campus === 'M' ? 'Markham' : log.campus_template || 'N/A',
            course_template: log.course_template || 'N/A',
            // All student data fields from data.php at top level for export
            academicyear: log.academicyear,
            studysession: log.studysession,
            sessionname: log.sessionname,
            transcripttitle: log.transcripttitle,
            campus: log.campus,
            collegeaffiliation: log.collegeaffiliation,
            college: log.college,
            program: log.program || log.transcripttitle,
            acadqualification: log.acadqualification,
            curriculumdetail: log.curriculumdetail,
            subject1: log.subject1,
            subject1faculty: log.subject1faculty,
            subject1facultydesc: log.subject1facultydesc,
            unit1: log.unit1,
            title1: log.title1,
            subject2: log.subject2,
            subject2faculty: log.subject2faculty,
            subject2facultydesc: log.subject2facultydesc,
            unit2: log.unit2,
            title2: log.title2,
            basis: log.basis,
            email: log.email,
            studylevel: log.studylevel,
            immigrationstatus: log.immigrationstatus,
            visaflag: log.visaflag,
            visaexpirydate: log.visaexpirydate,
            languagecorrespondence: log.languagecorrespondence,
            matureflag: log.matureflag,
            osapflag: log.osapflag,
            varsityflag: log.varsityflag,
            eslflag: log.eslflag,
            scholarshipflag: log.scholarshipflag,
            ogpa: log.ogpa,
            latestacademicdecision: log.latestacademicdecision,
            academicdecisionterm: log.academicdecisionterm,
            academicstatus: log.academicstatus,
            registrationstatus: log.registrationstatus,
            // Student data embedded
            student: {
              sisid: log.sisid,
              firstname: log.firstname,
              lastname: log.surname,
              email: log.email || `${log.firstname?.toLowerCase()}.${log.surname?.toLowerCase()}@my.yorku.ca`,
              home_faculty: log.progfaculty || log.faculty_template || 'Unknown',
              campus: log.campus === 'G' ? 'Glendon' : log.campus === 'K' ? 'Keele' : log.campus === 'M' ? 'Markham' : log.campus || 'Unknown',
              program: log.transcripttitle || log.program || 'Unknown Program',
              studylevel: log.studylevel ? log.studylevel.toString() : null,
              study_level: this.mapStudyLevel(log.studylevel),
              ogpa: log.ogpa || 0,
              academic_decision: log.latestacademicdecision || 'Unknown',
              academic_status: log.academicstatus || 'No status',
              immigration_status: this.mapImmigrationStatus(log.immigrationstatus),
              language_of_correspondence: log.languagecorrespondence || 'EN',
              osap_flag: log.osapflag === 'Y',
              esl_flag: log.eslflag === 'Y',
              varsity_flag: log.varsityflag === 'Y',
              scholarship_flag: log.scholarshipflag === 'Y',
              academicyear: log.academicyear,
              studysession: log.studysession,
              sessionname: log.sessionname,
              transcripttitle: log.transcripttitle,
              collegeaffiliation: log.collegeaffiliation,
              college: log.college,
              acadqualification: log.acadqualification,
              curriculumdetail: log.curriculumdetail,
              subject1: log.subject1,
              subject1faculty: log.subject1faculty,
              subject1facultydesc: log.subject1facultydesc,
              unit1: log.unit1,
              title1: log.title1,
              subject2: log.subject2,
              subject2faculty: log.subject2faculty,
              subject2facultydesc: log.subject2facultydesc,
              unit2: log.unit2,
              title2: log.title2,
              basis: log.basis,
              visaflag: log.visaflag,
              visaexpirydate: log.visaexpirydate,
              matureflag: log.matureflag,
              academicdecisionterm: log.academicdecisionterm,
              registrationstatus: log.registrationstatus
            }
          };
        });
        
        if (missingFacultyCount > 0) {
          console.warn(`⚠️ Found ${missingFacultyCount} alerts with missing faculty data`);
        }

        return alerts;
      }
    } catch (error) {
      console.warn('⚠️ Real alert data not available, falling back to API:', error.message);
    }

    // Fallback to original API logic
    const queryParams = new URLSearchParams();
    
    // Set a high limit to get all alerts (default API limit is 100)
    queryParams.append('limit', '1000');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/api/alerts?${queryString}`;
    
    return this.request(endpoint);
  }

  // Helper method to extract message type from alert name
  extractMessageType(name) {
    if (!name) return 'Unknown';
    
    // Extract the core message type from patterns like 'Campus: Type' or 'Faculty: Type'
    if (name.includes('Low Grade')) {
      return 'Low Grade';
    } else if (name.includes('Missed Assignment')) {
      return 'Missed Assignment';
    } else if (name.includes('Missed Test') || name.includes('MissedTest')) {
      return 'Missed Test/Quiz';
    }
    
    return 'Unknown';
  }

  // Helper method to map priority based on grade thresholds
  mapPriority(triggerGrade, actualGrade) {
    if (!actualGrade) return 'Medium';
    
    const grade = parseFloat(actualGrade);
    if (grade < 50) return 'High';
    if (grade < 60) return 'Medium';
    return 'Low';
  }

  // Helper method to map alert status
  mapAlertStatus(log) {
    // A student is advised if student_advised_by_advisor OR student_advised_by_instructor has a timestamp (not 0)
    // These fields contain timestamps when advised, or 0 when unadvised
    const advisedByAdvisor = log.student_advised_by_advisor && log.student_advised_by_advisor !== 0 && log.student_advised_by_advisor !== '0';
    const advisedByInstructor = log.student_advised_by_instructor && log.student_advised_by_instructor !== 0 && log.student_advised_by_instructor !== '0';

    if (advisedByAdvisor || advisedByInstructor) {
      return 'Advised';
    } else {
      return 'Unadvised';
    }
  }

  async createAlert(alertData) {
    return this.request('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async updateAlert(alertId, updateData) {
    return this.request(`/api/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Dashboard endpoints - now uses real student data first, then falls back to API
  async getDashboardMetrics() {
    try {
      // First, try to calculate metrics from real student data
      const realData = await this.loadRealStudentData();

      if (realData && realData.alert_logs && realData.alert_logs.length > 0) {

        const alerts = realData.alert_logs;
        const uniqueStudents = new Set();
        let highPriorityCount = 0;
        let mediumPriorityCount = 0;
        let lowPriorityCount = 0;
        let advisedCount = 0;
        let unadvisedCount = 0;

        alerts.forEach(alert => {
          // Count unique students
          if (alert.sisid) uniqueStudents.add(alert.sisid.toString());

          // Count priority levels
          const priority = this.mapPriority(alert.trigger_grade, alert.actual_grade);
          if (priority === 'High') highPriorityCount++;
          else if (priority === 'Medium') mediumPriorityCount++;
          else lowPriorityCount++;
          
          // Count status
          const status = this.mapAlertStatus(alert);
          if (status === 'Advised') advisedCount++;
          else unadvisedCount++;
        });
        
        const totalAlerts = alerts.length;
        const activeAlerts = unadvisedCount; // Active alerts are unadvised alerts

        return {
          totalAlerts,
          activeAlerts,
          resolvedAlerts: advisedCount,
          highPriority: highPriorityCount,
          mediumPriority: mediumPriorityCount,
          lowPriority: lowPriorityCount,
          uniqueStudents: uniqueStudents.size,
          resolutionRate: totalAlerts > 0 ? ((advisedCount / totalAlerts) * 100).toFixed(2) : 0,
          advisedAlerts: advisedCount,
          unadvisedAlerts: unadvisedCount
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not calculate metrics from real data, falling back to API:', error.message);
    }

    // Fallback to API
    return this.request('/api/dashboard/metrics');
  }

  async getChartData() {
    try {
      // First, try to generate chart data from real student data
      const realData = await this.loadRealStudentData();

      if (realData && realData.alert_logs && realData.alert_logs.length > 0) {

        const alerts = realData.alert_logs;
        
        // Alert types distribution
        const alertTypeMap = new Map();
        const facultyMap = new Map();
        const statusMap = new Map();
        const priorityMap = new Map();
        const campusMap = new Map();
        const timelineMap = new Map();
        
        alerts.forEach(alert => {
          // Alert types
          const alertType = alert.name || 'Unknown Alert';
          alertTypeMap.set(alertType, (alertTypeMap.get(alertType) || 0) + 1);
          
          // Faculty distribution
          const faculty = alert.PROGFACULTY || alert.faculty_template || 'Unknown';
          facultyMap.set(faculty, (facultyMap.get(faculty) || 0) + 1);
          
          // Status distribution
          const status = this.mapAlertStatus(alert);
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
          
          // Priority distribution
          const priority = this.mapPriority(alert.trigger_grade, alert.actual_grade);
          priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
          
          // Campus analysis
          const campus = alert.CAMPUS === 'G' ? 'Glendon' : alert.CAMPUS === 'K' ? 'Keele' : alert.CAMPUS === 'M' ? 'Markham' : alert.CAMPUS || alert.campus_template || 'Unknown';
          campusMap.set(campus, (campusMap.get(campus) || 0) + 1);
          
          // Timeline data
          if (alert.date_message_sent) {
            const date = new Date(alert.date_message_sent).toISOString().split('T')[0];
            timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
          }
        });
        
        // Convert maps to chart data arrays
        const CHART_COLORS = ['#E31837', '#B91C1C', '#991B1B', '#7F1D1D', '#DC2626', '#EF4444', '#F87171'];
        
        return {
          alert_types: Array.from(alertTypeMap.entries()).map(([name, value], index) => ({
            name, value, color: CHART_COLORS[index % CHART_COLORS.length]
          })),
          faculty_distribution: Array.from(facultyMap.entries()).map(([name, value], index) => ({
            name, value, color: CHART_COLORS[index % CHART_COLORS.length]
          })),
          status_distribution: Array.from(statusMap.entries()).map(([name, value], index) => ({
            name, value, color: CHART_COLORS[index % CHART_COLORS.length]
          })),
          priority_distribution: Array.from(priorityMap.entries()).map(([name, value], index) => ({
            name, value, color: CHART_COLORS[index % CHART_COLORS.length]
          })),
          campus_analysis: Array.from(campusMap.entries()).map(([campus, alerts]) => {
            // Count unique students per campus
            const campusStudents = new Set();
            realData.alert_logs.forEach(alert => {
              const alertCampus = alert.CAMPUS === 'G' ? 'Glendon' : alert.CAMPUS === 'K' ? 'Keele' : alert.CAMPUS === 'M' ? 'Markham' : alert.CAMPUS || alert.campus_template || 'Unknown';
              if (alertCampus === campus && alert.SISID) {
                campusStudents.add(alert.SISID.toString());
              }
            });
            return { campus, alerts, students: campusStudents.size };
          }),
          timeline_data: Array.from(timelineMap.entries())
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, alerts]) => ({ date, alerts })),
          risk_segmentation: [
            { segment: 'High Risk', students: Array.from(priorityMap.get('High') || 0), color: '#E31837' },
            { segment: 'Medium Risk', students: Array.from(priorityMap.get('Medium') || 0), color: '#F59E0B' },
            { segment: 'Low Risk', students: Array.from(priorityMap.get('Low') || 0), color: '#22C55E' }
          ]
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not generate chart data from real data, falling back to API:', error.message);
    }

    // Fallback to API
    return this.request('/api/dashboard/charts');
  }

  // Utility endpoints
  async getFaculties() {
    return this.request('/api/faculties');
  }

  async getAlertTypes() {
    return this.request('/api/alert-types');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Helper method to transform data from API format to dashboard format
  transformAlertsForDashboard(alerts) {
    const transformed = alerts.map(alert => ({
      id: alert.id,
      studentId: alert.student_id,
      studentName: `${alert.student.firstname} ${alert.student.lastname}`,
      email: alert.student.email || alert.email,
      faculty: alert.student.home_faculty,
      progfaculty: alert.progfaculty || alert.student.home_faculty, // Add progfaculty for AdministratorView
      faculty_template: alert.faculty_template || 'N/A',
      campus_template: alert.campus_template || 'N/A',
      course_template: alert.course_template || 'N/A',
      campus: alert.campus || alert.student.campus,
      alertType: alert.alert_type,
      template_type: alert.template_type,
      course: alert.course_code || 'N/A',
      course_name: alert.course_name || 'N/A',
      professor: alert.professor_name || 'N/A',
      dateRaised: new Date(alert.date_raised),
      timecreated: alert.timecreated, // Add timecreated field
      lastUpdated: new Date(alert.last_updated),
      priority: alert.priority,
      status: alert.status,
      description: alert.description,
      followUpNotes: alert.follow_up_notes,
      assignedTo: alert.assigned_to,
      followUpInitiated: alert.follow_up_initiated,
      emailOpened: alert.email_opened,
      studentContacted: alert.student_contacted,
      issueResolved: alert.issue_resolved,
      resolved: alert.issue_resolved, // Add resolved field for getFollowUpStatus function
      // Raw advised fields for export
      student_advised_by_advisor: alert.student_advised_by_advisor,
      student_advised_by_instructor: alert.student_advised_by_instructor,
      // All student data fields from data.php at top level for export
      academicyear: alert.academicyear,
      studysession: alert.studysession,
      sessionname: alert.sessionname,
      transcripttitle: alert.transcripttitle,
      collegeaffiliation: alert.collegeaffiliation,
      college: alert.college,
      program: alert.program || alert.student.program,
      acadqualification: alert.acadqualification,
      curriculumdetail: alert.curriculumdetail,
      subject1: alert.subject1,
      subject1faculty: alert.subject1faculty,
      subject1facultydesc: alert.subject1facultydesc,
      unit1: alert.unit1,
      title1: alert.title1,
      subject2: alert.subject2,
      subject2faculty: alert.subject2faculty,
      subject2facultydesc: alert.subject2facultydesc,
      unit2: alert.unit2,
      title2: alert.title2,
      basis: alert.basis,
      studylevel: alert.studylevel,
      immigrationstatus: alert.immigrationstatus,
      visaflag: alert.visaflag,
      visaexpirydate: alert.visaexpirydate,
      languagecorrespondence: alert.languagecorrespondence,
      matureflag: alert.matureflag,
      osapflag: alert.osapflag,
      varsityflag: alert.varsityflag,
      eslflag: alert.eslflag,
      scholarshipflag: alert.scholarshipflag,
      ogpa: alert.ogpa || alert.student.ogpa,
      latestacademicdecision: alert.latestacademicdecision,
      academicdecisionterm: alert.academicdecisionterm,
      academicstatus: alert.academicstatus,
      registrationstatus: alert.registrationstatus,
      // Flatten student data for easier access in React components
      student: {
        sisId: alert.student.sisid,
        firstName: alert.student.firstname,
        lastName: alert.student.lastname,
        email: alert.student.email,
        homeFaculty: alert.student.home_faculty,
        campus: alert.student.campus,
        program: alert.student.program,
        studylevel: alert.student.studylevel,
        studyLevel: alert.student.study_level,
        ogpa: alert.student.ogpa,
        academicDecision: alert.student.academic_decision,
        academicStatus: alert.student.academic_status,
        immigrationStatus: alert.student.immigration_status,
        osapFlag: alert.student.osap_flag,
        eslFlag: alert.student.esl_flag,
        varsityFlag: alert.student.varsity_flag,
        scholarshipFlag: alert.student.scholarship_flag,
        // Add all additional fields to student object as well
        academicyear: alert.student.academicyear,
        studysession: alert.student.studysession,
        sessionname: alert.student.sessionname,
        transcripttitle: alert.student.transcripttitle,
        collegeaffiliation: alert.student.collegeaffiliation,
        college: alert.student.college,
        acadqualification: alert.student.acadqualification,
        curriculumdetail: alert.student.curriculumdetail,
        subject1: alert.student.subject1,
        subject1faculty: alert.student.subject1faculty,
        subject1facultydesc: alert.student.subject1facultydesc,
        unit1: alert.student.unit1,
        title1: alert.student.title1,
        subject2: alert.student.subject2,
        subject2faculty: alert.student.subject2faculty,
        subject2facultydesc: alert.student.subject2facultydesc,
        unit2: alert.student.unit2,
        title2: alert.student.title2,
        basis: alert.student.basis,
        visaflag: alert.student.visaflag,
        visaexpirydate: alert.student.visaexpirydate,
        matureflag: alert.student.matureflag,
        academicdecisionterm: alert.student.academicdecisionterm,
        registrationstatus: alert.student.registrationstatus
      },
      // Additional computed fields for dashboard (keeping for backward compatibility)
      studyLevel: alert.student.study_level,
      academicDecision: alert.student.academic_decision,
      academicStatus: alert.student.academic_status,
      immigrationStatus: alert.student.immigration_status
    }));
    
    return transformed;
  }

  transformStudentsForDashboard(students) {

    // Safety check: ensure students is an array
    if (!Array.isArray(students)) {
      console.warn('⚠️ transformStudentsForDashboard - students is not an array:', students);
      return [];
    }
    
    return students.map(student => ({
      id: student.id,
      sisId: student.sisid,
      firstName: student.firstname,
      lastName: student.lastname,
      email: student.email,
      homeFaculty: student.home_faculty,
      campus: student.campus,
      program: student.program,
      studylevel: student.studylevel,
      studyLevel: student.study_level,
      ogpa: student.ogpa,
      languageOfCorrespondence: student.language_of_correspondence,
      academicDecision: student.academic_decision,
      academicStatus: student.academic_status,
      immigrationStatus: student.immigration_status,
      osapFlag: student.osap_flag,
      eslFlag: student.esl_flag,
      varsityFlag: student.varsity_flag,
      scholarshipFlag: student.scholarship_flag,
      createdAt: new Date(student.created_at),
      updatedAt: new Date(student.updated_at)
    }));
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
