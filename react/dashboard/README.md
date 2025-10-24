# Early Alerts Dashboard 📊

[![CI/CD Pipeline](https://github.com/your-username/early-alerts-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/early-alerts-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com/)

## York University Student Success Analytics Platform

A modern, real-time dashboard for tracking and managing student alerts across all York University faculties. Built with React and FastAPI to provide immediate visibility into student challenges and enable rapid intervention.

![Dashboard Preview](docs/images/dashboard-preview.png)

## ✨ Features

- 📊 **Real-time Analytics** - Live student alert tracking with instant updates
- 🎯 **Smart Filtering** - Advanced search and filter capabilities
- 📱 **Mobile Responsive** - Optimized for all devices
- 🔐 **Secure API** - RESTful backend with authentication
- 📈 **Data Visualization** - Interactive charts and metrics
- ⚡ **High Performance** - Optimized for 10,000+ student records

## 🚀 Quick Start

1. **Clone and setup**
   ```bash
   git clone https://github.com/your-username/early-alerts-dashboard.git
   cd early-alerts-dashboard
   ./scripts/setup-dev.sh
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start development servers**
   ```bash
   npm run dev:full  # Starts both frontend and backend
   ```

4. **Open dashboard**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
early-alerts-dashboard/
├── 📁 src/                  # React frontend source
│   ├── 📁 components/       # Reusable components
│   ├── 📁 hooks/           # Custom React hooks
│   └── 📁 services/        # API and business logic
├── 📁 backend/             # FastAPI backend
│   ├── 📄 main.py          # API entry point
│   ├── 📄 database.py      # Database models
│   └── 📄 schemas.py       # Pydantic schemas
├── 📁 docs/                # Documentation
├── 📁 scripts/             # Development scripts
└── 📁 .github/             # CI/CD workflows
```

---

## 🎯 **Overview**

The Early Alerts Dashboard transforms student support operations from reactive to proactive by providing:

- **Real-time student alert tracking** across all 11 York University faculties
- **Interactive data visualization** with charts, filters, and search capabilities
- **Immediate alert creation** with instant dashboard updates
- **Mobile-responsive design** accessible from any device
- **Comprehensive metrics** for data-driven decision making

### **Live Demo**
- **Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Admin Interface**: MySQL Workbench connection available

---

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REACT FRONTEND │◄──►│  FASTAPI BACKEND │◄──►│  MYSQL DATABASE │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 3306)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
    Dashboard UI             API Layer              Data Storage
    • Charts & Graphs       • REST Endpoints       • Students Table
    • Filters & Search      • Data Processing      • Alerts Table
    • Real-time Updates     • Business Logic       • Faculty Data
    • Mobile Interface      • Security Layer       • Audit Trail
```

### **Technology Stack**
- **Frontend**: React 19.1.0, Recharts, Lucide Icons
- **Backend**: FastAPI 0.104.1, SQLAlchemy, Pydantic
- **Database**: MySQL 8.0+, Structured relational schema
- **Development**: Node.js, Python 3.8+, npm/pip package management

---

## 🚀 **Quick Start Guide**

### **Prerequisites**
- **Node.js** (v16+ recommended)
- **Python** (3.8+ required)
- **MySQL** (8.0+ recommended)
- **Git** (for version control)

### **1. Clone Repository**
```bash
git clone <repository-url>
cd early-alerts-dashboard
```

### **2. Database Setup**
```bash
# Start MySQL service
brew services start mysql  # macOS
# OR
sudo systemctl start mysql  # Linux

# Create database and import schema
mysql -u root -p
CREATE DATABASE early_alerts_db;
USE early_alerts_db;
SOURCE backend/database_setup.sql;

# Import sample data
python backend/migrate_data.py
```

### **3. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **4. Frontend Setup**
```bash
# In project root directory
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm start
```

### **5. Verify Installation**
- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📱 **User Guide**

### **Dashboard Features**

#### **📊 Metrics Overview**
Four key performance indicators displayed at the top:
- **Active Alerts**: Current number of open student alerts
- **Unique Students**: Total students with at least one alert
- **International Students**: Count of international students with alerts
- **High Priority Alerts**: Number of urgent issues requiring attention

#### **🔍 Smart Filtering**
- **Faculty Filter**: Focus on specific departments (all 11 York faculties)
- **Status Filter**: View by alert status (Pending, In Progress, Contacted, Resolved)
- **Priority Filter**: Filter by urgency (Low, Medium, High, Critical)
- **Student Type Filter**: Domestic vs. International students
- **Clear Filters**: Reset all filters with one click

#### **📈 Interactive Charts**
- **Faculty Distribution**: Visual breakdown of alerts by department
- **Alert Status Overview**: Pie chart showing resolution progress
- **Priority Distribution**: Bar chart of alert urgency levels
- **Trend Analysis**: Historical data patterns

#### **📋 Recent Alerts Table**
- **Sortable Columns**: Click headers to sort by any field
- **Search Functionality**: Find students by name, ID, or email
- **Status Badges**: Color-coded priority and status indicators
- **Student Type**: International/Domestic designation with badges
- **Action Tracking**: View alert history and follow-up notes

### **Adding New Students & Alerts**

#### **Method 1: SQL Script (Recommended)**
```bash
# Open MySQL Workbench
# Load and customize add_student_with_alert.sql
# Execute script
# Student appears immediately in dashboard
```

#### **Method 2: Demo Helper Script**
```bash
./demo-helper.sh add-student
# Follow interactive prompts
```

#### **Method 3: Manual Database Entry**
```sql
-- Use provided SQL templates
-- See Demo_Queries.sql for examples
```

---

## 🛠️ **Development Guide**

### **Project Structure**
```
early-alerts-dashboard/
├── src/                          # React frontend source
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API communication
│   └── App.js                    # Main application component
├── backend/                      # FastAPI backend
│   ├── main.py                   # FastAPI application entry
│   ├── database.py               # Database connection & models
│   ├── schemas.py                # Pydantic data models
│   └── config.py                 # Configuration management
├── public/                       # Static assets
├── build/                        # Production build output
└── docs/                         # Documentation files
```

### **API Endpoints**

#### **Students**
- `GET /api/students` - List all students with alerts
- `GET /api/students/{id}` - Get specific student details
- `POST /api/students` - Create new student record

#### **Alerts**
- `GET /api/alerts` - List all alerts with student data
- `GET /api/alerts/{id}` - Get specific alert details
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/{id}` - Update alert status/notes

#### **Faculties**
- `GET /api/faculties` - List all York University faculties

#### **System**
- `GET /health` - System health check
- `GET /docs` - Interactive API documentation

### **Database Schema**

#### **Students Table**
```sql
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sisid VARCHAR(20) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    home_faculty VARCHAR(100) NOT NULL,
    campus VARCHAR(50) NOT NULL,
    program VARCHAR(200) NOT NULL,
    immigration_status ENUM('Domestic', 'International') NOT NULL,
    study_level VARCHAR(50) NOT NULL,
    ogpa DECIMAL(3,2) DEFAULT NULL,
    academic_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **Alerts Table**
```sql
CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) DEFAULT NULL,
    course_name VARCHAR(200) DEFAULT NULL,
    professor_name VARCHAR(100) DEFAULT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    status ENUM('Pending', 'In Progress', 'Contacted', 'Resolved') NOT NULL,
    assigned_to VARCHAR(100) DEFAULT NULL,
    follow_up_notes TEXT DEFAULT NULL,
    date_raised TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

### **Environment Configuration**

#### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

#### **Backend (.env)**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=early_alerts_db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

---

## 🧪 **Testing & Quality Assurance**

### **Frontend Testing**
```bash
# Run test suite
npm test

# Run tests with coverage
npm test -- --coverage

# Build production version
npm run build
```

### **Backend Testing**
```bash
# Activate virtual environment
source backend/venv/bin/activate

# Run API tests
python -m pytest backend/tests/

# Test specific endpoint
curl http://localhost:8000/api/students
```

### **Database Testing**
```bash
# Run verification queries
mysql -u root -p early_alerts_db < Demo_Queries.sql

# Check data integrity
./demo-helper.sh verify-data
```

---

## 📊 **Data Management**

### **Adding Sample Data**
```bash
# Method 1: Migration script
python backend/migrate_data.py

# Method 2: SQL script
mysql -u root -p early_alerts_db < add_student_with_alert.sql

# Method 3: Demo helper
./demo-helper.sh add-sample-data
```

### **Backup & Recovery**
```bash
# Create backup
mysqldump -u root -p early_alerts_db > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p early_alerts_db < backup_20250630.sql
```

### **Data Export**
```bash
# Export to CSV
mysql -u root -p -e "SELECT * FROM students;" early_alerts_db > students.csv

# Export alerts with student data
mysql -u root -p early_alerts_db < export_queries.sql
```

---

## 🔒 **Security & Compliance**

### **Data Protection**
- **PIPEDA Compliant**: Student privacy protection implemented
- **FIPPA Adherent**: Freedom of information requirements met
- **Local Data Storage**: All data remains within York infrastructure
- **Encrypted Connections**: HTTPS/TLS for all communications

### **Access Control**
- **Database Security**: User authentication and authorization
- **API Security**: Request validation and sanitization
- **Environment Variables**: Sensitive data stored securely
- **Audit Trails**: Complete logging of all data access

### **Best Practices**
- Regular security updates for all dependencies
- Input validation on all user-provided data
- SQL injection prevention through parameterized queries
- Cross-site scripting (XSS) protection in frontend

---

## 🚀 **Deployment**

### **Development Environment**
```bash
# Start all services
./start-backend.sh    # Terminal 1: Backend
npm start            # Terminal 2: Frontend
```

### **Production Deployment**
```bash
# Build frontend
npm run build

# Configure production environment
cp .env.production .env

# Deploy with process manager
pm2 start ecosystem.config.js

# Setup reverse proxy (nginx/apache)
# Configure SSL certificates
# Setup domain and DNS
```

### **Docker Deployment** (Future Enhancement)
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Scale services
docker-compose scale api=3
```

---

## 📈 **Monitoring & Analytics**

### **System Health**
- **API Health Check**: http://localhost:8000/health
- **Database Connection**: Monitored via backend health endpoint
- **Frontend Status**: Build and runtime error tracking

### **Usage Analytics**
- **Dashboard Usage**: Track user interactions and popular features
- **API Performance**: Response times and error rates
- **Database Performance**: Query optimization and indexing

### **Alerts & Notifications**
- **System Alerts**: Automated monitoring of service health
- **Data Quality**: Validation of student and alert information
- **Performance Monitoring**: Response time and availability tracking

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Backend Won't Start**
```bash
# Check Python version
python --version  # Should be 3.8+

# Verify virtual environment
which python  # Should point to venv

# Check database connection
mysql -u root -p -e "SHOW DATABASES;"

# Verify environment variables
cat backend/.env
```

#### **Frontend Build Errors**
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+

# Verify environment variables
cat .env
```

#### **Database Connection Issues**
```bash
# Check MySQL service
brew services list | grep mysql  # macOS
systemctl status mysql          # Linux

# Test connection
mysql -u root -p -e "SELECT 1;"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;" | grep early_alerts
```

#### **Student Not Appearing in Dashboard**
1. **Verify student has alerts** (students without alerts don't appear)
2. **Check database entry** using verification queries
3. **Refresh dashboard** (hard refresh: Cmd+Shift+R)
4. **Check API response** at http://localhost:8000/api/students

### **Debug Mode**
```bash
# Backend debug mode
DEBUG=True uvicorn main:app --reload

# Frontend debug mode
REACT_APP_DEBUG=true npm start

# Database query logging
tail -f /var/log/mysql/query.log
```

---

## 📚 **Documentation**

### **Available Documentation**
- **`ARCHITECTURE_OVERVIEW.md`** - System architecture and design
- **`DIRECTOR_PRESENTATION.md`** - Executive-level overview
- **`DEMO_SCRIPTS.md`** - Demonstration and testing scripts
- **`STUDENT_ADDITION_GUIDE.md`** - Quick guide for adding students
- **`LIVE_DATABASE_INTEGRATION.md`** - Database setup and migration

### **API Documentation**
- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **Redoc Interface**: http://localhost:8000/redoc

### **Code Documentation**
```bash
# Generate frontend documentation
npm run docs

# Generate backend documentation
cd backend && python -m pydoc -b
```

---

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork repository** and create feature branch
2. **Follow coding standards** (ESLint for JS, Black for Python)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit pull request** with clear description

### **Code Standards**
- **JavaScript**: ESLint configuration with React best practices
- **Python**: PEP 8 compliance with Black formatting
- **SQL**: Consistent naming conventions and indexing
- **Git**: Conventional commit messages

### **Testing Requirements**
- **Unit tests** for all business logic
- **Integration tests** for API endpoints
- **End-to-end tests** for critical user workflows
- **Performance tests** for database queries

---

## 📄 **License & Support**

### **License**
This project is developed for York University and is subject to university policies and intellectual property guidelines.

### **Support**
- **Technical Issues**: Contact development team
- **Feature Requests**: Submit through project management system
- **Documentation**: Check existing docs or request updates
- **Training**: Available for staff and administrators

### **Maintenance**
- **Regular Updates**: Dependencies and security patches
- **Feature Enhancements**: Based on user feedback and requirements
- **Performance Optimization**: Ongoing monitoring and improvements
- **Data Backup**: Automated daily backups with retention policy

---

## 🔮 **Future Roadmap**

### **Phase 2 Features**
- 🔐 **York SSO Integration**: Single sign-on authentication
- 📱 **Mobile Applications**: Native iOS/Android apps
- 🔔 **Automated Notifications**: Email/SMS alert system
- 📊 **Advanced Analytics**: Predictive modeling and AI insights

### **Phase 3 Enhancements**
- 🔗 **SIS Integration**: Direct Student Information System connection
- 🤖 **AI/ML Features**: Predictive analytics for at-risk students
- 📈 **Business Intelligence**: Comprehensive reporting suite
- 🌐 **Multi-Campus Support**: Expand to all York locations

---

## 📞 **Contact Information**

**Project Team**
- **Lead Developer**: [Your Name]
- **Technical Contact**: [Email]
- **Project Manager**: [Manager Name]
- **Director Sponsor**: [Director Name]

**Quick Links**
- 🌐 **Dashboard**: http://localhost:3000
- 📖 **API Docs**: http://localhost:8000/docs
- 📊 **Database**: MySQL Workbench connection
- 📚 **Documentation**: See docs/ directory

---

*Built with ❤️ for York University student success*

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
