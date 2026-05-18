import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers3,
  LogIn,
  MessageCircle,
  NotebookTabs,
  Rocket,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AnimatedGrid from '../../components/animations/AnimatedGrid';
import FloatingBlob from '../../components/animations/FloatingBlob';
import featureIcons from '../../utils/featureIcons';

const features = [
  {
    icon: CalendarDays,
    image: featureIcons.timetable,
    title: 'Smart Timetable',
    text: 'Branch, semester, and division-wise schedules are always one tap away.',
  },
  {
    icon: BadgeCheck,
    image: featureIcons.attendance,
    title: 'Attendance Tracker',
    text: 'Track present, absent, percentage, and recovery guidance without spreadsheets.',
  },
  {
    icon: FileText,
    image: featureIcons.notes,
    title: 'Notes Library',
    text: 'Subject and unit-wise study material with clear descriptions and downloads.',
  },
  {
    icon: ClipboardCheck,
    image: featureIcons.assignments,
    title: 'Assignments',
    text: 'Know what is due, what is completed, and what needs attention today.',
  },
  {
    icon: Bell,
    image: featureIcons.notices,
    title: 'Notices',
    text: 'Important updates stay visible instead of getting buried in message groups.',
  },
  {
    icon: BookOpen,
    image: featureIcons.exams,
    title: 'Exam Countdown',
    text: 'Upcoming exams, syllabus, and days remaining in a calm, focused view.',
  },
];

const workflow = [
  ['Login', 'Enter with secure role-based routing.', LogIn, featureIcons.admin],
  ['View today', 'See classes, assignments, notices, exams, and attendance at a glance.', Layers3, featureIcons.dashboard],
  ['Stay campus-ready', 'Use AI learning, official attendance, reports, complaints, and mobile-friendly tools in one place.', CheckCircle2, featureIcons.attendance],
];

const platformAreas = [
  ['Academic workspace', 'Daily college tools', 'Timetable, attendance, notes, assignments, notices, exams, and profile tools in one place.'],
  ['Smart learning', 'AI-powered preparation', 'AI Assistant, quizzes, study planner, reminders, progress, and weak topic detection.'],
  ['Campus operations', 'Role-based workflows', 'Teachers, coordinators, CRs, reports, analytics, complaints, contributions, and internal marks.'],
];

function Reveal({ children, delay = 0, className = '' }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PreviewCard() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-panel backdrop-blur-2xl"
    >
      <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-cyan-300/20 via-blue-500/10 to-violet-500/20 blur-xl" />
      <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-950/82 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
              Today
            </p>
            <p className="text-xl font-black text-white">Student Command Center</p>
          </div>
          <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-100">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Attendance', '82%', 'Safe'],
            ['Pending Tasks', '3', 'Due soon'],
            ['Next Exam', '5 days', 'BEEE'],
            ['Notices', '2', 'New'],
          ].map(([label, value, hint], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + index * 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-4"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs font-bold text-cyan-200">{hint}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Monday Timetable</p>
            <Badge tone="cyan">Official</Badge>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>10:00 AM - 11:00 AM - BEEE - A-204</p>
            <p>11:00 AM - 12:00 PM - PIC - Lab-2</p>
            <p>12:00 PM - 01:00 PM - Web Design - Studio-1</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-app-radial text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 text-lg font-black shadow-glow">
              C
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">CampusMate</p>
              <p className="text-xs font-semibold text-cyan-200">
                Smart College Companion
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Login
            </Button>
            <Button as={Link} to="/signup" size="sm">
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      <section className="relative flex min-h-[96vh] items-center px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <AnimatedGrid />
        <FloatingBlob className="right-[-14rem] top-28" />
        <FloatingBlob className="bottom-20 left-[-18rem] opacity-50" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-4xl"
          >
            <Badge tone="cyan" icon={Rocket}>Complete academic workspace</Badge>
            <h1 className="mt-6 text-balance text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              CampusMate
            </h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-slate-100 sm:text-2xl">
              Your smart college companion for timetable, attendance, notes,
              assignments, notices, exams, AI study help, quizzes, official attendance, and campus workflows.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              Manage your academic life from one clean dashboard. CampusMate helps
              students stay organized, track attendance, access study material,
              manage assignments, prepare for exams, and learn with AI-powered support.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to="/signup" size="lg">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Login
              </Button>
            </div>
          </motion.div>

          <div className="perspective-1000 relative">
            <PreviewCard />
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 top-10 hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-bold text-cyan-100 shadow-glow backdrop-blur-xl md:block"
            >
              Attendance 82%
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 bottom-12 hidden rounded-3xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm font-bold text-violet-100 shadow-violet backdrop-blur-xl md:block"
            >
              Exam in 5 days
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <Badge tone="violet" icon={MessageCircle}>Problem</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              College work is scattered everywhere.
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Timetables sit in PDFs. Assignments arrive in WhatsApp groups.
              Notices get missed. Attendance lives in notebooks. CampusMate
              gathers core academic tools and smart learning features into one calm workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['WhatsApp', 'Announcements disappear fast.'],
              ['PDFs', 'Schedules are hard to scan.'],
              ['Notebooks', 'Attendance math is manual.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <NotebookTabs className="h-6 w-6 text-cyan-200" />
                <p className="mt-4 font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
            <Badge tone="cyan" icon={Sparkles}>Advanced campus tools</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Built like a real campus-ready platform.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.04}>
              <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.09] hover:shadow-glow">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <img
                    src={feature.image}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover shadow-[0_0_18px_rgba(34,211,238,0.3)] transition group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <Badge tone="violet">Student workflow</Badge>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {workflow.map(([title, text, Icon, image], index) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-100">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover shadow-[0_0_18px_rgba(168,85,247,0.3)]"
                          loading="lazy"
                        />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <p className="text-3xl font-black text-white/10">0{index + 1}</p>
                  </div>
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <Badge tone="cyan">Platform</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Designed for students, faculty, and departments.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {platformAreas.map(([label, title, text], index) => (
            <Reveal key={label} delay={index * 0.06}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <Badge tone={index === 0 ? 'emerald' : index === 1 ? 'violet' : 'cyan'}>
                  {label}
                </Badge>
                <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400/12 via-blue-500/10 to-violet-500/12 p-8 shadow-glow backdrop-blur-xl">
            <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Badge tone="cyan" icon={Rocket}>CampusMate is ready</Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight">
                  Start your smarter college journey.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Manage timetable, attendance, notes, assignments, notices, exams,
                  AI learning, reports, complaints, contributions, and internal marks.
                </p>
              </div>
              <Button as={Link} to="/signup" size="lg">
                Open CampusMate
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
