import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle,
    ExternalLink, Copy, Languages, ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const TranslatorPage = () => {
    const [text, setText] = useState("");
    const [direction, setDirection] = useState<"en-hi" | "hi-en">("en-hi");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setIsLoading(true);
        setResult(null);

        const sourceLang = direction === "en-hi" ? "English" : "Hindi";
        const targetLang = direction === "en-hi" ? "Hindi" : "English";

        try {
            const systemPrompt = `You are a professional Legal Translator specializing in English and Hindi. 
            Translate the following legal text from ${sourceLang} to ${targetLang}. 
            Ensure that legal terminology is accurately translated (e.g., 'plaintiff' to 'वादी', 'affidavit' to 'शपथ पत्र'). 
            Maintain a formal, professional tone suitable for court documents. Only provide the translated text.`;

            const result = await generateLegalContent(text, systemPrompt);
            setResult(result);
            toast.success("Translation complete!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Translation Error:", error);
            toast.error(`Translation Failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const swapLanguages = () => {
        setDirection(direction === "en-hi" ? "hi-en" : "en-hi");
        if (result) {
            setText(result);
            setResult(null);
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                            <Languages className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">
                                Legal Translation
                            </h1>
                            <p className="text-gray-500">Translate legal documents between English and Hindi</p>
                        </div>
                    </div>
                </motion.div>

                {/* Language Direction Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center justify-center gap-4 mb-6"
                >
                    <div className={`px-6 py-3 rounded-xl font-medium transition-all ${direction === "en-hi" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"
                        }`}>
                        {direction === "en-hi" ? "English" : "Hindi"}
                    </div>

                    <button
                        onClick={swapLanguages}
                        className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-500/30 transition-all"
                    >
                        <ArrowRightLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className={`px-6 py-3 rounded-xl font-medium transition-all ${direction === "en-hi" ? "bg-white text-gray-700 border border-gray-200" : "bg-blue-600 text-white"
                        }`}>
                        {direction === "en-hi" ? "Hindi" : "English"}
                    </div>
                </motion.div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6"
                >
                    {/* Text Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {direction === "en-hi" ? "English Text" : "Hindi Text"}
                        </label>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={direction === "en-hi"
                                ? "Enter English legal text to translate to Hindi..."
                                : "हिंदी कानूनी पाठ यहाँ दर्ज करें..."
                            }
                            className="min-h-[180px] bg-white border-gray-200"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !text.trim()}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <Languages className="w-5 h-5 mr-2" />
                                Translate to {direction === "en-hi" ? "Hindi" : "English"}
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Result Display */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-600">
                                    {direction === "en-hi" ? "Hindi Translation" : "English Translation"}
                                </span>
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

                        <div className={`prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap ${direction === "en-hi" ? "font-hindi" : ""
                            }`}>
                            {result}
                        </div>
                    </motion.div>
                )}

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 p-4 bg-white/80 rounded-xl border border-gray-200"
                >
                    <h3 className="font-medium text-gray-900 mb-2">About Legal Translation</h3>
                    <p className="text-sm text-gray-500">
                        Legal translation requires precision. This tool uses AI to translate legal documents
                        while preserving technical terminology. Always have important translations reviewed
                        by a bilingual legal professional for official use.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default TranslatorPage;
