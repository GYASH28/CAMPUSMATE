export function calculatePercentage(present = 0, total = 0) {
  if (!total) return 0;
  return Math.round((Number(present) / Number(total)) * 100);
}

export function calculateAttendancePercentage(present = 0, late = 0, total = 0) {
  if (!total) return 0;
  return Math.round(((Number(present) + Number(late)) / Number(total)) * 100);
}

export function getAttendanceStatus(percentage = 0) {
  if (percentage >= 75) {
    return {
      label: 'Safe',
      color: 'text-emerald-300',
      chip: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
      bar: 'bg-emerald-400',
    };
  }

  if (percentage >= 60) {
    return {
      label: 'Warning',
      color: 'text-amber-300',
      chip: 'border-amber-300/30 bg-amber-400/10 text-amber-200',
      bar: 'bg-amber-400',
    };
  }

  return {
    label: 'Critical',
    color: 'text-rose-300',
    chip: 'border-rose-300/30 bg-rose-400/10 text-rose-200',
    bar: 'bg-rose-400',
  };
}

export function calculateLecturesNeeded(present = 0, total = 0, targetPercentage = 75) {
  let needed = 0;
  let projectedPresent = Number(present);
  let projectedTotal = Number(total);
  const target = Number(targetPercentage) / 100;

  while (projectedTotal === 0 || projectedPresent / projectedTotal < target) {
    needed += 1;
    projectedPresent += 1;
    projectedTotal += 1;
    if (needed > 250) break;
  }

  return needed;
}

export function lecturesNeededForSeventyFive(present = 0, total = 0) {
  return calculateLecturesNeeded(present, total, 75);
}

export function generateSessionCode(existingCodes = []) {
  const taken = new Set(existingCodes);
  let code = '';

  do {
    const bytes = new Uint8Array(3);
    window.crypto.getRandomValues(bytes);
    const number = bytes.reduce((value, byte) => (value << 8) + byte, 0) % 1000000;
    code = `CM-${String(number).padStart(6, '0')}`;
  } while (taken.has(code));

  return code;
}

export function generateQrToken() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getStudentClassQuery(profile = {}) {
  return {
    branch: profile.branch || '',
    semester: String(profile.semester || ''),
    division: profile.division || '',
  };
}

export function summarizeAttendanceRecords(records = []) {
  const counts = records.reduce(
    (acc, record) => {
      const status = record.status || 'absent';
      if (status === 'present') acc.presentCount += 1;
      else if (status === 'late') acc.lateCount += 1;
      else if (status === 'excused') acc.excusedCount += 1;
      else acc.absentCount += 1;
      return acc;
    },
    {
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
    },
  );

  const totalLectures =
    counts.presentCount + counts.absentCount + counts.lateCount + counts.excusedCount;
  const percentage = calculateAttendancePercentage(
    counts.presentCount,
    counts.lateCount,
    totalLectures,
  );

  return {
    ...counts,
    totalLectures,
    percentage,
    status: getAttendanceStatus(percentage).label,
  };
}
