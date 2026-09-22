# 💻 Laptop Library Management System

A web-based Laptop Library Management System designed to help educational institutions provide affordable access to laptops for students who may not have their own devices.

The system manages laptops, students, borrowing, returns, maintenance, and usage records through a centralized platform.

---

## 📌 Project Overview

Many students, especially hostel students, may face difficulty accessing laptops for online classes, assignments, programming practice, and other academic activities.

The Laptop Library Management System provides a structured solution where students can borrow available laptops for academic purposes for a fixed period of **3 days**.

The system allows administrators to manage laptops and students while keeping track of borrowing, return, maintenance, and laptop status.

---

## 🎯 Objectives

- Provide affordable access to laptops for students.
- Support students who cannot afford a personal laptop.
- Encourage programming and technical skill development.
- Promote reuse of donated and refurbished laptops.
- Maintain digital records of laptop usage.
- Simplify laptop issue and return management.
- Track laptop maintenance and condition.
- Reduce manual record keeping.

---

## ✨ Main Features

### 👨‍💼 Admin

- Admin login
- Admin dashboard
- View all laptops
- Add new laptops
- Edit laptop details
- Deactivate laptops
- View laptop status
- View laptop summary
- Manage students
- Issue laptops
- Process laptop returns
- Track overdue laptops
- Manage maintenance records
- View borrowing history
- Generate reports

### 👨‍🎓 Student

- Student registration/login
- Student dashboard
- View available laptops
- Request a laptop
- View currently borrowed laptop
- View return deadline
- Track borrowing status
- View borrowing history
- View notifications
- Manage profile

---

## 💻 Laptop Status

Each laptop can have one of the following statuses:

| Status | Meaning |
|---|---|
| `AVAILABLE` | Laptop can be issued |
| `ISSUED` | Currently borrowed by a student |
| `MAINTENANCE` | Under repair or maintenance |
| `INACTIVE` | No longer available for use |

---

## ⏱️ Borrowing System

The system uses a **3-day borrowing period**.

For example:

```text
Issue Date & Time : September 21, 10:30 AM
Return Deadline   : September 24, 10:30 AM
