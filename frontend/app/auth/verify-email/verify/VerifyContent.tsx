'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, Heart } from 'lucide-react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface ApiResponse {
  message?: string;
}

export default function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your new email...');

  useEffect(() => {
    let isMounted = true;
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post<ApiResponse>('/auth/verify-email/token', { token });
        
        if (isMounted) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully!');
          
          setTimeout(() => {
            router.push('/auth/profile/complete');
          }, 3000);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          
          if (err instanceof AxiosError && err.response) {
            const errorData = err.response.data as ErrorResponse;
            setMessage(errorData.error || errorData.message || 'Verification failed. The link may be invalid or expired.');
          } else if (err instanceof Error) {
            setMessage(err.message);
          } else {
            setMessage('Verification failed. The link may be invalid or expired.');
          }
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <>
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
          {status === 'loading' ? (
            <>
              <Loader2 className="w-16 h-16 text-purple-300 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-bold text-white mb-3">
                Verifying Email
              </h2>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-3">
                Email Updated!
              </h2>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-3">
                Verification Failed
              </h2>
            </>
          )}
          <p className="text-purple-200 text-lg">
            {message}
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
              {status === 'loading' ? 'Please Wait' : status === 'success' ? 'Success!' : 'Error'}
            </motion.h1>
            <p className="text-purple-200">
              {status === 'loading' 
                ? 'We are verifying your new email address' 
                : status === 'success' 
                  ? 'Redirecting you to settings shortly...' 
                  : 'Please try again or request a new verification link from settings'}
            </p>
          </div>

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Button
                onClick={() => router.push('/settings')}
                className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition-all duration-200"
              >
                <Mail className="mr-2 h-5 w-5" />
                Go to Settings
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}