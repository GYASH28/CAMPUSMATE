import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, firebaseMissingMessage } from './config';
import { addDays } from '../utils/dateUtils';
import { summarizeAttendanceRecords } from '../utils/attendanceUtils';
import {
  SAMPLE_BRANCH,
  SAMPLE_DEPARTMENT,
  SAMPLE_DIVISION,
  SAMPLE_SEMESTER,
} from '../utils/constants';
import { devAuthError, devAuthLog, mapFirebaseError, normalizeRole } from '../utils/authUtils';

function requireDb() {
  if (!db) throw new Error(firebaseMissingMessage);
  return db;
}

export function friendlyFirebaseError(error) {
  devAuthError('Firestore operation failed.', error);
  return mapFirebaseError(error);
}

function timestampOrNow(value) {
  return value || serverTimestamp();
}

function buildUserProfile(uid, profile = {}) {
  const now = serverTimestamp();
  return {
    uid,
    name: profile.name || 'CampusMate User',
    email: profile.email || '',
    role: normalizeRole(profile.role),
    branch: profile.branch || 'Computer Engineering & IoT',
    semester: String(profile.semester || '2'),
    division: profile.division || 'A',
    rollNumber: profile.rollNumber || '',
    department: profile.department || 'Computer Engineering',
    assignedSubjects: profile.assignedSubjects || [],
    isCR: profile.isCR ?? normalizeRole(profile.role) === 'cr',
    assignedBy: profile.assignedBy || '',
    assignedAt: profile.assignedAt || null,
    provider: profile.provider || 'password',
    status: profile.status || 'active',
    profileComplete: profile.profileComplete ?? true,
    createdAt: timestampOrNow(profile.createdAt),
    updatedAt: now,
  };
}

export async function createUserProfile(uid, profile) {
  const instance = requireDb();
  const userProfile = buildUserProfile(uid, profile);
  await setDoc(doc(instance, 'users', uid), userProfile);
  return userProfile;
}

export async function getUserProfile(uid, { retry = true } = {}) {
  const instance = requireDb();
  try {
    const snapshot = await getDoc(doc(instance, 'users', uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    if (retry) {
      devAuthError('Profile fetch failed, retrying once.', error);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 500);
      });
      return getUserProfile(uid, { retry: false });
    }
    throw error;
  }
}

export async function updateUserProfile(uid, updates) {
  const instance = requireDb();
  const payload = {
    ...updates,
    ...(updates.role ? { role: normalizeRole(updates.role) } : {}),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(instance, 'users', uid), payload);
  return payload;
}

export function normalizeInviteCode(code = '') {
  return String(code).trim().toUpperCase();
}

export async function getAvailableInviteCode(code) {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return null;

  const instance = requireDb();
  const snapshot = await getDocs(
    query(collection(instance, 'inviteCodes'), where('code', '==', normalized), limit(1)),
  );

  if (snapshot.empty) {
    throw new Error('Invalid invite code.');
  }

  const invite = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  if (invite.used) {
    throw new Error('This invite code has already been used.');
  }

  const role = normalizeRole(invite.role);
  if (!['cr', 'teacher', 'coordinator', 'admin'].includes(role)) {
    throw new Error('This invite code is not valid for elevated access.');
  }

  return { ...invite, code: normalized, role };
}

export async function markInviteCodeUsed(inviteId, usedBy) {
  if (!inviteId || !usedBy) return;
  await updateDocument('inviteCodes', inviteId, {
    used: true,
    usedBy,
    usedAt: serverTimestamp(),
  });
}

export async function ensureUserProfile(user, options = {}) {
  if (!user?.uid) throw new Error('Missing authenticated user.');

  const {
    role = 'student',
    provider = user.providerData?.[0]?.providerId?.includes('github') ? 'github' : 'password',
    defaults = {},
    profileComplete = true,
  } = options;

  devAuthLog('Ensuring profile for uid:', user.uid);
  const existing = await getUserProfile(user.uid);
  if (existing) {
    const normalized = normalizeRole(existing.role);
    const patch = {};
    if (existing.role !== normalized) patch.role = normalized;
    if (!existing.status) patch.status = 'active';
    if (!existing.provider) patch.provider = provider;
    if (!existing.updatedAt) patch.updatedAt = serverTimestamp();
    if (Object.keys(patch).length) {
      await updateUserProfile(user.uid, patch);
      return { ...existing, ...patch, repaired: true };
    }
    devAuthLog('Profile fetch success:', user.uid, normalized);
    return { ...existing, role: normalized };
  }

  devAuthLog('Profile missing, rebuilding profile:', user.uid);
  const rebuilt = await createUserProfile(user.uid, {
    name: defaults.name || user.displayName || 'CampusMate User',
    email: defaults.email || user.email || '',
    role: defaults.role || role,
    branch: defaults.branch || 'Computer Engineering & IoT',
    semester: defaults.semester || '2',
    division: defaults.division || 'A',
    rollNumber: defaults.rollNumber || '',
    department: defaults.department || 'Computer Engineering',
    assignedSubjects: defaults.assignedSubjects || [],
    provider,
    status: 'active',
    profileComplete,
  });

  return { ...rebuilt, id: user.uid, repaired: true };
}

export function listenToCollection(collectionName, onData, onError) {
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    },
    (error) => onError?.(friendlyFirebaseError(error)),
  );
}

export async function fetchCollection(collectionName) {
  const instance = requireDb();
  const snapshot = await getDocs(collection(instance, collectionName));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function addDocument(collectionName, data) {
  const instance = requireDb();
  const payload = {
    ...data,
    createdAt: data.createdAt || serverTimestamp(),
  };
  const ref = await addDoc(collection(instance, collectionName), payload);
  await updateDoc(ref, { id: ref.id });
  return { id: ref.id, ...payload };
}

export async function setDocumentWithId(collectionName, id, data) {
  const instance = requireDb();
  await setDoc(
    doc(instance, collectionName, id),
    {
      id,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return { id, ...data };
}

export async function updateDocument(collectionName, id, updates) {
  const instance = requireDb();
  await updateDoc(doc(instance, collectionName, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName, id) {
  const instance = requireDb();
  await deleteDoc(doc(instance, collectionName, id));
}

async function addUnique(collectionName, keyFactory, records) {
  const existing = await fetchCollection(collectionName);
  const existingKeys = new Set(existing.map(keyFactory));
  const created = [];

  for (const record of records) {
    const key = keyFactory(record);
    if (!existingKeys.has(key)) {
      created.push(await addDocument(collectionName, record));
      existingKeys.add(key);
    }
  }

  return [...existing, ...created];
}

export async function seedDemoData(createdBy = 'demo-admin') {
  const demoStudents = Array.from({ length: 10 }, (_, index) => {
    const rollNumber = String(254101 + index);
    return {
      uid: index === 0 ? 'demo-cr-yash' : `demo-student-${rollNumber}`,
      name: index === 0 ? 'Yash Krishna Ganesh' : `Demo Student ${index + 1}`,
      email: index === 0 ? 'yash.cr@campusmate.demo' : `student${index + 1}@campusmate.demo`,
      role: index === 0 ? 'cr' : 'student',
      rollNumber,
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      isCR: index === 0,
      status: 'active',
      provider: 'demo',
      profileComplete: true,
      createdAt: serverTimestamp(),
    };
  });

  const demoUsers = [
    {
      uid: 'demo-admin-principal',
      name: 'CampusMate Admin',
      email: 'admin@campusmate.demo',
      role: 'admin',
      department: 'Administration',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      status: 'active',
      provider: 'demo',
      profileComplete: true,
      createdAt: serverTimestamp(),
    },
    {
      uid: 'demo-coordinator-hod',
      name: 'Dr. Meera HOD',
      email: 'coordinator@campusmate.demo',
      role: 'coordinator',
      department: SAMPLE_DEPARTMENT,
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      status: 'active',
      provider: 'demo',
      profileComplete: true,
      createdAt: serverTimestamp(),
    },
    {
      uid: 'demo-teacher-nisha',
      name: 'Prof. Nisha Shah',
      email: 'nisha.teacher@campusmate.demo',
      role: 'teacher',
      department: SAMPLE_DEPARTMENT,
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      assignedSubjects: [],
      status: 'active',
      provider: 'demo',
      profileComplete: true,
      createdAt: serverTimestamp(),
    },
    {
      uid: 'demo-teacher-arjun',
      name: 'Prof. Arjun Mehta',
      email: 'arjun.teacher@campusmate.demo',
      role: 'teacher',
      department: SAMPLE_DEPARTMENT,
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      assignedSubjects: [],
      status: 'active',
      provider: 'demo',
      profileComplete: true,
      createdAt: serverTimestamp(),
    },
    ...demoStudents,
  ];

  await Promise.all(demoUsers.map((item) => setDocumentWithId('users', item.uid, item)));

  const legacyUserDocs = await fetchCollection('users');
  await Promise.all(
    legacyUserDocs
      .filter(
        (item) =>
          demoUsers.some((user) => user.uid === item.uid) &&
          item.id !== item.uid,
      )
      .map((item) => deleteDocument('users', item.id).catch(() => {})),
  );

  const demoSubjects = [
    {
      name: 'Basic Electrical and Electronics Engineering',
      code: 'BEEE',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      teacherId: 'demo-teacher-nisha',
      teacherName: 'Prof. Nisha Shah',
    },
    {
      name: 'Programming in C',
      code: 'PIC',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      teacherId: 'demo-teacher-arjun',
      teacherName: 'Prof. Arjun Mehta',
    },
    {
      name: 'Web Design',
      code: 'WD',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      teacherId: 'demo-teacher-arjun',
      teacherName: 'Prof. Arjun Mehta',
    },
    {
      name: 'Mathematics',
      code: 'MATH',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      teacherId: 'demo-teacher-nisha',
      teacherName: 'Prof. Dev Iyer',
    },
    {
      name: 'Communication Skills',
      code: 'CS',
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
      teacherId: 'demo-teacher-nisha',
      teacherName: 'Prof. Sana Khan',
    },
  ];

  const subjects = await addUnique(
    'subjects',
    (item) => `${item.code}-${item.branch}-${item.semester}-${item.division || 'All'}`,
    demoSubjects,
  );

  const sampleSubjects = subjects.filter(
    (subject) =>
      subject.branch === SAMPLE_BRANCH &&
      String(subject.semester || '') === SAMPLE_SEMESTER &&
      (subject.division || SAMPLE_DIVISION) === SAMPLE_DIVISION,
  );
  const byCode = new Map(sampleSubjects.map((subject) => [subject.code, subject]));
  const samplePdf =
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const timetableRows = [
    ['Monday', '10:00', '11:00', 'BEEE', 'A-204'],
    ['Monday', '11:00', '12:00', 'PIC', 'Lab-2'],
    ['Monday', '12:00', '13:00', 'WD', 'Studio-1'],
    ['Tuesday', '10:00', '11:00', 'MATH', 'A-101'],
    ['Tuesday', '11:00', '12:00', 'CS', 'B-110'],
  ].map(([day, startTime, endTime, code, room]) => {
    const subject = byCode.get(code);
    return {
      day,
      startTime,
      endTime,
      subjectId: subject?.id || code,
      subjectName: subject ? `${subject.code} - ${subject.name}` : code,
      teacherId: subject?.teacherId || 'demo-teacher-nisha',
      teacherName: subject?.teacherName || 'Faculty',
      room,
      branch: SAMPLE_BRANCH,
      semester: SAMPLE_SEMESTER,
      division: SAMPLE_DIVISION,
    };
  });

  const notes = ['BEEE', 'PIC', 'WD'].map((code, index) => {
    const subject = byCode.get(code);
    return {
      title: `${code} Unit ${index + 1} Essentials`,
      subjectId: subject?.id || code,
      subjectName: subject ? `${subject.code} - ${subject.name}` : code,
      unit: `Unit ${index + 1}`,
      description:
        'Concise theory notes with summaries, important concepts, and revision prompts.',
      fileUrl: samplePdf,
      fileName: `${code.toLowerCase()}-unit-${index + 1}.pdf`,
      uploadedBy: createdBy,
    };
  });

  const assignments = ['BEEE', 'PIC', 'WD'].map((code, index) => {
    const subject = byCode.get(code);
    return {
      title: `${code} Practice Set ${index + 1}`,
      subjectId: subject?.id || code,
      subjectName: subject ? `${subject.code} - ${subject.name}` : code,
      description:
        'Complete the attached practice questions and submit before the deadline.',
      dueDate: addDays(index + 3),
      fileUrl: samplePdf,
      fileName: `${code.toLowerCase()}-assignment.pdf`,
      createdBy,
    };
  });

  const exams = [
    ['BEEE', 'Mid Semester Test', 5, 'DC circuits, safety, basic electronics'],
    ['PIC', 'Practical Assessment', 8, 'C basics, loops, arrays, functions'],
    ['WD', 'Design Review', 12, 'HTML, CSS layout, responsive UI'],
  ].map(([code, examType, days, syllabus]) => {
    const subject = byCode.get(code);
    return {
      subjectId: subject?.id || code,
      subjectName: subject ? `${subject.code} - ${subject.name}` : code,
      examType,
      examDate: addDays(days),
      syllabus,
    };
  });

  await addUnique(
    'timetable',
    (item) => `${item.day}-${item.startTime}-${item.subjectName}-${item.division}`,
    timetableRows,
  );
  await addUnique('notes', (item) => `${item.title}-${item.subjectName}`, notes);
  await addUnique('assignments', (item) => item.title, assignments);
  await addUnique('exams', (item) => `${item.subjectName}-${item.examType}`, exams);
  await addUnique('reminders', (item) => `${item.userId}-${item.title}-${item.dueDate}`, [
    {
      userId: 'demo-cr-yash',
      title: 'Revise BEEE formulas',
      description: 'Review Ohm\'s Law, current, voltage, resistance, and safety before the test.',
      type: 'Study plan task',
      dueDate: addDays(2),
      status: 'Pending',
    },
    {
      userId: 'demo-cr-yash',
      title: 'Submit PIC practice set',
      description: 'Finish loops and arrays questions before the assignment deadline.',
      type: 'Assignment due',
      dueDate: addDays(3),
      status: 'Pending',
    },
  ]);
  await addUnique('attendance', (item) => `${item.userId}-${item.subjectId}`, [
    ...['BEEE', 'PIC', 'WD'].map((code, index) => {
      const subject = byCode.get(code);
      const present = [8, 7, 5][index];
      const total = [10, 9, 8][index];
      return {
        userId: 'demo-cr-yash',
        subjectId: subject?.id || code,
        subjectName: subject ? `${subject.code} - ${subject.name}` : code,
        present,
        total,
        percentage: Math.round((present / total) * 100),
      };
    }),
  ]);

  const officialAttendanceSubjects = ['BEEE', 'PIC'].map((code, index) => ({
    subject: byCode.get(code),
    date: addDays(-(index + 1)),
    period: `Lecture ${index + 1}`,
  })).filter((item) => item.subject);

  const officialRecords = officialAttendanceSubjects.flatMap(({ subject, date, period }, subjectIndex) => {
    const sessionId = `${subject.id}_${date}_${period}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    return demoStudents.map((student, studentIndex) => {
      const status = studentIndex < 8 || (subjectIndex === 1 && studentIndex < 9) ? 'present' : 'absent';
      return {
        recordId: `${sessionId}_${student.uid}`,
        sessionId,
        studentId: student.uid,
        studentName: student.name,
        studentEmail: student.email,
        rollNumber: student.rollNumber,
        subjectId: subject.id,
        subjectName: `${subject.code} - ${subject.name}`,
        branch: SAMPLE_BRANCH,
        semester: SAMPLE_SEMESTER,
        division: SAMPLE_DIVISION,
        date,
        period,
        status,
        markedBy: subject.teacherId || 'demo-teacher-nisha',
        markedByName: subject.teacherName || 'Faculty',
        markedByRole: 'teacher',
        markedAt: serverTimestamp(),
      };
    });
  });

  await Promise.all(
    officialAttendanceSubjects.map(({ subject, date, period }) => {
      const sessionId = `${subject.id}_${date}_${period}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      return setDocumentWithId('attendanceSessions', sessionId, {
        sessionId,
        subjectId: subject.id,
        subjectName: `${subject.code} - ${subject.name}`,
        branch: SAMPLE_BRANCH,
        semester: SAMPLE_SEMESTER,
        division: SAMPLE_DIVISION,
        date,
        period,
        takenBy: subject.teacherId || 'demo-teacher-nisha',
        takenByName: subject.teacherName || 'Faculty',
        takenByRole: 'teacher',
        status: 'submitted',
        createdAt: serverTimestamp(),
      });
    }),
  );
  await Promise.all(
    officialRecords.map((record) =>
      setDocumentWithId('attendanceRecords', record.recordId, record),
    ),
  );
  await Promise.all(
    demoStudents.flatMap((student) =>
      officialAttendanceSubjects.map(({ subject }) => {
        const subjectRecords = officialRecords.filter(
          (record) => record.studentId === student.uid && record.subjectId === subject.id,
        );
        return setDocumentWithId('attendanceSummary', `${student.uid}_${subject.id}`, {
          summaryId: `${student.uid}_${subject.id}`,
          studentId: student.uid,
          studentName: student.name,
          rollNumber: student.rollNumber,
          subjectId: subject.id,
          subjectName: `${subject.code} - ${subject.name}`,
          branch: SAMPLE_BRANCH,
          semester: SAMPLE_SEMESTER,
          division: SAMPLE_DIVISION,
          ...summarizeAttendanceRecords(subjectRecords),
        });
      }),
    ),
  );
  await addUnique('internalMarks', (item) => `${item.studentId}-${item.subjectId}`, [
    ...['BEEE', 'PIC', 'WD'].map((code, index) => {
      const subject = byCode.get(code);
      const totals = [42, 38, 44];
      return {
        studentId: 'demo-cr-yash',
        studentName: 'Yash Krishna Ganesh',
        subjectId: subject?.id || code,
        subjectName: subject ? `${subject.code} - ${subject.name}` : code,
        unitTestMarks: totals[index] - 25,
        assignmentMarks: 9,
        practicalMarks: 8,
        attendanceMarks: 8,
        totalMarks: totals[index],
        maxMarks: 50,
        updatedBy: createdBy,
      };
    }),
  ]);
  await addUnique(
    'quizQuestions',
    (item) => `${item.subjectName}-${item.question}`,
    buildSampleQuizQuestions(byCode, createdBy),
  );
  await addUnique('notices', (item) => item.title, [
    {
      title: 'CampusMate academic workspace',
      message:
        'Official attendance, reports, analytics, complaints, contributions, internal marks, and role-based campus workflows are active.',
      category: 'Important',
      targetBranch: SAMPLE_BRANCH,
      targetSemester: SAMPLE_SEMESTER,
      createdBy,
    },
    {
      title: 'Campus operations update',
      message:
        'Department teams can now use CampusMate to coordinate students, teachers, notices, assignments, exams, and attendance from one workspace.',
      category: 'Event',
      targetBranch: 'All',
      targetSemester: 'All',
      createdBy,
    },
  ]);
}

function buildQuestion(subject, topic, index, question, options, correctAnswer, explanation) {
  return {
    subjectId: subject?.id || subject?.code || topic,
    subjectName: subject ? `${subject.code} - ${subject.name}` : topic,
    unit: `Unit ${((index - 1) % 5) + 1}`,
    topic,
    question,
    options,
    correctAnswer,
    explanation,
    difficulty: index <= 3 ? 'easy' : index <= 7 ? 'medium' : 'hard',
    createdBy: 'demo-admin',
  };
}

function buildSampleQuizQuestions(byCode, createdBy) {
  const beee = byCode.get('BEEE');
  const pic = byCode.get('PIC');
  const wd = byCode.get('WD');
  const rows = [
    [beee, "Ohm's Law", "Ohm's Law relates which quantities?", ['Voltage, current, resistance', 'Mass, force, speed', 'HTML, CSS, JS', 'Area, volume, density'], 'Voltage, current, resistance', 'V = IR connects voltage, current, and resistance.'],
    [beee, 'Current', 'Electric current is measured in?', ['Ampere', 'Volt', 'Ohm', 'Watt'], 'Ampere', 'Current is rate of charge flow and is measured in amperes.'],
    [beee, 'Voltage', 'Voltage is also known as?', ['Potential difference', 'Resistance', 'Power loss', 'Frequency'], 'Potential difference', 'Voltage is electrical potential difference.'],
    [beee, 'Resistance', 'Resistance is measured in?', ['Ohm', 'Ampere', 'Tesla', 'Newton'], 'Ohm', 'Resistance opposes current flow and is measured in ohms.'],
    [beee, 'AC/DC', 'Which supply changes direction periodically?', ['AC', 'DC', 'Static', 'Ground'], 'AC', 'Alternating current changes direction periodically.'],
    [beee, 'Transformer', 'A transformer works on?', ['Electromagnetic induction', 'Chemical reaction', 'Friction', 'Thermal expansion'], 'Electromagnetic induction', 'Transformers use mutual induction.'],
    [beee, 'Safety', 'A fuse is used for?', ['Overcurrent protection', 'Data storage', 'Voltage generation', 'Signal decoding'], 'Overcurrent protection', 'Fuse melts under excessive current.'],
    [beee, 'Power', 'Electrical power in DC is?', ['V x I', 'V / I', 'I / R', 'R / V'], 'V x I', 'Power equals voltage times current.'],
    [beee, 'Series circuit', 'In a series circuit current is?', ['Same through all components', 'Zero always', 'Different in each element', 'Only in resistors'], 'Same through all components', 'Series path has same current.'],
    [beee, 'Parallel circuit', 'In parallel circuit voltage is?', ['Same across branches', 'Always zero', 'Different for identical branches', 'Not measurable'], 'Same across branches', 'Parallel branches share same voltage.'],
    [pic, 'Variables', 'A variable stores?', ['Data value', 'Only comments', 'Compiler errors', 'Keyboard input only'], 'Data value', 'Variables hold values in memory.'],
    [pic, 'Data types', 'Which is commonly used for integers in C?', ['int', 'float', 'char[] only', 'void'], 'int', 'int stores integer values.'],
    [pic, 'If else', 'if-else is used for?', ['Decision making', 'Looping only', 'File deletion only', 'Styling'], 'Decision making', 'if-else branches based on conditions.'],
    [pic, 'Loops', 'Which loop checks condition before executing?', ['while', 'do-while only after', 'switch', 'typedef'], 'while', 'while evaluates condition first.'],
    [pic, 'Arrays', 'Array index in C starts from?', ['0', '1', '-1', '10'], '0', 'C arrays are zero-indexed.'],
    [pic, 'Functions', 'A function helps with?', ['Code reuse', 'Only comments', 'Changing compiler', 'Increasing errors'], 'Code reuse', 'Functions break code into reusable blocks.'],
    [pic, 'Pointers', 'A pointer stores?', ['Address', 'Only string', 'Only decimal', 'Keyword'], 'Address', 'Pointers store memory addresses.'],
    [pic, 'Operators', 'Which operator gives remainder?', ['%', '/', '*', '&'], '%', 'Modulo returns remainder.'],
    [pic, 'Strings', 'C strings end with?', ['\\0', '#', '@', 'EOF always'], '\\0', 'Null terminator marks string end.'],
    [pic, 'Switch', 'switch is best for?', ['Multiple fixed choices', 'CSS layout', 'Infinite recursion', 'File upload'], 'Multiple fixed choices', 'switch handles fixed case values.'],
    [wd, 'HTML', 'HTML is used for?', ['Page structure', 'Database only', 'Server hardware', 'Electric circuits'], 'Page structure', 'HTML defines document structure.'],
    [wd, 'CSS', 'CSS controls?', ['Presentation and layout', 'Only database', 'Compiler memory', 'Voltage'], 'Presentation and layout', 'CSS styles HTML.'],
    [wd, 'Forms', 'Which tag creates a form?', ['form', 'table', 'section only', 'meta'], 'form', 'The form element collects user input.'],
    [wd, 'Flexbox', 'Flexbox is useful for?', ['One-dimensional layout', 'SQL queries', 'Circuit analysis', 'OS booting'], 'One-dimensional layout', 'Flexbox lays items in rows or columns.'],
    [wd, 'JavaScript', 'JavaScript adds?', ['Interactivity', 'Only font files', 'Electrical safety', 'Mechanical torque'], 'Interactivity', 'JS handles behavior and logic.'],
    [wd, 'Responsive design', 'Responsive design adapts to?', ['Screen sizes', 'Only printers', 'Only CPUs', 'Only voltage'], 'Screen sizes', 'Responsive UIs work across devices.'],
    [wd, 'Semantic HTML', 'Semantic elements improve?', ['Meaning and accessibility', 'Battery charging', 'Resistance', 'Pointer arithmetic'], 'Meaning and accessibility', 'Semantic tags describe content purpose.'],
    [wd, 'CSS Grid', 'CSS Grid is best for?', ['Two-dimensional layout', 'C pointers', 'AC generation', 'Exam seating'], 'Two-dimensional layout', 'Grid handles rows and columns.'],
    [wd, 'Accessibility', 'alt text helps?', ['Screen readers', 'Only servers', 'Only compilers', 'Current flow'], 'Screen readers', 'Alt text describes images.'],
    [wd, 'Media query', 'Media queries are used for?', ['Responsive styles', 'C loops', 'Transformers', 'File deletion'], 'Responsive styles', 'Media queries apply CSS by viewport/features.'],
  ];

  return rows.map((row, index) =>
    ({
      ...buildQuestion(row[0], row[1], index + 1, row[2], row[3], row[4], row[5]),
      createdBy,
    }),
  );
}
