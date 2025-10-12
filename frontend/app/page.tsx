"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-dark text-foreground">
      {/* Header */}
      <motion.header
        className="hidden md:flex justify-between items-center px-8 py-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-2xl font-bold bg-gradient text-primary bg-clip-text">
          Matcha
        </div>
        <button className="px-6 py-2 rounded-full bg-purple text-primary font-medium hover:opacity-90 transition-opacity" onClick={() => router.push('/auth/login')}>
          Sign In
        </button>
      </motion.header>

      {/* Mobile Header */}
      <motion.header
        className="md:hidden flex justify-between items-center px-4 py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-xl font-bold bg-gradient text-primary bg-clip-text">
          Matcha
        </div>
        <Button className="px-4 py-1 rounded-full bg-purple text-primary text-sm font-medium" onClick={() => router.push('/auth/login')}>
          Sign In
        </Button>
      </motion.header>

      {/* Main Section - Mobile */}
      <div className="md:hidden">
        <motion.main
          className="container mx-auto px-4 py-12 flex flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight mb-6 text-primary"
            variants={itemVariants}
          >
            More than matches — meaningful moments
          </motion.h1>
          <motion.p
            className="text-base md:text-lg lg:text-xl text-secondary max-w-2xl mb-12"
            variants={itemVariants}
          >
            Meet real people, not just profiles. Smart matches, instant chats,
            and genuine connections — all in one modern dating app.
          </motion.p>

          {/* Image with bottom content */}
          <motion.div
            className="relative mb-16 w-full max-w-3xl"
            variants={imageVariants}
          >
            <video autoPlay loop muted className="rounded-xl object-cover w-full h-full">
                <source src="/landing-page-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-0 w-full transform bg-primary text-secondary text-center text-2xl font-bold py-3 px-6 rounded">
              Swipe. Match. Chat.
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 w-full max-w-4xl"
            variants={containerVariants}
          >
            {[
              { value: "1.2M+", label: "Users" },
              { value: "540K+", label: "Matches" },
              { value: "500K+", label: "Satisfied" },
            ].map((stat, index) => (
              <motion.div key={index} className="text-center" variants={itemVariants}>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-secondary mt-2 text-sm sm:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            className="px-8 py-4 bg-purple text-primary rounded-full text-base md:text-lg font-medium hover:opacity-90 transition-opacity w-full max-w-xs"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/auth/registration')}
          >
            Get Started
          </motion.button>
        </motion.main>
      </div>

      {/* Main Section - Desktop */}
      <div className="hidden md:block ">
        <motion.main
          className="container mx-auto px-4 py-24 flex flex-col lg:flex-row items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="lg:w-1/2 mb-12 lg:mb-0 lg:pr-12">
            <motion.h1
              className="text-4xl lg:text-5xl xl:text-6xl font-bold max-w-3xl leading-tight mb-6 text-primary"
              variants={itemVariants}
            >
              More than matches — meaningful moments
            </motion.h1>
            <motion.p
              className="text-lg xl:text-xl text-secondary max-w-2xl mb-12"
              variants={itemVariants}
            >
              Meet real people, not just profiles. Smart matches, instant chats,
              and genuine connections — all in one modern dating app.
            </motion.p>

            {/* Stats Section */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 w-full max-w-4xl"
              variants={containerVariants}
            >
              {[
                { value: "1.2M+", label: "Users" },
                { value: "540K+", label: "Matches" },
                { value: "500K+", label: "Satisfied" },
              ].map((stat, index) => (
                <motion.div key={index} className="text-center" variants={itemVariants}>
                  <div className="text-3xl xl:text-4xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-secondary mt-2 text-base">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              className="px-8 py-4 bg-purple text-primary rounded-full text-lg font-medium hover:opacity-90 transition-opacity w-full max-w-xs"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/registration')}
            >
              Get Started
            </motion.button>
          </div>

          <div className="lg:w-1/2 lg:h-[500px] flex justify-center relative ">
            <motion.div
              className="relative w-full max-w-lg"
              variants={imageVariants}
            >

              <video autoPlay loop muted className="rounded-xl object-cover w-full h-full">
                <source src="/landing-page-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-0 w-full transform bg-primary text-secondary text-center text-2xl font-bold py-3 px-6 rounded">
                Swipe. Match. Chat.
              </div>
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default HomePage;
