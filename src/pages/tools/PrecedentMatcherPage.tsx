import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle,
    ExternalLink, Copy, Search, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const PrecedentMatcherPage = () => {
    const [caseDescription, setCaseDescription] = useState("");
    const [jurisdiction, setJurisdiction] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!caseDescription.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const systemPrompt = `You are an expert Indian Legal Researcher. 
            Find and summarize relevant legal precedents and case laws based on the situation described. 
            Focus on Supreme Court and High Court judgments. 
            Provide case names, citations (if possible), and a brief summary of the ratio decidendi.
            Jurisdiction Filter: ${jurisdiction === 'all' ? 'All India' : jurisdiction.replace('_', ' ').toUpperCase()}`;

            const result = await generateLegalContent(caseDescription, systemPrompt);
            setResult(result);
            toast.success("Precedents found!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Precedent Search Error:", error);
            toast.error(`Search Failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResult = () => {
        if (result) navigator.clipboard.writeText(result);
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
                            <Search className="w-6 h-6" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Precedent Matcher
                            </h1>
                            <p className="text-gray-500">Find similar case laws and legal precedents</p>
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
                    {/* Jurisdiction Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: "all", label: "All India" },
                                { id: "supreme_court", label: "Supreme Court" },
                                { id: "high_court", label: "High Courts" },
                                { id: "tribunal", label: "Tribunals" }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setJurisdiction(option.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${jurisdiction === option.id
                                        ? "bg-saffron text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Case Description Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-saffron" />
                                Describe Your Case or Legal Issue
                            </div>
                        </label>
                        <Textarea
                            value={caseDescription}
                            onChange={(e) => setCaseDescription(e.target.value)}
                            placeholder="Describe your legal situation in detail. Include:
• Nature of the dispute (civil, criminal, constitutional, etc.)
• Key facts and circumstances
• Legal questions involved
• Outcome you're seeking

Example: 'Employer terminated employee for posting on social media about company policies. Is this wrongful termination?'"
                            className="min-h-[200px] bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            The more details you provide, the more relevant precedents we can find.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !caseDescription.trim()}
                        className="w-full h-12 btn-saffron rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Searching Precedents...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5 mr-2" />
                                Find Matching Precedents
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
                                <span className="font-semibold text-green-600">Precedents Found</span>
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

                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {result}
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Important Note</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        These precedents are AI-generated suggestions based on available data.
                                        Always verify citations on official sources like Indian Kanoon.
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
                    <a
                        href="https://indiankanoon.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl glass-premium border border-gray-100 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Indian Kanoon</span>
                        <span className="text-xs text-gray-500">Verify case citations</span>
                    </a>

                    <a
                        href="https://main.sci.gov.in/judgments"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl glass-premium border border-gray-100 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Supreme Court</span>
                        <span className="text-xs text-gray-500">Official judgments</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default PrecedentMatcherPage;
