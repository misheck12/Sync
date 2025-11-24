# UI Wireframes (Phase 1)

## 1. Login Screen
**Goal**: Simple, secure entry point.

```
+-------------------------------------------------------+
|  [ Logo: Sync School System ]                         |
|                                                       |
|           Sign In to Your Account                     |
|                                                       |
|  Email / Phone: [_____________________________]       |
|                                                       |
|  Password:      [_____________________________]       |
|                                                       |
|           [  LOGIN  ]                                 |
|                                                       |
|  Forgot Password? | Contact Support                   |
+-------------------------------------------------------+
```

---

## 2. Admin/Bursar Dashboard
**Goal**: Immediate visibility of financial health and daily stats.

```
+-------------------------------------------------------+
| [Menu]  Sync System              User: Mr. Banda (Admin)|
+-------------------------------------------------------+
|                                                       |
|  TODAY'S COLLECTION       OUTSTANDING FEES            |
|  [ ZMW 4,500 ]            [ ZMW 125,000 ]             |
|  (↑ 15% vs yesterday)     (350 Students owing)        |
|                                                       |
|  ATTENDANCE TODAY         ACTIVE STUDENTS             |
|  [ 92% Present ]          [ 450 Total ]               |
|                                                       |
+-------------------------------------------------------+
|  QUICK ACTIONS                                        |
|  [+ New Student]  [+ Record Payment]  [View Debtors]  |
+-------------------------------------------------------+
|  RECENT PAYMENTS                                      |
|  1. John Doe (Gr 8) - ZMW 500 - Cash - 10:30 AM       |
|  2. Mary Jane (Gr 9) - ZMW 1000 - MTN - 10:15 AM      |
|  3. Peter Pan (Gr 10) - ZMW 200 - Bank - 09:00 AM     |
|  [View All Transactions]                              |
+-------------------------------------------------------+
```

---

## 3. Student Profile & Payment
**Goal**: View student details and record a payment in one place.

```
+-------------------------------------------------------+
| < Back to Search                                      |
|                                                       |
|  STUDENT: JOHN BANDA (ID: 2025-001)                   |
|  Class: 8A | Status: Active | Guardian: 0977-123456   |
|                                                       |
|  +-------------------+   +-------------------------+  |
|  | FINANCIAL STATUS  |   | RECORD NEW PAYMENT      |  |
|  |                   |   |                         |  |
|  | Total Billed:     |   | Amount: [ ZMW _____ ]   |  |
|  | ZMW 5,000         |   |                         |  |
|  |                   |   | Method:                 |  |
|  | Total Paid:       |   | (o) Cash ( ) Mobile     |  |
|  | ZMW 2,000         |   | ( ) Bank                |  |
|  |                   |   |                         |  |
|  | BALANCE DUE:      |   | Ref #: [ ____________ ] |  |
|  | [ ZMW 3,000 ]     |   |                         |  |
|  | (Status: PARTIAL) |   | [ CONFIRM PAYMENT ]     |  |
|  +-------------------+   +-------------------------+  |
|                                                       |
|  PAYMENT HISTORY                                      |
|  - 01 Jan: ZMW 1,000 (Tuition Term 1)                 |
|  - 15 Feb: ZMW 1,000 (Tuition Term 1)                 |
+-------------------------------------------------------+
```

---

## 4. Teacher Attendance View (Mobile Optimized)
**Goal**: Fast, one-handed operation for teachers in class.

```
+-----------------------------------+
|  [<] Class 8A - Attendance        |
|  Date: 19 Nov 2025                |
+-----------------------------------+
|  Mark All Present [X]             |
+-----------------------------------+
|  1. Banda, John                   |
|     (o) Present  ( ) Absent       |
|     ( ) Late                      |
+-----------------------------------+
|  2. Chanda, Mary                  |
|     ( ) Present  (o) Absent       |
|     ( ) Late                      |
+-----------------------------------+
|  3. Phiri, Peter                  |
|     (o) Present  ( ) Absent       |
|     ( ) Late                      |
+-----------------------------------+
|  ... (List continues)             |
+-----------------------------------+
|         [ SUBMIT REGISTER ]       |
+-----------------------------------+
```

---

## 5. Debtors List (Financial Report)
**Goal**: Identify who to follow up with.

```
+-------------------------------------------------------+
|  DEBTORS LIST (Term 1 2025)                           |
|  Filter: [ All Grades v ]  Sort: [ Highest Debt v ]   |
+-------------------------------------------------------+
|  Name           | Class | Guardian #  | Balance       |
+-------------------------------------------------------+
|  1. Zulu, A.    | 9B    | 0966-11...  | ZMW 5,000 [!] |
|  2. Mumba, C.   | 8A    | 0977-22...  | ZMW 4,500 [!] |
|  3. Tembo, D.   | 10C   | 0955-33...  | ZMW 1,200 [!] |
|  4. Lungu, E.   | 8A    | 0977-44...  | ZMW   500 [ ] |
+-------------------------------------------------------+
|  [ Export to PDF ]  [ Send SMS Reminders ]            |
+-------------------------------------------------------+
```
