import React, { useState } from 'react';
import { useApp } from '../context';
import { Status } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CreateAssignmentModal from '../components/CreateAssignmentModal';

const Dashboard = () => {
  const { assignments, subjects } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Stats
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === Status.Completed).length;
  const pending = total - completed;

  // Chart Data
  const chartData = [
    { name: 'Completed', value: completed, color: '#22c55e' }, // green-500
    { name: 'Pending', value: pending, color: '#eab308' }, // yellow-500
  ];

  // Upcoming
  const upcoming = [...assignments]
    .filter(a => a.status !== Status.Completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Recent
  const recent = [...assignments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // By Subject
  const bySubject = subjects.map(s => ({
    name: s.name,
    count: assignments.filter(a => a.subjectId === s.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <CreateAssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-white/60 mt-1">Here is an overview of your academic workload.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search assignments..." 
              className="w-full h-10 pl-10 pr-4 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center h-10 px-4 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Add New
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
            <p className="text-slate-500 dark:text-white/60 font-medium">Total Assignments</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{total}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
            <p className="text-slate-500 dark:text-white/60 font-medium">Completed</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{completed}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
            <p className="text-slate-500 dark:text-white/60 font-medium">Pending</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{pending}</p>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Upcoming */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h2>
                <button onClick={() => navigate('/assignments')} className="text-sm font-semibold text-primary hover:underline">View All</button>
              </div>
              <div className="flex flex-col gap-2">
                {upcoming.map(item => {
                  const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  return (
                    <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`
                          flex items-center justify-center w-12 h-12 rounded-xl shrink-0
                          ${daysLeft <= 2 ? 'bg-red-100 text-red-500 dark:bg-red-500/10' : daysLeft <= 5 ? 'bg-yellow-100 text-yellow-500 dark:bg-yellow-500/10' : 'bg-green-100 text-green-500 dark:bg-green-500/10'}
                        `}>
                          <span className="material-symbols-outlined">{daysLeft <= 2 ? 'priority_high' : 'event'}</span>
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold line-clamp-1">{item.title}</p>
                          <p className="text-slate-500 dark:text-white/60 text-sm line-clamp-1">{getSubjectName(item.subjectId)} • Due in {daysLeft} days</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/assignments')} className="opacity-0 group-hover:opacity-100 text-primary text-sm font-semibold transition-opacity">Details</button>
                    </div>
                  );
                })}
                {upcoming.length === 0 && <p className="text-slate-500 dark:text-white/40 text-center py-4">No upcoming deadlines.</p>}
              </div>
            </motion.div>

            {/* Recently Added */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recently Added</h2>
              <div className="flex flex-col gap-2">
                {recent.map(item => (
                  <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
                        <span className="material-symbols-outlined">post_add</span>
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-bold line-clamp-1">{item.title}</p>
                        <p className="text-slate-500 dark:text-white/60 text-sm line-clamp-1">{getSubjectName(item.subjectId)}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/assignments')} className="opacity-0 group-hover:opacity-100 text-primary text-sm font-semibold transition-opacity">Details</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Status Chart */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Assignment Status</h2>
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">{total}</span>
                  <span className="text-slate-500 dark:text-white/60 text-sm">Total</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-600 dark:text-white/80">Completed</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{completed}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-600 dark:text-white/80">Pending</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{pending}</span>
                </div>
              </div>
            </motion.div>

            {/* Subjects List */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Assignments by Subject</h2>
              <div className="flex flex-col gap-4">
                {bySubject.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="text-slate-600 dark:text-white/80 text-sm font-medium">{item.name}</p>
                    <span className="flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;