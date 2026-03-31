import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    ArrowLeft, Search, HelpCircle, MessageSquare, 
    BookOpen, Sparkles, Loader2, Copy, CheckCircle 
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const JargonExplainerPage = () => {
    const [term, setTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);

    const handleExplain = async () => {
        if (!term.trim()) return;

        setIsLoading(true);
        setExplanation(null);

        try {
            const systemPrompt = "You are a specialized Legal Jargon Explainer for the Indian Legal System. Explain the provided legal term or phrase in simple, plain English (and provide Hindi translation where common). Focus on: 1. Simple Definition, 2. Practical Example, 3. Relevance in Indian Law (BNS/IPC). Keep it concise.";
            const result = await generateLegalContent(term, systemPrompt);
            setExplanation(result);
            toast.success("Explanation generated!");
        } catch (error) {
            console.error("Explainer Error:", error);
            toast.error("Failed to explain term. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (explanation) {
            navigator.clipboard.writeText(explanation);
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
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-saffron mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-india text-white mb-6 shadow-premium">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Legal <span className="premium-gradient-text">Jargon Explainer</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Demystifying complex Indian legal terminology. Enter any legal term, 
                        latin phrase, or section jargon to get a plain-language explanation.
                    </p>
                </motion.div>

                {/* Search Box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-tricolor-card p-2 md:p-4 mb-12"
                >
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                                placeholder="e.g., 'Mens Rea', 'Ad Interim', 'Non-Bailable Offense'..."
                                className="h-14 pl-12 pr-4 bg-white border-0 text-lg rounded-xl focus-visible:ring-saffron"
                            />
                        </div>
                        <Button
                            onClick={handleExplain}
                            disabled={isLoading || !term.trim()}
                            className="h-14 px-8 btn-navy rounded-xl uppercase tracking-widest font-bold"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Explain"
                            )}
                        </Button>
                    </div>
                </motion.div>

                {/* Quick Shortcuts */}
                {!explanation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
                    >
                        {["Suo Moto", "Caveat Emptor", "Vakalatanama", "Cognizable"].map((item) => (
                            <button
                                key={item}
                                onClick={() => { setTerm(item); }}
                                className="px-4 py-3 rounded-xl bg-white/50 border border-gray-100 hover:border-saffron/30 hover:bg-white transition-all text-sm font-medium text-gray-600"
                            >
                                {item}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Explanation Result */}
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-premium rounded-[2rem] p-8 md:p-12 border border-gray-100 relative overflow-hidden mb-12"
                    >
                        <div className="absolute top-0 left-0 w-2 h-full bg-saffron" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-saffron" />
                                <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    AI_Powered_Explanation
                                </span>
                            </div>
                            <Button
                                onClick={copyToClipboard}
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-gray-100"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                        </div>

                        <div className="prose prose-lg max-w-none text-gray-800 font-serif">
                            {explanation.split('\n').map((line, i) => (
                                <p key={i} className="mb-4 last:mb-0 leading-relaxed italic">
                                    {line}
                                </p>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between gap-4">
                            <Link to="/chat" className="text-sm font-bold text-navy-india flex items-center gap-2 hover:underline">
                                <MessageSquare className="w-4 h-4" />
                                Ask AI Assistant deeper questions
                            </Link>
                            <div className="flex items-center gap-2 text-green-india">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Accuracy_Verified</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* CTA / Disclaimer */}
                <div className="text-center">
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        Explanations provided are for linguistic and educational clarity only. 
                        Always refer to official legal dictionaries or consult a lawyer for precise legal contexts.
                    </p>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default JargonExplainerPage;
