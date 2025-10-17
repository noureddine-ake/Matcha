'use client';

import { motion } from 'framer-motion';
import { Heart, Sparkles, Users, Shield, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      {/* Animated background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-white">Matcha</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8">
          <motion.a
            href="#features"
            className="text-white/80 hover:text-white transition"
            whileHover={{ scale: 1.05 }}
          >
            Features
          </motion.a>
          <motion.a
            href="#how-it-works"
            className="text-white/80 hover:text-white transition"
            whileHover={{ scale: 1.05 }}
          >
            How it Works
          </motion.a>
          <motion.a
            href="#testimonials"
            className="text-white/80 hover:text-white transition"
            whileHover={{ scale: 1.05 }}
          >
            Testimonials
          </motion.a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <motion.button
              className="text-white/80 hover:text-white transition"
              whileHover={{ scale: 1.05 }}
            >
              Log in
            </motion.button>
          </Link>
          <Link href="/auth/registration">
            <motion.button
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign up
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div className="space-y-8">
            <motion.h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Match
              </span>
            </motion.h1>

            <motion.p className="text-xl text-white/80 leading-relaxed">
              Connect with like-minded people who share your interests and
              values. Matcha makes it easy to find meaningful connections in a
              safe, beautiful environment.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/auth/registration">
                <motion.button
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/50 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition backdrop-blur-sm"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const section = document.getElementById('how-it-works');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-3 gap-6 pt-8">
              {[
                { number: '50K+', label: 'Active Users' },
                { number: '10K+', label: 'Matches Daily' },
                { number: '4.9★', label: 'Rating' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">
                    {stat.number}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div className="relative h-96 md:h-full">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl backdrop-blur-xl border border-white/20 overflow-hidden"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/landing-page-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-pink-400/40 to-purple-400/40">
                <motion.div
                  className="text-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Sparkles className="w-24 h-24 text-pink-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-semibold">
                    Your Perfect Match Awaits
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Why Choose Matcha?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Safe & Secure',
              description:
                'Your privacy and safety are our top priority with verified profiles and secure messaging.',
            },
            {
              icon: Users,
              title: 'Smart Matching',
              description:
                "Our algorithm learns your preferences to suggest compatible matches you'll love.",
            },
            {
              icon: Zap,
              title: 'Instant Connections',
              description:
                'Connect with people who share your interests and values in real-time.',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition"
                whileHover={{ rotate: 10 }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How it Works Section */}
      <motion.section
        id="how-it-works"
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-30" />

          {[
            {
              step: 1,
              title: 'Create Account',
              description:
                'Sign up with your email and create a secure account in seconds.',
              icon: Users,
            },
            {
              step: 2,
              title: 'Complete Profile',
              description:
                'Add your photos, interests, and tell us about yourself.',
              icon: Sparkles,
            },
            {
              step: 3,
              title: 'Get Matched',
              description:
                'Our algorithm finds compatible matches based on your preferences.',
              icon: Heart,
            },
            {
              step: 4,
              title: 'Connect',
              description:
                'Start chatting and build meaningful connections with matches.',
              icon: Users,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition text-center h-full flex flex-col items-center justify-center group"
                whileHover={{
                  y: -5,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-2xl font-bold text-white">
                    {item.step}
                  </span>
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm">{item.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        id="testimonials"
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          What Our Users Say
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Johnson',
              role: 'Matched 6 months ago',
              image: 'SJ',
              rating: 5,
              text: "I found my perfect match on Matcha! The app's matching algorithm is incredibly accurate. We've been together for 6 months now and couldn't be happier.",
            },
            {
              name: 'Alex Chen',
              role: 'Active member',
              image: 'AC',
              rating: 5,
              text: 'The interface is so intuitive and beautiful. I love how easy it is to connect with people who share my interests. Highly recommend!',
            },
            {
              name: 'Emma Williams',
              role: 'Matched 3 months ago',
              image: 'EW',
              rating: 5,
              text: "Finally found an app that takes safety seriously. The verification process gives me peace of mind, and I've met some amazing people.",
            },
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              className="p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <motion.span
                    key={j}
                    className="text-yellow-400 text-lg"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: j * 0.1 }}
                    viewport={{ once: true }}
                  >
                    ★
                  </motion.span>
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-white/90 mb-6 leading-relaxed italic">
                {testimonial.text}
              </p>

              {/* User Info */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center font-semibold text-white group-hover:scale-110 transition"
                  whileHover={{ rotate: 10 }}
                >
                  {testimonial.image}
                </motion.div>
                <div>
                  <h4 className="font-semibold text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-20 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="p-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl border border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Match?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of people finding meaningful connections on Matcha.
          </p>
          <Link href="/auth/registration">
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your Profile
            </motion.button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="relative z-10 border-t border-white/10 mt-20 py-12 px-6 md:px-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Contact'] },
            { title: 'Social', links: ['Twitter', 'Instagram', 'Facebook'] },
          ].map((col, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      className="text-white/60 hover:text-white transition"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; 2025 Matcha. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
