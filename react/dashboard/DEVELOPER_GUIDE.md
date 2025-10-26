# Early Alerts React Dashboard - Developer Guide

**Last Updated:** October 26, 2025  
**Version:** 1.0.0  
**Maintainer:** York University

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Hooks & Services](#hooks--services)
7. [Integration with Moodle](#integration-with-moodle)
8. [Data Flow](#data-flow)
9. [Adding New Features](#adding-new-features)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## 🎯 Overview

The Early Alerts Dashboard is a React-based single-page application (SPA) embedded within a Moodle plugin. It provides real-time analytics and management of student early alerts across York University faculties.

### Key Features
- **Real-time student alert tracking** across 11+ faculties
- **Dual-view system**: Administrator and Advisor perspectives
- **AI-powered chatbot** using Azure OpenAI (GPT-5)
- **Advanced data visualization** with Recharts
- **Multi-language support** via Moodle's language system
- **Export capabilities** to Excel/CSV
- **Mobile-responsive** design

### Technology Stack
- **Frontend Framework:** React 19.1.0
- **Charts:** Recharts 3.0.2
- **Icons:** Lucide React 0.525.0
- **AI:** Azure OpenAI (GPT-5)
- **Export:** XLSX 0.18.5
- **Backend:** Moodle PHP + MySQL

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MOODLE ENVIRONMENT                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Dashboard (SPA)                    │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  App.js (Main Component)                    │    │  │
│  │  │  - State management                         │    │  │
│  │  │  - View routing (Admin/Advisor)            │    │  │
│  │  │  - Data fetching coordination              │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │Administrator │  │ Advisor View │                │  │
│  │  │    View      │  │              │                │  │
│  │  └──────────────┘  └──────────────┘                │  │
│  │                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐       │  │
│  │  │ Chatbot │  │ Charts  │  │Visualization │       │  │
│  │  └─────────┘  └─────────┘  └──────────────┘       │  │
│  │                                                       │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │           PHP API Endpoints                           │  │
│  │  - data.php (alert data)                             │  │
│  │  - get_strings.php (language strings)                │  │
│  │  - app_env.php (Azure OpenAI config)                 │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │           Moodle Database (MySQL)                     │  │
│  │  - mdl_local_earlyalert_logs                         │  │
│  │  - mdl_user                                           │  │
│  │  - mdl_course                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

External Services:
┌─────────────────────┐
│  Azure OpenAI API   │
│  (GPT-5 Chatbot)    │
└─────────────────────┘
```

### Component Hierarchy

```
App.js
├── AdministratorView
│   ├── Metrics Cards
│   ├── Faculty Charts
│   ├── Alert Type Distribution
│   ├── Timeline Analysis
│   └── Intervention Tracking
│
├── AdvisorView
│   ├── Student Table
│   ├── Search & Filters
│   ├── Alert Details Modal
│   ├── Export Controls
│   └── Faculty Charts
│
├── Chatbot
│   ├── AI Integration (Azure OpenAI)
│   ├── Conversation History
│   └── Context-Aware Responses
│
├── VisualizationPanel
│   ├── Dynamic Charts
│   └── Data Insights
│
└── ViewToggle
    └── Role Switcher
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **Moodle:** >= 4.0
- **PHP:** >= 7.4
- **MySQL:** >= 8.0
- **Access to:** Azure OpenAI (optional, for chatbot)

### Initial Setup

1. **Navigate to the React dashboard directory:**
   ```bash
   cd /path/to/moodle/local/earlyalert/react/dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (if using Azure OpenAI):**
   - Configure Azure OpenAI settings in Moodle plugin settings
   - The React app will fetch configuration via `app_env.php`

4. **Start development server:**
   ```bash
   npm start
   ```
   - Opens at: `http://localhost:3000`
   - API endpoints: `http://localhost/local/earlyalert/react/dashboard/`

5. **Build for production:**
   ```bash
   npm run build
   ```
   - Output: `build/` directory
   - Integrated into Moodle via `react_report_dashboard.php`

### Environment Configuration

The React app integrates with Moodle and doesn't use a separate `.env` file. Configuration is managed through:

1. **Moodle Plugin Settings** - Azure OpenAI credentials
2. **PHP Endpoints** - Data and configuration delivery
3. **Browser Local Storage** - User preferences (theme, view mode)

---

## 📁 Project Structure

```
react/dashboard/
├── public/                      # Static assets
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA manifest (icons only)
│   └── *.svg                   # Icons and images
│
├── src/
│   ├── App.js                  # Main application component
│   ├── App.css                 # Global styles
│   ├── index.js                # React entry point
│   ├── index.css               # Base styles
│   │
│   ├── components/             # React components
│   │   ├── AdministratorView.js    # Admin dashboard view
│   │   ├── AdvisorView.js          # Advisor/faculty view
│   │   ├── Chatbot.js              # AI chatbot component
│   │   ├── ViewToggle.js           # Role switcher
│   │   ├── VisualizationPanel.js   # Chart visualizations
│   │   ├── AccessibilityPanel.js   # A11y features
│   │   ├── AdvancedReporting.js    # Report generation
│   │   ├── AuraEmbed.js            # External integrations
│   │   └── [other components]
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useApiData.js       # Data fetching hook
│   │   └── useLanguageStrings.js # Moodle language hook
│   │
│   ├── services/               # Business logic & API
│   │   ├── apiService.js           # Main API service
│   │   ├── azureOpenAIService.js   # AI integration
│   │   ├── languageService.js      # i18n service
│   │   ├── localAnalyticsService.js # Analytics
│   │   └── visualizationService.js  # Chart helpers
│   │
│   └── [config files]
│
├── build/                      # Production build (generated)
│
├── data.php                    # Alert data endpoint
├── get_strings.php            # Language strings endpoint
├── app_env.php                # Azure config endpoint
│
├── package.json               # Dependencies
├── README.md                  # Project overview
├── CONTRIBUTING.md            # Contribution guide
├── LANGUAGE_STRINGS.md        # i18n documentation
├── SECURITY.md                # Security guidelines
└── DEVELOPER_GUIDE.md         # This file
```

---

## 🧩 Core Components

### 1. App.js (Main Component)

**Location:** `src/App.js`  
**Purpose:** Central application controller

**Key Responsibilities:**
- State management for all alerts, students, and filters
- Data fetching orchestration
- View routing (Administrator vs Advisor)
- Filter logic and derived data calculations
- Chart data transformations

**Important State Variables:**
```javascript
// Core data
const [alerts, setAlerts] = useState([])           // All alert records
const [students, setStudents] = useState([])       // Student master list

// UI state
const [currentView, setCurrentView] = useState('administrator') // View mode
const [loading, setLoading] = useState(true)       // Loading state

// Filters
const [tableSearchTerm, setTableSearchTerm] = useState('')
const [filterFaculty, setFilterFaculty] = useState('all')
const [filterStatus, setFilterStatus] = useState('all')
const [filterTemplateType, setFilterTemplateType] = useState('all')
// ... more filters

// Sorting
const [sortField, setSortField] = useState('dateRaised')
const [sortDirection, setSortDirection] = useState('desc')
```

**Key Functions:**
- `fetchData()` - Main data loading function
- `calculateMetrics()` - Derives dashboard metrics
- `generateChartData()` - Transforms data for visualization
- Filter functions - Apply search/filter criteria

**Usage Example:**
```javascript
// App.js handles all data and passes to child components
<AdvisorView 
  alerts={alerts}
  students={students}
  filteredAlerts={filteredAlerts}
  filterFaculty={filterFaculty}
  setFilterFaculty={setFilterFaculty}
  // ... more props
/>
```

---

### 2. AdministratorView Component

**Location:** `src/components/AdministratorView.js`  
**Purpose:** High-level analytics dashboard for administrators

**Features:**
- University-wide metrics (unique students, active alerts, resolution rate)
- Faculty-level analysis
- Alert type distribution
- Timeline trends (3-month view)
- Intervention success tracking
- Campus analysis

**Props Received:**
```javascript
{
  metrics,              // Calculated metrics object
  alerts,               // All alerts
  students,             // All students
  chartData,            // Pre-processed chart data
  filteredAlerts,       // Filtered alert subset
  currentFacultyData,   // Faculty distribution
  currentAlertTypeData, // Alert type breakdown
  currentTimelineData,  // Timeline data
  currentInterventionData, // Intervention stats
  currentCampusAnalysisData // Campus-level data
}
```

**Key Sections:**
1. **Metrics Cards** - 4 primary KPIs
2. **Faculty Analysis** - Bar chart of alerts by faculty
3. **Alert Types** - Distribution visualization
4. **Timeline** - Monthly trend analysis
5. **Intervention Tracking** - Success metrics

---

### 3. AdvisorView Component

**Location:** `src/components/AdvisorView.js`  
**Purpose:** Detailed student-level view for advisors/faculty

**Features:**
- Searchable/filterable student table
- Individual alert details
- Student contact information
- Export to Excel/CSV
- Faculty-specific filtering
- Alert status management
- Template type filtering

**Interactive Elements:**
- **Search Bar** - Real-time student name/email search
- **Filter Panel** - Multi-dimensional filtering
- **Sort Controls** - Column-based sorting
- **Export Button** - XLSX export with filtering
- **Detail Modal** - Full student/alert information

**Filter Options:**
- Faculty (home faculty)
- Status (Active, Resolved, etc.)
- Template Type (Low Grade, Missed Assignment, etc.)
- Student Type (Domestic, International)
- Campus (Keele, Glendon, etc.)
- Alert Type
- Academic Status
- Study Level

**Table Structure:**
```javascript
// Key columns displayed
- Student Name
- Email
- Faculty
- Campus
- Alert Type
- Status
- Date Raised
- Actions (View Details, Contact)
```

---

### 4. Chatbot Component

**Location:** `src/components/Chatbot.js`  
**Purpose:** AI-powered conversational interface using Azure OpenAI

**Features:**
- GPT-5 powered responses
- Context-aware conversations
- Alert data analysis
- Natural language queries
- Conversation history
- Collapsible interface

**Configuration:**
- Loaded dynamically from `app_env.php`
- Requires Azure OpenAI setup in Moodle plugin settings
- Gracefully degrades if not configured

**Example Queries:**
```
"How many high-priority alerts do we have?"
"Show me students from LAPS faculty"
"What's the resolution rate for this month?"
"Which faculty has the most alerts?"
```

**Implementation:**
```javascript
import azureOpenAIService from '../services/azureOpenAIService';

const handleSendMessage = async (message) => {
  const configured = await azureOpenAIService.isConfigured();
  if (!configured) {
    // Show configuration message
    return;
  }
  
  const response = await azureOpenAIService.generateChatResponse(
    conversationHistory,
    message,
    contextData // Current alerts/students data
  );
  
  setConversationHistory([...conversationHistory, userMsg, aiMsg]);
};
```

---

### 5. VisualizationPanel Component

**Location:** `src/components/VisualizationPanel.js`  
**Purpose:** Advanced data visualization and insights

**Chart Types Supported:**
- Bar Charts
- Line Charts
- Area Charts
- Pie Charts
- Stacked Charts
- Time Series

**Uses:** Recharts library for all visualizations

---

## 🎣 Hooks & Services

### Custom Hooks

#### 1. useApiData Hook

**Location:** `src/hooks/useApiData.js`  
**Purpose:** Centralized data fetching from Moodle

```javascript
import { useApiData } from '../hooks/useApiData';

const MyComponent = () => {
  const { 
    alerts,        // All alert records
    students,      // All student records
    loading,       // Loading state
    error,         // Error state
    refetch        // Manual refetch function
  } = useApiData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{alerts.length} alerts loaded</div>;
};
```

**Features:**
- Automatic data fetching on mount
- Error handling
- Loading states
- Manual refetch capability
- Mock data fallback for development

**Data Sources:**
- Primary: `/local/earlyalert/react/dashboard/data.php`
- Fallback: Mock data (development only)

---

#### 2. useLanguageStrings Hook

**Location:** `src/hooks/useLanguageStrings.js`  
**Purpose:** Access Moodle's multi-language system in React

```javascript
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const MyComponent = () => {
  const { getString, loading } = useLanguageStrings([
    'pluginname',      // From local_earlyalert
    'core:add',        // From core Moodle
    'core:delete',     // From core Moodle
  ]);
  
  return (
    <div>
      <h1>{getString('pluginname')}</h1>
      <button>{getString('core:add')}</button>
    </div>
  );
};
```

**String Formats:**
1. **Simple:** `'pluginname'` - Defaults to `local_earlyalert`
2. **Component:Key:** `'core:add'` - From specific component
3. **Object:** `{key: 'add', component: 'core'}` - Explicit format

**See:** `LANGUAGE_STRINGS.md` for complete documentation

---

### Services

#### 1. apiService.js

**Location:** `src/services/apiService.js`  
**Purpose:** HTTP requests to Moodle endpoints

```javascript
import apiService from '../services/apiService';

// Fetch alert data
const data = await apiService.fetchAlerts();

// Custom endpoint
const result = await apiService.get('/local/earlyalert/api/custom.php');
```

---

#### 2. azureOpenAIService.js

**Location:** `src/services/azureOpenAIService.js`  
**Purpose:** Azure OpenAI GPT-5 integration

**Key Methods:**
```javascript
// Check if configured
const isConfigured = await azureOpenAIService.isConfigured();

// Generate chat response
const response = await azureOpenAIService.generateChatResponse(
  conversationHistory,  // Array of previous messages
  userMessage,          // Current user message
  contextData          // Alert/student data for context
);

// Generate data insights
const insights = await azureOpenAIService.generateDataInsights(
  alerts,
  students,
  metrics
);
```

**Configuration:**
- Fetches config from `app_env.php`
- Credentials stored in Moodle plugin settings
- Requires: endpoint, api_key, deployment_name, api_version

---

#### 3. languageService.js

**Location:** `src/services/languageService.js`  
**Purpose:** Interface to Moodle's get_string() system

**Methods:**
```javascript
// Load multiple strings
const strings = await languageService.loadStrings([
  'pluginname',
  'core:add',
  {key: 'delete', component: 'core'}
]);

// Get single string (cached)
const str = languageService.getString('pluginname');
```

---

#### 4. visualizationService.js

**Location:** `src/services/visualizationService.js`  
**Purpose:** Chart data transformation helpers

**Utilities:**
- Data aggregation functions
- Color palette management
- Chart formatting utilities
- Responsive chart configs

---

## 🔗 Integration with Moodle

### How the React App is Embedded

1. **Moodle Template:** `templates/react_report_dashboard.mustache`
   ```mustache
   <div id="root"></div>
   <script src="{$wwwroot}/local/earlyalert/react/dashboard/build/static/js/main.js"></script>
   ```

2. **PHP Page:** `report_admin_dashboard.php` or `report_advisor_dashboard.php`
   ```php
   echo $OUTPUT->render_from_template('local_earlyalert/react_report_dashboard', [
     'wwwroot' => $CFG->wwwroot
   ]);
   ```

3. **React Mount:** `src/index.js`
   ```javascript
   const root = ReactDOM.createRoot(document.getElementById('root'));
   root.render(<App />);
   ```

---

### PHP API Endpoints

#### 1. data.php - Alert Data Endpoint

**URL:** `/local/earlyalert/react/dashboard/data.php`

**Purpose:** Fetch all alert and student data

**Parameters:**
- `date_range` (optional) - Filter by date range

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "jdoe@yorku.ca",
      "subject": "Low Grade Alert",
      "message": "Student performance concern",
      "context": "LAPS",
      "unit": "Computer Science",
      "active": 1,
      "template_type": "Low Grade",
      "SISID": "100200001",
      "campus": "Keele",
      "study_level": "Undergraduate"
      // ... more fields
    }
  ],
  "count": 1234
}
```

**Security:**
- Requires Moodle authentication (`require_login()`)
- CORS headers configured
- Global database access via `$DB`

---

#### 2. get_strings.php - Language Strings Endpoint

**URL:** `/local/earlyalert/react/dashboard/get_strings.php`

**Purpose:** Fetch translated strings from Moodle

**Request Format:**
```javascript
POST /local/earlyalert/react/dashboard/get_strings.php
Content-Type: application/json

{
  "strings": [
    {
      "key": "pluginname",
      "component": "local_earlyalert"
    },
    {
      "key": "add",
      "component": "core"
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "strings": {
    "pluginname": "Early Alerts",
    "core:add": "Add",
    "core:delete": "Delete"
  }
}
```

**How It Works:**
```php
foreach ($requested_strings as $str) {
    $key = $str->key;
    $component = $str->component ?? 'local_earlyalert';
    $value = get_string($key, $component);
    $result_strings["$component:$key"] = $value;
}
```

---

#### 3. app_env.php - Configuration Endpoint

**URL:** `/local/earlyalert/react/dashboard/app_env.php`

**Purpose:** Provide Azure OpenAI configuration to React

**Response Format:**
```json
{
  "success": true,
  "configured": true,
  "azure_openai": {
    "endpoint": "https://your-resource.openai.azure.com",
    "api_key": "your-api-key",
    "deployment_name": "gpt-5",
    "api_version": "2024-02-15-preview"
  }
}
```

**Security:**
- Requires Moodle authentication
- API key is necessary for client-side Azure OpenAI SDK
- Ensure proper HTTPS in production

---

### Database Tables Used

The React app reads from these Moodle tables:

#### mdl_local_earlyalert_logs
```sql
- id               BIGINT
- name             VARCHAR(255)  -- Student name
- email            VARCHAR(255)
- subject          TEXT          -- Alert subject
- message          TEXT          -- Alert message
- context          VARCHAR(100)  -- Faculty code
- unit             VARCHAR(100)  -- Department/program
- active           TINYINT       -- 1=active, 0=inactive
- template_type    VARCHAR(50)   -- Alert type
- SISID            VARCHAR(50)   -- Student ID
- campus           VARCHAR(50)
- study_level      VARCHAR(50)
- timecreated      BIGINT        -- Unix timestamp
- timemodified     BIGINT
```

**Accessed via:** `\local_earlyalert\logs::get_logs($date_range)`

---

## 🔄 Data Flow

### Complete Request Lifecycle

```
1. User Opens Dashboard
   ↓
2. App.js mounts → useEffect triggered
   ↓
3. useApiData hook calls apiService.fetchAlerts()
   ↓
4. HTTP GET → /local/earlyalert/react/dashboard/data.php
   ↓
5. PHP: require_login() → Check Moodle session
   ↓
6. PHP: \local_earlyalert\logs::get_logs()
   ↓
7. PHP: Query mdl_local_earlyalert_logs table
   ↓
8. PHP: Format & return JSON
   ↓
9. React: Process response → setAlerts(data)
   ↓
10. React: Calculate derived data (metrics, charts)
   ↓
11. React: Pass to child components
   ↓
12. Components: Render visualizations
```

### State Management Flow

```
App.js (Root State)
├── alerts (raw data)
├── students (derived)
├── filters (user input)
│
├─[useMemo]─> filteredAlerts (filtered subset)
│
├─[useMemo]─> metrics (calculated KPIs)
│
├─[useMemo]─> chartData (transformed for Recharts)
│
└─[props]─> Child Components
            ├── AdministratorView
            ├── AdvisorView
            ├── Chatbot
            └── VisualizationPanel
```

**Performance Note:** All heavy computations use `useMemo` to prevent unnecessary recalculations.

---

## ➕ Adding New Features

### Example: Adding a New Filter

**Step 1: Add State in App.js**
```javascript
const [filterNewOption, setFilterNewOption] = useState('all');
```

**Step 2: Add to Filter Logic**
```javascript
const filteredAlerts = useMemo(() => {
  return alerts.filter(alert => {
    // ... existing filters
    if (filterNewOption !== 'all' && alert.newField !== filterNewOption) {
      return false;
    }
    return true;
  });
}, [alerts, filterNewOption, /* other deps */]);
```

**Step 3: Pass to Child Component**
```javascript
<AdvisorView
  filterNewOption={filterNewOption}
  setFilterNewOption={setFilterNewOption}
  // ... other props
/>
```

**Step 4: Add UI in AdvisorView.js**
```javascript
<select 
  value={filterNewOption} 
  onChange={(e) => setFilterNewOption(e.target.value)}
>
  <option value="all">All Options</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

---

### Example: Adding a New Chart

**Step 1: Add Data Transformation in App.js**
```javascript
const newChartData = useMemo(() => {
  const grouped = {};
  filteredAlerts.forEach(alert => {
    const key = alert.someField;
    grouped[key] = (grouped[key] || 0) + 1;
  });
  
  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / filteredAlerts.length) * 100).toFixed(1)
  }));
}, [filteredAlerts]);
```

**Step 2: Add to AdministratorView.js**
```javascript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<div className="bg-white p-6 rounded-lg shadow-sm">
  <h3 className="text-lg font-semibold mb-4">New Chart Title</h3>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={newChartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#3b82f6" />
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

### Example: Adding a New Component

**Step 1: Create Component File**
```javascript
// src/components/NewFeature.js
import React from 'react';
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const NewFeature = ({ data }) => {
  const { getString } = useLanguageStrings(['feature_title', 'feature_description']);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">{getString('feature_title')}</h2>
      <p>{getString('feature_description')}</p>
      {/* Feature implementation */}
    </div>
  );
};

export default NewFeature;
```

**Step 2: Add Language Strings**
```php
// lang/en/local_earlyalert.php
$string['feature_title'] = 'New Feature';
$string['feature_description'] = 'Description of the new feature';
```

**Step 3: Import and Use in App.js**
```javascript
import NewFeature from './components/NewFeature';

// In render:
<NewFeature data={relevantData} />
```

---

### Example: Adding a New API Endpoint

**Step 1: Create PHP Endpoint**
```php
// react/dashboard/custom_data.php
<?php
require_once('../../../../config.php');
require_login();

global $DB;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $records = $DB->get_records('some_table', ['status' => 1]);
    
    echo json_encode([
        'success' => true,
        'data' => array_values($records)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

**Step 2: Add Service Method**
```javascript
// src/services/apiService.js
export const fetchCustomData = async () => {
  try {
    const response = await fetch(
      '/local/earlyalert/react/dashboard/custom_data.php'
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch custom data:', error);
    throw error;
  }
};
```

**Step 3: Use in Component**
```javascript
import { fetchCustomData } from '../services/apiService';

useEffect(() => {
  const loadData = async () => {
    const data = await fetchCustomData();
    setCustomData(data);
  };
  loadData();
}, []);
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- AdvisorView.test.js
```

### Writing Component Tests

```javascript
// src/components/AdvisorView.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import AdvisorView from './AdvisorView';

test('renders advisor view with student count', () => {
  const mockAlerts = [
    { id: 1, studentName: 'John Doe', email: 'john@test.com' }
  ];
  
  render(<AdvisorView alerts={mockAlerts} /* ... other props */ />);
  
  expect(screen.getByText(/john doe/i)).toBeInTheDocument();
});

test('filter updates when changed', () => {
  const setFilter = jest.fn();
  render(<AdvisorView setFilterFaculty={setFilter} /* ... */ />);
  
  fireEvent.change(screen.getByRole('combobox'), { 
    target: { value: 'LAPS' } 
  });
  
  expect(setFilter).toHaveBeenCalledWith('LAPS');
});
```

### Testing Hooks

```javascript
// src/hooks/useApiData.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useApiData } from './useApiData';

test('fetches data on mount', async () => {
  const { result } = renderHook(() => useApiData());
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.alerts).toBeDefined();
  });
});
```

---

## 🚀 Deployment

### Development Deployment

1. **Make Changes** in `src/` files
2. **Test Locally** with `npm start`
3. **Build** with `npm run build`
4. **Test in Moodle** by accessing the dashboard page

### Production Deployment

```bash
# 1. Ensure all changes are committed
git status

# 2. Run tests
npm test

# 3. Build production bundle
npm run build

# 4. Verify build output
ls -la build/static/js/

# 5. The build/ directory is served by Moodle
# No additional deployment needed - Moodle serves files directly

# 6. Clear Moodle cache
php admin/cli/purge_caches.php

# 7. Test in production Moodle environment
```

### Build Configuration

**package.json:**
```json
{
  "homepage": "/local/earlyalert/react/dashboard/build",
  "scripts": {
    "build": "react-scripts build"
  }
}
```

This ensures all asset paths are relative to the Moodle installation.

### Production Checklist

- [ ] All tests passing
- [ ] No console errors in browser
- [ ] Azure OpenAI configured (if using chatbot)
- [ ] Language strings tested in multiple languages
- [ ] Responsive design verified on mobile
- [ ] Export functions tested
- [ ] Performance tested with large datasets
- [ ] Moodle cache cleared after deployment

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to fetch data" Error

**Symptoms:** Loading spinner indefinitely, console error about CORS

**Solutions:**
```bash
# Check PHP endpoint directly
curl http://localhost/local/earlyalert/react/dashboard/data.php

# Verify you're logged into Moodle
# Check browser Network tab for 401/403 errors

# Ensure CORS headers in data.php:
header('Access-Control-Allow-Origin: *');
```

#### 2. Language Strings Not Loading

**Symptoms:** Seeing string keys instead of translated text

**Solutions:**
```php
// Verify strings exist in lang/en/local_earlyalert.php
$string['pluginname'] = 'Early Alerts';

// Check get_strings.php endpoint:
curl -X POST http://localhost/local/earlyalert/react/dashboard/get_strings.php \
  -H "Content-Type: application/json" \
  -d '{"strings":[{"key":"pluginname","component":"local_earlyalert"}]}'

// Clear Moodle's language cache
php admin/cli/purge_caches.php
```

#### 3. Azure OpenAI Chatbot Not Working

**Symptoms:** "AI assistant not configured" message

**Solutions:**
1. Check Moodle plugin settings for Azure OpenAI credentials
2. Verify `app_env.php` returns valid config:
   ```bash
   curl http://localhost/local/earlyalert/react/dashboard/app_env.php
   ```
3. Check browser console for OpenAI SDK errors
4. Ensure API key has proper permissions in Azure portal

#### 4. Charts Not Rendering

**Symptoms:** Blank white boxes where charts should be

**Solutions:**
```javascript
// Check if data is in correct format
console.log('Chart data:', chartData);

// Ensure ResponsiveContainer has dimensions
<ResponsiveContainer width="100%" height={300}>

// Verify Recharts is installed
npm list recharts

// Check for console errors about missing props
```

#### 5. Filters Not Working

**Symptoms:** Table doesn't update when changing filters

**Solutions:**
```javascript
// Ensure filter state is in dependency array
const filteredAlerts = useMemo(() => {
  // ... filter logic
}, [alerts, filterFaculty, filterStatus]); // ← Add all filters here

// Check if onChange handlers are connected
<select onChange={(e) => setFilterFaculty(e.target.value)}>
```

#### 6. Build Fails

**Symptoms:** `npm run build` errors

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
npm run build 2>&1 | grep -i error

# Verify Node version
node --version  # Should be >= 18.0.0

# Check for unused imports
npm run build -- --stats
```

#### 7. Page is Blank After Deployment

**Symptoms:** White screen, React app doesn't load

**Solutions:**
```javascript
// Check browser console for errors
// Common issue: Incorrect homepage in package.json

// Verify paths in package.json:
"homepage": "/local/earlyalert/react/dashboard/build"

// Check if files exist:
ls -la build/static/js/

// Verify Moodle template includes correct path:
// templates/react_report_dashboard.mustache
<script src="{$wwwroot}/local/earlyalert/react/dashboard/build/static/js/main.*.js"></script>
```

---

### Debugging Tips

**1. Enable Verbose Logging:**
```javascript
// Add to App.js for debugging
useEffect(() => {
  console.log('App State:', {
    alerts: alerts.length,
    students: students.length,
    filteredAlerts: filteredAlerts.length,
    filters: {
      faculty: filterFaculty,
      status: filterStatus
    }
  });
}, [alerts, students, filteredAlerts, filterFaculty, filterStatus]);
```

**2. Test PHP Endpoints Directly:**
```bash
# Test data endpoint
curl -i http://localhost/local/earlyalert/react/dashboard/data.php

# Test language strings
curl -X POST http://localhost/local/earlyalert/react/dashboard/get_strings.php \
  -H "Content-Type: application/json" \
  -d '{"strings":[{"key":"pluginname","component":"local_earlyalert"}]}'

# Test Azure config
curl http://localhost/local/earlyalert/react/dashboard/app_env.php
```

**3. React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state
- Profile component rendering performance

**4. Network Tab:**
- Check all API requests
- Verify response codes (200, 401, 404, 500)
- Inspect request/response payloads

---

## ✅ Best Practices

### Code Style

**1. Component Structure:**
```javascript
// Imports
import React, { useState, useMemo } from 'react';
import { useLanguageStrings } from '../hooks/useLanguageStrings';

// Component
const MyComponent = ({ data, onAction }) => {
  // Language strings
  const { getString } = useLanguageStrings(['title', 'description']);
  
  // State
  const [localState, setLocalState] = useState(null);
  
  // Derived data
  const processedData = useMemo(() => {
    return data.map(/* transformation */);
  }, [data]);
  
  // Event handlers
  const handleClick = () => {
    onAction(localState);
  };
  
  // Render
  return (
    <div>
      <h1>{getString('title')}</h1>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

**2. Always Use Language Strings:**
```javascript
// ❌ Bad - Hardcoded text
<button>Send Email</button>

// ✅ Good - Uses Moodle language system
<button>{getString('send_email')}</button>
```

**3. Use useMemo for Heavy Computations:**
```javascript
// ❌ Bad - Recalculates every render
const metrics = calculateMetrics(alerts);

// ✅ Good - Only recalculates when alerts change
const metrics = useMemo(() => calculateMetrics(alerts), [alerts]);
```

**4. Prop Drilling vs Context:**
```javascript
// For 2-3 levels deep: Use props
<Parent>
  <Child data={data}>
    <GrandChild data={data} />
  </Child>
</Parent>

// For deep nesting or global state: Use Context
const DataContext = React.createContext();
<DataContext.Provider value={data}>
  {/* Any child can access data */}
</DataContext.Provider>
```

**5. Error Handling:**
```javascript
// Always handle errors in async operations
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await apiService.fetchAlerts();
    setAlerts(data);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Performance

**1. Avoid Unnecessary Re-renders:**
```javascript
// Use React.memo for components that don't change often
const ExpensiveComponent = React.memo(({ data }) => {
  // ... expensive rendering
});

// Use useCallback for event handlers passed as props
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**2. Optimize Large Lists:**
```javascript
// Use key prop correctly
{alerts.map(alert => (
  <AlertRow key={alert.id} alert={alert} />
))}

// Consider virtualization for 1000+ items
import { FixedSizeList } from 'react-window';
```

**3. Lazy Load Components:**
```javascript
const Chatbot = React.lazy(() => import('./components/Chatbot'));

<React.Suspense fallback={<div>Loading...</div>}>
  <Chatbot />
</React.Suspense>
```

### Security

**1. Never Expose API Keys in Frontend:**
```javascript
// ❌ Bad - API key in code
const API_KEY = 'secret-key-12345';

// ✅ Good - Fetch from secure endpoint
const config = await fetch('/local/earlyalert/react/dashboard/app_env.php');
```

**2. Sanitize User Input:**
```javascript
// When displaying user-generated content
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

**3. Validate Data:**
```javascript
// Always validate data from API
const isValidAlert = (alert) => {
  return alert && 
         typeof alert.id === 'number' &&
         typeof alert.studentName === 'string' &&
         alert.email.includes('@');
};
```

### Accessibility

**1. Semantic HTML:**
```javascript
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

**2. ARIA Labels:**
```javascript
<button aria-label={getString('close_dialog')} onClick={onClose}>
  <X size={20} />
</button>
```

**3. Keyboard Navigation:**
```javascript
const handleKeyPress = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleAction();
  }
};
```

### Documentation

**1. Comment Complex Logic:**
```javascript
// Group alerts by faculty and calculate percentages
// This powers the faculty distribution chart
const facultyData = useMemo(() => {
  const grouped = {};
  filteredAlerts.forEach(alert => {
    const faculty = alert.context || 'Unknown';
    grouped[faculty] = (grouped[faculty] || 0) + 1;
  });
  // ... more logic
}, [filteredAlerts]);
```

**2. JSDoc for Functions:**
```javascript
/**
 * Calculates dashboard metrics from alert data
 * @param {Array} alerts - Array of alert objects
 * @param {Array} students - Array of student objects
 * @returns {Object} Metrics object with counts and percentages
 */
const calculateMetrics = (alerts, students) => {
  // ...
};
```

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Recharts Documentation](https://recharts.org/)
- [Moodle Development](https://docs.moodle.org/dev/)
- [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

### Related Files in This Project
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines
- `LANGUAGE_STRINGS.md` - i18n documentation
- `SECURITY.md` - Security guidelines
- `REAL_DATA_INTEGRATION_SUMMARY.md` - Data integration details

### Moodle Plugin Files
- `/classes/logs.php` - Data access layer
- `/lang/en/local_earlyalert.php` - Language strings
- `/db/access.php` - Permissions
- `/version.php` - Version information

---

## 🤝 Getting Help

### Support Channels
1. **Check this guide** - Most common issues are documented here
2. **Moodle logs** - Check `apache/php error logs` for backend issues
3. **Browser console** - Check for JavaScript errors
4. **Network tab** - Verify API requests/responses

### Contact
- **Maintainer:** York University IT
- **Email:** vidurk@yorku.ca
- **Plugin Page:** Site Administration → Plugins → Local plugins → Early Alerts

---

## 📝 Changelog

### Version 1.0.0 (October 26, 2025)
- Initial comprehensive developer guide
- Documented all components, hooks, and services
- Added troubleshooting section
- Included deployment procedures
- Added code examples throughout

---

## 🔮 Future Enhancements

### Planned Features
1. **Real-time Updates** - WebSocket integration for live data
2. **Advanced Analytics** - Machine learning predictions
3. **Mobile App** - React Native version
4. **Bulk Actions** - Multi-select alert management
5. **Custom Reports** - User-defined report templates
6. **Integration API** - REST API for third-party tools

### Technical Debt
- Consider migrating to TypeScript for better type safety
- Implement React Query for better data fetching
- Add E2E testing with Cypress
- Optimize bundle size with code splitting
- Implement proper state management (Redux/Zustand)

---

**Last Updated:** October 26, 2025  
**Document Version:** 1.0.0  
**React App Version:** 1.0.0

---

*This guide is a living document. Please keep it updated as the application evolves.*

