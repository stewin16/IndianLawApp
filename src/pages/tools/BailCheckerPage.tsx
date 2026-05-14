import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Unlock, ShieldCheck, AlertCircle, Scale, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent, parseModelJson } from "@/services/groqService";
import SmartWizard, { WizardStep } from "@/components/SmartWizard";

interface BailResult {
    bailable: boolean;
    section: string;
    provision: string;
    conditions: string[];
    reasoning: string;
    bail_amount_range?: string;
    recommended_court?: string;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        title: "The Offense",
        subtitle: "What is the alleged crime?",
        icon: "⚖️",
        fields: [
            {
                key: "offenseType",
                label: "Type of Offense",
                type: "chips",
                chips: ["Theft", "Cheating / Fraud", "Assault", "Murder", "Kidnapping", "Drunk Driving", "Dowry Harassment", "Cybercrime", "Drug Possession"],
                placeholder: "Or describe the offense...",
                required: true,
            },
            {
                key: "offenseDescription",
                label: "Describe the Alleged Offense",
                type: "textarea",
                placeholder: "Provide details about what the accused is alleged to have done...",
                required: true,
                minLength: 20,
            },
            {
                key: "sectionIfKnown",
                label: "Section Number (if known)",
                type: "text",
                placeholder: "e.g., BNS 303, IPC 420 — leave blank if unknown",
                hint: "We will identify the correct section automatically if you leave this blank.",
            },
        ],
    },
    {
        title: "Accused Profile",
        subtitle: "Background of the accused",
        icon: "👤",
        fields: [
            {
                key: "accusedBackground",
                label: "Criminal History",
                type: "select",
                options: [
                    { value: "first_time", label: "First-time offender — no prior criminal record" },
                    { value: "minor_prior", label: "Minor prior offenses (bailable)" },
                    { value: "prior_serious", label: "Prior serious convictions" },
                    { value: "unknown", label: "Not known" },
                ],
            },
            {
                key: "accusedAge",
                label: "Age of Accused",
                type: "select",
                options: [
                    { value: "juvenile", label: "Juvenile (below 18)" },
                    { value: "adult", label: "Adult (18-60)" },
                    { value: "senior", label: "Senior Citizen (60+)" },
                ],
            },
            {
                key: "flightRisk",
                label: "Is there a flight risk?",
                type: "select",
                options: [
                    { value: "low", label: "Low — accused has local ties, stable employment" },
                    { value: "medium", label: "Medium — unclear ties to area" },
                    { value: "high", label: "High — may flee or tamper with evidence" },
                ],
            },
        ],
    },
    {
        title: "Court & Jurisdiction",
        subtitle: "Where will bail be applied for?",
        icon: "🏛️",
        fields: [
            {
                key: "court",
                label: "Which Court?",
                type: "chips",
                chips: ["Magistrate Court", "Sessions Court", "High Court", "Supreme Court"],
                placeholder: "",
                required: true,
            },
            {
                key: "state",
                label: "State / UT",
                type: "text",
                placeholder: "e.g., Maharashtra, Delhi, Karnataka",
                required: true,
            },
            {
                key: "additionalContext",
                label: "Any other relevant context?",
                type: "textarea",
                placeholder: "e.g., victim's condition, media attention, co-accused, ongoing investigation status...",
            },
        ],
    },
];

const BailCheckerPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BailResult | null>(null);

    const handleComplete = async (data: Record<string, string>) => {
        setIsLoading(true);
        setResult(null);

        const systemPrompt = `You are an expert Indian Criminal Law Consultant specialising in bail jurisprudence.
Analyse the bail eligibility for the given offense and circumstances under the Bharatiya Nyaya Sanhita (BNS) 2023 and Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.
Output ONLY a valid JSON object in this EXACT structure — no markdown, no explanation:
{
  "bailable": true or false,
  "section": "applicable BNS/IPC section number",
  "provision": "brief description of the legal provision",
  "conditions": ["condition 1", "condition 2"],
  "reasoning": "detailed legal reasoning",
  "bail_amount_range": "e.g., ₹10,000 - ₹50,000 surety",
  "recommended_court": "which court to approach"
}`;

        const prompt = `Analyse bail eligibility for:
Offense: ${data.offenseType}. Details: ${data.offenseDescription}.
Section (if known): ${data.sectionIfKnown || "To be identified"}.
Accused background: ${data.accusedBackground || "unknown"}.
Age: ${data.accusedAge || "adult"}.
Flight risk: ${data.flightRisk || "unknown"}.
Court: ${data.court}.
State: ${data.state}.
Additional context: ${data.additionalContext || "None"}.`;

        try {
            const content = await generateLegalContent(prompt, systemPrompt);
            const parsed = parseModelJson<BailResult>(content);
            if (typeof parsed.bailable === "undefined") throw new Error("Unexpected AI response. Please try again.");
            setResult(parsed);
            toast.success("Bail analysis complete!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Analysis failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-4xl mx-auto pt-8 pb-20 px-4 md:px-6">
                <Link to="/features" className="inline-flex items-center gap-2 text-gray-500 hover:text-saffron mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg">
                            <Unlock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">Bail Eligibility Checker</h1>
                            <p className="text-gray-500">AI-guided analysis based on BNS 2023 & BNSS 2023</p>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key="wizard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 shadow-lg"
                        >
                            <SmartWizard
                                steps={WIZARD_STEPS}
                                onComplete={handleComplete}
                                isLoading={isLoading}
                                accentColor="bg-green-600"
                                reviewTitle="Review Bail Details"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            {/* Verdict banner */}
                            <div className={`p-6 rounded-3xl border flex items-center gap-5 ${result.bailable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.bailable ? "bg-green-100" : "bg-red-100"}`}>
                                    {result.bailable ? <ShieldCheck className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Eligibility Verdict</p>
                                    <p className={`text-2xl font-black ${result.bailable ? "text-green-700" : "text-red-700"}`}>
                                        {result.bailable ? "✅ BAILABLE OFFENCE" : "❌ NON-BAILABLE OFFENCE"}
                                    </p>
                                    {result.recommended_court && (
                                        <p className="text-sm text-gray-600 mt-1">Apply for bail at: <strong>{result.recommended_court}</strong></p>
                                    )}
                                </div>
                            </div>

                            {/* Detail cards */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white/90 rounded-2xl border border-gray-200 p-5">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                        <Scale className="w-4 h-4 text-green-600" /> Legal Section
                                    </h4>
                                    <p className="font-bold text-navy-india">{result.section}</p>
                                    <p className="text-xs text-gray-600 mt-1">{result.provision}</p>
                                </div>
                                {result.bail_amount_range && (
                                    <div className="bg-white/90 rounded-2xl border border-gray-200 p-5">
                                        <h4 className="font-bold text-gray-900 mb-2 text-sm">💰 Bail Amount Range</h4>
                                        <p className="font-bold text-navy-india">{result.bail_amount_range}</p>
                                        <p className="text-xs text-gray-500 mt-1">Subject to court's discretion</p>
                                    </div>
                                )}
                            </div>

                            {result.conditions?.length > 0 && (
                                <div className="bg-white/90 rounded-2xl border border-gray-200 p-5">
                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">📋 Bail Conditions Likely to Be Imposed</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.conditions.map((c, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white/90 rounded-2xl border border-gray-200 p-5">
                                <h4 className="font-bold text-gray-900 mb-2 text-sm">🧠 AI Legal Reasoning</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-700">
                                <strong>Note:</strong> Bail decisions are ultimately at the court's discretion. Consult a criminal lawyer before filing a bail application.
                            </div>

                            <Button variant="outline" onClick={() => setResult(null)} className="gap-2 rounded-xl">
                                <RefreshCw className="w-4 h-4" /> Check Another Case
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BailCheckerPage;
