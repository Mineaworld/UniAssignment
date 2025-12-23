import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import GoogleIcon from '../components/GoogleIcon';
import { useApp } from '../context';

// ============================================================================
// Component
// ============================================================================

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useApp();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#101622]/50 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-8 md:p-10 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-white/60">
              Please sign in to continue.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
            {/* Email Input */}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </span>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
              />
            </label>

            {/* Password Input */}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="text-right">
                <a href="#" className="text-sm font-semibold text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="mt-2 h-12 w-full rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#101622] px-2 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600 dark:border-t-blue-400" />
                <span className="text-sm">Signing in...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span className="text-sm font-semibold">Sign in with Google</span>
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
