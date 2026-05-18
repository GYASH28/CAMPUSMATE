export const PRODUCT_MESSAGE =
  'CampusMate brings timetable, attendance, notes, assignments, notices, exams, progress, and campus workflows into one complete academic workspace.';

export const PRODUCT_MODULES = [
  {
    label: 'Academic workspace',
    title: 'Everything students need daily',
    text: 'Timetable, attendance, notes, assignments, notices, exams, profile, and admin management.',
  },
  {
    label: 'Smart learning',
    title: 'AI-powered preparation',
    text: 'AI Assistant, quizzes, study planner, reminders, progress, and weak topic detection.',
  },
  {
    label: 'Campus operations',
    title: 'Tools for real departments',
    text: 'Role-based access, official attendance, notifications, PWA, reports, analytics, complaints, contributions, and internal marks.',
  },
];

export const ROLES = ['student', 'cr', 'teacher', 'coordinator', 'admin'];
export const STUDENT_ROLES = ['student', 'cr'];
export const ATTENDANCE_TAKER_ROLES = ['cr', 'teacher', 'coordinator', 'admin'];
export const ROLL_NUMBER_PATTERN = '^[0-9]{6}$';

export const BRANCHES = [
  'Computer Engineering & IoT',
  'Computer Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
];

export const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics',
  'Science & Humanities',
  'Administration',
];

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const DIVISIONS = ['A', 'B', 'C'];

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

export const NOTICE_CATEGORIES = [
  'General',
  'Exam',
  'Event',
  'Important',
  'Holiday',
];

export const COMPLAINT_CATEGORIES = [
  'Classroom',
  'Lab',
  'Internet',
  'Washroom',
  'Library',
  'Cleanliness',
  'Electrical',
  'Other',
];

export const COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
export const PRIORITIES = ['Low', 'Medium', 'High'];

export const CONTRIBUTION_TYPES = [
  'Notes',
  'Question Paper',
  'Assignment Solution',
  'Viva Questions',
  'Other',
];

export const CONTRIBUTION_STATUSES = ['Pending approval', 'Approved', 'Rejected'];

export const NOTIFICATION_TYPES = [
  'assignment',
  'exam',
  'notice',
  'attendance',
  'quiz',
  'study-plan',
  'complaint',
  'system',
];

export const SAMPLE_BRANCH = 'Computer Engineering & IoT';
export const SAMPLE_SEMESTER = '2';
export const SAMPLE_DIVISION = 'A';
export const SAMPLE_DEPARTMENT = 'Computer Engineering';

export const DEFAULT_PROFILE = {
  branch: SAMPLE_BRANCH,
  semester: SAMPLE_SEMESTER,
  division: SAMPLE_DIVISION,
  department: SAMPLE_DEPARTMENT,
  assignedSubjects: [],
  status: 'active',
};

export const AI_MODES = [
  { value: 'explain-topic', label: 'Explain Topic' },
  { value: 'viva', label: 'Generate Viva Questions' },
  { value: 'mcq', label: 'Create MCQs' },
  { value: 'study-plan', label: 'Make Study Plan' },
  { value: 'summarize-notes', label: 'Summarize Notes' },
];

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const QUIZ_UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

export const REMINDER_TYPES = [
  'Assignment due',
  'Exam coming',
  'Attendance warning',
  'Study plan task',
  'Custom reminder',
];

export const SESSION_DURATIONS = [
  { label: '2 minutes', value: 2 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
];
