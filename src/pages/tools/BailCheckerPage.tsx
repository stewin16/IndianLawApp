import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle,
    ExternalLink, Copy, Unlock, AlertCircle, ShieldCheck, Scale
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent, parseModelJson } from "@/services/groqService";

interface BailResult {
    bailable: boolean;
    conditions: string[];
    section: string;
    provision: string;
    reasoning: string;
}

const BailCheckerPage = () => {
    const [offense, setOffense] = useState("");
    const [section, setSection] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BailResult | null>(null);

    const handleSubmit = async () => {
        if (!offense.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const systemPrompt = `You are an expert Indian Criminal Law Consultant. 
            Analyze the bail eligibility for the given offense description and section. 
            Output must be a valid JSON object with this exact structure: 
            { 
              "bailable": boolean, 
              "section": "string representing applicable BNS/IPC section", 
              "provision": "string summarizing the legal provision", 
              "conditions": ["array of strings for bail conditions"], 
              "reasoning": "detailed legal reasoning for the classification" 
            }`;

            const prompt = `Analyze bail eligibility for:
            Offense: ${offense}
            Section (if provided): ${section}`;
            
            const content = await generateLegalContent(prompt, systemPrompt);
            const parsed = parseModelJson<BailResult>(content, "bail eligibility", "object");
            
            setResult(parsed);
            toast.success("Bail eligibility analyzed!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Bail Check Error:", error);
            toast.error(`Analysis Failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResult = () => {
        if (result) {
            const text = `Bail Eligibility: ${result.bailable ? 'Bailable' : 'Non-Bailable'}\nSection: ${result.section}\nProvision: ${result.provision}\nConditions: ${result.conditions.join(', ')}\nReasoning: ${result.reasoning}`;
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
        }
    };

    // Common offenses for quick selection
    const commonOffenses = [
        "Theft",
        "Cheating",
        "Assault",
        "Dowry harassment",
        "Drunk driving",
        "Cybercrime"
    ];

    return (
        <div className="min-h-screen text-gray-900">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-4xl mx-auto pt-8 pb-20 px-4 md:px-6">

                {/* Back Button */}
                <Link
                    to="/features"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-saffron mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center">
                            <Unlock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">
                                Bail Eligibility Checker
                            </h1>
                            <p className="text-gray-500">Check if an offense is bailable under Indian law</p>
                        </div>
                    </div>
                </motion.div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6"
                >
                    {/* Quick Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Select Common Offenses
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {commonOffenses.map((off) => (
                                <button
                                    key={off}
                                    onClick={() => setOffense(off)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${offense === off
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {off}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offense Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Offense Description *
                        </label>
                        <Textarea
                            value={offense}
                            onChange={(e) => setOffense(e.target.value)}
                            placeholder="Describe the offense for which you want to check bail eligibility..."
                            className="min-h-[100px] bg-white border-gray-200"
                        />
                    </div>

                    {/* Section Number (Optional) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Section Number (if known)
                        </label>
                        <input
                            type="text"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            placeholder="e.g., BNS 303, IPC 420"
                            className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !offense.trim()}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Checking Eligibility...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Check Bail Eligibility
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Result Display */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-green-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-600">Bail Eligibility Analysis</span>
                            </div>
                            <Button
                                onClick={copyResult}
                                variant="outline"
                                size="sm"
                                className="text-gray-500"
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                            </Button>
                        </div>

                        <div className="space-y-6 text-gray-700">
                             <div className={`p-4 rounded-xl border flex items-center gap-4 ${result.bailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.bailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {result.bailable ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-bold tracking-wider opacity-60">Eligibility Status</p>
                                    <p className={`text-xl font-black ${result.bailable ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.bailable ? 'BAILABLE OFFENCE' : 'NON-BAILABLE OFFENCE'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-green-600" />
                                        Legal Provisions
                                    </h4>
                                    <p className="text-sm font-bold text-navy-india">{result.section}</p>
                                    <p className="text-xs text-gray-600 mt-1">{result.provision}</p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Analysis Reasoning
                                    </h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {result.reasoning}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">Bail Conditions</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.conditions.map((c, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                                <h4 className="font-bold text-gray-900 mb-1">AI Reasoning & Recommendation</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {result.reasoning}
                                </p>
                            </div>
                        </div>

                        {/* Important Note */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm font-medium text-blue-800 mb-2">Important Note:</p>
                            <p className="text-xs text-blue-700">
                                Bail decisions are ultimately at the court's discretion. Factors like criminal history,
                                flight risk, and case specifics can affect bail grant. Always consult a criminal lawyer
                                for bail applications.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Resources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <a
                        href="https://ecourts.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-green-500/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-600 mb-2" />
                        <span className="block font-medium text-gray-900">eCourts</span>
                        <span className="text-xs text-gray-500">Check case status</span>
                    </a>

                    <a
                        href="https://nalsa.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-green-500/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-600 mb-2" />
                        <span className="block font-medium text-gray-900">NALSA</span>
                        <span className="text-xs text-gray-500">Free legal aid for bail</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default BailCheckerPage;
