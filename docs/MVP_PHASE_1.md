# Phase 1 MVP: Core Operations & Financial Recovery

**Timeline**: Weeks 1–4  
**Primary Goal**: Stop revenue leakage and digitize student records.  
**Key Value**: Immediate financial visibility and secure student data.

---

## 1. User Roles & Permissions (Phase 1)

| Role | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | School Owner / Head | Full access, system config, user management, financial oversight. |
| **Bursar** | Finance Officer | Record payments, manage fee structures, view financial reports. |
| **Teacher** | Class Teacher | View student profiles, mark attendance, view class lists. |
| **Secretary** | Admin Staff | Register students, update profiles, manage class assignments. |

*(Note: Parent access is scheduled for Phase 2)*

---

## 2. Epics & User Stories

### Epic 1: Student Lifecycle Management
**Goal**: Create a single source of truth for all student data.

| ID | Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **STU-01** | As a **Secretary**, I want to **register a new student** so that they are in the system. | - Form captures: Name, DOB, Gender, Guardian Name, Phone, Address.<br>- System generates unique Student ID.<br>- Student is assigned to a status (Active). | **High** |
| **STU-02** | As a **Secretary**, I want to **assign a student to a class** so they appear on registers. | - Dropdown to select Grade (e.g., Grade 8) and Class (e.g., 8A).<br>- History of class movements is stored. | **High** |
| **STU-03** | As a **Teacher**, I want to **view my class list** so I know who is in my class. | - List shows Name, Student ID, Guardian Phone.<br>- Filterable by Grade and Class. | **Med** |
| **STU-04** | As an **Admin**, I want to **bulk upload students** via CSV so we can onboard quickly. | - CSV template provided.<br>- Validation for required fields.<br>- Error report for failed rows. | **High** |

### Epic 2: Financial Management (Revenue Recovery)
**Goal**: Track every kwacha and identify unpaid fees immediately.

| ID | Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **FIN-01** | As a **Bursar**, I want to **define fee structures** for different grades. | - Set amounts for Tuition, PTA, Exam fees.<br>- Assign fees to specific Grades or Terms. | **High** |
| **FIN-02** | As a **Bursar**, I want to **record a payment** against a student. | - Input: Student ID, Amount, Date, Payment Method (Cash/Mobile/Bank), Reference #.<br>- System calculates remaining balance immediately. | **High** |
| **FIN-03** | As a **School Owner**, I want to **view the Debtors List** to see who owes money. | - List of students with `Balance > 0`.<br>- Sort by Amount Owed (High to Low).<br>- Color-coded (Red = Critical, Yellow = Warning). | **High** |
| **FIN-04** | As a **Bursar**, I want to **generate a payment receipt** to give to the parent. | - PDF generation or printable view.<br>- Includes School Logo, Student Details, Amount Paid, Balance Remaining. | **Med** |
| **FIN-05** | As a **School Owner**, I want a **Daily Collection Report** to reconcile cash. | - Total collected today broken down by User (Bursar) and Method (Cash/Mobile). | **High** |

### Epic 3: Basic Attendance
**Goal**: Replace paper registers and track daily presence.

| ID | Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **ATT-01** | As a **Teacher**, I want to **mark daily attendance** for my class. | - List of students with "Present", "Absent", "Late" toggles.<br>- Default is "Present" to save clicks.<br>- "Submit" button locks the register for the session. | **High** |
| **ATT-02** | As an **Admin**, I want to **view attendance stats** for the whole school. | - Dashboard widget: % Present Today.<br>- Drill down by Grade. | **Med** |

### Epic 4: System Configuration
**Goal**: Set up the school environment.

| ID | Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **SYS-01** | As an **Admin**, I want to **configure school details** (Name, Logo, Address). | - Details appear on reports and receipts. | **High** |
| **SYS-02** | As an **Admin**, I want to **manage academic terms** (Term 1, Term 2, Term 3). | - Set Start Date and End Date.<br>- Set "Current Active Term". | **High** |
| **SYS-03** | As an **Admin**, I want to **create staff accounts** and assign roles. | - Create User (Email/Phone, Password, Role).<br>- Role determines menu access. | **High** |

---

## 3. Non-Functional Requirements (Phase 1)

1.  **Mobile Responsiveness**: The web app must be fully functional on a standard smartphone (Android/Chrome) for Teachers and Bursars.
2.  **Offline Resilience**: Forms should not crash if internet drops; basic caching for "Submit later" (stretch goal for Phase 1, essential for Phase 2).
3.  **Speed**: Student search must return results in < 2 seconds.
4.  **Security**: All passwords hashed (bcrypt). HTTPS enforced. Role-based access control (RBAC) strictly enforced (Teachers cannot see financial totals).

---

## 4. Out of Scope for Phase 1

*   Parent Portal / Login (Phase 2).
*   Automated SMS/WhatsApp Reminders (Phase 2).
*   Gradebook & Report Cards (Phase 2).
*   Online Payments Integration (Phase 3).
*   Inventory Management.
*   Library Management.
