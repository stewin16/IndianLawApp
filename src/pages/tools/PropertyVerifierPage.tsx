import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, Home, FileCheck, Sparkles, 
    Loader2, CheckCircle, ShieldAlert, BookOpen, 
    Search, MapPin, Scale
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";

const PropertyVerifierPage = () => {
    const [selectedDoc, setSelectedDoc] = useState("");
    const [docText, setDocText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verification, setVerification] = useState<string | null>(null);

    const docTypes = [
        "Sale Deed", "Encumbrance Certificate (EC)", "Khata / Patta", 
        "RTC (Record of Rights)", "Mother Deed", "Power of Attorney"
    ];

    const handleVerify = async () => {
        if (!docText.trim() || !selectedDoc) {
            toast.error("Please select a document type and paste the text.");
            return;
        }

        setIsLoading(true);
        setVerification(null);

        try {
            const prompt = `Analyze this ${selectedDoc} for an Indian real estate transaction:
            Document Text: ${docText}`;
            
            const systemPrompt = "You are a Real Estate Lawyer in India specializing in Due Diligence. Analyze the provided property document text. Identify: 1. Main Parties, 2. Property Description & Survey No., 3. Potential Red Flags (unclear title, pending liabilities, inconsistent details), 4. Missing Mandatory Clauses. Format clearly and professionally.";

            const result = await generateLegalContent(prompt, systemPrompt);
            setVerification(result);
            toast.success("Document verification complete!");
        } catch (error) {
            console.error("Verification Error:", error);
            toast.error("Failed to verify document.");
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-6 shadow-premium">
                        <Home className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Property <span className="premium-gradient-text">Document Verifier</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        In-depth due diligence for real estate. Our AI checks your Sale Deeds, 
                        ECs, and Khata for legal consistency and red flags.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-saffron" />
                                1. Select Document Type
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {docTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedDoc(type)}
                                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all uppercase tracking-wider ${
                                            selectedDoc === type 
                                            ? "border-navy-india bg-navy-india text-white shadow-lg" 
                                            : "border-gray-100 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-saffron" />
                                2. Paste Document Content
                            </h3>
                            <textarea 
                                value={docText}
                                onChange={(e) => setDocText(e.target.value)}
                                placeholder="Paste the text from your property document here..."
                                className="w-full min-h-[300px] p-6 rounded-3xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all font-serif italic text-sm leading-relaxed"
                            />
                        </section>

                        <Button 
                            onClick={handleVerify}
                            disabled={isLoading || !docText.trim() || !selectedDoc}
                            className="w-full h-14 btn-navy rounded-xl uppercase tracking-widest font-bold"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" /> Start Verification</>}
                        </Button>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {verification ? (
                                <motion.div
                                    key="verify-result"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-premium rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative h-full flex flex-col"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
                                    
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-emerald-600" />
                                            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">DUE_DILIGENCE_REPORT</span>
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText(verification || ""); toast.success("Copied!"); }} className="text-gray-400 hover:text-navy-india"><Scale className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 text-sm text-gray-700 leading-relaxed font-serif whitespace-pre-wrap italic">
                                        {verification}
                                    </div>

                                    <div className="mt-8 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                                        <CheckCircle className="w-6 h-6 text-emerald-600 mt-1 shrink-0" />
                                        <div className="text-[11px] text-emerald-800/80 leading-tight">
                                            Verification is based on the provided text. We recommend physical verification of documents at the sub-registrar office.
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="verify-placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] p-12 text-center bg-white/40"
                                >
                                    <FileCheck className="w-16 h-16 text-gray-100 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-gray-300">Analysis Waiting</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed">
                                        Select a property document type and paste the text to begin an AI-powered legal audit.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Important Links Section */}
                <div className="mt-20 p-10 bg-white rounded-[3rem] border border-gray-100">
                    <h3 className="text-2xl font-serif font-bold text-navy-india mb-10 text-center">Mandatory Document Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <MapPin className="w-6 h-6 text-saffron mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Sale Deed</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Verification of ownership transfer and registration at the sub-registrar office.</p>
                        </div>
                        <div>
                            <BookOpen className="w-6 h-6 text-blue-600 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Encumbrance</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Checking for any registered mortgages or legal dues against the property.</p>
                        </div>
                        <div>
                            <CheckCircle className="w-6 h-6 text-emerald-600 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Khata/Patta</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Ensuring the property is registered in the revenue records for tax purposes.</p>
                        </div>
                        <div>
                            <Scale className="w-6 h-6 text-navy-india mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2 font-serif text-sm">Approvals</h4>
                            <p className="text-xs text-gray-500 leading-relaxed italic">Verification of layout plans and building approvals from local authorities.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PropertyVerifierPage;
