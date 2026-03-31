import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, MapPin, Scale, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("@/pages/Index"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const DraftingPage = lazy(() => import("@/pages/DraftingPage"));
const SummarizePage = lazy(() => import("@/pages/SummarizePage"));
const ComparisonPage = lazy(() => import("@/pages/ComparisonPage"));
const AIFeaturesHub = lazy(() => import("@/pages/AIFeaturesHub"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const BailCheckerPage = lazy(() => import("@/pages/tools/BailCheckerPage"));
const CasePredictorPage = lazy(() => import("@/pages/tools/CasePredictorPage"));
const FIRGeneratorPage = lazy(() => import("@/pages/tools/FIRGeneratorPage"));
const LawyerFinderPage = lazy(() => import("@/pages/tools/LawyerFinderPage"));
const PrecedentMatcherPage = lazy(() => import("@/pages/tools/PrecedentMatcherPage"));
const RiskAnalyzerPage = lazy(() => import("@/pages/tools/RiskAnalyzerPage"));
const SectionFinderPage = lazy(() => import("@/pages/tools/SectionFinderPage"));
const TranslatorPage = lazy(() => import("@/pages/tools/TranslatorPage"));
const JargonExplainerPage = lazy(() => import("@/pages/tools/JargonExplainerPage"));
const ConsumerComplaintPage = lazy(() => import("@/pages/tools/ConsumerComplaintPage"));
const RTIGeneratorPage = lazy(() => import("@/pages/tools/RTIGeneratorPage"));
const CyberCrimeReporterPage = lazy(() => import("@/pages/tools/CyberCrimeReporterPage"));
const LegalCostEstimatorPage = lazy(() => import("@/pages/tools/LegalCostEstimatorPage"));
const JudgmentSimplifierPage = lazy(() => import("@/pages/tools/JudgmentSimplifierPage"));
const PropertyVerifierPage = lazy(() => import("@/pages/tools/PropertyVerifierPage"));
const MarriageGuidePage = lazy(() => import("@/pages/tools/MarriageGuidePage"));
const DivorceGuidePage = lazy(() => import("@/pages/tools/DivorceGuidePage"));
const LaborAdvisorPage = lazy(() => import("@/pages/tools/LaborAdvisorPage"));

type ComingSoonProps = {
  title: string;
  description: string;
  accent: string;
};

function RouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <div className="animate-pulse text-sm font-medium tracking-wide text-navy-india/70">Loading legal workspace...</div>
    </div>
  );
}

function ComingSoonPage({ title, description, accent }: ComingSoonProps) {
  return (
    <div className="min-h-screen text-gray-900 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,153,51,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(19,136,8,0.12),transparent_35%)]" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="w-3 h-3" />
            Expansion in progress
          </div>

          <h1 className="editorial-title mb-5">
            {title}
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-10">
            {description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            <div className="glass-premium rounded-2xl p-5 border border-navy-india/10">
              <ShieldCheck className="w-5 h-5 text-green-india mb-3" />
              <p className="text-sm font-semibold text-navy-india">Reliable guidance</p>
              <p className="text-xs text-gray-500 mt-1">Designed to be replaced with a dedicated workflow.</p>
            </div>
            <div className="glass-premium rounded-2xl p-5 border border-navy-india/10">
              <Scale className="w-5 h-5 text-saffron mb-3" />
              <p className="text-sm font-semibold text-navy-india">Indian law focused</p>
              <p className="text-xs text-gray-500 mt-1">Keeps the experience consistent with the rest of the app.</p>
            </div>
            <div className="glass-premium rounded-2xl p-5 border border-navy-india/10">
              <MapPin className="w-5 h-5 text-navy-india mb-3" />
              <p className="text-sm font-semibold text-navy-india">Future-ready shell</p>
              <p className="text-xs text-gray-500 mt-1">No broken navigation while features are being added.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-navy rounded-full px-6 h-11">
              <Link to="/features">
                Explore AI Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6 h-11 border-2" >
              <Link to="/chat">Open Assistant</Link>
            </Button>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-[0.25em]">
            <FileText className="w-3 h-3" />
            {accent}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Toaster />

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/features" element={<ProtectedRoute><AIFeaturesHub /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/draft" element={<ProtectedRoute><DraftingPage /></ProtectedRoute>} />
            <Route path="/summarize" element={<ProtectedRoute><SummarizePage /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />

            <Route path="/tools/bail-checker" element={<ProtectedRoute><BailCheckerPage /></ProtectedRoute>} />
            <Route path="/tools/case-predictor" element={<ProtectedRoute><CasePredictorPage /></ProtectedRoute>} />
            <Route path="/tools/fir-generator" element={<ProtectedRoute><FIRGeneratorPage /></ProtectedRoute>} />
            <Route path="/tools/lawyer-finder" element={<ProtectedRoute><LawyerFinderPage /></ProtectedRoute>} />
            <Route path="/tools/precedent-matcher" element={<ProtectedRoute><PrecedentMatcherPage /></ProtectedRoute>} />
            <Route path="/tools/risk-analyzer" element={<ProtectedRoute><RiskAnalyzerPage /></ProtectedRoute>} />
            <Route path="/tools/section-finder" element={<ProtectedRoute><SectionFinderPage /></ProtectedRoute>} />
            <Route path="/tools/translator" element={<ProtectedRoute><TranslatorPage /></ProtectedRoute>} />

            <Route path="/tools/consumer-complaint" element={<ProtectedRoute><ConsumerComplaintPage /></ProtectedRoute>} />
            <Route path="/tools/rti-generator" element={<ProtectedRoute><RTIGeneratorPage /></ProtectedRoute>} />
            <Route path="/tools/cost-estimator" element={<ProtectedRoute><LegalCostEstimatorPage /></ProtectedRoute>} />
            <Route path="/tools/jargon-explainer" element={<ProtectedRoute><JargonExplainerPage /></ProtectedRoute>} />
            <Route path="/tools/judgment-simplifier" element={<ProtectedRoute><JudgmentSimplifierPage /></ProtectedRoute>} />
            <Route path="/tools/property-verifier" element={<ProtectedRoute><PropertyVerifierPage /></ProtectedRoute>} />
            <Route path="/tools/cyber-complaint" element={<ProtectedRoute><CyberCrimeReporterPage /></ProtectedRoute>} />
            <Route path="/tools/marriage-guide" element={<ProtectedRoute><MarriageGuidePage /></ProtectedRoute>} />
            <Route path="/tools/divorce-guide" element={<ProtectedRoute><DivorceGuidePage /></ProtectedRoute>} />
            <Route path="/tools/labor-advisor" element={<ProtectedRoute><LaborAdvisorPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
            <Route path="/tools" element={<Navigate to="/features" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
