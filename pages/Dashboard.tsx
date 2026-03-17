import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Assignment, Status } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import TelegramPromptModal from '../components/TelegramPromptModal';
import { BentoCard, BentoHeader, BentoContent } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { NeonButton } from '../components/ui/NeonButton';
import { Input } from '../components/ui/Input';
import { MiniChart } from '../components/ui/MiniChart';
import {
  Search, Plus, Calendar, Clock, BookOpen,
  CheckCircle, AlertCircle, TrendingUp, MoreHorizontal
} from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';
import { getAssignmentSubject } from '../utils/assignmentSubject';

// Wrapper to delay chart rendering until container is mounted
const DelayedChart = ({ children, delay = 100 }: { children: React.ReactNode; delay?: number }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  if (!ready) return null;
  return <>{children}</>;
};

const Dashboard = () => {
  const { assignments, subjects, user, dismissTelegramPrompt } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTelegramPrompt, setShowTelegramPrompt] = useState(false);
  const navigate = useNavigate();

  // Telegram Logic (Same as before)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) return;
      if (user.telegramLinked) return;
      if (user.telegramPromptDismissed) return;
      if (!user.telegramPromptLastShown) { setShowTelegramPrompt(true); return; }
      const daysSince = (Date.now() - new Date(user.telegramPromptLastShown).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 5) setShowTelegramPrompt(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  const handlePromptClose = async (action: 'link' | 'remind' | 'permanent') => {
    setShowTelegramPrompt(false);
    try { await dismissTelegramPrompt(action === 'permanent'); } catch (e) { console.error(e); }
  };

  // Stats
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === Status.Completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const highPriorityCount = assignments.filter(a => a.priority === 'High' && a.status !== 'Completed').length;



  // Upcoming (Timeline Viz Data)
  const upcoming = [...assignments]
    .filter(a => a.status !== Status.Completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Subject Heatmap Data
  const subjectData = subjects.map(s => ({
    name: s.name,
    full: s.name,
    count: assignments.filter(a => a.subjectId === s.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const miniChartData = subjectData.map(s => ({
    label: s.name,
    value: s.count
  }));

  const getAssignmentSubjectName = (assignment: Assignment) => (
    getAssignmentSubject(assignment, subjects)?.name || 'Unknown'
  );

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen w-full max-w-[1400px] mx-auto pt-10 px-6 pb-6 md:p-8 space-y-10">
      <CreateAssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {user?.uid && (
        <TelegramPromptModal isOpen={showTelegramPrompt} onClose={handlePromptClose} userUid={user.uid} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50 pb-1">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              {getGreeting()}, <span className="text-foreground font-semibold">{user?.name || 'there'}</span>.
            </p>
          </div>
          {/* Mobile Theme Toggle - inline with header, scrolls with content */}
          <AnimatedThemeToggler className="md:hidden h-10 w-10 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 rounded-xl shrink-0" />
        </div>

        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative flex-1 md:w-72 group">
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground z-10" />
            <Input
              type="text"
              inputMode="search"
              placeholder="Search anything..."
              className="pl-11 h-12 bg-background/40 backdrop-blur-md border border-black/5 dark:border-white/5 focus:bg-background/60 focus:border-primary/20 transition-all rounded-2xl shadow-sm z-10 relative"
            />
          </div>
          <NeonButton onClick={() => setIsModalOpen(true)} className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </NeonButton>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:auto-rows-[180px]">

        <BentoCard delay={0.1} className="min-h-[320px] md:min-h-0 lg:col-span-3 lg:row-span-2 relative p-6">
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Progress</span>
              </div>
              <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
                {completionRate}%
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Assignment Completion</p>
            </div>

            <div className="flex-1 w-full flex items-center justify-center opacity-80 mix-blend-multiply dark:mix-blend-screen">
              <DelayedChart delay={500}>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: completionRate, fill: 'hsl(var(--primary))' }]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" cornerRadius={100} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </DelayedChart>
            </div>
          </div>
          {/* Decorative Blur */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        </BentoCard>

        {/* 2. Stats Column - 3 Columns */}
        <div className="lg:col-span-3 lg:row-span-2 flex flex-col gap-6">
          {/* Total Tasks */}
          <BentoCard delay={0.2} href="/dashboard/assignments" className="min-h-[120px] md:min-h-0 flex-1 flex flex-col justify-center p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 bg-muted/50 dark:bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
              <p className="text-4xl font-bold mt-1 tracking-tight">{total}</p>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              All active and completed
            </div>
          </BentoCard>

          {/* Pending Review */}
          <BentoCard delay={0.3} className="min-h-[120px] md:min-h-0 flex-1 flex flex-col justify-center p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 bg-muted/50 dark:bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-4xl font-bold mt-1 tracking-tight">{pending}</p>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2" />
              Requires attention
            </div>
          </BentoCard>
        </div>

        {/* 3. Upcoming Timeline - 6 Columns */}
        <BentoCard className="min-h-[280px] md:min-h-0 lg:col-span-6 lg:row-span-2" delay={0.4}>
          <BentoHeader title="Timeline" subtitle="Upcoming deadlines" icon={Calendar} />
          <BentoContent className="flex flex-col gap-3 mt-4 overflow-y-auto custom-scrollbar pr-2 h-[calc(100%-60px)]">
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((item, idx) => {
                  const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-3 rounded-2xl bg-muted/30 hover:bg-muted/60 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all cursor-pointer"
                      onClick={() => navigate('/assignments')}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        daysLeft <= 2 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-foreground/30" />
                          {getAssignmentSubjectName(item)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("text-xs font-bold px-2.5 py-1 rounded-lg inline-block", daysLeft <= 2 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                          {daysLeft} days left
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                          {new Date(item.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60">
                <div className="p-4 bg-muted/30 rounded-full mb-3">
                  <Calendar className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            )}
          </BentoContent>
        </BentoCard>

        {/* 4. Subject Heatmap - 4 Columns */}
        <BentoCard className="min-h-[180px] md:min-h-0 lg:col-span-4 p-0 overflow-hidden" delay={0.5}>
          <MiniChart title="Workload" data={miniChartData} className="!border-0 !bg-transparent w-full h-full" />
        </BentoCard>

        {/* 5. High Priority Alert - 4 Columns */}
        <BentoCard delay={0.6} className="min-h-[100px] md:min-h-0 lg:col-span-4 bg-gradient-to-br from-destructive/5 via-destructive/5 to-transparent border-destructive/10">
          <div className="flex flex-row items-center h-full p-6 gap-5">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 animate-pulse">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-destructive tracking-tight">{highPriorityCount}</h3>
              <p className="text-sm font-medium text-muted-foreground">High Priority Tasks</p>
            </div>
          </div>
        </BentoCard>

        {/* 6. Quick Actions - 4 Columns */}
        <BentoCard className="min-h-[100px] md:min-h-0 lg:col-span-4" delay={0.7}>
          <div className="flex h-full items-center justify-between p-4 px-6 gap-3">
            {[
              { icon: BookOpen, label: 'Subjects', path: '/dashboard/subjects' },
              { icon: CheckCircle, label: 'Tasks', path: '/dashboard/assignments' },
              { icon: MoreHorizontal, label: 'Settings', path: '/dashboard/settings' }
            ].map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="flex-1 h-20 flex-col gap-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </BentoCard>

      </div>
    </div>
  );
};

export default Dashboard;
