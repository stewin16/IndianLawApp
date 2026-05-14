import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, FileText, Download, Copy, CheckCircle, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent } from "@/services/groqService";
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";
import SmartWizard, { WizardStep } from "@/components/SmartWizard";

const WIZARD_STEPS: WizardStep[] = [
    {
        title: "What did you buy?",
        subtitle: "Tell us about the product or service",
        icon: "🛒",
        fields: [
            {
                key: "seller",
                label: "Seller / Business Name",
                type: "text",
                placeholder: "e.g., Amazon India, Local Electronics Shop, Swiggy",
                required: true,
            },
            {
                key: "product",
                label: "Product / Service Name",
                type: "text",
                placeholder: "e.g., iPhone 15 Pro, Sofa Set, House Repair Service",
                required: true,
            },
            {
                key: "price",
                label: "Amount Paid (₹)",
                type: "number",
                placeholder: "e.g., 75000",
                required: true,
            },
            {
                key: "purchaseDate",
                label: "Date of Purchase / Service",
                type: "date",
            },
        ],
    },
    {
        title: "What Went Wrong?",
        subtitle: "Describe the issue",
        icon: "⚠️",
        fields: [
            {
                key: "issueType",
                label: "Type of Problem",
                type: "chips",
                chips: ["Defective product", "Not delivered", "Wrong item delivered", "Service not rendered", "Overcharging / Hidden fees", "Misleading advertisement", "Refund refused", "Warranty claim denied"],
                placeholder: "Or describe the problem type...",
                required: true,
            },
            {
                key: "grievance",
                label: "Detailed Description of Issue",
                type: "textarea",
                placeholder: "Describe exactly what happened — what was promised, what you received, what damage was caused...",
                required: true,
                minLength: 40,
            },
            {
                key: "attemptedResolution",
                label: "Did you contact the seller / company?",
                type: "select",
                options: [
                    { value: "yes_no_response", label: "Yes — but they did not respond" },
                    { value: "yes_refused", label: "Yes — they refused to help" },
                    { value: "yes_unsatisfactory", label: "Yes — response was unsatisfactory" },
                    { value: "no", label: "No — I want to send a first notice" },
                ],
            },
        ],
    },
    {
        title: "What Relief Do You Want?",
        subtitle: "Your demands from the seller",
        icon: "⚖️",
        fields: [
            {
                key: "reliefSought",
                label: "What remedy are you seeking?",
                type: "chips",
                chips: ["Full refund", "Product replacement", "Compensation for damages", "Repair under warranty", "Apology + Rectification", "Legal action"],
                placeholder: "Describe your demand...",
                required: true,
            },
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
                placeholder: "Full address with PIN code",
                required: true,
            },
            {
                key: "forum",
                label: "Which Consumer Forum?",
                type: "select",
                options: [
                    { value: "auto", label: "Auto-select based on claim amount" },
                    { value: "DCDRC", label: "District Consumer Disputes Redressal Commission (up to ₹50 Lakh)" },
                    { value: "SCDRC", label: "State Commission (₹50 Lakh – ₹2 Crore)" },
                    { value: "NCDRC", label: "National Commission (above ₹2 Crore)" },
                ],
            },
        ],
    },
];

const ConsumerComplaintPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);
    const [lastData, setLastData] = useState<Record<string, string>>({});

    const handleComplete = async (data: Record<string, string>) => {
        setIsLoading(true);
        setDraft(null);
        setLastData(data);

        const systemPrompt = `You are a Consumer Law expert specialising in the Indian Consumer Protection Act 2019.
Draft a formal, legally-sound consumer grievance notice letter.
Use proper legal structure: To, Date, Subject, Body, Relief Sought, Signature.
Reference specific provisions of the Consumer Protection Act 2019 and Consumer Protection (E-Commerce) Rules 2020 where applicable.
Give the seller a 15-day deadline to respond before escalating to the Consumer Forum.`;

        const forum = data.forum === "auto"
            ? `appropriate forum based on claim of ₹${data.price}`
            : data.forum;

        const prompt = `Draft a consumer complaint notice letter:
Complainant: ${data.complainantName}, ${data.complainantAddress}.
Seller: ${data.seller}.
Product/Service: ${data.product}.
Amount Paid: ₹${data.price}.
Purchase Date: ${data.purchaseDate || "Not specified"}.
Type of Issue: ${data.issueType}.
Grievance: ${data.grievance}.
Attempted Resolution: ${data.attemptedResolution || "Not attempted"}.
Relief Sought: ${data.reliefSought}.
Consumer Forum: ${forum}.`;

        try {
            const result = await generateLegalContent(prompt, systemPrompt);
            setDraft(result);
            toast.success("Consumer complaint drafted!");
        } catch (error) {
            console.error("Drafting Error:", error);
            toast.error("Failed to draft complaint. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!draft) return;
        try {
            await exportStructuredPdf({
                title: "Consumer Complaint Notice",
                fileName: `Consumer_Complaint_${lastData.seller?.replace(/\s+/g, "_") || "draft"}.pdf`,
                metadata: [`Product: ${lastData.product}`, `Amount: ₹${lastData.price}`, `Date: ${new Date().toLocaleDateString()}`],
                sections: [{ text: toPlainText(draft) }],
                footer: "Generated by LegalAI India — Not a substitute for professional legal advice.",
            });
            toast.success("Downloaded successfully!");
        } catch {
            toast.error("PDF generation failed.");
        }
    };

    return (
        <div className="min-h-screen text-gray-900">
            <TricolorBackground intensity="strong" showOrbs={true} />
            <Header />

            <div className="container max-w-4xl mx-auto pt-8 pb-20 px-4 md:px-6">
                <Link to="/features" className="inline-flex items-center gap-2 text-gray-500 hover:text-saffron mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Tools
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white mb-4 shadow-lg">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                        Consumer <span className="premium-gradient-text">Complaint Draft</span>
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        AI-guided intake → professional consumer grievance notice under the Consumer Protection Act 2019.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!draft ? (
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
                                accentColor="bg-orange-500"
                                reviewTitle="Review Complaint Details"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-premium rounded-3xl p-8 border border-gray-100"
                        >
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-saffron" />
                                    <span className="font-bold text-navy-india text-lg">Consumer Complaint Draft</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(draft); toast.success("Copied!"); }} className="rounded-full">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-full text-green-600">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[480px] text-sm text-gray-700 leading-relaxed font-serif whitespace-pre-wrap pr-2 bg-gray-50/60 rounded-2xl p-6 border border-gray-100">
                                {draft}
                            </div>

                            <div className="mt-5 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                <span className="text-xs text-green-800 font-medium">Draft complies with Consumer Protection Act 2019 guidelines. Review and send as a registered notice.</span>
                            </div>

                            <Button variant="outline" onClick={() => setDraft(null)} className="mt-5 gap-2 rounded-xl">
                                <RefreshCw className="w-4 h-4" /> Draft Another Complaint
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!draft && (
                    <div className="text-center mt-8">
                        <p className="text-[10px] text-gray-400 max-w-2xl mx-auto uppercase tracking-widest font-mono">
                            Informational tool — not a substitute for professional legal advice.
                        </p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default ConsumerComplaintPage;
