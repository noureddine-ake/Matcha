'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Settings, Mail, AlertCircle, CheckCircle, Loader2, User, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface UserData {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface PendingStatus {
  hasPendingEmail: boolean;
  pendingEmail: string | null;
  currentEmail: string;
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statusRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/email-update/status'),
        ]);
        setUser(userRes.data);
        setPendingStatus(statusRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newEmail) {
      setError('Please enter a new email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/email-update/request', { newEmail });
      setSuccess(response.data.message);
      setNewEmail('');
      const statusRes = await api.get('/email-update/status');
      setPendingStatus(statusRes.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.error || errorData.message || 'Failed to send verification email');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelUpdate = async () => {
    setError('');
    setCancelling(true);

    try {
      await api.post('/email-update/cancel');
      const statusRes = await api.get('/email-update/status');
      setPendingStatus(statusRes.data);
      setSuccess('Email change cancelled');
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.error || errorData.message || 'Failed to cancel email change');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-red-900">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Account Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-purple-200 text-sm">Username</Label>
                  <p className="text-white font-medium">{user?.username}</p>
                </div>
                <div>
                  <Label className="text-purple-200 text-sm">Name</Label>
                  <p className="text-white font-medium">
                    {user?.first_name || ''} {user?.last_name || ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Email Address</h2>
              </div>

              <div className="mb-4">
                <Label className="text-purple-200 text-sm">Current Email</Label>
                <p className="text-white font-medium flex items-center gap-2">
                  {pendingStatus?.currentEmail}
                  {pendingStatus?.hasPendingEmail && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                      Pending change
                    </span>
                  )}
                </p>
              </div>

              {pendingStatus?.hasPendingEmail ? (
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-200 text-sm">
                          A verification email has been sent to:
                        </p>
                        <p className="text-white font-medium">{pendingStatus.pendingEmail}</p>
                        <p className="text-yellow-200/70 text-xs mt-1">
                          Check your inbox and click the confirmation link to complete the change.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCancelUpdate}
                    disabled={cancelling}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Email Change'
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEmailUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="newEmail" className="text-purple-200 text-sm">
                      New Email Address
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter your new email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-300 text-sm bg-red-500/20 py-3 px-4 rounded-xl flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-green-300 text-sm bg-green-500/20 py-3 px-4 rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {success}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Verification...
                      </>
                    ) : (
                      'Send Verification Email'
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}