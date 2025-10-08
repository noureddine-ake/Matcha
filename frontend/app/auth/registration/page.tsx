"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import Image from "next/image"
import api from "@/lib/api"
import { AxiosError } from "axios"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      router.push(`/auth/verify-email`);
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response?.data?.error || "Registration failed");
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient p-6">
      <div className="w-full max-w-6xl space-y-8 lg:flex">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center order-2 lg:items-center lg:w-full"
        >
          <Image src={"/Logo.png"} width={200} height={200} alt="logo" />
        </motion.div>

        {/* Registration Form */}
        <div className="space-y-6 w-full flex justify-center">
          <div className="w-full max-w-md">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-bold text-white text-left"
            >
              Registration
            </motion.h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* First Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="firstName" className="text-white text-base">
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="h-14 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </motion.div>

              {/* Last Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="lastName" className="text-white text-base">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="h-14 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-white text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-14 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </motion.div>

              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="text-white text-base">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="h-14 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-white text-base">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-14 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-300 text-sm text-center bg-red-500/20 py-2 px-4 rounded-full"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white text-lg font-semibold rounded-full shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Signing up..." : "Sign up"}
                </Button>
              </motion.div>
            </form>

            {/* Login Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="text-center text-secondary space-y-5"
            >
              Already have an account?{" "}
              <Link href="/auth/login" className="text-purple-300 hover:text-purple-200 font-medium transition-colors">
                Log in
              </Link>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  )
}
