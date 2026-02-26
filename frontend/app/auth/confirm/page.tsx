"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, Check, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { AxiosError } from "axios";

const ConfirmPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No token provided in URL");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.post("/auth/reset-password/confirm", {
        token: token,
        newPassword: newPassword,
      });

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to reset password. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="size-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Request</h1>
          <p className="text-white/60">
            No token provided in URL. Please check your reset password link.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="size-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-white/60 text-sm">
            Enter your new password to reset your account
          </p>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-green-500/20 border border-green-500/30"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-200 text-sm">
                Password reset successfully! Redirecting to login...
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/30"
          >
            <p className="text-red-200 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-white text-base font-medium">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl pl-12 pr-12 focus-visible:ring-2 focus-visible:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white text-base font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl pl-12 pr-12 focus-visible:ring-2 focus-visible:ring-purple-400"
              />
              {confirmPassword && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {newPassword === confirmPassword ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting...
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                Password Reset!
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            Back to Login
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
            Make sure your password is at least 6 characters long.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmPassword;
