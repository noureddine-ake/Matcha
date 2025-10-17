"use client";
import React, { useState } from 'react';
import api from "@/lib/api";

const App = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/auth/reset-password/request', {
        email: email
      });
      
      if (response.status === 200) {
        setIsSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setEmail('');
        }, 3000);
      }
    }  catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      console.error('Reset password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--dark)',
        backgroundImage: `linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(186, 186, 186, 0.1) 100%)`
      }}
    >
      <style jsx>{`
        :root {
          --dark: #000000;
          --light: #ffffff;
          --purple: #a259ff;
          --gray: #bababa;
        }
      `}</style>
      
      <div className="w-full max-w-md">
        <div 
          className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800"
          style={{ backgroundColor: '#111111' }}
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8" 
                style={{ color: 'var(--purple)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--light)' }}
            >
              Reset Your Password
            </h1>
            <p 
              className="text-gray-400 text-sm"
              style={{ color: 'var(--gray)' }}
            >
              {"Enter your email address and we'll send you a link to reset your password"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900 border border-red-700">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--light)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:outline-none transition-all duration-200 bg-gray-800"
                  style={{
                    backgroundColor: '#1f1f1f',
                    borderColor: 'var(--gray)',
                    color: 'var(--light)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: 'var(--gray)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSubmitted ? '#10b981' : 'var(--purple)',
                color: 'var(--light)',
                boxShadow: '0 4px 6px rgba(162, 89, 255, 0.3)'
              }}
            >
              {isSubmitting ? (
                <>
                  <svg 
                    className="animate-spin w-5 h-5" 
                    style={{ color: 'var(--light)' }}
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: 'var(--light)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>Email Sent!</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: 'var(--light)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    ></path>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a 
              href="/auth/login" 
              className="text-sm font-medium hover:underline transition-colors duration-200"
              style={{ color: 'var(--purple)' }}
            >
              Back to Login
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p 
            className="text-xs text-gray-500"
            style={{ color: 'var(--gray)' }}
          >
            {"Didn't receive the email? Check your spam folder or "}
            <a 
              href="#" 
              className="font-medium hover:underline"
              style={{ color: 'var(--purple)' }}
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;