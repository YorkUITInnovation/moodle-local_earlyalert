# York University Early Alert Analytics Dashboard - Data Documentation

This document provides a comprehensive overview of the data structure used in the Early Alert Analytics Dashboard system.

## Table of Contents
- [Alert Types](#alert-types)
- [Alert Features](#alert-features)
- [User Roles](#user-roles)
- [Data Attributes & Reporting](#data-attributes--reporting)
- [Student Information System (SIS) Data](#student-information-system-sis-data)
- [Learning Management System (LMS) Data](#learning-management-system-lms-data)
- [Course & Grade Data](#course--grade-data)
- [CRM Data](#crm-data)

---

## Alert Types

The system supports the following types of early alerts:

### 1. Grades
- **Examples**: Fall, Winter, Year
- **System Default**: D+ (55-59) with optional change button for professors
- **Routing**: Based on student's campus, home faculty, and course-specific supports
- **Automatic Communication**: ✅ Yes
- **Visible to Instructors**: ✅ Yes

### 2. Missed Exam
- **Routing**: Based on student's campus, home faculty, and course-specific supports
- **Automatic Communication**: ✅ Yes
- **Visible to Instructors**: ✅ Yes

### 3. Major Assignment
- **Routing**: Based on student's campus, home faculty, and course-specific supports
- **Automatic Communication**: ✅ Yes
- **Visible to Instructors**: ✅ Yes

### 4. Behavioural (FS)
- **Routing**: Based on student's campus, home faculty, and course-specific supports
- **Automatic Communication**: ❌ No
- **Visible to Instructors**: ✅ Yes

### 5. Academic Integrity (Graduate) (FS)
- **Routing**: Based on student's campus, home faculty, and course-specific supports
- **Automatic Communication**: ❌ No
- **Visible to Instructors**: ✅ Yes

---

## Alert Features

### Core Features
- ✅ Dropdown menu definition
- ✅ Automatic communication dictation
- ✅ Notification routing
- ✅ Button for notification routing
- ✅ Admin add/edit alert types and rules
- ✅ Dropdown options with definitions

### Email Template Editing
- **Enabled**: May 1
- **Disabled**: September 15

### LDAP Integration
- ✅ Course list integration
- ✅ User identification

### Moodle Grades Integration
- ✅ Auto-tag elements for alerts
- ✅ Auto-dictate communication notifications
- ✅ Professors define passing grades for midterm reporting
- ✅ Professors see students below threshold in gradebook

### Automated Messages
- ✅ From gradebook
- ✅ From SIS grades

### Additional Features
- ✅ LMS log data for automated communications
- ✅ FS system data points for notifications
- ✅ Identify students with rapid grade drops
- ✅ Pull drop deadline dates from VDT

---

## User Roles

### Instructor
**Permissions:**
- ✅ Search, view, and raise alerts for students in their courses
- ✅ Enter major assignment names
- ✅ Bulk select students to send messages
- ✅ View sample messages
- ✅ View follow-up initiated status
- ✅ Indicate supports initiated
- ✅ Request automatic messaging from gradebook

### Advisor
**Permissions:**
- ✅ Search and view all students to identify alerts
- ✅ Easily identify students with multiple alerts
- ✅ Indicate supports initiated
- ✅ View follow-up initiated status
- ✅ Run reports for own home faculties
- ✅ FS: Search and view all students with self-reported absences
- ✅ FS: Easily identify students with multiple absences
- ✅ FS: Run absence reports for own home faculties

### Designate
**Permissions:**
- ✅ Send messages on behalf of faculty members

### Director (Partner Units, OIPA, YI, etc.)
**Permissions:**
- ✅ Search and view all students across all faculties
- ✅ Run reports across all faculties
- ✅ Admin functions for partner units

### Administrator
**Permissions:**
- ✅ Full system access
- ✅ Configure alert types and routing rules
- ✅ Manage user roles and permissions
- ✅ Access all reporting functions

### OSCR (Office of Student Community Relations)
**Permissions:**
- ✅ Search and view students with behavioral/mental health flags
- ✅ Access counseling and wellness data points
- ✅ Coordinate with academic support services

---

## Data Attributes & Reporting

### Data Sources
- **SIS** (Student Information System)
- **LMS** (Learning Management System)
- **CRM** (Customer Relationship Management)

### Capabilities
- ✅ Support system functions
- ✅ Customize messages to students
- ✅ Add/update data points in later phases
- ✅ Generate reports based on attributes
- ✅ Export reports to Excel
- ✅ FS: Integrate with PowerBI

---

## Student Information System (SIS) Data

### Student Demographics & Academic Information

| Field | Description | Example |
|-------|-------------|---------|
| **SISID** | Student ID | 100100001 |
| **Firstname** | First name | Liam |
| **Lastname** | Last name | Smith |
| **Home Faculty** | Student's primary faculty | Engineering, Arts, Science, Business, etc. |
| **Campus** | Campus location | Main, Satellite |
| **Program** | Degree program | BENG Computer Engineering |
| **Acadqual** | Academic qualification | BENG, BA, BSc, etc. |
| **Major 1** | Primary major | CENG, ENGL, MATH, etc. |
| **Major 2** | Secondary major (if applicable) | HIST, PSYC, etc. |
| **Email** | Student email | student@univ.edu |
| **Immstat** | Immigration status | Domestic, International |
| **Study level** | Academic level | Undergraduate, Graduate |
| **Language of correspondence** | Preferred language | EN, FR |

### Financial & Support Flags

| Field | Description | Values |
|-------|-------------|--------|
| **OSAP Y/N flag** | Ontario Student Assistance Program | Y/N |
| **Varsity flag** | Varsity athlete status | Y/N |
| **ESL flag** | English as Second Language | Y/N |
| **Scholarship flag** | Scholarship recipient | Y/N |

### Academic Standing

| Field | Description | Example |
|-------|-------------|---------|
| **OGPA** | Overall Grade Point Average | 3.8 |
| **Academic Decision** | Current academic standing | Good Standing, Probation, Academic Warning |
| **Academic Status** | Enrollment status | Active, Inactive, Withdrawn |
| **Drop effective date** | Course drop date | 2024-02-15 |
| **Assigned Grade** | Final course grade | A+, B, C+, etc. |

### Sample Student Records

#### Student 1: Liam Smith
- **ID**: 100100001
- **Faculty**: Engineering
- **Program**: BENG Computer Engineering
- **OGPA**: 3.8
- **Status**: Domestic, Good Standing
- **Flags**: OSAP ✅, Scholarship ✅

#### Student 2: Olivia Johnson
- **ID**: 100100002
- **Faculty**: Arts
- **Program**: BA (Hons) English Literature
- **OGPA**: 3.2
- **Status**: Domestic, Good Standing
- **Flags**: OSAP ✅

---

## Learning Management System (LMS) Data

### Course Engagement Metrics
- Login frequency and duration
- Assignment submission rates
- Discussion forum participation
- Video lecture viewing completion
- Quiz/assessment attempts and scores

### Early Warning Indicators
- Days since last login
- Missing assignment submissions
- Below-threshold quiz scores
- Decreased engagement patterns
- Late submission trends

---

## Course & Grade Data

### Academic Performance Tracking
- **Midterm grades** with alert thresholds
- **Assignment scores** and submission status
- **Attendance records** and absence patterns
- **Grade trends** over time
- **Course completion rates**

### Alert Triggers
- Grades below D+ (55-59%)
- Missing major assignments
- Excessive absences
- Rapid grade decline
- Failed exams

---

## CRM Data

### Student Support Services
- **Counseling services** usage and history
- **Academic support** program participation
- **Financial aid** application status
- **Career services** engagement
- **Health and wellness** service utilization

### Communication History
- **Email interactions** with faculty and staff
- **Appointment scheduling** and attendance
- **Support service referrals**
- **Follow-up activities** and outcomes

---

## Data Privacy & Security

### Compliance
- ✅ FIPPA (Freedom of Information and Protection of Privacy Act) compliant
- ✅ Role-based access controls
- ✅ Audit trails for all data access
- ✅ Secure data transmission and storage

### Data Retention
- **Student records**: Maintained per institutional policy
- **Alert history**: 7 years retention
- **Communication logs**: 3 years retention
- **Analytics data**: Aggregated and anonymized after 1 year

---

## System Integration

### Connected Systems
1. **SIS** - Student Information System
2. **LMS** - Moodle Learning Management System
3. **CRM** - Customer Relationship Management
4. **Email** - Automated communication system
5. **PowerBI** - Advanced analytics and reporting
6. **LDAP** - User authentication and course lists

### Data Flow
1. **Real-time sync** from SIS for student demographics
2. **Daily sync** from LMS for engagement metrics
3. **Weekly sync** from CRM for support services data
4. **Automated alerts** triggered by predefined thresholds
5. **Manual alerts** created by faculty and staff

---

*Last Updated: June 30, 2025*
*Total Student Records: 100 active students*
*System Version: Early Alert Analytics Dashboard v1.0*
