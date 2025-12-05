import React from 'react';
import { useApp } from '../context';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, logout } = useApp();

  const sections = [

    {
      title: 'Profile Settings',
      description: 'Manage your personal information.',
      icon: 'person',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
              <input
                type="text"
                value={user?.name}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-white/60 px-4 h-12 cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</span>
              <input
                type="email"
                value={user?.email}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-white/60 px-4 h-12 cursor-not-allowed"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Major</span>
            <input
              type="text"
              value={user?.major}
              disabled
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-white/60 px-4 h-12 cursor-not-allowed"
            />
          </label>
        </div>
      )
    },
    {
      title: 'Telegram Notifications',
      description: 'Link your Telegram account to receive assignment reminders.',
      icon: 'send',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Connect your Telegram account to receive notifications about upcoming assignment deadlines.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://t.me/UniAssignmentBot?start=${user?.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.155.231.17.325.015.093.035.305.019.47z" />
              </svg>
              Link Telegram Account
            </a>
            <button
              onClick={() => {
                const linkUrl = `https://t.me/UniAssignmentBot?start=${user?.uid}`;
                navigator.clipboard.writeText(linkUrl);
                alert('Link copied to clipboard!');
              }}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              <span className="material-symbols-outlined text-xl">content_copy</span>
              Copy Link
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            After clicking the link, press "Start" in Telegram to complete the connection.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-white/60 mt-1">Manage your preferences and account settings.</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">{section.icon}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
                <p className="text-slate-500 dark:text-white/60 text-sm mt-1">{section.description}</p>
              </div>
            </div>
            {section.content}
          </motion.div>
        ))}

        <div className="pt-6 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out of All Devices
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;