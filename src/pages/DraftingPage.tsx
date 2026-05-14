import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, Languages, FileText, PenTool, Loader2, Maximize2, Sparkles, ArrowLeft, Copy, Zap, ShieldCheck, FileSignature, Settings2, Wand2, RefreshCw } from 'lucide-react';
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateLegalContent } from "@/services/groqService";
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";
import SmartWizard, { WizardStep } from "@/components/SmartWizard";

// ─── Wizard steps for Guided Drafting ─────────────────────────────────────────
const DRAFT_WIZARD_STEPS: WizardStep[] = [
    {
        title: "Document Type",
        subtitle: "What do you need to draft?",
        icon: "📄",
        fields: [
            {
                key: "docType",
                label: "Type of Document",
                type: "chips",
                chips: ["Rental Agreement", "Legal Notice", "NDA", "Affidavit", "Employment Contract", "Court Memorial", "Will / Testament", "Sale Agreement", "Partnership Deed", "Power of Attorney"],
                placeholder: "Or describe the document type...",
                required: true,
            },
            {
                key: "language",
                label: "Preferred Language",
                type: "select",
                options: [
                    { value: "English", label: "English" },
                    { value: "Hindi", label: "Hindi (Shuddh)" },
                ],
            },
        ],
    },
    {
        title: "The Parties",
        subtitle: "Who are the parties involved?",
        icon: "👥",
        fields: [
            {
                key: "partyA",
                label: "Party A (Name, Role & Address)",
                type: "textarea",
                placeholder: "e.g., Ramesh Kumar, Landlord, 123 MG Road, Mumbai - 400001",
                required: true,
            },
            {
                key: "partyB",
                label: "Party B (Name, Role & Address)",
                type: "textarea",
                placeholder: "e.g., Priya Sharma, Tenant, 456 Link Road, Mumbai - 400050",
                required: true,
            },
            {
                key: "additionalParties",
                label: "Additional Parties (if any)",
                type: "text",
                placeholder: "e.g., Guarantor, Witness, Third Party",
            },
        ],
    },
    {
        title: "Key Terms",
        subtitle: "What are the main terms and conditions?",
        icon: "📋",
        fields: [
            {
                key: "keyTerms",
                label: "Core Terms & Conditions",
                type: "textarea",
                placeholder: `Describe the main terms, e.g.:
• Rent: ₹25,000/month, payable by 5th of each month
• Duration: 11 months from 1st June 2025
• Security Deposit: ₹50,000 (refundable)
• Notice period: 1 month by either party`,
                required: true,
                minLength: 30,
                hint: "The more specific you are, the more accurate and professional the document will be.",
            },
            {
                key: "specialClauses",
                label: "Special / Additional Clauses",
                type: "textarea",
                placeholder: "e.g., No subletting, Pets not allowed, Maintenance responsibilities, Specific payment penalties...",
            },
        ],
    },
    {
        title: "Jurisdiction & Date",
        subtitle: "Legal context for the document",
        icon: "🏛️",
        fields: [
            {
                key: "jurisdiction",
                label: "Jurisdiction / State",
                type: "text",
                placeholder: "e.g., Maharashtra, Karnataka, Delhi",
                required: true,
            },
            {
                key: "executionDate",
                label: "Date of Execution",
                type: "date",
            },
            {
                key: "stampDuty",
                label: "Stamp Duty / Notarisation Required?",
                type: "select",
                options: [
                    { value: "yes_stamp", label: "Yes — include stamp duty clause" },
                    { value: "yes_notarised", label: "Yes — to be notarised" },
                    { value: "no", label: "No — simple signed agreement" },
                ],
            },
        ],
    },
];

const exampleScenarios: Record<string, string> = {
    legal_notice: "Sender: Ramesh Kumar, 123 MG Road, Mumbai.\nRecipient: Suresh Patel, 456 Link Road, Mumbai.\nIssue: Non-repair of rented property despite multiple reminders.\nDemand: Repair damages worth Rs. 50,000 within 15 days or face legal action.",
    nda: "Party A: TechSolutions Pvt Ltd, Bangalore.\nParty B: Rahul Verma, Consultant.\nPurpose: Exploring potential software development partnership.\nConfidential Info: Source code, business strategies, client lists.\nDuration: 2 years.",
    rent_agreement: "Landlord: Amit Singh, Delhi.\nTenant: Priya Sharma, Delhi.\nProperty: Flat 301, Green Apartments, Rohini, Delhi.\nRent: Rs. 25,000/month.\nSecurity Deposit: Rs. 50,000.\nDuration: 11 months.\nStart Date: 1st February 2024.",
    affidavit: "Deponent: Vijay Singh, aged 35, residing in Pune.\nStatement: I declare that I have lost my original driving license (DL No. MH123456) on 10th Jan 2024 while travelling from Pune to Mumbai. I have not misused it.",
    employment_contract: "Employer: Innovate AI Ltd, Hyderabad.\nEmployee: Anjali Das.\nDesignation: Senior Data Scientist.\nSalary: Rs. 1,50,000/month.\nNotice Period: 60 days.\nJoining Date: 1st March 2024.",
    posh_complaint: "Complainant: Neha Gupta, Marketing Manager.\nRespondent: Ravi Kumar, Team Lead.\nIncident: Unsolicited inappropriate comments made during lunch break on 15th Jan 2024 at the office cafeteria.\nWitnesses: Priya (HR), Rahul (Sales).",
    rti_application: "Department: Ministry of Road Transport & Highways.\nInformation Sought: 1. Status of road construction project on NH-44 near Nagpur. 2. Total funds allocated and utilized for this project in 2023-24.\n Applicant: Suresh Patil, Nagpur."
};

const DraftingPage = () => {
    const [draftType, setDraftType] = useState<string>("legal_notice");
    const [details, setDetails] = useState<string>("");
    const [language, setLanguage] = useState<string>("en");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState<string>("");
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [wizardMode, setWizardMode] = useState(true); // default to guided wizard

    // ── Wizard handler ──────────────────────────────────────────────────────
    const handleWizardComplete = async (data: Record<string, string>) => {
        setIsGenerating(true);
        setGeneratedDraft("");
        setWizardMode(false); // switch to editor view
        try {
            const systemPrompt = `You are an expert Indian Legal Draftsman with 20+ years of experience.
Draft a professional, complete, legally-sound ${data.docType || "legal document"} in ${data.language || "English"}.
Use proper legal terminology, numbered clauses, formal structure.
Ensure compliance with relevant Indian laws (BNS 2023, BNSS 2023, specific state laws of ${data.jurisdiction || "India"}).
Include all necessary clauses, recitals, and schedules for this type of document.
Add signature lines, date lines, and witness fields at the end.
If HINDI is selected, use formal Shuddh Hindi legal language.`;

            const prompt = `Draft a ${data.docType}:

PARTIES:
Party A: ${data.partyA}
Party B: ${data.partyB}
${data.additionalParties ? `Additional Parties: ${data.additionalParties}` : ""}

KEY TERMS:
${data.keyTerms}

${data.specialClauses ? `SPECIAL CLAUSES:
${data.specialClauses}` : ""}

JURISDICTION: ${data.jurisdiction}
EXECUTION DATE: ${data.executionDate || "[Date of signing]"}
STAMP DUTY: ${data.stampDuty || "As applicable"}

Generate the complete, final document with all proper legal clauses.`;

            const result = await generateLegalContent(prompt, systemPrompt);
            setGeneratedDraft(result);
            toast.success("Professional draft generated!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Drafting Failed: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        if (!details.trim()) {
            toast.error("Please provide some details for the draft.");
            return;
        }

        setIsGenerating(true);
        setGeneratedDraft("");

        try {
            const systemPrompt = `You are an expert Indian Legal Draftsman. 
            Draft a professional, legally-sound document of type: ${draftType.replace(/_/g, " ").toUpperCase()}. 
            Language: ${language === 'hi' ? 'HINDI' : 'ENGLISH'}.
            Use appropriate legal terminology, formal structure, and ensure compliance with relevant Indian statutes (IPC, BNS, etc. as applicable). 
            If HINDI is selected, ensure the legal tone is formal (Shuddh Hindi) but understandable.`;

            const prompt = `Draft a ${draftType.replace(/_/g, " ")} based on these details:\n${details}\n\nInclude placeholders for signatures, dates, and locations where necessary.`;
            
            const result = await generateLegalContent(prompt, systemPrompt);
            setGeneratedDraft(result);
            toast.success("Draft generated successfully!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Error generating draft:", error);
            toast.error(`Drafting Failed: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!generatedDraft) return;

        try {
            await exportStructuredPdf({
                title: "LegalAi Draft",
                fileName: `${draftType}_draft.pdf`,
                metadata: [
                    `Type: ${draftType.replace(/_/g, " ").toUpperCase()}`,
                    `Date: ${new Date().toLocaleDateString()}`,
                ],
                sections: [{ text: toPlainText(generatedDraft) }],
                footer: "Generated by LegalAi - Not a substitute for professional legal advice.",
            });
            toast.success("PDF Downloaded!");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Unable to download PDF. Please try again.");
        }
    };

    return (
        <div className={cn(
            "min-h-screen flex flex-col text-gray-900 overflow-x-hidden transition-colors duration-500",
            isFocusMode ? "bg-white" : ""
        )}>
            {!isFocusMode && <TricolorBackground intensity="strong" showOrbs={true} />}
            {!isFocusMode && <Header />}

            {/* Focus Mode Overlay */}
            <AnimatePresence>
                {isFocusMode && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white p-4 md:p-12 flex flex-col"
                    >
                        <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsFocusMode(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-gray-900">Editor Focus</h2>
                                        <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
                                            {draftType.replace(/_/g, " ")} • {language === 'hi' ? 'Hindi' : 'English'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedDraft);
                                            toast.success("Copied!");
                                        }}
                                        className="rounded-full"
                                    >
                                        <Copy className="w-4 h-4 mr-2" /> Copy
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPDF}
                                        className="btn-saffron rounded-full px-8"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Export PDF
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={generatedDraft}
                                onChange={(e) => setGeneratedDraft(e.target.value)}
                                className="flex-1 bg-gray-50/50 border-0 text-gray-900 font-serif text-xl leading-loose p-12 resize-none focus:ring-0 rounded-[2.5rem] shadow-inner"
                                placeholder="Your draft will appear here..."
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn(
                "container mx-auto px-4 flex-1 relative z-10 transition-all duration-500",
                isFocusMode ? "opacity-0" : "pt-8 pb-24 max-w-7xl"
            )}>


                {/* Hero Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        <Zap className="w-3 h-3" />
                        AI Drafting Engine
                    </div>
                    <h1 className="editorial-title mb-4">
                        Legal <span className="premium-gradient-text">Drafter</span>
                    </h1>
                    <p className="editorial-subtitle max-w-2xl mb-8">
                        Generate precise, professional legal documents in seconds. 
                        Tailored for Indian Law and compliance standards with AI-driven accuracy.
                    </p>

                    {/* Mode Switcher */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                        <button
                            onClick={() => { setWizardMode(true); setGeneratedDraft(""); }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                wizardMode
                                    ? "bg-white text-saffron shadow-md"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Wand2 className="w-4 h-4" />
                            Guided Wizard
                        </button>
                        <button
                            onClick={() => setWizardMode(false)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                !wizardMode
                                    ? "bg-white text-saffron shadow-md"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Settings2 className="w-4 h-4" />
                            Quick Draft
                        </button>
                    </div>
                </motion.div>

                {/* ── Guided Wizard Mode ───────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                {wizardMode && !generatedDraft && (
                    <motion.div
                        key="guided"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 shadow-lg mb-10"
                    >
                        <SmartWizard
                            steps={DRAFT_WIZARD_STEPS}
                            onComplete={handleWizardComplete}
                            isLoading={isGenerating}
                            accentColor="bg-saffron"
                            reviewTitle="Review Document Details"
                        />
                    </motion.div>
                )}
                {isGenerating && wizardMode && (
                    <motion.div
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-2xl mx-auto text-center py-20"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-saffron animate-pulse" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Drafting your document...</h3>
                        <p className="text-gray-500 text-sm">AI is generating a professionally formatted legal document tailored to your details.</p>
                    </motion.div>
                )}
                {generatedDraft && wizardMode && (
                    <motion.div
                        key="wizard-result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 shadow-lg mb-10"
                    >
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <h3 className="text-xl font-serif font-bold text-gray-900">Generated Document</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generatedDraft); toast.success("Copied!"); }} className="rounded-xl">
                                    <Copy className="w-4 h-4 mr-1" /> Copy
                                </Button>
                                <Button size="sm" onClick={handleDownloadPDF} className="btn-saffron rounded-xl">
                                    <Download className="w-4 h-4 mr-1" /> PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setGeneratedDraft(""); }} className="rounded-xl gap-1">
                                    <RefreshCw className="w-4 h-4" /> New
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            value={generatedDraft}
                            onChange={(e) => setGeneratedDraft(e.target.value)}
                            className="w-full min-h-[540px] border-0 bg-gray-50/30 text-gray-900 font-serif text-base leading-relaxed p-6 resize-none focus:ring-0 rounded-2xl"
                        />
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            <ShieldCheck className="w-3 h-3 text-green-600" />
                            AI-drafted document — review before signing. Not a substitute for professional legal advice.
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* ── Quick Draft Mode (original UI) ──────────────────────────────── */}
                {!wizardMode && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">


                    {/* Configuration Panel */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5 flex flex-col"
                    >
                        <div className="glass-tricolor-card p-8 rounded-[3rem] border border-gray-100 flex flex-col h-full shadow-premium relative overflow-hidden">
                            {/* Technical Accents */}
                            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-saffron/20 rounded-tl-[3rem]" />
                            
                            <div className="mb-8 border-b border-gray-100 pb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="flex items-center gap-2 text-2xl font-serif font-bold text-gray-900">
                                        <Settings2 className="w-6 h-6 text-saffron" />
                                        Configuration
                                    </h3>
                                    <p className="text-gray-400 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">
                                        Document Parameters
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-saffron-light flex items-center justify-center shadow-inner">
                                    <FileSignature className="w-6 h-6 text-saffron" />
                                </div>
                            </div>

                            <div className="space-y-8 flex-1">
                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <Label className="text-gray-900 font-bold text-sm uppercase tracking-wider">Document Type</Label>
                                    <Select value={draftType} onValueChange={setDraftType}>
                                        <SelectTrigger className="h-14 bg-white/50 border-gray-200 text-gray-900 focus:ring-saffron/20 focus:border-saffron rounded-2xl text-base">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-2xl shadow-elevated">
                                            <SelectItem value="legal_notice">Legal Notice</SelectItem>
                                            <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                                            <SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                                            <SelectItem value="affidavit">Affidavit</SelectItem>
                                            <SelectItem value="employment_contract">Employment Contract</SelectItem>
                                            <SelectItem value="posh_complaint">POSH Complaint</SelectItem>
                                            <SelectItem value="rti_application">RTI Application</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Situation Input */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <Label className="text-gray-900 font-bold text-sm uppercase tracking-wider">Case Details</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setDetails(exampleScenarios[draftType] || "");
                                                toast.success("Example details loaded!");
                                            }}
                                            className="h-8 text-xs text-saffron hover:bg-saffron-light rounded-full px-4"
                                        >
                                            <Sparkles className="w-3 h-3 mr-2" />
                                            Quick Fill
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Describe the situation, parties involved, dates, and specific demands..."
                                        className="min-h-[280px] bg-white/50 border-gray-200 text-gray-900 resize-none focus:ring-saffron/20 focus:border-saffron rounded-[2rem] p-6 text-base leading-relaxed"
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                    />
                                </div>

                                {/* Language & Action */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                                    <div className="flex items-center gap-4 bg-gray-50/80 px-6 py-3 rounded-full border border-gray-100">
                                        <Languages className="w-5 h-5 text-gray-400" />
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-xs font-bold tracking-widest transition-colors", language === 'en' ? 'text-gray-900' : 'text-gray-300')}>ENGLISH</span>
                                            <Switch
                                                checked={language === 'hi'}
                                                onCheckedChange={(checked) => setLanguage(checked ? 'hi' : 'en')}
                                                className="data-[state=checked]:bg-saffron"
                                            />
                                            <span className={cn("text-xs font-bold tracking-widest transition-colors", language === 'hi' ? 'text-gray-900' : 'text-gray-300')}>HINDI</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !details}
                                        className="w-full sm:w-auto h-14 px-10 rounded-full btn-saffron font-bold text-base transition-all shadow-saffron group"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Drafting...
                                            </>
                                        ) : (
                                            <>
                                                Generate Draft
                                                <PenTool className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3 h-3 text-green-india" />
                                        Legal Standard
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>Verified Logic</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Editor Panel */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 flex flex-col"
                    >
                        <Card className="card-premium shadow-premium h-full flex flex-col rounded-[2.5rem] border border-gray-100 bg-white/80 backdrop-blur-xl overflow-hidden min-h-[560px]">
                            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-gray-100">
                                <div>
                                    <CardTitle className="text-2xl font-serif font-bold text-gray-900">Document Editor</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
                                        Live Preview & Refinement
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsFocusMode(true)}
                                        disabled={!generatedDraft}
                                        className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                                        title="Focus Mode"
                                    >
                                        <Maximize2 className="w-5 h-5" />
                                    </Button>
                                    <div className="h-6 w-px bg-gray-200 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (generatedDraft) {
                                                navigator.clipboard.writeText(generatedDraft);
                                                toast.success("Copied!");
                                            }
                                        }}
                                        disabled={!generatedDraft}
                                        className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                                        title="Copy Draft"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPDF}
                                        disabled={!generatedDraft}
                                        className="rounded-full btn-green shadow-green px-6 font-bold"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 relative">
                                {generatedDraft ? (
                                    <Textarea
                                        value={generatedDraft}
                                        onChange={(e) => setGeneratedDraft(e.target.value)}
                                        className="w-full h-full min-h-[500px] border-0 bg-gray-50/30 text-gray-900 font-serif text-lg leading-relaxed p-10 resize-none focus:ring-0"
                                        placeholder="Generated draft will appear here..."
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-gray-50/50">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white shadow-elevated flex items-center justify-center mb-6">
                                            <FileText className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-gray-400 mb-2">Editor Ready</h3>
                                        <p className="text-gray-400 text-sm max-w-xs font-light">
                                            Configure your document on the left to generate a professional draft here.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
                )} {/* end !wizardMode */}
            </div>

            {!isFocusMode && <Footer />}
        </div>
    );
};

export default DraftingPage;
