import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileWarning, CheckCircle, Copy, Download, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent, parseModelJson } from "@/services/groqService";
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";
import SmartWizard, { WizardStep } from "@/components/SmartWizard";

interface FIRResult {
    draft: string;
    relevant_sections: string[];
    instructions: string[];
}

const WIZARD_STEPS: WizardStep[] = [
    {
        title: "Who are you?",
        subtitle: "Tell us about the complainant",
        icon: "👤",
        fields: [
            {
                key: "complainantName",
                label: "Your Full Name",
                type: "text",
                placeholder: "e.g., Ramesh Kumar",
                required: true,
            },
            {
                key: "complainantAddress",
                label: "Your Address",
                type: "text",
                placeholder: "e.g., 123, MG Road, Mumbai - 400001",
                required: true,
            },
            {
                key: "contactNumber",
                label: "Contact Number",
                type: "text",
                placeholder: "e.g., 9876543210",
            },
        ],
    },
    {
        title: "The Incident",
        subtitle: "When and where did it happen?",
        icon: "📍",
        fields: [
            {
                key: "incidentDate",
                label: "Date of Incident",
                type: "date",
                required: true,
            },
            {
                key: "incidentTime",
                label: "Approximate Time",
                type: "text",
                placeholder: "e.g., around 9:30 PM",
            },
            {
                key: "incidentLocation",
                label: "Location of Incident",
                type: "text",
                placeholder: "Full address or landmark where it occurred",
                required: true,
            },
            {
                key: "policeStation",
                label: "Nearest Police Station",
                type: "text",
                placeholder: "e.g., Andheri Police Station",
            },
        ],
    },
    {
        title: "What Happened?",
        subtitle: "Describe the incident in detail",
        icon: "📋",
        fields: [
            {
                key: "crimeType",
                label: "Type of Crime / Offense",
                type: "chips",
                chips: ["Theft", "Assault", "Fraud / Cheating", "Domestic Violence", "Cybercrime", "Robbery", "Sexual Harassment", "Other"],
                placeholder: "Or describe the offense type...",
                required: true,
            },
            {
                key: "incidentDescription",
                label: "Detailed Description",
                type: "textarea",
                placeholder: "Describe exactly what happened — what was done, how, by whom, and what loss or injury occurred...",
                required: true,
                minLength: 50,
                hint: "The more detail you provide, the better the FIR draft will be.",
            },
        ],
    },
    {
        title: "The Accused",
        subtitle: "Details about the person(s) involved",
        icon: "🔍",
        fields: [
            {
                key: "accusedKnown",
                label: "Is the accused known to you?",
                type: "select",
                options: [
                    { value: "yes_known", label: "Yes — I know who it is" },
                    { value: "partially", label: "Partially — I have a description" },
                    { value: "unknown", label: "No — accused is unknown" },
                ],
            },
            {
                key: "accusedDetails",
                label: "Accused Details (if known)",
                type: "textarea",
                placeholder: "Name, address, description, vehicle number, or any other identifying information...",
                hint: "Leave blank if accused is completely unknown.",
            },
            {
                key: "witnesses",
                label: "Witnesses (if any)",
                type: "text",
                placeholder: "e.g., Suresh Patel (neighbour), CCTV at location",
            },
        ],
    },
];

const FIRGeneratorPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<FIRResult | null>(null);

    const handleComplete = async (data: Record<string, string>) => {
        setIsLoading(true);
        setResult(null);

        const systemPrompt = `You are an expert Indian Police and Legal Assistant specialising in FIR drafting.
Generate a complete, professionally formatted FIR (First Information Report) complaint draft based on the given details.
Identify the applicable sections under the Bharatiya Nyaya Sanhita (BNS 2023) and/or Indian Penal Code (IPC).
Output ONLY a valid JSON object in this EXACT structure — no explanation, no markdown wrapper:
{ "draft": "full multi-paragraph FIR text", "relevant_sections": ["BNS 103", "BNS 316", "..."], "instructions": ["Step 1...", "Step 2..."] }`;

        const prompt = `Generate an FIR draft with these details:
Complainant: ${data.complainantName}, ${data.complainantAddress}. Contact: ${data.contactNumber || "N/A"}.
Incident Date & Time: ${data.incidentDate} ${data.incidentTime || ""}.
Incident Location: ${data.incidentLocation}.
Nearest Police Station: ${data.policeStation || "To be determined"}.
Type of Crime: ${data.crimeType}.
Full Description: ${data.incidentDescription}.
Accused: ${data.accusedKnown || "Unknown"}. Details: ${data.accusedDetails || "Unknown"}.
Witnesses: ${data.witnesses || "None identified"}.`;

        try {
            const content = await generateLegalContent(prompt, systemPrompt);
            const parsed = parseModelJson<FIRResult>(content);
            if (!parsed.draft) throw new Error("AI returned an unexpected response. Please try again.");
            setResult(parsed);
            toast.success("FIR Draft generated successfully!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("FIR Generation Error:", error);
            toast.error(`Error: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!result) return;
        try {
            await exportStructuredPdf({
                title: "FIR Complaint Draft",
                fileName: "fir_complaint_draft.pdf",
                metadata: [`Date: ${new Date().toLocaleDateString()}`, `Sections: ${result.relevant_sections.join(", ")}`],
                sections: [{ label: "FIR Draft", text: toPlainText(result.draft) }],
                footer: "AI-generated draft — review before submission. Not a substitute for legal advice.",
            });
            toast.success("PDF Downloaded!");
        } catch {
            toast.error("PDF export failed.");
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

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                            <FileWarning className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">FIR Complaint Generator</h1>
                            <p className="text-gray-500">AI-guided intake → legally formatted FIR draft</p>
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
                                accentColor="bg-red-600"
                                reviewTitle="Review FIR Details"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Result header */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-green-200 p-6">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-green-700 text-lg">FIR Draft Generated</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result.draft); toast.success("Copied!"); }}>
                                            <Copy className="w-4 h-4 mr-1" /> Copy
                                        </Button>
                                        <Button size="sm" onClick={handleDownload} className="bg-red-600 hover:bg-red-700 text-white">
                                            <Download className="w-4 h-4 mr-1" /> PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="font-mono text-sm text-gray-700 bg-gray-50 rounded-xl p-5 whitespace-pre-wrap leading-relaxed border border-gray-100">
                                    {result.draft}
                                </div>

                                {result.relevant_sections?.length > 0 && (
                                    <div className="mt-5">
                                        <p className="text-sm font-bold text-gray-900 mb-2">Applicable Sections:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.relevant_sections.map((sec, i) => (
                                                <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">{sec}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.instructions?.length > 0 && (
                                    <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-sm font-bold text-blue-800 mb-2">Next Steps:</p>
                                        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                            {result.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                                        </ol>
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700">This is an AI-generated draft. Review carefully before submission. For serious crimes, consult a lawyer.</p>
                                </div>
                            </div>

                            <Button variant="outline" onClick={() => setResult(null)} className="gap-2 rounded-xl">
                                <RefreshCw className="w-4 h-4" /> Start New FIR
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FIRGeneratorPage;
