import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle,
    ExternalLink, Copy, Shield, FileText, Upload
} from "lucide-react";
import { toast } from "sonner";
import { riskAnalyzer } from "@/services/groqService";

const RiskAnalyzerPage = () => {
    const [contractText, setContractText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        risks: Array<{ level: string; description: string; remedy: string }>;
        overall_score: number;
    } | null>(null);

    const handleSubmit = async () => {
        if (!contractText.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const analysis = await riskAnalyzer(contractText);
            setResult(analysis);
            toast.success("Risk analysis complete!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Risk Analysis Error:", error);
            toast.error(`Analysis Failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResult = () => {
        if (result) {
            const text = `Overall Risk Score: ${result.overall_score}/100\n\nRisks Identified:\n${result.risks.map(r => `[${r.level}] ${r.description}\nRemedy: ${r.remedy}`).join('\n\n')}`;
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="min-h-screen text-gray-900">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-4xl mx-auto pt-24 pb-20 px-4 md:px-6">

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
                        <div className="icon-container icon-container-lg icon-navy">
                            <Shield className="w-6 h-6" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Legal Risk Analyzer
                            </h1>
                            <p className="text-gray-500">AI-powered contract risk assessment</p>
                        </div>
                    </div>
                </motion.div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-tricolor-card p-6 mb-6"
                >
                    {/* Contract Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-saffron" />
                                Paste Contract or Agreement Text
                            </div>
                        </label>
                        <Textarea
                            value={contractText}
                            onChange={(e) => setContractText(e.target.value)}
                            placeholder="Paste your contract, agreement, or legal document here for analysis...

For best results, include:
• All terms and conditions
• Payment terms
• Liability clauses
• Termination provisions
• Any annexures or schedules"
                            className="min-h-[250px] bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Your document will be analyzed for legal risks, unfavorable terms, and compliance issues.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !contractText.trim()}
                        className="w-full h-12 btn-saffron rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing Contract...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5 mr-2" />
                                Analyze Risks
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Result Display */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-tricolor-card p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-600">Risk Analysis Complete</span>
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

                        <div className="space-y-6">
                            {/* Score Card */}
                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Overall Risk Score</h4>
                                    <p className="text-3xl font-black text-gray-900">
                                        {result.overall_score} <span className="text-lg text-gray-400 font-normal">/ 100</span>
                                    </p>
                                </div>
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                                    <div 
                                        className={`absolute inset-0 rounded-full border-4 border-t-transparent ${
                                            result.overall_score > 70 ? 'border-red-500' : result.overall_score > 40 ? 'border-amber-500' : 'border-green-500'
                                        }`}
                                        style={{ transform: `rotate(${(result.overall_score / 100) * 360}deg)` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Risks List */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-saffron" />
                                    Identified Risks & Remedies
                                </h4>
                                {result.risks.map((risk, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                risk.level === 'High' ? 'bg-red-100 text-red-700' : 
                                                risk.level === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {risk.level} Risk
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900 mb-2">{risk.description}</p>
                                        <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                            <div className="mt-1">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <p className="text-xs text-blue-800 leading-relaxed">
                                                <span className="font-bold">Suggested Remedy: </span>
                                                {risk.remedy}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Important Disclaimer</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        This AI analysis is for informational purposes only.
                                        Always consult a qualified legal professional before signing any contract.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Related Resources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <Link
                        to="/draft"
                        className="p-4 rounded-xl glass-premium border border-gray-100 hover:border-saffron/30 transition-all group"
                    >
                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Document Drafter</span>
                        <span className="text-xs text-gray-500">Create new contracts</span>
                    </Link>

                    <a
                        href="https://indiankanoon.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl glass-premium border border-gray-100 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Indian Kanoon</span>
                        <span className="text-xs text-gray-500">Search contract law cases</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default RiskAnalyzerPage;
