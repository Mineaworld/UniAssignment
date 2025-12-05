
import React, { useState } from 'react';
import { useApp } from '../context';
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (name && email && password) {
      try {
        await signup(name, email, password);
        navigate('/');
      } catch (err: any) {
        console.error(err);
        setError('Failed to create account. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#101622]/50 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-8 md:p-10 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Uni Assignment Logo" className="w-16 h-16 rounded-xl shadow-lg" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-slate-500 dark:text-white/60">Join us to manage your assignments effortlessly.</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</span>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
