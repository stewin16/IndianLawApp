import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, Sparkles, AlertCircle, Loader2, Download, History, Trash2, X, Copy, Maximize2, Minimize2, ArrowLeft, FileUp, ShieldCheck, Zap } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateLegalContent } from "@/services/groqService";
import * as pdfjsLib from 'pdfjs-dist';
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SummaryHistory {
    id: string;
    fileName: string;
    summary: string;
    timestamp: number;
}

const SummarizePage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [history, setHistory] = useState<SummaryHistory[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasStr = (value: unknown): value is { str: string } =>
        typeof value === "object" && value !== null && "str" in value && typeof (value as { str?: unknown }).str === "string";

    // Load history from local storage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem("summaryHistory");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (fileName: string, summaryText: string) => {
        const newEntry: SummaryHistory = {
            id: Date.now().toString(),
            fileName,
            summary: summaryText,
            timestamp: Date.now(),
        };
        const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
        setHistory(updatedHistory);
        localStorage.setItem("summaryHistory", JSON.stringify(updatedHistory));
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem("summaryHistory", JSON.stringify(updatedHistory));
    };

    const loadHistoryItem = (item: SummaryHistory) => {
        setSummary(item.summary);
        setFile({ name: item.fileName, size: 0 } as File); // Mock file object for display
        setIsHistoryOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setSummary(null);
        }
    };

    const extractTextFromFile = async (file: File): Promise<string> => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'txt') {
            return await file.text();
        }

        if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item) => {
                        if (hasStr(item)) return item.str;
                        return '';
                    })
                    .join(' ');
                fullText += pageText + '\n';
            }
            return fullText;
        }

        if (extension === 'docx') {
            throw new Error("DOCX support is coming soon. Please use PDF or TXT for now.");
        }

        throw new Error("Unsupported file format. Please upload PDF or TXT.");
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const text = await extractTextFromFile(file);
            if (!text.trim()) {
                throw new Error("The document appears to be empty or unreadable.");
            }

            const systemPrompt = "You are a specialized Legal AI Assistant. Provide a structured, executive summary of the provided legal text. Use Markdown for formatting. Focus on: 1. Parties Involved, 2. Key Provisions, 3. Critical Risks/Liabilities, 4. Strategic Observations.";
            const summaryText = await generateLegalContent(text, systemPrompt);
            setSummary(summaryText);
            saveToHistory(file.name, summaryText);
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Summarization Error:", err);
            setSummary(`Error: ${err.message || "Failed to process document."}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!summary) return;

        try {
            await exportStructuredPdf({
                title: "Legal Document Summary",
                fileName: `Summary_${file?.name.replace(/\.[^/.]+$/, "") || "Legal_Document"}.pdf`,
                metadata: [
                    `Source File: ${file?.name || "Unknown"}`,
                    `Generated: ${new Date().toLocaleString()}`,
                ],
                sections: [{ text: toPlainText(summary) }],
                footer: "Generated by LegalAi - Not a substitute for professional legal advice.",
            });
        } catch (error) {
            console.error("PDF Generation failed", error);
        }
    };

    const handleReset = () => {
        setFile(null);
        setSummary(null);
    };

    return (
        <div className={cn(
            "min-h-screen flex flex-col text-gray-900 overflow-x-hidden transition-colors duration-500",
            isFocusMode ? "bg-white" : ""
        )}>
            {!isFocusMode && <TricolorBackground intensity="strong" showOrbs={true} />}
            {!isFocusMode && <Header />}

            {/* History Sidebar Button */}
            {!isFocusMode && (
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="fixed left-6 top-24 z-30 flex items-center gap-2 px-4 py-3 glass-tricolor-card hover:shadow-saffron border border-gray-200 rounded-full transition-all group"
                >
                    <History className="w-5 h-5 text-gray-400 group-hover:text-saffron" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 hidden md:inline">History</span>
                </button>
            )}

            {/* History Sidebar */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 z-50 p-6 shadow-elevated overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-saffron" />
                                    History
                                </h2>
                                <button
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No recent summaries</p>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => loadHistoryItem(item)}
                                            className="group relative p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-saffron/30 hover:bg-saffron-light transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <FileText className="w-4 h-4 text-saffron shrink-0" />
                                                <p className="text-sm font-medium text-gray-700 truncate">{item.fileName}</p>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            <button
                                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className={cn(
                "container mx-auto px-4 flex-1 relative z-10 transition-all duration-500",
                isFocusMode ? "pt-4 max-w-4xl" : "pt-8 pb-24 max-w-5xl"
            )}>
                {!isFocusMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center mb-16 text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Zap className="w-3 h-3" />
                            AI-Powered Intelligence
                        </div>
                        <h1 className="editorial-title mb-6">
                            Document <span className="premium-gradient-text">Summarizer</span>
                        </h1>
                        <p className="editorial-subtitle max-w-2xl">
                            Transform dense legal text into concise, actionable intelligence. 
                            Built for precision and speed in the Indian legal landscape.
                        </p>
                    </motion.div>
                )}

                <div className="flex flex-col items-center gap-8 w-full">
                    {/* Upload Section */}
                    {!summary && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-3xl"
                        >
                            <div 
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative group p-12 rounded-[3rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center text-center overflow-hidden",
                                    dragActive 
                                        ? "border-saffron bg-saffron/5 scale-[1.02] shadow-2xl shadow-saffron/10" 
                                        : "border-gray-200 bg-white/40 backdrop-blur-md hover:border-saffron/40 hover:bg-white/60 shadow-xl shadow-navy-india/5"
                                )}
                            >
                                {/* Technical Accents */}
                                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-saffron/20 rounded-tl-[3rem]" />
                                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-india/20 rounded-br-[3rem]" />
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.txt"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-saffron to-orange-600 flex items-center justify-center mb-8 shadow-2xl shadow-saffron/30 group-hover:scale-110 transition-transform duration-700">
                                    <FileUp className="w-12 h-12 text-white" />
                                </div>

                                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-3">
                                    {file ? file.name : "Upload Legal Document"}
                                </h3>
                                <p className="text-gray-500 mb-10 max-w-sm mx-auto font-light leading-relaxed">
                                    {file 
                                        ? `Ready to analyze ${(file.size / 1024 / 1024).toFixed(2)} MB file. Our AI will extract key clauses and risks.` 
                                        : "Drag and drop your PDF or TXT file here, or click to browse our secure portal."
                                    }
                                </p>

                                <div className="flex flex-wrap justify-center gap-4">
                                    {!file ? (
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-12 px-8 rounded-full btn-saffron shadow-saffron font-bold text-base"
                                        >
                                            Select File
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleUpload}
                                                disabled={isUploading}
                                                className="h-12 px-10 rounded-full btn-green shadow-green font-bold text-base"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5 mr-2" />
                                                        Generate Summary
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setFile(null)}
                                                className="h-12 px-6 rounded-full border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200"
                                            >
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div className="mt-12 flex items-center gap-6 text-xs text-gray-400 font-medium uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-green-india" />
                                        Secure Processing
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>PDF, TXT</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>Max 20MB</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Result Section */}
                    <AnimatePresence>
                        {summary && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "w-full transition-all duration-500",
                                    isFocusMode ? "fixed inset-0 z-[100] bg-white overflow-y-auto p-4 md:p-12" : "mt-8"
                                )}
                            >
                                <div className={cn(
                                    "relative transition-all duration-500",
                                    isFocusMode 
                                        ? "max-w-4xl mx-auto" 
                                        : "card-premium shadow-premium rounded-[2.5rem] p-8 md:p-12 border border-gray-100 bg-white/80 backdrop-blur-xl"
                                )}>
                                    {/* Toolbar */}
                                    <div className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
                                        <div className="flex items-center gap-4">
                                            {isFocusMode && (
                                                <button 
                                                    onClick={() => setIsFocusMode(false)}
                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                                                >
                                                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                                                </button>
                                            )}
                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-3">
                                                    <Sparkles className="w-6 h-6 text-saffron" />
                                                    Executive Summary
                                                </h3>
                                                <p className="text-sm text-gray-400 font-mono mt-1">
                                                    REF: {file?.name || "DOC-ANALYSIS"} • {new Date().toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIsFocusMode(!isFocusMode)}
                                                className="rounded-full hover:bg-gray-100"
                                                title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
                                            >
                                                {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                            </Button>
                                            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(summary);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="hidden sm:flex items-center gap-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </Button>
                                            <Button
                                                onClick={handleDownload}
                                                variant="ghost"
                                                size="sm"
                                                className="hidden sm:flex items-center gap-2 text-green-india hover:bg-green-50 rounded-full"
                                            >
                                                <Download className="w-4 h-4" />
                                                Export PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div 
                                        id="summary-content" 
                                        className={cn(
                                            "prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700",
                                            "font-serif text-xl"
                                        )}
                                    >
                                        <ReactMarkdown>{summary}</ReactMarkdown>
                                    </div>

                                    {/* Action Footer */}
                                    {!isFocusMode && (
                                        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-serif italic text-lg">
                                                    L
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Legal Intelligence AI</p>
                                                    <p className="text-xs text-gray-400 uppercase tracking-widest">Verified Analysis Protocol</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsHistoryOpen(true)}
                                                    className="rounded-full border-gray-200 hover:bg-gray-50 px-6"
                                                >
                                                    <History className="w-4 h-4 mr-2" />
                                                    History
                                                </Button>
                                                <Button
                                                    onClick={handleReset}
                                                    className="rounded-full btn-saffron px-8"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    New Document
                                                </Button>
                                            </div>
                                        </div>
                                    )}
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
export default SummarizePage;
