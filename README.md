# 💻 Laptop Library Management System

A web-based **Laptop Library Management System** designed to provide affordable access to laptops for students who may not have their own devices.

The system allows students to register, view available laptops, request/borrow a laptop, and track their borrowing period. Administrators can manage laptops, students, borrowing records, returns, and maintenance.

---

## 📌 Problem Statement

Many students, especially those living in hostels or coming from financially constrained backgrounds, may not be able to afford a personal laptop.

Lack of access to a laptop can make it difficult to:

- Attend online classes
- Complete assignments
- Practice programming
- Work on academic projects
- Develop technical skills outside laboratory hours

The Laptop Library provides a shared and organized system where students can borrow available laptops for academic purposes.

---

## 🎯 Objectives

- Provide affordable access to laptops for students.
- Promote digital equality among students.
- Encourage programming and technical skill development.
- Reuse donated or refurbished laptops.
- Maintain organized laptop issue and return records.
- Track laptop availability and maintenance.
- Provide a simple web-based management system.

---

## 🚀 Features

### 👨‍🎓 Student

- Student registration
- Student login
- View available laptops
- Request a laptop
- View currently borrowed laptop
- Track return deadline
- View borrowing history
- View laptop details

### 👨‍💼 Admin

- Admin login
- Dashboard
- Add laptops
- Update laptop information
- View laptop availability
- Issue laptops
- Process laptop returns
- View overdue laptops
- Manage students
- Track maintenance
- View borrowing history
- Generate reports

---

## ⏳ Borrowing System

Each student can have **only one active laptop** at a time.

A laptop is issued for exactly **3 days from the date and time of issue**.

### Example

If a laptop is issued on:

**21 September, 10:30 AM**

The return deadline will be:

**24 September, 10:30 AM**

The system records the exact issue time and calculates the return deadline automatically.

### Laptop Status

- `AVAILABLE`
- `ISSUED`
- `MAINTENANCE`
- `INACTIVE`

### Borrowing Status

- `ACTIVE`
- `RETURNED`
- `OVERDUE`
- `CANCELLED`

---

## 🏗️ System Architecture

```text
Student / Admin
       │
       ▼
   Web Interface
       │
       ▼
 React Frontend
       │
       ▼
 Node.js + Express Backend
       │
       ▼
     MySQL
       │
       ├── Students
       ├── Users
       ├── Laptops
       ├── Borrowings
       └── Maintenance
