import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { NeonButton } from '../components/ui/NeonButton';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Bell, LogOut, User, Shield, Loader2 } from 'lucide-react';
import AvatarUpload from '../components/AvatarUpload';
import { cn } from '../utils/cn';
import { generateTelegramLinkUrl } from '../utils/telegramLinkToken';

const Settings = () => {
  const { user, logout, updateUserProfile } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [major, setMajor] = useState(user?.major || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMajor(user.major);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        name,
        major,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

const formatLinkedDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleConnectTelegram = async () => {
    if (!user?.uid) return;
    
    setTelegramLinkLoading(true);
    try {
      const url = await generateTelegramLinkUrl(user.uid);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to generate Telegram link:', error);
    } finally {
      setTelegramLinkLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-8 space-y-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-base mt-2">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Section */}
        <div className="glass-card rounded-3xl border border-border/60 p-6 md:p-8 subtle-shadow">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatarUrl={user?.avatar}
                onUpload={(file) => updateUserProfile({}, file)}
                size="lg"
              />
            </div>
            <div className="flex-1 space-y-6 w-full">
              <div className="flex justify-between items-center border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Profile Information</h2>
                {!isEditing ? (
                  <NeonButton variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </NeonButton>
                ) : (
                  <div className="flex gap-2">
                    <NeonButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </NeonButton>
                    <NeonButton variant="primary" size="sm" onClick={handleSave} disabled={loading} glow>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </NeonButton>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <Label className="text-muted-foreground/80 font-medium">Display Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-muted-foreground/80 font-medium">Email Address</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label className="text-muted-foreground/80 font-medium">Major / Focus</Label>
                  <Input
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass-card rounded-3xl border border-border/60 p-6 md:p-8 subtle-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-5 flex gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Telegram Integration</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your Telegram to receive instant updates about assignments and tasks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.telegramLinked ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold border border-emerald-500/20">
                  <User className="h-4 w-4" />
                  Connected
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold border border-amber-500/20">
                  <Shield className="h-4 w-4" />
                  Not Connected
                </div>
              )}
              {user?.telegramLinked && user?.telegramLinkedAt && (
                <span className="text-sm text-muted-foreground">
                  since {formatLinkedDate(user.telegramLinkedAt)}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
<NeonButton
                variant="outline"
                className={cn(
                  "gap-2 rounded-2xl border-border/60 hover:border-primary/40 hover:bg-primary/5",
                  !user?.telegramLinked && "border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60"
                )}
                onClick={handleConnectTelegram}
                disabled={telegramLinkLoading}
              >
                {telegramLinkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {user?.telegramLinked ? 'Open Telegram Bot' : 'Connect Telegram'}
              </NeonButton>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="flex justify-end pt-4">
          <NeonButton
            variant="danger"
            onClick={handleLogout}
            className="gap-2 rounded-2xl"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

export default Settings;
