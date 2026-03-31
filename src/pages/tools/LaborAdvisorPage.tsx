import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, Briefcase, FileCheck, Sparkles, 
    Loader2, CheckCircle, Shield, Info, Scale, 
    HardHat, UserCheck, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const LaborAdvisorPage = () => {
    const [issue, setIssue] = useState("Termination");
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);

    const laborIssues = [
        "Wrongful Termination",
        "PF & Gratuity Claims",
        "Maternity Benefits",
        "Overtime & Wage Arrears",
        "Harassment at Workplace"
    ];

    const generateAdvice = async () => {
        setIsLoading(true);
        setAdvice(null);

        try {
            const prompt = `Provide a comprehensive labor law advisory for an employee in India:
            - Selected Issue: ${issue}
            - Applicable Laws (e.g., Industrial Disputes Act, PF Act, Maternity Benefit Act)
            - Rights of the employee
            - Step-by-step grievance procedure (Internal, Labor Commissioner, Labor Court)
            - Necessary evidence for a claim`;
            
            const systemPrompt = "You are an Employment & Labor Law Expert in India. Provide a detailed, professional advisory on employee rights. Use clear headings and reference relevant sections like Section 25F of IDA for termination, etc.";

            const result = await generateLegalContent(prompt, systemPrompt);
            setAdvice(result);
            toast.success("Professional advisory generated!");
        } catch (error) {
            console.error("Advice Error:", error);
            toast.error("Failed to generate labor advisory.");
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white mb-6 shadow-premium">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Labor <span className="premium-gradient-text">Law Advisor</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto italic font-serif">
                        Empowering the workforce. Get expert legal advisory on employee rights, 
                        wrongful discharge, and statutory benefits under Indian Labor Code.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 items-start">
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <HardHat className="w-4 h-4 text-orange-600" />
                                1. Select Workplace Issue
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {laborIssues.map((li) => (
                                    <button
                                        key={li}
                                        onClick={() => setIssue(li)}
                                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                                            issue === li 
                                            ? "border-orange-600 bg-orange-600 text-white shadow-xl translate-x-1" 
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${issue === li ? "bg-white/10" : "bg-gray-50 group-hover:bg-orange-50 transition-colors"}`}>
                                                <UserCheck className={`w-5 h-5 ${issue === li ? "text-white" : "text-gray-400 group-hover:text-orange-600"}`} />
                                            </div>
                                            <span className="font-serif font-bold text-sm tracking-tight">{li}</span>
                                        </div>
                                        {issue === li && <CheckCircle className="w-5 h-5 text-orange-400 fill-orange-400/20" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <Button 
                            onClick={generateAdvice}
                            disabled={isLoading}
                            className="w-full h-16 btn-navy rounded-2xl uppercase tracking-widest font-bold shadow-xl shadow-navy-india/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-3" /> Get Expert Advice</>}
                        </Button>
                    </div>

                    <div className="relative h-full min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {advice ? (
                                <motion.div
                                    key="advice-result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-premium rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative h-full flex flex-col bg-white"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />
                                    
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="w-4 h-4 text-orange-600" />
                                            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">ADVISORY_REPORT</span>
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText(advice || ""); toast.success("Copied!"); }} className="text-gray-400 hover:text-navy-india"><Scale className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 text-[13px] text-gray-700 leading-relaxed font-serif whitespace-pre-wrap italic">
                                        {advice}
                                    </div>

                                    <div className="mt-8 p-6 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-start gap-4">
                                        <ShieldCheck className="w-6 h-6 text-orange-600 mt-1 shrink-0" />
                                        <div className="text-[11px] text-orange-800/80 leading-tight italic">
                                            Information provided is for workforce empowerment only. For formal legal action, consult a registered trade union or labor lawyer.
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="advice-placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] p-12 text-center bg-white/40"
                                >
                                    <Scale className="w-16 h-16 text-gray-100 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-gray-300">Advisor Ready</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed italic font-serif">
                                        Select a labor category to get a specialized advisory on your workplace rights in India.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Statutory Benefits Cards */}
                <div className="mt-20 p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                    <h3 className="text-2xl font-serif font-bold text-navy-india mb-12 text-center">Labor Code Quick Grid</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <Info className="w-6 h-6 text-saffron mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Gratuity</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Payment is mandatory for employees who have completed 5 years of continuous service in any establishment with 10+ employees.</p>
                        </div>
                        <div>
                            <Info className="w-6 h-6 text-blue-600 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Provident Fund</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Mandatory contributions for establishments with 20+ employees. Employer must contribute matching share (12%).</p>
                        </div>
                        <div>
                            <Info className="w-6 h-6 text-emerald-600 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Notice Pay</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Employers must provide 1 month's notice or salary in lieu of notice for termination of long-term employees.</p>
                        </div>
                        <div>
                            <Info className="w-6 h-6 text-orange-600 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">POSH Act</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Protection of Women from Sexual Harassment is a mandatory compliance for every firm with Internal Committees.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default LaborAdvisorPage;
