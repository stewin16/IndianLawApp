import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Copy, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { riskAnalyzer } from "@/services/groqService";
import SmartWizard, { WizardStep } from "@/components/SmartWizard";
import { Link as RouterLink } from "react-router-dom";
import { FileText, ExternalLink } from "lucide-react";

const WIZARD_STEPS: WizardStep[] = [
    {
        title: "Contract Type",
        subtitle: "What kind of agreement is this?",
        icon: "📄",
        fields: [
            {
                key: "contractType",
                label: "Type of Contract / Agreement",
                type: "chips",
                chips: ["Employment Contract", "Rental / Lease Agreement", "Business Partnership", "Sale / Purchase Deed", "Service Agreement", "Loan Agreement", "NDA", "Freelance Contract"],
                placeholder: "Or describe the contract type...",
                required: true,
            },
            {
                key: "yourRole",
                label: "You are signing as:",
                type: "select",
                options: [
                    { value: "party_a", label: "Party A (e.g., Employer, Landlord, Seller, Lender)" },
                    { value: "party_b", label: "Party B (e.g., Employee, Tenant, Buyer, Borrower)" },
                    { value: "reviewing", label: "Reviewing on behalf of a third party" },
                ],
                required: true,
            },
            {
                key: "jurisdiction",
                label: "Jurisdiction / State",
                type: "text",
                placeholder: "e.g., Maharashtra, Karnataka, Delhi",
                hint: "Indian state law may affect specific clauses.",
            },
        ],
    },
    {
        title: "Your Concerns",
        subtitle: "What areas worry you most?",
        icon: "🔍",
        fields: [
            {
                key: "concerns",
                label: "Key Areas of Concern",
                type: "chips",
                chips: ["Liability & indemnity clauses", "Exit / termination clause", "Payment terms", "Intellectual property rights", "Non-compete / restraint of trade", "Arbitration clause", "Force majeure", "Data privacy"],
                placeholder: "Any other specific concerns?",
            },
            {
                key: "dealValue",
                label: "Deal Value / Contract Amount (₹)",
                type: "number",
                placeholder: "e.g., 500000",
                hint: "This helps calibrate the risk severity assessment.",
            },
        ],
    },
    {
        title: "Paste Contract",
        subtitle: "Add the agreement text for analysis",
        icon: "📋",
        fields: [
            {
                key: "contractText",
                label: "Contract / Agreement Text",
                type: "textarea",
                placeholder: `Paste the full contract text here for analysis...

For best results, include:
• All terms and conditions
• Payment terms and penalties
• Termination / exit provisions
• Liability and indemnity clauses
• Any special conditions`,
                required: true,
                minLength: 100,
                hint: "The more complete the text, the more accurate the risk analysis.",
            },
        ],
    },
];

const RiskAnalyzerPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        risks: Array<{ level: string; description: string; remedy: string }>;
        overall_score: number;
    } | null>(null);
    const [lastData, setLastData] = useState<Record<string, string>>({});

    const handleComplete = async (data: Record<string, string>) => {
        setIsLoading(true);
        setResult(null);
        setLastData(data);

        // Build a rich contract analysis prompt from all wizard data
        const enrichedText = `Contract Type: ${data.contractType}.
Reviewer's Role: ${data.yourRole}.
Jurisdiction: ${data.jurisdiction || "Not specified"}.
Key Concerns: ${data.concerns || "General review"}.
Deal Value: ₹${data.dealValue || "Not specified"}.

Full Contract Text:
${data.contractText}`;

        try {
            const analysis = await riskAnalyzer(enrichedText);
            setResult(analysis);
            toast.success("Risk analysis complete!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Analysis failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResult = () => {
        if (!result) return;
        const text = `Overall Risk Score: ${result.overall_score}/100\n\nRisks Identified:\n${result.risks.map(r => `[${r.level}] ${r.description}\nRemedy: ${r.remedy}`).join("\n\n")}`;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const riskColor = (score: number) =>
        score > 70 ? "text-red-600" : score > 40 ? "text-amber-600" : "text-green-600";

    const riskLabel = (score: number) =>
        score > 70 ? "🔴 HIGH RISK" : score > 40 ? "🟡 MEDIUM RISK" : "🟢 LOW RISK";

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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center shadow-lg">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">Legal Risk Analyzer</h1>
                            <p className="text-gray-500">AI-guided contract analysis — know your risks before you sign</p>
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
                                accentColor="bg-red-500"
                                reviewTitle="Review & Analyze Contract"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            {/* Score header */}
                            <div className="bg-white/90 rounded-3xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-lg text-gray-900">Risk Analysis Complete</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={copyResult}>
                                        <Copy className="w-4 h-4 mr-1" /> Copy Report
                                    </Button>
                                </div>

                                {/* Score card */}
                                <div className="flex items-center gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="relative w-20 h-20 shrink-0">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15.9" fill="none"
                                                stroke={result.overall_score > 70 ? "#ef4444" : result.overall_score > 40 ? "#f59e0b" : "#22c55e"}
                                                strokeWidth="3"
                                                strokeDasharray={`${result.overall_score} ${100 - result.overall_score}`}
                                                strokeDashoffset="25"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-lg font-black ${riskColor(result.overall_score)}`}>{result.overall_score}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Overall Risk Score</p>
                                        <p className={`text-xl font-black ${riskColor(result.overall_score)}`}>{riskLabel(result.overall_score)}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Contract Type: <strong>{lastData.contractType}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Risks */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2 px-1">
                                    <AlertTriangle className="w-5 h-5 text-saffron" />
                                    Identified Risks & Remedies ({result.risks.length})
                                </h4>
                                {result.risks.map((risk, idx) => (
                                    <div key={idx} className="bg-white/90 p-5 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                risk.level === "High" ? "bg-red-100 text-red-700" :
                                                risk.level === "Medium" ? "bg-amber-100 text-amber-700" :
                                                "bg-green-100 text-green-700"
                                            }`}>
                                                {risk.level} Risk
                                            </span>
                                        </div>
                                        <p className="font-semibold text-gray-900 mb-2 text-sm">{risk.description}</p>
                                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                                            <p className="text-xs text-blue-800 leading-relaxed">
                                                <strong>Suggested Remedy: </strong>{risk.remedy}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700">AI analysis for informational purposes only. Always consult a qualified legal professional before signing.</p>
                            </div>

                            {/* Related resources */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <RouterLink to="/draft" className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group">
                                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                                    <span className="block font-medium text-gray-900">Document Drafter</span>
                                    <span className="text-xs text-gray-500">Create a new contract with better terms</span>
                                </RouterLink>
                                <a href="https://indiankanoon.org" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group">
                                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                                    <span className="block font-medium text-gray-900">Indian Kanoon</span>
                                    <span className="text-xs text-gray-500">Search relevant contract law cases</span>
                                </a>
                            </div>

                            <Button variant="outline" onClick={() => setResult(null)} className="gap-2 rounded-xl">
                                <RefreshCw className="w-4 h-4" /> Analyze Another Contract
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RiskAnalyzerPage;
