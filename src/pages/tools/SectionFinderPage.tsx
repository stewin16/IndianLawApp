import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle,
    ExternalLink, Copy, Search, Scale, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const SectionFinderPage = () => {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Common situations for quick selection
    const commonSituations = [
        "Cheating and fraud",
        "Theft of mobile phone",
        "Domestic violence",
        "Road accident",
        "Cyber bullying",
        "Property dispute"
    ];

    const handleSubmit = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const systemPrompt = `You are a legal expert specializing in Indian Penal Statutes. 
            Identify the relevant sections of the Bharatiya Nyaya Sanhita (BNS) and the corresponding older Indian Penal Code (IPC) sections for the given situation.
            Provide a brief explanation of why each section applies and the prescribed punishment.
            Be concise and accurate.`;

            const result = await generateLegalContent(query, systemPrompt);
            setResult(result);
            toast.success("Sections identified!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Section Finder Error:", error);
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron to-orange-400 flex items-center justify-center">
                            <Search className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">
                                Section Finder
                            </h1>
                            <p className="text-gray-500">Find relevant IPC/BNS sections for any situation</p>
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
                            Common Situations
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {commonSituations.map((situation) => (
                                <button
                                    key={situation}
                                    onClick={() => setQuery(situation)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${query === situation
                                        ? "bg-saffron text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {situation}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Situation Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe the Situation *
                        </label>
                        <Textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Describe the legal situation or offense you want to find sections for...

Example: Someone stole my mobile phone from my pocket while I was on a bus. 
The thief pushed me when I tried to stop him."
                            className="min-h-[120px] bg-white border-gray-200"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !query.trim()}
                        className="w-full h-12 bg-gradient-to-r from-saffron to-orange-400 hover:from-saffron/90 hover:to-orange-400/90 text-white font-medium rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Finding Sections...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5 mr-2" />
                                Find Applicable Sections
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
                                <span className="font-semibold text-green-600">Applicable Sections</span>
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

                        {/* Note about BNS */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm font-medium text-blue-800 mb-2">📌 Important Note</p>
                            <p className="text-xs text-blue-700">
                                The Bharatiya Nyaya Sanhita (BNS) replaced the IPC from July 1, 2024.
                                Both old and new section numbers are provided for reference.
                                Always verify with a lawyer before taking legal action.
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
                        href="https://indiankanoon.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Indian Kanoon</span>
                        <span className="text-xs text-gray-500">Read full sections</span>
                    </a>

                    <a
                        href="https://www.indiacode.nic.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">India Code</span>
                        <span className="text-xs text-gray-500">Official bare acts</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default SectionFinderPage;
