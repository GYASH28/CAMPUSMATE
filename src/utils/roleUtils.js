export function subjectDisplay(subject) {
  return subject ? `${subject.code} - ${subject.name}` : '';
}

export function isTeacherSubject(subject, user, profile) {
  return (
    subject.teacherId === user?.uid ||
    subject.teacherName === profile?.name ||
    (profile?.assignedSubjects || []).includes(subject.id)
  );
}

export function isStudentSubject(subject, profile) {
  return (
    subject?.branch === profile?.branch &&
    String(subject?.semester || '') === String(profile?.semester || '') &&
    (!subject?.division || subject.division === profile?.division)
  );
}

export function matchesStudentClass(student, target) {
  return (
    student?.branch === target?.branch &&
    student?.semester === target?.semester &&
    student?.division === target?.division
  );
}

export function statusTone(status) {
  if (['Approved', 'Resolved', 'Completed', 'active', 'Excellent'].includes(status)) return 'emerald';
  if (['In Progress', 'Medium', 'Good', 'Pending approval', 'Pending'].includes(status)) return 'amber';
  if (['Rejected', 'High', 'disabled', 'Needs Improvement'].includes(status)) return 'rose';
  return 'cyan';
}
