import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowRightLeft, Sparkles, Loader2, Scale, AlertTriangle, 
    BookOpen, Gavel, Lightbulb, Shield, Download, Copy,
    ChevronRight, Info, Zap, Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LawSearch, LawSection } from "@/components/LawSearch";
import { compareLegalTexts } from "@/services/groqService";
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";


interface ComparisonResult {
    change_type: string;
    legal_impact: string;
    penalty_difference: string;
    key_changes: string[];
    verdict: string;
}

const ComparisonPage = () => {
    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");
    const [result, setResult] = useState<ComparisonResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedSection, setSelectedSection] = useState<LawSection | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const { toast } = useToast();

    // Helper to normalize text for comparison (ignore whitespace/case)
    const normalizeText = (t: string) => t.toLowerCase().replace(/\s+/g, '').trim();

    const handleCompare = async () => {
        if (!text1 || !text2) {
            toast({
                title: "Missing Input",
                description: "Please enter text for both IPC and BNS sections.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        setResult(null);
        setError("");

        // Define fallback logic for curated data
        const handleCuratedFallback = () => {
            if (selectedSection &&
                selectedSection.summary_of_change &&
                normalizeText(selectedSection.text_ipc || "") === normalizeText(text1) &&
                normalizeText(selectedSection.text_bns || "") === normalizeText(text2)
            ) {
                console.log("Using curated fallback for", selectedSection.bns);
                toast({
                    title: "AI Service Busy",
                    description: "Using verified high-impact analysis instead.",
                    duration: 3000,
                });

                setResult({
                    change_type: selectedSection.change_type || "Analysis",
                    legal_impact: selectedSection.summary_of_change,
                    penalty_difference: "Refer to full text for specific penalty matrix.",
                    key_changes: [selectedSection.summary_of_change],
                    verdict: "High Impact Legislative Change"
                });
                setIsLoading(false);
                return true;
            }
            return false;
        };

        try {
            // Priority: Try AI Analysis First using Groq
            const comparison = await compareLegalTexts(text1, text2);

            if (comparison) {
                setResult(comparison);
            } else {
                throw new Error("Invalid response format");
            }

        } catch (error) {
            console.error("AI Analysis failed:", error);

            // Fallback: Try curated data
            const fallbackSuccess = handleCuratedFallback();

            if (!fallbackSuccess) {
                toast({
                    title: "Analysis Failed",
                    description: "Could not analyze the text. Please try again.",
                    variant: "destructive"
                });
                setError("Analysis failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };



    const handleSectionSelect = (section: LawSection) => {
        setText2(section.text_bns || "");
        setSelectedSection(section);

        if (section.text_ipc) {
            setText1(section.text_ipc);
            toast({
                title: "Section Loaded",
                description: `Loaded BNS ${section.bns} and corresponding IPC section.`,
            });
        } else {
            setText1("");
            toast({
                title: "IPC Text Unavailable",
                description: "The corresponding IPC text is missing from our database. Please paste the Old Law text manually.",
                variant: "default",
            });
        }
        setResult(null);
    };

    const handleExportReport = async () => {
        if (!result) {
            toast({
                title: "No report to export",
                description: "Run a comparison first.",
                variant: "destructive",
            });
            return;
        }

        try {
            await exportStructuredPdf({
                title: "LegalAI Comparison Report",
                fileName: "bns-ipc-comparison-report.pdf",
                metadata: [`Generated: ${new Date().toLocaleString()}`],
                sections: [
                    { label: "Verdict", text: toPlainText(result.verdict) },
                    { label: "Change Type", text: toPlainText(result.change_type) },
                    { label: "Legal Impact", text: toPlainText(result.legal_impact) },
                    { label: "Penalty Difference", text: toPlainText(result.penalty_difference) },
                    {
                        label: "Key Changes",
                        text: toPlainText(result.key_changes.map((change, index) => `${index + 1}. ${change}`).join("\n")),
                    },
                ],
            });
            toast({ title: "Comparison report exported" });
        } catch (error) {
            console.error("Comparison PDF Export Error:", error);
            toast({
                title: "Export failed",
                description: "Unable to export comparison report. Please try again.",
                variant: "destructive",
            });
        }
    };

    const getChangeTypeInfo = (type: string) => {
        const normalizeType = (t: string) => {
            if (t.includes("Same")) return "Same";
            if (t.includes("Modified")) return "Modified";
            if (t.includes("Expanded")) return "Expanded";
            if (t.includes("Restructured")) return "Restructured";
            if (t.includes("Replaced")) return "Replaced";
            if (t.includes("Omitted")) return "Omitted";
            return "Unknown";
        };

        const typeKey = normalizeType(type);

        switch (typeKey) {
            case "Same":
                return {
                    desc: "The legal substance remains unchanged.",
                    explanation: "The provision is substantively unchanged. Wording is nearly identical, punishment structure remains the same, or only minor formatting changes."
                };
            case "Modified":
                return {
                    desc: "Provision retained with textual and structural modifications.",
                    explanation: "The core offence exists, but wording or punishment is adjusted (e.g., gender-neutral language, refined punishment)."
                };
            case "Expanded":
                return {
                    desc: "Scope widened to cover additional circumstances.",
                    explanation: "New acts included, additional punishments added (e.g., community service), or new categories of offenders covered."
                };
            case "Restructured":
                return {
                    desc: "Provision reorganized for clarity without altering core intent.",
                    explanation: "Multiple IPC sections merged, definitions separated from punishments, or new sub-sections introduced."
                };
            case "Replaced":
                return {
                    desc: "Provision replaced with a newly defined offence.",
                    explanation: "The IPC provision is removed and replaced with a different formulation (e.g., Sedition removed, new offence defined)."
                };
            case "Omitted":
                return {
                    desc: "Provision omitted without direct replacement.",
                    explanation: "The IPC provision no longer exists in BNS."
                };
            default:
                return {
                    desc: "Legislative change classification.",
                    explanation: "This describes the structural or textual change between the IPC and BNS provisions."
                };
        }
    };

    return (
        <div className="min-h-screen flex flex-col text-gray-900 bg-white selection:bg-saffron/30">
            <TricolorBackground intensity="strong" showOrbs={true} />
            {!isFocusMode && <Header />}

            <div className={cn(
                "container mx-auto px-4 pb-20 flex-1 max-w-7xl relative z-10 transition-all duration-700",
                isFocusMode ? "pt-12" : "pt-12"
            )}>

                {/* Hero Section - Editorial Style */}
                {!isFocusMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20 space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-navy-india/10 text-navy-india shadow-premium-sm"
                        >
                            <div className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">Legislative_Evolution_Engine_v2.0</span>
                        </motion.div>
                        
                        <h1 className="text-6xl md:text-8xl font-serif font-bold text-navy-india tracking-tighter leading-[0.9]">
                            From <span className="text-saffron italic">IPC</span> to <span className="text-green-india italic">BNS</span>
                        </h1>
                        <p className="text-gray-500 text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed">
                            Identify legal shifts, penalty updates, and semantic changes between India's old and new criminal codes with <span className="text-navy-india font-bold">neural-sync</span> analysis.
                        </p>
                    </motion.div>
                )}

                {/* Search Bar - Premium Floating */}
                {!isFocusMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto mb-20"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-saffron/20 via-white to-green-india/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
                            <div className="relative bg-white rounded-[2rem] shadow-premium-lg border border-gray-100 p-2">
                                <LawSearch onSelect={handleSectionSelect} />
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-green-india" />
                                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Grounded_Data_Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-saffron" />
                                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Cross_Reference_Ready</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Comparison Interface */}
                <div className={cn(
                    "grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 relative",
                    isFocusMode && "lg:grid-cols-1"
                )}>
                    {/* Focus Mode Toggle */}
                    <div className="absolute -top-12 right-0 z-30">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className="rounded-full bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm text-gray-400 hover:text-navy-india"
                        >
                            {isFocusMode ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                            {isFocusMode ? "Exit Focus" : "Focus Mode"}
                        </Button>
                    </div>

                    {/* Inputs Panel */}
                    {!isFocusMode && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8 relative"
                        >
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-elevated group">
                                <ArrowRightLeft className="w-7 h-7 text-navy-india group-hover:rotate-180 transition-transform duration-700" />
                            </div>

                            {/* IPC Section */}
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-saffron/20 to-transparent rounded-[2.5rem] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative rounded-[2.5rem] bg-white border border-gray-100 p-10 shadow-premium hover:shadow-elevated transition-all duration-500 h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-saffron/10 flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-saffron" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Protocol_Legacy</span>
                                                <h3 className="text-lg font-serif font-bold text-navy-india">Old Law (IPC)</h3>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-saffron/20 text-saffron bg-saffron/5 font-mono text-[10px] px-3 py-1">LEGACY_V1860</Badge>
                                    </div>
                                    <Textarea
                                        value={text1}
                                        onChange={(e) => setText1(e.target.value)}
                                        placeholder="Paste IPC section text here..."
                                        className="min-h-[320px] bg-gray-50/30 border-0 focus:ring-0 rounded-2xl resize-none text-gray-900 placeholder:text-gray-300 text-xl font-serif leading-relaxed transition-all p-0"
                                    />
                                </div>
                            </div>

                            {/* BNS Section */}
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-green-india/20 to-transparent rounded-[2.5rem] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative rounded-[2.5rem] bg-white border border-gray-100 p-10 shadow-premium hover:shadow-elevated transition-all duration-500 h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green-india/10 flex items-center justify-center">
                                                <Scale className="w-6 h-6 text-green-india" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Protocol_Modern</span>
                                                <h3 className="text-lg font-serif font-bold text-navy-india">New Law (BNS)</h3>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-green-india/20 text-green-india bg-green-india/5 font-mono text-[10px] px-3 py-1">MODERN_V2023</Badge>
                                    </div>
                                    <Textarea
                                        value={text2}
                                        onChange={(e) => setText2(e.target.value)}
                                        placeholder="Paste BNS section text here..."
                                        className="min-h-[320px] bg-gray-50/30 border-0 focus:ring-0 rounded-2xl resize-none text-gray-900 placeholder:text-gray-300 text-xl font-serif leading-relaxed transition-all p-0"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {!isFocusMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-12 flex justify-center mt-4 mb-20"
                        >
                            <Button
                                size="lg"
                                onClick={handleCompare}
                                disabled={isLoading}
                                className="h-20 px-16 rounded-[2rem] bg-navy-india text-white shadow-premium-lg hover:shadow-elevated text-xl font-bold transition-all hover:scale-105 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-saffron/20 via-transparent to-green-india/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                {isLoading ? (
                                    <Loader2 className="mr-4 h-7 w-7 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-4 h-7 w-7 text-saffron group-hover:rotate-12 transition-transform" />
                                )}
                                <span className="relative z-10">
                                    {isLoading ? "Analyzing Legislative Shift..." : "Analyze Legal Impact"}
                                </span>
                            </Button>
                        </motion.div>
                    )}

                    {/* Results Area - Full Width in Focus Mode */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "space-y-10",
                                    isFocusMode ? "lg:col-span-12" : "lg:col-span-12"
                                )}
                            >
                                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest mb-1">Analysis_Report_Generated</span>
                                        <h3 className="text-3xl font-serif font-bold text-navy-india">Legislative Impact Assessment</h3>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const analysisText = `Verdict: ${result.verdict}\n\nLegal Impact: ${result.legal_impact}\n\nKey Changes:\n${result.key_changes.map(c => `- ${c}`).join('\n')}\n\nPenalty Impact: ${result.penalty_difference}`;
                                                navigator.clipboard.writeText(analysisText);
                                                toast({ title: "Analysis copied to clipboard" });
                                            }}
                                            className="rounded-full h-12 w-12 bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-navy-india transition-all"
                                            title="Copy Report"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            className="rounded-full btn-green shadow-green px-8 h-12 font-bold"
                                            onClick={handleExportReport}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export Report
                                        </Button>
                                    </div>
                                </div>

                                {/* Verdict Banner - Dramatic Editorial Style */}
                                <div className={cn(
                                    "p-12 rounded-[3rem] border flex flex-col lg:flex-row items-start gap-12 relative overflow-hidden shadow-premium-lg transition-all duration-700",
                                    result.change_type.includes("Major") ? "bg-red-50/30 border-red-100 text-red-900" :
                                        result.change_type.includes("Modified") ? "bg-blue-50/30 border-blue-100 text-blue-900" :
                                            "bg-green-50/30 border-green-100 text-green-900"
                                )}>
                                    <div className={cn(
                                        "w-24 h-24 rounded-[2rem] shrink-0 flex items-center justify-center shadow-elevated transition-transform duration-700 group-hover:rotate-12",
                                        result.change_type.includes("Major") ? "bg-white text-red-600" :
                                            result.change_type.includes("Modified") ? "bg-white text-blue-600" :
                                                "bg-white text-green-600"
                                    )}>
                                        <Gavel className="w-12 h-12" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] opacity-50">Neural_Sync_Verdict</span>
                                            <div className="h-px w-12 bg-current opacity-20" />
                                        </div>
                                        <h3 className="text-4xl md:text-5xl font-serif font-bold mb-8 tracking-tighter leading-tight">{result.verdict}</h3>
                                        <p className="text-xl md:text-2xl font-light leading-relaxed opacity-80 max-w-4xl">{result.legal_impact}</p>
                                    </div>
                                    
                                    {/* Abstract Background Accent */}
                                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-current opacity-[0.03] rounded-full blur-[100px]" />
                                    <div className="absolute top-10 right-10 opacity-10">
                                        <Scale className="w-40 h-40" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    {/* Key Changes List - Technical Grid Style */}
                                    <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[3rem] p-12 shadow-premium group hover:shadow-elevated transition-all duration-700">
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-navy-india/5 flex items-center justify-center">
                                                    <Sparkles className="w-6 h-6 text-navy-india" />
                                                </div>
                                                <h4 className="text-2xl font-serif font-bold text-navy-india">Structural Modifications</h4>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-navy-india/20 uppercase tracking-widest">Data_Points: {result.key_changes.length}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-8">
                                            {result.key_changes.map((change, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * i }}
                                                    className="flex items-start gap-6 group/item p-6 rounded-2xl hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="mt-1.5 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-gray-400 group-hover/item:bg-saffron group-hover/item:text-white transition-all">
                                                        0{i + 1}
                                                    </div>
                                                    <p className="text-lg text-gray-600 leading-relaxed font-light">{change}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Side Metrics - Hardware Widget Style */}
                                    <div className="lg:col-span-4 space-y-10">
                                        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-premium hover:shadow-elevated transition-all duration-700 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <AlertTriangle className="w-24 h-24" />
                                            </div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">Penalty_Impact_Matrix</h4>
                                            </div>
                                            <div className={cn(
                                                "text-3xl font-serif font-bold tracking-tighter leading-tight",
                                                result.penalty_difference.toLowerCase().includes("increased") ? "text-red-600" :
                                                    result.penalty_difference.toLowerCase().includes("decreased") ? "text-green-600" :
                                                        "text-navy-india"
                                            )}>
                                                {result.penalty_difference}
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">High_Sensitivity_Data</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-premium hover:shadow-elevated transition-all duration-700 relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                                        <Lightbulb className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">Change_Classification</h4>
                                                </div>
                                                
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <div className="cursor-help w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors">
                                                                <Info className="w-4 h-4 text-navy-india" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="max-w-[320px] p-8 bg-white border-gray-100 shadow-premium-lg rounded-[2rem]">
                                                            <div className="space-y-4">
                                                                <div className="w-10 h-10 rounded-xl bg-navy-india/5 flex items-center justify-center mb-2">
                                                                    <BookOpen className="w-5 h-5 text-navy-india" />
                                                                </div>
                                                                <p className="font-serif font-bold text-navy-india text-xl leading-tight">
                                                                    {getChangeTypeInfo(result.change_type).desc}
                                                                </p>
                                                                <p className="text-[15px] text-gray-500 leading-relaxed font-light">
                                                                    {getChangeTypeInfo(result.change_type).explanation}
                                                                </p>
                                                                <div className="pt-4 border-t border-gray-50 mt-4">
                                                                    <p className="text-[10px] text-gray-400 italic font-mono uppercase tracking-widest">
                                                                        *Statutory_Evolution_Context
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <Badge variant="outline" className="text-xl py-3 px-6 border-navy-india/10 text-navy-india bg-navy-india/5 rounded-2xl font-serif font-bold w-fit">
                                                    {result.change_type}
                                                </Badge>
                                                <p className="text-xs text-gray-400 font-light leading-relaxed">
                                                    Hover the info icon for detailed legislative classification.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Footer Disclaimer */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[3rem] bg-gray-50/50 border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-navy-india" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest">Compliance_Shield</span>
                                            <span className="text-sm text-gray-600 font-medium">Structural analysis only • Not legal advice</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest">System_Reference</span>
                                            <span className="text-xs font-bold text-navy-india">GAZETTE_VERIFIED_V2</span>
                                        </div>
                                        <div className="h-10 w-px bg-gray-200" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest">Analysis_Node</span>
                                            <span className="text-xs font-bold text-navy-india">GROQ_CLOUD_MODEL</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {!isFocusMode && <Footer />}
        </div>
    );
};

export default ComparisonPage;
