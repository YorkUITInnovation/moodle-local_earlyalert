import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, Search, Filter, Download, 
  ChevronUp, ChevronDown, Eye, Mail,
  FileText,
  CheckCircle, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const AdvisorView = ({ 
  alerts,
  students,
  metrics,
  chartData,
  filteredAlerts,
  tableFilteredAlerts,
  currentFacultyData,
  currentAlertTypeData,
  currentTimelineData,
  currentInterventionData,
  currentCampusAnalysisData,
  // Filter states
  tableSearchTerm,
  setTableSearchTerm,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  filterFaculty,
  setFilterFaculty,
  filterStatus,
  setFilterStatus,
  filterTemplateType,
  setFilterTemplateType,
  filterStudentType,
  setFilterStudentType,
  filterCampus,
  setFilterCampus,
  filterAlertType,
  setFilterAlertType,
  filterAcademicStatus,
  setFilterAcademicStatus,
  filterStudyLevel,
  setFilterStudyLevel,
  // Available options
  availableFaculties,
  availableStatuses,
  availableTemplateTypes,
  availableCampuses,
  availableAlertTypes,
  availableAcademicStatuses,
  availableStudyLevels,
  // Handlers
  handleSort,
  handleChartClick,
  selectedChartData,
  setSelectedChartData,
  chartFilterType,
  setChartFilterType
}) => {
  // Language strings hook
  const { getString } = useLanguageStrings([
    'advisor_staff_dashboard',
    'detailed_student_info_insights',
    'alert_types_click_filter',
    'intervention_status',
    'filter_options',
    'clear_all_filters',
    'all_campuses',
    'all_faculties',
    'all_alert_types',
    'all_statuses',
    'all_template_types',
    'all_student_types',
    'domestic',
    'international',
    'all_academic_statuses',
    'all_study_levels',
    'active_filters',
    'filter_faculty',
    'filter_status',
    'filter_template',
    'filter_type',
    'chart_filter',
    'student_alerts_total',
    'search_placeholder',
    'hide_filters',
    'show_filters',
    'export',
    'export_count',
    'student',
    'date',
    'course',
    'send_email',
    'view_details',
    'showing_first_of_results',
    'student_details',
    'personal_information',
    'name',
    'email',
    'student_id',
    'immigration_status',
    'academic_information',
    'program',
    'campus',
    'gpa',
    'recent_alerts',
    'n_a',
    'alert_type',
    'status',
    'faculty',
    'actions',
    'pending',
    'in_progress',
    'high',
    'medium',
    'low'
  ]);

  const COLORS = ['#E31837', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#EF4444', '#F87171'];
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Detailed metrics for advisors
  const advisorMetrics = useMemo(() => {
    const pendingAlerts = filteredAlerts.filter(alert => alert.status === 'Pending').length;
    const inProgressAlerts = filteredAlerts.filter(alert => alert.status === 'In Progress').length;
    const highPriorityAlerts = filteredAlerts.filter(alert => alert.priority === 'High').length;
    const todayAlerts = filteredAlerts.filter(alert => {
      const today = new Date().toISOString().split('T')[0];
      if (!alert.dateRaised) return false;
      // Convert to string if it's a Date object
      const dateStr = alert.dateRaised instanceof Date 
        ? alert.dateRaised.toISOString().split('T')[0]
        : String(alert.dateRaised).split('T')[0];
      return dateStr === today;
    }).length;

    return {
      pendingAlerts,
      inProgressAlerts,
      highPriorityAlerts,
      todayAlerts,
      totalFiltered: filteredAlerts.length
    };
  }, [filteredAlerts]);

  // Pagination calculations
  const totalPages = Math.ceil(tableFilteredAlerts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAlerts = tableFilteredAlerts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tableFilteredAlerts.length]);

  // Student details lookup
  const getStudentDetails = (studentId) => {
    // Try to find student by id or sisId
    return students.find(s => s.id === studentId || s.sisId === studentId) || {};
  };

  // Export filtered data
  const exportToExcel = () => {
    const exportData = tableFilteredAlerts.map(alert => {
      const student = getStudentDetails(alert.studentId);
      return {
        'Student Name': alert.studentName,
        'Email': alert.email,
        'Alert Type': alert.alertType,
        'Date Raised': new Date(alert.dateRaised).toLocaleDateString(),
        'Status': alert.status,
        'Priority': alert.priority,
        'Faculty': alert.faculty,
        'Campus': alert.campus,
        'Course': alert.course,
        'Professor': alert.professor,
        'Description': alert.description,
        'Academic Decision': alert.academicDecision,
        'Student ID': alert.studentId,
        'Program': student.program,
        'Study Level': student.studyLevel,
        'Immigration Status': student.immigrationStatus,
        'OSAP': student.osapFlag ? 'Yes' : 'No',
        'GPA': student.ogpa
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alerts');
    XLSX.writeFile(workbook, `student-alerts-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterFaculty('');
    setFilterStatus('');
    setFilterTemplateType('');
    setFilterStudentType('');
    setFilterCampus('');
    setFilterAlertType('');
    setFilterAcademicStatus('');
    setFilterStudyLevel('');
    setTableSearchTerm('');
    setSelectedChartData(null);
    setChartFilterType(null);
  };

  // Action cards for quick stats - currently disabled, can be re-enabled in the future
  const actionCards = [];

  return (
    <div className="space-y-6">
      {/* Advisor Header */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#E31837] p-6">
        <h2 className="text-2xl font-bold mb-2 text-[#E31837]">{getString('advisor_staff_dashboard')}</h2>
        <p className="text-[#B91C1C]">{getString('detailed_student_info_insights')}</p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className={`bg-white rounded-lg shadow-lg border-l-4 ${
              card.urgent ? 'border-red-500' : 'border-gray-300'
            } p-4`}>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.color} text-white`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {card.urgent && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mt-3 mb-1">{card.title}</h3>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Actionable Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Types Distribution */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {getString('alert_types_click_filter')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={currentAlertTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                onClick={(data) => handleChartClick(data.name, 'alertType')}
                style={{ cursor: 'pointer' }}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {currentAlertTypeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]}
                    stroke={selectedChartData === entry.name ? '#000' : 'none'}
                    strokeWidth={selectedChartData === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {currentAlertTypeData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-gray-700">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {getString('intervention_status')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={currentInterventionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              {getString('filter_options')}
            </h4>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              {getString('clear_all_filters')}
            </button>
          </div>
          <div className="space-y-4">
            {/* Filter Controls - Updated for real student data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Row 1 */}
          <select
            value={filterCampus}
            onChange={(e) => setFilterCampus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_campuses')}</option>
            {availableCampuses && availableCampuses.map(campus => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>

          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_faculties')}</option>
            {availableFaculties.map(faculty => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>

          <select
            value={filterAlertType}
            onChange={(e) => setFilterAlertType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_alert_types')}</option>
            {availableAlertTypes && availableAlertTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_statuses')}</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Row 2 of filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <select
            value={filterTemplateType}
            onChange={(e) => setFilterTemplateType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_template_types')}</option>
            {availableTemplateTypes.map(templateType => (
              <option key={templateType} value={templateType}>{templateType}</option>
            ))}
          </select>

          <select
            value={filterStudentType}
            onChange={(e) => setFilterStudentType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_student_types')}</option>
            <option value="Domestic">{getString('domestic')}</option>
            <option value="International">{getString('international')}</option>
          </select>

          <select
            value={filterAcademicStatus}
            onChange={(e) => setFilterAcademicStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_academic_statuses')}</option>
            {availableAcademicStatuses && availableAcademicStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filterStudyLevel}
            onChange={(e) => setFilterStudyLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{getString('all_study_levels')}</option>
            {availableStudyLevels && availableStudyLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

            {/* Active Filters Display */}
            {(filterFaculty || filterStatus || filterTemplateType || filterStudentType || selectedChartData) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-900">{getString('active_filters')}</span>
              {filterFaculty && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {getString('faculty')}: {filterFaculty}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterFaculty('')} />
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {getString('status')}: {filterStatus}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus('')} />
                </span>
              )}
              {filterTemplateType && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Template: {filterTemplateType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterTemplateType('')} />
                </span>
              )}
              {filterStudentType && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Type: {filterStudentType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStudentType('')} />
                </span>
              )}
              {selectedChartData && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Chart Filter: {selectedChartData}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => {setSelectedChartData(null); setChartFilterType(null);}} />
                </span>
              )}
            </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Student Alert Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <Users className="w-5 h-5 text-blue-600" />
              {getString('student_alerts_total').replace('{$a}', advisorMetrics.totalFiltered)}
            </h3>
            
            <div className="flex items-center justify-end whitespace-nowrap" style={{ gap: '8px' }}>
              {/* Collapsible Search Bar - Expands horizontally to the left */}
              {showSearch && (
                <div className="relative transition-all duration-300 ease-in-out" style={{ width: '350px' }}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={getString('search_placeholder')}
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <X 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600" 
                    onClick={() => {
                      setShowSearch(false);
                      setTableSearchTerm('');
                    }}
                  />
                </div>
              )}
              
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? getString('hide_filters') : getString('show_filters')}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-[#E31837] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
                {getString('export')} ({advisorMetrics.totalFiltered})
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('studentName')}
                >
                  <div className="flex items-center gap-1">
                    {getString('student')}
                    {sortField === 'studentName' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('alertType')}
                >
                  <div className="flex items-center gap-1">
                    {getString('alert_type')}
                    {sortField === 'alertType' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dateRaised')}
                >
                  <div className="flex items-center gap-1">
                    {getString('date')}
                    {sortField === 'dateRaised' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('faculty')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('course')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getString('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAlerts.map((alert, index) => (
                <tr key={index} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(getStudentDetails(alert.studentId));
                      setShowStudentDetails(true);
                    }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{alert.studentName}</div>
                        <div className="text-sm text-gray-500">{alert.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{alert.alertType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(alert.dateRaised).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      alert.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      alert.status === 'Contacted' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.faculty}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {alert.courseName || alert.course || getString('n_a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${alert.email}`, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title={getString('send_email')}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(getStudentDetails(alert.studentId));
                          setShowStudentDetails(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title={getString('view_details')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {tableFilteredAlerts.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, tableFilteredAlerts.length)} of {tableFilteredAlerts.length} results
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="rowsPerPage" className="text-sm text-gray-700">
                    Rows per page:
                  </label>
                  <select
                    id="rowsPerPage"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowStudentDetails(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: '56rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{getString('student_details')}</h2>
                <button
                  onClick={() => setShowStudentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{getString('personal_information')}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('name')}</label>
                      <div className="text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('email')}</label>
                      <div className="text-gray-900">{selectedStudent.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('student_id')}</label>
                      <div className="text-gray-900">{selectedStudent.sisId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('immigration_status')}</label>
                      <div className="text-gray-900">{selectedStudent.immigrationStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{getString('academic_information')}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('faculty')}</label>
                      <div className="text-gray-900">{selectedStudent.homeFaculty}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('program')}</label>
                      <div className="text-gray-900">{selectedStudent.program}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('campus')}</label>
                      <div className="text-gray-900">{selectedStudent.campus}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{getString('gpa')}</label>
                      <div className="text-gray-900">{selectedStudent.ogpa || getString('n_a')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student's Alerts */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{getString('recent_alerts')}</h3>
                <div className="space-y-3">
                  {alerts
                    .filter(alert => alert.studentId === selectedStudent.id || alert.studentId === selectedStudent.sisId)
                    .slice(0, 5)
                    .map((alert, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{alert.alertType}</div>
                            <div className="text-sm text-gray-600">
                              {alert.courseName && alert.courseName !== 'N/A' ? alert.courseName : alert.course}
                              {alert.course && alert.course !== 'N/A' && alert.courseName && alert.courseName !== 'N/A' && alert.course !== alert.courseName && (
                                <span className="text-gray-500"> ({alert.course})</span>
                              )}
                              {' • '}
                              {new Date(alert.dateRaised).toLocaleDateString()}
                            </div>
                            {alert.professor && alert.professor !== 'N/A' && (
                              <div className="text-xs text-gray-500 mt-1">
                                Professor: {alert.professor}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdvisorView;
