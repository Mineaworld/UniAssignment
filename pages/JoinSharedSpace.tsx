import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Link2, Users } from 'lucide-react';
import { useApp } from '../context';
import { useToast } from '../components/ToastContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { rememberPostAuthRedirect } from '../utils/sharedSpaces';

const JoinSharedSpace = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { joinSharedSpace, loading: authLoading, user } = useApp();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inviteId) {
      setError('This invite link is missing the share id.');
      setLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      rememberPostAuthRedirect(`/join/${inviteId}`);
      navigate('/login', { replace: true });
      return;
    }

    const join = async () => {
      try {
        const joinedSpace = await joinSharedSpace(inviteId);
        const successMessage = joinedSpace.targetType === 'assignment'
          ? 'Shared assignment added to your workspace.'
          : 'Shared subject added to your workspace.';

        showToast(successMessage, 'success');
        navigate('/dashboard/assignments', {
          replace: true,
          state: {
            joinedSharedSpaceId: joinedSpace.spaceId,
            joinedSharedTargetType: joinedSpace.targetType,
          },
        });
      } catch (joinError) {
        const message = joinError instanceof Error ? joinError.message : 'Failed to join this shared item.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void join();
  }, [authLoading, inviteId, joinSharedSpace, navigate, showToast, user]);

  return (
    <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
      <GlassCard className="w-full max-w-lg rounded-3xl border border-border/60 bg-background/80 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-3xl bg-primary/10 p-4 text-primary">
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Users className="h-8 w-8" />}
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">
            {loading ? 'Joining shared item' : 'Invite status'}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {loading
              ? 'We are checking the invite and adding you to the shared workspace.'
              : error || 'This invite is ready.'}
          </p>

          {!loading && error && (
            <div className="mt-6 w-full rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-left">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="text-sm text-muted-foreground">
                  The link may be disabled, expired, or already removed by the owner.
                </div>
              </div>
            </div>
          )}

          {!loading && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/assignments')}>
                Go to assignments
              </Button>
              <Button type="button" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default JoinSharedSpace;
