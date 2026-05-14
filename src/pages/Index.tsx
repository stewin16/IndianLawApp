import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesGridBento from "@/components/FeaturesGridBento";
import TimelineSection from "@/components/TimelineSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import LegalNews from "@/components/LegalNews";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(true);

  // Set document title for SEO
  useEffect(() => {
    document.title = "LegalAI - AI-Powered Legal Assistant for Indian Law";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(progress);
      setShowScrollBtn(progress < 0.92);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollDown = () => {
    window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen text-gray-900">
      <TricolorBackground intensity="strong" showOrbs={true} />
      <Header />
      <main>
        <HeroSection />
        <LegalNews />
        <FeaturesGridBento />
        <HowItWorksSection />
        <TimelineSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />

      {/* ── Persistent Scroll Overlay ── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="fixed right-6 bottom-8 z-50 flex flex-col items-center gap-2"
          >
            {/* Scroll to Top — only shows after scrolling down 300px */}
            <AnimatePresence>
              {scrollProgress > 0.05 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-saffron/20 shadow-lg flex items-center justify-center text-navy-india hover:bg-saffron hover:text-white hover:border-saffron transition-all duration-300"
                  aria-label="Scroll to top"
                >
                  <ChevronUp className="w-5 h-5" strokeWidth={2} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="w-0.5 h-16 bg-navy-india/10 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 w-full rounded-full bg-gradient-to-b from-saffron to-green-india"
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>

            {/* Scroll Down — bouncing */}
            <motion.button
              onClick={handleScrollDown}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-saffron/20 shadow-lg flex items-center justify-center text-navy-india hover:bg-saffron hover:text-white hover:border-saffron transition-all duration-300"
              aria-label="Scroll down"
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Index;
