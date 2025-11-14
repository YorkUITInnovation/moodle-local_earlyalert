import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, AlertTriangle, CheckCircle, Target, Award, Clock, BarChart3 } from 'lucide-react';
import { useLanguageStrings } from '../hooks/useLanguageStrings';
import { FACULTY_NAMES, getFacultyCode, facultyMapping } from '../constants/facultyMapping';

// Normalizes various student identifier shapes into a comparable string key.
const normalizeAlertStudentId = (alert) => {
  if (!alert) return null;

  const rawId = alert.studentId ??
    alert.student_id ??
    alert.SISID ??
    alert.sisid ??
    alert.student?.sisId ??
    alert.student?.sisid ??
    alert.student?.id ??
    alert.student?.SISID;

  if (rawId === null || rawId === undefined || rawId === '') return null;
  return String(rawId).trim();
};

const AdministratorView = ({ 
  metrics, 
  alerts, 
  students, 
  chartData, 
  filteredAlerts,
  currentFacultyData,
  currentAlertTypeData,
  currentTimelineData,
  currentInterventionData,
  currentCampusAnalysisData 
}) => {
  // Language strings hook
  const { getString } = useLanguageStrings([
    'unique_students',
    'active_alerts',
    'faculties_engaged',
    'resolution_rate',
    'currently_tracked',
    'requiring_attention',
    'active_monitoring',
    'students_contacted',
    'alert_trends_3months',
    'monthly_alert_activity',
    'alert_distribution_by_student_home_faculty',
    'top_faculties',
    'top',
    'alert_distribution_by_course_faculty',
    'faculty_performance_analysis',
    'comprehensive_faculty_metrics',
    'faculties_monitored',
    'faculty',
    'total_alerts',
    'students',
    'contacted',
    'low_grade',
    'missed_assignment',
    'missed_test_quiz',
    'strategic_insights_recommendations',
    'intervention_efficiency',
    'resource_allocation',
    'system_coverage',
    'resolved',
    'first_half_alerts',
    'second_half_alerts',
    'total_alerts_for',
    'intervention_efficiency_text',
    'resource_allocation_text',
    'system_coverage_text',
    'alerts',
    'based_total_alerts',
    'students_advised',
    'unique_students_advised',
    'based_unique_students'
  ]);

  // Calculate strategic metrics
  const strategicMetrics = useMemo(() => {
    const totalAlerts = alerts?.length || 0;

    const uniqueStudentIds = alerts?.reduce((set, alert) => {
      const normalizedId = normalizeAlertStudentId(alert);
      if (normalizedId) {
        set.add(normalizedId);
      }
      return set;
    }, new Set()) || new Set();

    const studentsWithAlerts = uniqueStudentIds.size;
    const studentRosterCount = students?.length || 0;
    const totalStudents = Math.max(studentRosterCount, studentsWithAlerts);
    const rawAlertRate = totalStudents > 0 ? ((studentsWithAlerts / totalStudents) * 100) : 0;
    const alertRate = Math.min(rawAlertRate, 100);

    const resolutionCandidates = alerts || [];
    const resolvedAlerts = resolutionCandidates.filter(alert => 
      alert.status === 'Advised'
    ).length;
    const resolutionRate = totalAlerts > 0 ? ((resolvedAlerts / totalAlerts) * 100).toFixed(1) : 0;
    
    // Calculate unique students advised
    const uniqueAdvisedStudentIds = alerts?.reduce((set, alert) => {
      if (alert.status === 'Advised') {
        const normalizedId = normalizeAlertStudentId(alert);
        if (normalizedId) {
          set.add(normalizedId);
        }
      }
      return set;
    }, new Set()) || new Set();

    const studentsAdvised = uniqueAdvisedStudentIds.size;
    const studentsAdvisedRate = studentsWithAlerts > 0 ? ((studentsAdvised / studentsWithAlerts) * 100).toFixed(1) : 0;

    const highPriorityAlerts = alerts?.filter(alert => alert.priority === 'High').length || 0;
    const criticalRate = totalAlerts > 0 ? ((highPriorityAlerts / totalAlerts) * 100).toFixed(1) : 0;
    
    return {
      totalStudents,
      totalAlerts,
      studentsWithAlerts,
      alertRate: alertRate.toFixed(1),
      resolutionRate,
      studentsAdvised,
      studentsAdvisedRate,
      criticalRate
    };
  }, [alerts, students]);

  // Faculty performance analysis
  const facultyPerformance = useMemo(() => {
    const facultyStats = {};
    
    alerts?.forEach(alert => {
      const faculty = alert.progfaculty || alert.student?.home_faculty || 'Unknown';
      const normalizedId = normalizeAlertStudentId(alert);
      const alertType = alert.alert_type || alert.alertType || 'Unknown';
      

      if (!facultyStats[faculty]) {
        facultyStats[faculty] = {
          total: 0,
          resolved: 0,
          highPriority: 0,
          students: new Set(),
          advisedStudents: new Set(),
          lowGrade: 0,
          missedAssignment: 0,
          missedTest: 0
        };
      }
      
      facultyStats[faculty].total++;
      if (normalizedId) {
        facultyStats[faculty].students.add(normalizedId);
      }
      
      if (alert.status === 'Advised') {
        facultyStats[faculty].resolved++;
        if (normalizedId) {
          facultyStats[faculty].advisedStudents.add(normalizedId);
        }
      }
      
      if (alert.priority === 'High') {
        facultyStats[faculty].highPriority++;
      }
      
      // Count alert types
      if (alertType === 'Low Grade') {
        facultyStats[faculty].lowGrade++;
      } else if (alertType === 'Missed Assignment') {
        facultyStats[faculty].missedAssignment++;
      } else if (alertType === 'Missed Test/Quiz') {
        facultyStats[faculty].missedTest++;
      }
    });
    
    return Object.entries(facultyStats).map(([faculty, stats]) => ({
      faculty: facultyMapping[faculty] || faculty,
      totalAlerts: stats.total,
      uniqueStudents: stats.students.size,
      uniqueStudentsAdvised: stats.advisedStudents.size,
      resolutionRate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0,
      criticalRate: stats.total > 0 ? ((stats.highPriority / stats.total) * 100).toFixed(1) : 0,
      alertsPerStudent: stats.students.size > 0 ? (stats.total / stats.students.size).toFixed(1) : 0,
      lowGrade: stats.lowGrade,
      missedAssignment: stats.missedAssignment,
      missedTest: stats.missedTest
    })).sort((a, b) => b.totalAlerts - a.totalAlerts);
  }, [alerts]);

  // Trend analysis (last 90 days to capture more data)
  const trendData = useMemo(() => {
    // Debug: Log sample alert data to understand date format
    if (alerts && alerts.length > 0) {
      console.log('Sample alert for date debugging:', alerts[0]);
    }
    
    // Calculate the last 3 months (current month + 2 previous months)
    const now = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortName: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    
    console.log('Calculating trends for months:', months);
    
    // Log which date field we're using for a sample alert
    if (alerts && alerts.length > 0) {
      const sampleAlert = alerts[0];
      console.log('📅 Sample alert date fields:', {
        timecreated: sampleAlert.timecreated,
        date_raised: sampleAlert.date_raised,
        dateRaised: sampleAlert.dateRaised
      });
    }
    
    const monthlyStats = months.map(monthInfo => {
      const monthAlerts = alerts?.filter(alert => {
        // Use timecreated field which comes from the raw data
        const dateField = alert.timecreated || alert.date_raised || alert.dateRaised;
        if (!dateField) return false;
        
        try {
          // Parse the date
          let alertDate;
          
          if (dateField instanceof Date) {
            alertDate = dateField;
          } else if (typeof dateField === 'string') {
            alertDate = new Date(dateField);
          } else {
            alertDate = new Date(dateField);
          }
          
          // Check if date is valid
          if (isNaN(alertDate.getTime())) {
            return false;
          }
          
          // Check if alert is from this month and year
          return alertDate.getFullYear() === monthInfo.year && 
                 alertDate.getMonth() === monthInfo.month;
        } catch (error) {
          console.warn('Error parsing date for alert:', dateField, error);
          return false;
        }
      }) || [];
      
      // Calculate first half vs second half distribution
      const firstHalf = monthAlerts.filter(alert => {
        const dateField = alert.timecreated || alert.date_raised || alert.dateRaised;
        if (!dateField) return false;
        const alertDate = new Date(dateField);
        return alertDate.getDate() <= 15;
      }).length;
      
      const secondHalf = monthAlerts.length - firstHalf;
      
      console.log(`📊 ${monthInfo.shortName}: ${monthAlerts.length} alerts (1st half: ${firstHalf}, 2nd half: ${secondHalf})`);
      
      return {
        month: monthInfo.name,
        shortMonth: monthInfo.shortName,
        alerts: monthAlerts.length,
        resolved: monthAlerts.filter(a => a.status === 'Advised').length,
        highPriority: monthAlerts.filter(a => a.priority === 'High').length,
        firstHalf: firstHalf,
        secondHalf: secondHalf
      };
    });
    
    // Debug: Log trend data
    console.log('Monthly trend data calculated:', monthlyStats);
    console.log('Total alerts in last 3 months:', monthlyStats.reduce((sum, month) => sum + month.alerts, 0));
    
    return monthlyStats;
  }, [alerts]);

  // Course Faculty Distribution - Extract faculty code from course name
  const courseFacultyDistribution = useMemo(() => {
    const facultyCounts = {};
    
    alerts?.forEach(alert => {
      // Get the course name
      const courseName = alert.course_name || alert.courseName || '';
      
      // Extract first two letters before the slash
      const match = courseName.match(/^([A-Z]{2})\//);
      if (match) {
        const code = match[1];
        
        // Use the centralized faculty name mapping
        const facultyName = FACULTY_NAMES[code] || code;

        facultyCounts[code] = {
          code: code,
          name: facultyName,
          count: (facultyCounts[code]?.count || 0) + 1
        };
      }
    });
    
    // Convert to array and sort by count
    return Object.values(facultyCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 faculties
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#E31837] p-8">
        <div className="grid gap-6 mt-6" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-[#E31837] text-white shadow-md">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{getString('unique_students')}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">{strategicMetrics.studentsWithAlerts}</div>
            <p className="text-sm text-gray-500">{getString('currently_tracked')}</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-[#E31837] text-white shadow-md">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{getString('active_alerts')}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">{strategicMetrics.totalAlerts}</div>
            <p className="text-sm text-gray-500">{getString('requiring_attention')}</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-[#E31837] text-white shadow-md">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{getString('faculties_engaged')}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">{facultyPerformance.length}</div>
            <p className="text-sm text-gray-500">{getString('active_monitoring')}</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-[#E31837] text-white shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{getString('resolution_rate')}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">{strategicMetrics.resolutionRate}%</div>
            <p className="text-sm text-gray-500">{getString('based_total_alerts')}</p>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-[#E31837] text-white shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{getString('students_advised')}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">{strategicMetrics.studentsAdvisedRate}%</div>
            <p className="text-sm text-gray-500">{getString('based_unique_students')}</p>
          </div>
        </div>
      </div>

      {/* Strategic Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Trend Analysis */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6" style={{ height: '48px' }}>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#E31837]" />
              {getString('alert_trends_3months')}
            </h3>
            <div className="text-sm text-gray-500">
              {getString('monthly_alert_activity')}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortMonth" 
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  // Find the month data to get the full name
                  const monthData = trendData.find(d => d.shortMonth === value);
                  return monthData?.month || value;
                }}
                formatter={(value, name, props) => {
                  const labels = {
                    'alerts': getString('total_alerts'),
                    'resolved': getString('advised'),
                    'highPriority': getString('high_priority')
                  };
                  return [value, labels[name] || name];
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                        <p className="font-semibold mb-2">{data.month}</p>
                        <p className="text-sm"><span className="font-medium">{getString('total_alerts')}:</span> {data.alerts}</p>
                        <p className="text-sm"><span className="font-medium">{getString('advised')}:</span> {data.resolved}</p>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <p className="text-xs text-gray-600">{getString('first_half_alerts', '1st-15th')}: {data.firstHalf} alerts</p>
                          <p className="text-xs text-gray-600">{getString('second_half_alerts', '16th-End')}: {data.secondHalf} alerts</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="alerts" fill="#E31837" name="alerts" />
              <Bar dataKey="resolved" fill="#059669" name="resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faculty Overview */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6" style={{ height: '48px' }}>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#E31837]" />
              {getString('alert_distribution_by_student_home_faculty')}
            </h3>
            <div className="text-sm text-gray-500">
              {getString('top')} {Math.min(6, facultyPerformance.length)} {getString('faculties_monitored').toLowerCase()}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facultyPerformance.slice(0, 6).map(f => ({
              name: getFacultyCode(f.faculty),
              value: f.totalAlerts,
              fullName: f.faculty
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} height={60} />
              <YAxis />
              <Tooltip formatter={(value, name, props) => [value, `${getString('total_alerts_for')} ${props.payload.fullName}`]} />
              <Bar dataKey="value" fill="#E31837" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E31837]" />
              {getString('alert_distribution_by_course_faculty')}
            </h3>
            <span className="text-sm text-gray-500">{getString('top')} {courseFacultyDistribution.length} {getString('faculties_monitored').toLowerCase()}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseFacultyDistribution.map(f => ({
              name: f.code,
              value: f.count,
              fullName: f.name
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value, name, props) => [value, `${getString('total_alerts_for')} ${props.payload.fullName}`]} />
              <Bar dataKey="value" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Faculty Performance Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#E31837]" />
                {getString('faculty_performance_analysis')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{getString('comprehensive_faculty_metrics')}</p>
            </div>
            <div className="text-sm text-gray-500">
              {facultyPerformance.length} {getString('faculties_monitored')}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('faculty')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('total_alerts')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('students')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('students_advised')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('low_grade')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('missed_assignment')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('missed_test_quiz')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facultyPerformance.slice(0, 8).map((faculty, index) => {
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{faculty.faculty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.totalAlerts}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.uniqueStudents}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.uniqueStudentsAdvised}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.lowGrade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.missedAssignment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.missedTest}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#E31837]" />
          {getString('strategic_insights_recommendations')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">{getString('intervention_efficiency')}</h4>
            <p className="text-sm text-blue-800">
              {strategicMetrics.resolutionRate}% of {getString('alerts')} are being successfully addressed.
              Consider expanding successful intervention strategies to underperforming areas.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">{getString('resource_allocation')}</h4>
            <p className="text-sm text-yellow-800">
              {strategicMetrics.criticalRate}% of {getString('alerts')} are {getString('high_priority').toLowerCase()}.
              Review resource distribution to ensure adequate support for critical cases.
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">{getString('system_coverage')}</h4>
            <p className="text-sm text-green-800">
              Monitoring {strategicMetrics.alertRate}% of student population.
              Strong coverage indicates effective early warning system implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorView;
