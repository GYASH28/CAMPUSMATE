# CampusMate - Smart College Companion

CampusMate is a premium React + Firebase campus platform for students, class representatives, teachers, coordinators, and admins. It brings timetable, official attendance, notes, assignments, notices, exams, AI learning, quizzes, reminders, progress, reports, complaints, contributions, and internal marks into one complete academic workspace.

## Roles

- Student: view timetable, official attendance, notes, assignments, notices, exams, AI assistant, quizzes, study planner, reminders, progress, complaints, contributions, and internal marks.
- Class Representative: student features plus class students and official attendance marking for their assigned class.
- Teacher: assigned subjects, official attendance sheet, notes, assignments, quizzes, student progress, internal marks, notices, and profile.
- Coordinator / HOD: teachers, students, CR assignment, attendance, timetable, notices, reports, and profile for assigned classes or department.
- Admin: full control over users, coordinators, teachers, CRs, subjects, timetable, notes, assignments, notices, exams, quizzes, attendance, analytics, complaints, contributions, internal marks, invite codes, and demo data seeding.

## Feature List

- Firebase Authentication with Email/Password and GitHub provider support
- Role-based protected routes for student, CR, teacher, coordinator, and admin
- Public signup is student-only; elevated roles require admin/coordinator approval or a one-time invite code
- Roll number support for students and CRs, validated as exactly 6 digits
- Logical account disabling through `users.status`
- Official attendance sheet controlled by teacher, CR, coordinator, or admin
- Firestore academic collections for users, subjects, timetable, attendance, notes, assignments, notices, exams, quizzes, reminders, study plans, and AI history
- Secure AI endpoint at `POST /api/ai` using server-side `GEMINI_API_KEY`
- In-app notifications with unread badge, dropdown, notification center, and mark-as-read
- PWA manifest, service worker, offline fallback, app icon, and install prompt
- PDF/CSV exports for student, teacher, coordinator, and admin reporting
- Admin analytics with Recharts
- Complaint and maintenance tracker
- Student notes contribution approval system
- Internal marks module
- Firebase Storage uploads for notes, assignments, complaints, and contributions
- Demo data seeding for Computer Engineering & IoT, Semester 2, Division A
- Premium dark futuristic UI with glass cards, responsive layouts, Framer Motion animations, Lucide icons, and custom feature artwork

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router DOM
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Gemini API through Vercel serverless function
- Framer Motion
- Lucide React
- Recharts
- jsPDF
- html2canvas

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Add Firebase web app values and Gemini key:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

4. Run locally:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Firebase Setup

1. Create a Firebase project.
2. Add a Web App and copy the Firebase web config into `.env`.
3. Enable Authentication providers:
   - Email/Password
   - GitHub
4. Create Firestore.
5. Create Firebase Storage.
6. Sign up with your first account.
7. Manually set your first admin user role in Firestore, then use Admin User Management for future coordinator, teacher, and CR invites.
8. Use Admin Dashboard -> `Seed Demo Data`.

Demo data targets:

- Branch: Computer Engineering & IoT
- Semester: 2
- Division: A
- Student roll numbers: 254101 to 254110

## Firestore Collections

- `users`
- `subjects`
- `timetable`
- `teacherAssignments`
- `classRepresentatives`
- `attendanceSessions`
- `attendanceRecords`
- `attendanceSummary`
- `notes`
- `assignments`
- `assignmentStatus`
- `notices`
- `exams`
- `aiHistory`
- `quizQuestions`
- `quizResults`
- `noteSummaries`
- `studyPlans`
- `reminders`
- `notifications`
- `inviteCodes`
- `complaints`
- `contributions`
- `internalMarks`

## Official Attendance

CampusMate uses a simple teacher-controlled attendance sheet:

1. Authorized user opens Attendance.
2. Selects branch, semester, division, subject, date, and lecture/period.
3. App loads students and CRs sorted by roll number.
4. Authorized user marks Present, Absent, Late, or Excused.
5. Save creates an `attendanceSessions` document and deterministic `attendanceRecords`.
6. `attendanceSummary` updates immediately.
7. Students can view official percentage and date-wise history, but cannot edit official attendance.

Who can take attendance:

- Admin
- Coordinator / HOD
- Teacher for assigned subjects/classes
- CR for their own class

Students can view attendance only.

## Vercel Deployment

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Use the Vite framework preset.
4. Add all Firebase `VITE_FIREBASE_*` variables.
5. Add server-side `GEMINI_API_KEY`.
6. Deploy.

The `api/ai.js` serverless function handles Gemini requests. The React Router rewrite in `vercel.json` keeps deep links working.

## Security Notes

- Do not commit Firebase Admin SDK JSON files.
- Do not expose `GEMINI_API_KEY` as a `VITE_` variable.
- Public signup always creates student accounts.
- GitHub signup defaults to student access.
- Elevated invite codes are stored in `inviteCodes`, can be used once, and can be tied to an approved email.
- Enforce role checks in Firestore rules for production.
- Students should only access their own data.
- CRs should only mark attendance for their own class.
- Teachers should only manage assigned subjects/classes.
- Coordinators should only manage assigned classes or departments.
- Admins can manage campus-wide data.
- Contributions must remain pending until approval.
- File uploads should be restricted by type and size in production Storage rules.

## How to Demo CampusMate

1. Log in as admin.
2. Open Admin Dashboard and click `Seed Demo Data`.
3. Review seeded users, subjects, timetable, notes, assignments, exams, quiz questions, reminders, attendance, and internal marks for Computer Engineering & IoT, Semester 2, Division A.
4. Assign or invite coordinator, teacher, and CR roles from User Management.
5. Log in as teacher, coordinator, or CR and save attendance from the official sheet.
6. Log in as a student in the same class to view official attendance, timetable, notes, assignments, notices, exams, AI learning, quizzes, reminders, complaints, contributions, and internal marks.
7. Export reports and test mobile layout, notifications, PWA install prompt, and offline fallback.

## Stabilization Notes

- Auth creates and repairs `users/{uid}` profiles before routing.
- Public signup no longer exposes role selection.
- Dashboard routing supports `student`, `cr`, `teacher`, `coordinator`, and `admin`.
- Demo users are written to stable Firestore document IDs.
- Student academic data is filtered by branch, semester, and division.
- Official attendance percentage is calculated from `attendanceSummary`.
- Uploads are validated by file type and 10 MB size limit before Firebase Storage upload.
- Topbar search is a real page navigator.

## Future Scope

- Native mobile app
- Biometric attendance
- Parent portal
- Payment/fees module
- Library management
- Placement portal
- Richer push notifications through Firebase Cloud Messaging

## Project Structure

```text
api/
  ai.js
  _aiCore.js
public/
  manifest.webmanifest
  offline.html
  sw.js
src/
  components/
    animations/
    common/
    dashboard/
    layout/
  context/
  firebase/
  hooks/
  pages/
    admin/
    coordinator/
    cr/
    public/
    shared/
    student/
    teacher/
  utils/
```

## Service Account Safety

Firebase Admin SDK JSON files contain private keys. Do not add them to the React app, commit them to GitHub, or expose them in Vercel frontend variables. This app only needs Firebase Web App config in `VITE_FIREBASE_*` variables.
