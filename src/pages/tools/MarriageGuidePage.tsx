import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, Heart, FileText, Sparkles, 
    Loader2, CheckCircle, Shield, Info, Scale, 
    Calendar, Globe, Users
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const MarriageGuidePage = () => {
    const [act, setAct] = useState("Hindu Marriage Act");
    const [isLoading, setIsLoading] = useState(false);
    const [guide, setGuide] = useState<string | null>(null);

    const marriageActs = [
        "Hindu Marriage Act, 1955",
        "Special Marriage Act, 1954",
        "Muslim Personal Law",
        "Christian Marriage Act"
    ];

    const generateGuide = async () => {
        setIsLoading(true);
        setGuide(null);

        try {
            const prompt = `Provide a complete guide for marriage registration in India under the ${act}:
            - Eligibility criteria
            - Necessary documents
            - Step-by-step registration procedure (Online/Offline)
            - Typical timeline and fees
            - Important legal rights post-marriage`;
            
            const systemPrompt = "You are a Family Law Expert in India. Provide a highly detailed, professional, and practical guide for marriage registration. Focus on the jurisdictional nuances of the selected law (HMA vs SMA etc.). Use clear headings and bullet points.";

            const result = await generateLegalContent(prompt, systemPrompt);
            setGuide(result);
            toast.success("Detailed guide generated!");
        } catch (error) {
            console.error("Guide Error:", error);
            toast.error("Failed to generate marriage guide.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
                <Link to="/features" className="inline-flex items-center gap-2 text-gray-500 hover:text-saffron mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500 text-white mb-6 shadow-premium">
                        <Heart className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Marriage <span className="premium-gradient-text">Registration Guide</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto italic font-serif">
                        Navigate the legal formalities of union. AI-powered guidance on 
                        Indian marriage acts, registration procedures, and documentation.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 items-start">
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4 text-saffron" />
                                1. Select Applicable Law
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {marriageActs.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setAct(m)}
                                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                                            act === m 
                                            ? "border-navy-india bg-navy-india text-white shadow-xl translate-x-1" 
                                            : "border-gray-100 bg-white hover:border-saffron/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act === m ? "bg-white/10" : "bg-gray-50 group-hover:bg-saffron/10 transition-colors"}`}>
                                                <Globe className={`w-5 h-5 ${act === m ? "text-white" : "text-gray-400 group-hover:text-saffron"}`} />
                                            </div>
                                            <span className="font-serif font-bold text-sm tracking-tight">{m}</span>
                                        </div>
                                        {act === m && <CheckCircle className="w-5 h-5 text-saffron fill-saffron/20" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <Button 
                            onClick={generateGuide}
                            disabled={isLoading}
                            className="w-full h-16 btn-navy rounded-2xl uppercase tracking-widest font-bold shadow-xl shadow-navy-india/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-3" /> Generate Personalized Guide</>}
                        </Button>
                    </div>

                    <div className="relative h-full min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {guide ? (
                                <motion.div
                                    key="guide-result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-premium rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative h-full flex flex-col bg-white"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-pink-500" />
                                    
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-pink-500" />
                                            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">REGISTRATION_PROTOCOL</span>
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText(guide || ""); toast.success("Copied!"); }} className="text-gray-400 hover:text-navy-india"><Scale className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 text-[13px] text-gray-700 leading-relaxed font-serif whitespace-pre-wrap italic">
                                        {guide}
                                    </div>

                                    <div className="mt-8 p-6 bg-pink-50/50 rounded-2xl border border-pink-100 flex items-start gap-4">
                                        <Shield className="w-6 h-6 text-pink-600 mt-1 shrink-0" />
                                        <div className="text-[11px] text-pink-800/80 leading-tight italic">
                                            Guidelines are based on national legal frameworks. Physical presence at the Registrar's office is mandatory for finalizing registration.
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="guide-placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] p-12 text-center bg-white/40"
                                >
                                    <Calendar className="w-16 h-16 text-gray-100 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-gray-300">Guide Waiting</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed italic font-serif">
                                        Select an applicable law to generate a tailored registration checklist and procedural guide.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Important Information Cards */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-navy-india uppercase tracking-widest mb-4">Age Criteria</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic font-serif">Legal age of marriage in India is currently 18 years for females and 21 years for males across various personal laws.</p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-navy-india uppercase tracking-widest mb-4">Notice Period</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic font-serif">Under the Special Marriage Act, a mandatory 30-day public notice is required before formal registration.</p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-navy-india uppercase tracking-widest mb-4">Witnesses</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic font-serif">Most registration processes require 2 to 3 witnesses with valid ID and address proof for the formal ceremony or signing.</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MarriageGuidePage;
