import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle,
    ExternalLink, Download, Copy, Scale
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent, parseModelJson } from "@/services/groqService";

interface PredictionResult {
    prediction: string;
    probability: number;
    reasoning: string[];
    relevant_sections: string[];
    suggested_strategy: string;
}

const CasePredictorPage = () => {
    const [caseFacts, setCaseFacts] = useState("");
    const [caseType, setCaseType] = useState("civil");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);

    const handleSubmit = async () => {
        if (!caseFacts.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const systemPrompt = `You are a Senior Indian Legal Analyst. 
            Based on the case facts provided, predict the likely outcome, estimate the confidence probability (0-100), identify relevant sections, and suggest a strategy.
            Output must be a valid JSON object with this exact structure:
            {
              "prediction": "string",
              "probability": number,
              "reasoning": ["array of strings"],
              "relevant_sections": ["array of strings"],
              "suggested_strategy": "string"
            }`;

            const prompt = `Case Type: ${caseType}\nCase Facts:\n${caseFacts}`;
            
            const content = await generateLegalContent(prompt, systemPrompt);
            const parsed = parseModelJson<PredictionResult>(content, "case prediction", "object");
            
            setResult(parsed);
            toast.success("Case outcome predicted!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Prediction Error:", error);
            toast.error(`Prediction Failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResult = () => {
        if (result) {
            const text = `Prediction: ${result.prediction}\nProbability: ${result.probability}%\nReasoning:\n${result.reasoning.join('\n')}\nSections: ${result.relevant_sections.join(', ')}\nStrategy: ${result.suggested_strategy}`;
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron to-orange-400 flex items-center justify-center">
                            <Scale className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">
                                Case Outcome Predictor
                            </h1>
                            <p className="text-gray-500">AI-powered case analysis and prediction</p>
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
                    {/* Case Type Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
                        <div className="flex flex-wrap gap-2">
                            {["civil", "criminal", "family", "property", "labor", "consumer"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setCaseType(type)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${caseType === type
                                        ? "bg-saffron text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Case Facts Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Case Facts & Details
                        </label>
                        <Textarea
                            value={caseFacts}
                            onChange={(e) => setCaseFacts(e.target.value)}
                            placeholder="Describe your case in detail. Include:
• Background of the dispute
• Key events and dates
• Parties involved
• Evidence available
• Current status of the case"
                            className="min-h-[180px] bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            The more details you provide, the more accurate the prediction will be.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !caseFacts.trim()}
                        className="w-full h-12 bg-gradient-to-r from-saffron to-orange-400 hover:from-saffron/90 hover:to-orange-400/90 text-white font-medium rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing Case...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Predict Outcome
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
                                <span className="font-semibold text-green-600">AI Prediction</span>
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

                        <div className="space-y-4 text-gray-700">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Likely Outcome</p>
                                    <p className="text-lg font-bold text-gray-900">{result.prediction}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Confidence</p>
                                    <p className="text-2xl font-black text-saffron">{result.probability}%</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Legal Reasoning</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {result.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Relevant Sections</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.relevant_sections.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded border border-orange-100">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Recommended Strategy</h4>
                                <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                    {result.suggested_strategy}
                                </p>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Important Disclaimer</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        This is an AI-generated prediction for informational purposes only.
                                        Actual case outcomes depend on many factors including evidence, judge's discretion,
                                        and legal representation. Consult a qualified advocate for legal advice.
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
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">Indian Kanoon</span>
                        <span className="text-xs text-gray-500">Search case precedents</span>
                    </a>

                    <a
                        href="https://ecourts.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                        <span className="block font-medium text-gray-900">eCourts</span>
                        <span className="text-xs text-gray-500">Check case status</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default CasePredictorPage;
