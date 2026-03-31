import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, ShieldAlert, FileText, Sparkles, 
    Loader2, CheckCircle, Shield, Info, Scale, 
    HeartOff, Gavel, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const DivorceGuidePage = () => {
    const [grounds, setGrounds] = useState("Mutual Consent");
    const [isLoading, setIsLoading] = useState(false);
    const [guide, setGuide] = useState<string | null>(null);

    const divorceGrounds = [
        "Mutual Consent Section 13B",
        "Cruelty / Desertion",
        "Adultery",
        "Mental Disorder / Conversion"
    ];

    const generateGuide = async () => {
        setIsLoading(true);
        setGuide(null);

        try {
            const prompt = `Provide a comprehensive procedural guide for divorce in India based on:
            - Selected Ground: ${grounds}
            - Step-by-step court procedure (Filing, First Motion, Cooling Period, Second Motion)
            - Necessary documentation (Evidence, Joint Petition, etc.)
            - Timeline for final decree
            - Alimony, Maintenance, and Child Custody considerations`;
            
            const systemPrompt = "You are a specialized Matrimonial Lawyer in India. Provide a highly professional, compassionate, and practical guide for the divorce process. Reference the Hindu Marriage Act, 1955 and other relevant personal laws. Use clear headers and structure.";

            const result = await generateLegalContent(prompt, systemPrompt);
            setGuide(result);
            toast.success("Detailed procedural guide generated!");
        } catch (error) {
            console.error("Guide Error:", error);
            toast.error("Failed to generate divorce guide.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900 border-t-4 border-red-600/10">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
                <Link to="/features" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-500 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white mb-6 shadow-premium">
                        <HeartOff className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Divorce <span className="premium-gradient-text">Procedure Guide</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto italic font-serif">
                        Clarity during transition. Detailed guidance on the Indian divorce process, 
                        legal grounds, and procedural timelines.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 items-start">
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                1. Select Legal Grounds
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {divorceGrounds.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGrounds(g)}
                                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                                            grounds === g 
                                            ? "border-gray-900 bg-gray-900 text-white shadow-xl translate-x-1" 
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${grounds === g ? "bg-white/10" : "bg-gray-50 group-hover:bg-red-50 transition-colors"}`}>
                                                <Gavel className={`w-5 h-5 ${grounds === g ? "text-white" : "text-gray-400 group-hover:text-red-500"}`} />
                                            </div>
                                            <span className="font-serif font-bold text-sm tracking-tight">{g}</span>
                                        </div>
                                        {grounds === g && <CheckCircle className="w-5 h-5 text-green-500 fill-green-500/20" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <Button 
                            onClick={generateGuide}
                            disabled={isLoading}
                            className="w-full h-16 btn-navy rounded-2xl uppercase tracking-widest font-bold shadow-xl shadow-navy-india/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-3" /> Generate Procedural Guide</>}
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
                                    <div className="absolute top-0 left-0 w-2 h-full bg-gray-900" />
                                    
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-900" />
                                            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">PROCEDURAL_TIMELINE</span>
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText(guide || ""); toast.success("Copied!"); }} className="text-gray-400 hover:text-navy-india"><Scale className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 text-[13px] text-gray-700 leading-relaxed font-serif whitespace-pre-wrap italic">
                                        {guide}
                                    </div>

                                    <div className="mt-8 p-6 bg-red-50/50 rounded-2xl border border-red-100 flex items-start gap-4">
                                        <Shield className="w-6 h-6 text-red-600 mt-1 shrink-0" />
                                        <div className="text-[11px] text-red-800/80 leading-tight italic">
                                            Legal matters related to family law should always be finalized through a Family Court. AI assistance is strictly informational.
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
                                    <ShieldAlert className="w-16 h-16 text-gray-100 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-gray-300">Guide Ready</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed italic font-serif">
                                        Select the legal grounds to get a comprehensive guide on the Indian court procedure for divorce.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* FAQ / Procedural Steps */}
                <div className="mt-20 p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -z-10" />
                    <h3 className="text-2xl font-serif font-bold text-navy-india mb-12 text-center underline decoration-red-500/20 underline-offset-8">Critical Procedural Brief</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 font-black text-gray-300 text-xl border border-gray-100">01</div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 font-serif">Cooling-off Period</h4>
                                <p className="text-xs text-gray-500 leading-relaxed italic">The standard 6-month cooling period can be waived by the court in specific cases under recent Supreme Court rulings.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 font-black text-gray-300 text-xl border border-gray-100">02</div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 font-serif">Mediation</h4>
                                <p className="text-xs text-gray-500 leading-relaxed italic">Court-ordered mediation is standard in family matters to attempt reconciliation before final hearing.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 font-black text-gray-300 text-xl border border-gray-100">03</div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 font-serif">Section 24 HMA</h4>
                                <p className="text-xs text-gray-500 leading-relaxed italic">Interim maintenance can be applied for 'pendente lite' while the main divorce proceedings are ongoing.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 font-black text-gray-300 text-xl border border-gray-100">04</div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 font-serif">Contested Decree</h4>
                                <p className="text-xs text-gray-500 leading-relaxed italic">Contested divorces on grounds of cruelty or desertion require evidentiary trial and can take 3-5 years.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DivorceGuidePage;
