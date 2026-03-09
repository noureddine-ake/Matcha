'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Heart, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

// Define an interface for your error response
interface ErrorResponse {
  error?: string;
  message?: string;
}

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/resend-verification', { email });
      setSuccess('Verification email sent! Check your inbox and click the link to verify your account.');
    } catch (err: unknown) {
      // Type guard to check if it's an AxiosError
      if (err instanceof AxiosError && err.response) {
        // Access the error message from the response data
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.error || errorData.message || 'Failed to send verification email');
      } else if (err instanceof Error) {
        // Handle generic errors
        setError(err.message);
      } else {
        // Handle unknown errors
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-6xl relative z-10 space-y-8 flex flex-col md:flex-row justify-center items-center md:space-x-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center lg:w-1/2 space-y-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"></div>
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-48 h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-20 h-20 text-white fill-white" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <Mail className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">
              Resend Verification
            </h2>
            <p className="text-purple-200 text-lg">
              Enter your email to receive a new verification link
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="w-full max-w-md lg:w-1/2"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Verify Your Email
              </motion.h1>
              <p className="text-purple-200">
                Enter your email address and we&apos;ll send you a verification link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-purple-200 text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="text-purple-200 hover:text-white text-sm transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}