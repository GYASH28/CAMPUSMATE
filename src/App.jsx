import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import CoordinatorLayout from './components/layout/CoordinatorLayout';
import CRLayout from './components/layout/CRLayout';
import StudentLayout from './components/layout/StudentLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import CompleteProfile from './pages/public/CompleteProfile';
import StudentDashboard from './pages/student/StudentDashboard';
import Timetable from './pages/student/Timetable';
import Attendance from './pages/student/Attendance';
import Notes from './pages/student/Notes';
import Assignments from './pages/student/Assignments';
import Notices from './pages/student/Notices';
import Exams from './pages/student/Exams';
import Profile from './pages/student/Profile';
import AiAssistant from './pages/student/AiAssistant';
import Quizzes from './pages/student/Quizzes';
import StudyPlanner from './pages/student/StudyPlanner';
import Progress from './pages/student/Progress';
import Reminders from './pages/student/Reminders';
import Complaints from './pages/student/Complaints';
import Contributions from './pages/student/Contributions';
import InternalMarks from './pages/student/InternalMarks';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageNotes from './pages/admin/ManageNotes';
import ManageAssignments from './pages/admin/ManageAssignments';
import ManageNotices from './pages/admin/ManageNotices';
import ManageExams from './pages/admin/ManageExams';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import ManageUsers from './pages/admin/ManageUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ManageComplaints from './pages/admin/ManageComplaints';
import ReviewContributions from './pages/admin/ReviewContributions';
import ManageInternalMarks from './pages/admin/ManageInternalMarks';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageAttendance from './pages/admin/ManageAttendance';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSubjects from './pages/teacher/TeacherSubjects';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherNotes from './pages/teacher/TeacherNotes';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherProgress from './pages/teacher/TeacherProgress';
import TeacherNotices from './pages/teacher/TeacherNotices';
import TeacherProfile from './pages/teacher/TeacherProfile';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorTeachers from './pages/coordinator/CoordinatorTeachers';
import CoordinatorStudents from './pages/coordinator/CoordinatorStudents';
import CoordinatorAttendance from './pages/coordinator/CoordinatorAttendance';
import CoordinatorReports from './pages/coordinator/CoordinatorReports';
import CRDashboard from './pages/cr/CRDashboard';
import CRAttendance from './pages/cr/CRAttendance';
import CRClassStudents from './pages/cr/CRClassStudents';
import Notifications from './pages/shared/Notifications';
import Offline from './pages/shared/Offline';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        <Route element={<ProtectedRoute publicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="notes" element={<Notes />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="notices" element={<Notices />} />
            <Route path="exams" element={<Exams />} />
            <Route path="ai" element={<AiAssistant />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="study-planner" element={<StudyPlanner />} />
            <Route path="progress" element={<Progress />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="internal-marks" element={<InternalMarks />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['cr']} />}>
          <Route path="/cr" element={<CRLayout />}>
            <Route index element={<Navigate to="/cr/dashboard" replace />} />
            <Route path="dashboard" element={<CRDashboard />} />
            <Route path="class-students" element={<CRClassStudents />} />
            <Route path="attendance" element={<CRAttendance />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="notes" element={<Notes />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="notices" element={<Notices />} />
            <Route path="exams" element={<Exams />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="subjects" element={<TeacherSubjects />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="notes" element={<TeacherNotes />} />
            <Route path="quizzes" element={<TeacherQuizzes />} />
            <Route path="progress" element={<TeacherProgress />} />
            <Route path="notices" element={<TeacherNotices />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['coordinator']} />}>
          <Route path="/coordinator" element={<CoordinatorLayout />}>
            <Route index element={<Navigate to="/coordinator/dashboard" replace />} />
            <Route path="dashboard" element={<CoordinatorDashboard />} />
            <Route path="teachers" element={<CoordinatorTeachers />} />
            <Route path="students" element={<CoordinatorStudents />} />
            <Route path="attendance" element={<CoordinatorAttendance />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="notices" element={<TeacherNotices />} />
            <Route path="reports" element={<CoordinatorReports />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="subjects" element={<ManageSubjects />} />
            <Route path="timetable" element={<ManageTimetable />} />
            <Route path="notes" element={<ManageNotes />} />
            <Route path="assignments" element={<ManageAssignments />} />
            <Route path="notices" element={<ManageNotices />} />
            <Route path="exams" element={<ManageExams />} />
            <Route path="quizzes" element={<ManageQuizzes />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="complaints" element={<ManageComplaints />} />
            <Route path="contributions" element={<ReviewContributions />} />
            <Route path="internal-marks" element={<ManageInternalMarks />} />
            <Route path="teachers" element={<ManageTeachers />} />
            <Route path="attendance" element={<ManageAttendance />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student', 'cr', 'teacher', 'coordinator', 'admin']} />}>
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
