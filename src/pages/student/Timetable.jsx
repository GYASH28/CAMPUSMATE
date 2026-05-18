import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import SectionHeader from '../../components/common/SectionHeader';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { DAYS } from '../../utils/constants';
import { getTodayName } from '../../utils/dateUtils';

export default function Timetable() {
  const { profile } = useAuth();
  const { data: timetable } = useCollection('timetable');
  const today = getTodayName();
  const [activeDay, setActiveDay] = useState(today);
  const [mode, setMode] = useState('day');

  const entries = useMemo(
    () =>
      timetable
        .filter(
          (entry) =>
            entry.branch === profile?.branch &&
            entry.semester === profile?.semester &&
            entry.division === profile?.division,
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [timetable, profile?.branch, profile?.semester, profile?.division],
  );

  const visibleDays = mode === 'week' ? DAYS : [activeDay];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Weekly timetable"
        title="Your class schedule"
        description={`Showing timetable for ${profile?.branch}, Semester ${profile?.semester}, Division ${profile?.division}.`}
        actions={
          <div className="flex rounded-2xl border border-white/10 bg-white/[0.06] p-1">
            {['day', 'week'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${
                  mode === item
                    ? 'bg-cyan-300/15 text-cyan-100'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        <SectionHeader
          eyebrow="Day tabs"
          title="Pick a day"
          description="Today is highlighted automatically."
        />
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <Button
              key={day}
              type="button"
              variant={activeDay === day ? 'primary' : day === today ? 'secondary' : 'dark'}
              size="sm"
              className="shrink-0"
              onClick={() => {
                setActiveDay(day);
                setMode('day');
              }}
            >
              {day}
              {day === today ? <span className="text-xs opacity-80">Today</span> : null}
            </Button>
          ))}
        </div>
      </Card>

      {entries.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleDays.map((day) => {
            const dayEntries = entries.filter((entry) => entry.day === day);
            return (
              <Card key={day} tone={day === today ? 'highlight' : 'default'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone={day === today ? 'emerald' : 'cyan'} icon={CalendarDays}>
                      {day === today ? 'Today' : 'Schedule'}
                    </Badge>
                    <h3 className="mt-3 text-2xl font-black text-white">{day}</h3>
                  </div>
                  <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-300">
                    {dayEntries.length} classes
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  {dayEntries.length ? (
                    dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.07]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">{entry.subjectName}</p>
                            <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                              <span className="inline-flex items-center gap-2">
                                <UserRound className="h-4 w-4 text-cyan-200" />
                                {entry.teacherName}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-violet-200" />
                                Room {entry.room}
                              </span>
                            </div>
                          </div>
                          <Badge tone="cyan" icon={Clock3}>
                            {entry.startTime} - {entry.endTime}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No class scheduled"
                      message="Enjoy the breathing room, or check the weekly overview for other days."
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Timetable is empty"
          message="Ask an admin to add timetable entries for your branch, semester, and division."
        />
      )}
    </MotionPage>
  );
}
