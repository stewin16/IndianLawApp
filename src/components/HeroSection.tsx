import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-start overflow-visible bg-gradient-hero pt-4 md:pt-8 pb-20">
      {/* Background Gradients - Enhanced tricolor glows */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-saffron/12 rounded-full blur-[140px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-green-india/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />

      {/* Content Container */}
      <div className="container relative z-10 px-4 md:px-6 text-center max-w-7xl mx-auto pt-4">

        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-premium border border-white/40 shadow-sm group hover:scale-105 transition-all duration-500">
              <div className="flex -space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-saffron border-2 border-white shadow-sm" />
                <div className="w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                  <div className="w-3.5 h-3.5 rounded-full border border-navy-india animate-spin" />
                </div>
                <div className="w-7 h-7 rounded-full bg-green-india border-2 border-white shadow-sm" />
              </div>
              <div className="flex flex-col items-start border-l border-navy-india/10 pl-4">
                <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-[0.2em] leading-none mb-1">Status: Active_Protocol</span>
                <span className="text-xs font-bold text-navy-india tracking-wider uppercase">Digital India Initiative</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-4"
        >
          {/* Floating Accents */}
          <motion.div
            animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-40 h-40 bg-saffron/10 rounded-[3rem] blur-2xl hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-20 -right-20 w-48 h-48 bg-green-india/10 rounded-full blur-2xl hidden lg:block"
          />

          <h1 className="editorial-title text-navy-india">
            Legal Clarity <br />
            <span className="premium-gradient-text italic font-serif font-light tracking-tight inline-block pr-6 pb-4 pt-2 -mt-4">Redefined</span>
          </h1>
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="editorial-subtitle max-w-4xl mx-auto mb-8"
        >
          The most advanced AI assistant for Indian Law. Compare statutes, analyze case laws, and get criminal justice insights{' '}
          <span className="text-navy-india font-semibold border-b-4 border-saffron/30 pb-1">instantly</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link to="/chat">
            <Button size="lg" className="h-16 px-10 text-lg rounded-full btn-saffron group shadow-saffron-glow hover:scale-105 transition-all duration-500">
              <Zap className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              Describe a Crime
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/compare">
            <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-full btn-outline-premium hover:scale-105 transition-all duration-500">
              Compare BNS vs IPC
            </Button>
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-india" />
            Verified Criminal Datasets
          </span>
          <span className="w-1.5 h-1.5 bg-saffron rounded-full hidden sm:block" />
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-india" />
            Updated for 2025
          </span>
          <span className="w-1.5 h-1.5 bg-saffron rounded-full hidden sm:block" />
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-india" />
            100% Private & Secure
          </span>
        </motion.div>

      </div>
    </div>
  );
};

export default HeroSection;
