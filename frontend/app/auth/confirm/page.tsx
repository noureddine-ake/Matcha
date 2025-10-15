"use client";
import React, { useState, useEffect } from 'react';
import api from "@/lib/api";

const ConfirmPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('No token provided in URL');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/auth/reset-password/confirm', {
        token: token,
        newPassword: newPassword
      });
      
      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/auth/login'; // Redirect to login after success
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      console.error('Confirm password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
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
        
        <div 
          className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800 text-center"
          style={{ backgroundColor: '#111111', maxWidth: '400px' }}
        >
          <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8" 
              style={{ color: '#ef4444' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--light)' }}
          >
            Invalid Request
          </h1>
          <p 
            className="text-gray-400"
            style={{ color: 'var(--gray)' }}
          >
            No token provided in URL. Please check your reset password link.
          </p>
        </div>
      </div>
    );
  }

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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                ></path>
              </svg>
            </div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--light)' }}
            >
              Set New Password
            </h1>
            <p 
              className="text-gray-400 text-sm"
              style={{ color: 'var(--gray)' }}
            >
              Enter your new password to reset your account
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-900 border border-green-700">
              <div className="flex items-center">
                <svg 
                  className="w-5 h-5 mr-2" 
                  style={{ color: '#10b981' }}
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
                <span className="text-green-200">Password reset successfully! Redirecting to login...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900 border border-red-700">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--light)' }}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:outline-none transition-all duration-200 bg-gray-800"
                  style={{
                    backgroundColor: '#1f1f1f',
                    borderColor: 'var(--gray)',
                    color: 'var(--light)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  placeholder="Enter new password"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--light)' }}
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:outline-none transition-all duration-200 bg-gray-800"
                  style={{
                    backgroundColor: '#1f1f1f',
                    borderColor: 'var(--gray)',
                    color: 'var(--light)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  placeholder="Confirm new password"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: success ? '#10b981' : 'var(--purple)',
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
                  <span>Resetting...</span>
                </>
              ) : success ? (
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
                  <span>Password Reset!</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a 
              href="/login" 
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
            Make sure your password is at least 6 characters long and includes a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPassword;