"use client";

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Button } from '../components/ui/Button';
import { NeonButton } from '../components/ui/NeonButton';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import GoogleIcon from '../components/GoogleIcon';
import AvatarUpload from '../components/AvatarUpload';
import { Loader2, ArrowRight, Sparkles, UserPlus, Eye as ViewIcon, EyeOff as ViewOffIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signup, loginWithGoogle } = useApp();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!name || !email || !password) {
        setError("Please fill in all fields");
        return;
      }
      setStep(2);
      setError('');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, major, avatarFile || undefined);
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <div className="absolute top-0 right-1/2 w-[1000px] h-[500px] translate-x-1/2 bg-primary/20 blur-[130px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full opacity-30 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <div className="w-full max-w-md p-6 relative z-10 flex flex-col gap-8">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Create account
          </h1>
          <p className="text-muted-foreground text-md">
            Start your academic journey with UniMinder.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="p-8 border-white/5 dark:border-white/5 bg-white/50 dark:bg-black/40 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
            <div className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-destructive bg-destructive/5 border border-destructive/10 p-3 rounded-xl flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSignUp} className="space-y-5">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-11 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="student@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 focus:border-primary/50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <ViewOffIcon className="h-4 w-4" />
                            ) : (
                              <ViewIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-center py-4">
                        <div className="relative group p-1 rounded-full border-2 border-dashed border-primary/30 hover:border-primary transition-colors cursor-pointer">
                          <AvatarUpload
                            onUpload={(file) => setAvatarFile(file)}
                            size="lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="major">Major / Focus</Label>
                        <Input
                          id="major"
                          placeholder="Computer Science"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          className="h-11 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 focus:border-primary/50"
                          autoFocus
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Back
                    </Button>
                  )}
                  <NeonButton
                    className="flex-1 h-11 text-base shadow-lg shadow-primary/20"
                    type="submit"
                    disabled={loading || isGoogleLoading}
                    variant="primary"
                    glow
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : step === 1 ? (
                      <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      'Create Account'
                    )}
                  </NeonButton>
                </div>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background/50 px-3 text-muted-foreground backdrop-blur-sm">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 gap-2 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                onClick={handleGoogleLogin}
                disabled={loading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span className="font-medium">Google</span>
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
          >
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
