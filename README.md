<div align="center">

# 🎓 CampusMate

### A smart college companion for students, teachers, CRs, coordinators, and administrators

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=111827)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#progressive-web-app)

</div>

## Overview

**CampusMate** is a multi-role college management and student-productivity platform designed to bring everyday academic workflows into one modern application.

Instead of making students and faculty jump between attendance sheets, messages, timetables, notices, assignments, and disconnected portals, CampusMate provides a single responsive workspace with role-based dashboards and real-time Firebase data.

> **Status:** Active development and product exploration.

## Product Highlights

- Unified student, teacher, CR, coordinator/HOD, and admin experiences
- Official subject-wise attendance tracking and analytics
- Timetables, notices, assignments, notes, exams, and reminders
- Role-based permissions and dedicated dashboards
- Academic progress charts and report-ready data
- AI-assisted study and productivity workflows
- Responsive, installable Progressive Web App experience
- Modern dark interface with motion and dashboard visualizations

## Role-Based Experience

| Role | Core capabilities |
|---|---|
| **Student** | View attendance, timetable, notes, assignments, notices, exams, quizzes, reminders, and progress |
| **Teacher** | Take attendance, manage classes, upload academic content, create quizzes, and review student performance |
| **Class Representative** | Support assigned-class attendance and communication while retaining student access |
| **Coordinator / HOD** | Assign academic responsibilities, monitor classes, publish notices, and review department analytics |
| **Admin** | Manage users, roles, subjects, timetables, reports, platform data, and demo setup |

## Core Modules

### Attendance

Authorized roles can mark students present or absent, while students can review subject-wise percentages, history, and attendance risk.

### Academic Workspace

CampusMate brings together:

- Timetables
- Notes and study materials
- Assignments and submissions
- Notices and announcements
- Exam schedules and countdowns
- Quizzes and academic reminders

### Analytics

Charts and progress views help users understand attendance, academic performance, and overall engagement without reading raw tables.

### AI Assistance

The product is designed to support topic explanations, study help, quiz assistance, and academic productivity workflows from inside the same dashboard.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS, responsive layouts, custom dashboard UI |
| Motion | Framer Motion |
| Backend services | Firebase Authentication, Cloud Firestore, Firebase Storage |
| Visualization | Recharts |
| Documents | jsPDF |
| QR workflows | html5-qrcode, qrcode.react |
| Icons | Lucide React |
| Quality | ESLint |

## Quick Start

### Prerequisites

- Node.js 20 or newer
- npm
- A Firebase project for authentication and application data

### Installation

```bash
git clone https://github.com/GYASH28/CAMPUSMATE.git
cd CAMPUSMATE
npm install
npm run dev
```

Open the local URL printed by Vite.

### Production Build

```bash
npm run build
npm run preview
```

### Code Quality

```bash
npm run lint
```

## Firebase Setup

Create a Firebase project and configure the application with your own Firebase web credentials. Never commit service-account credentials, private keys, or unrestricted secrets to the repository.

For a production deployment, configure appropriate Firestore and Storage security rules for every user role.

## Progressive Web App

CampusMate is designed to work as an installable web app, allowing users to add it to a phone or desktop home screen while keeping a responsive browser experience.

## Design Direction

- Futuristic dark visual language
- Glass-inspired cards and layered surfaces
- Blue and purple accent gradients
- Smooth transitions and feedback states
- Mobile-first dashboard adaptation
- Clear role and status communication

## Product Vision

CampusMate aims to become a practical digital layer for college life: simple enough for daily attendance and notices, but powerful enough to support analytics, academic planning, AI assistance, and institution-wide workflows.

## License

This project is currently maintained as a personal product project. Please contact the repository owner before redistributing the full product or branding.
