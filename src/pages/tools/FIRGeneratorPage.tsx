import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle,
    ExternalLink, Copy, FileWarning, Calendar, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { generateLegalContent, parseModelJson } from "@/services/groqService";

const FIRGeneratorPage = () => {
    const [formData, setFormData] = useState({
        complainantName: "",
        incidentDate: "",
        incidentLocation: "",
        incidentDescription: "",
        accusedDetails: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        draft: string;
        relevant_sections: string[];
        instructions: string[];
    } | null>(null);

    const handleSubmit = async () => {
        if (!formData.incidentDescription.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const systemPrompt = `You are an expert Indian Police and Legal Assistant. 
            Generate a detailed and professionally formatted FIR (First Information Report) complaint draft. 
            Identify the likely Sections under the Bharatiya Nyaya Sanhita (BNS) or Indian Penal Code (IPC) as applicable. 
            Provide clear next steps for the complainant. 
            Output must be a valid JSON object with this exact structure: 
            { "draft": "full text of the FIR", "relevant_sections": ["string"], "instructions": ["string"] }`;

            const prompt = `Generate an FIR draft for the following incident:
            Complainant: ${formData.complainantName}
            Date: ${formData.incidentDate}
            Location: ${formData.incidentLocation}
            Accused Details: ${formData.accusedDetails}
            Description of Incident: ${formData.incidentDescription}`;
            
            const content = await generateLegalContent(prompt, systemPrompt);
            const parsed = parseModelJson<{
                draft: string;
                relevant_sections: string[];
                instructions: string[];
            }>(content, "FIR generation", "object");
            
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

    const copyResult = () => {
        if (result) navigator.clipboard.writeText(result.draft);
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                            <FileWarning className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">
                                FIR Complaint Generator
                            </h1>
                            <p className="text-gray-500">Generate legally formatted FIR complaint drafts</p>
                        </div>
                    </div>
                </motion.div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Complainant Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Complainant Name
                            </label>
                            <Input
                                value={formData.complainantName}
                                onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                                placeholder="Your full name"
                                className="bg-white border-gray-200"
                            />
                        </div>

                        {/* Incident Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Incident Date
                            </label>
                            <Input
                                type="date"
                                value={formData.incidentDate}
                                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                                className="bg-white border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Incident Location */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Incident Location
                        </label>
                        <Input
                            value={formData.incidentLocation}
                            onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
                            placeholder="Full address where the incident occurred"
                            className="bg-white border-gray-200"
                        />
                    </div>

                    {/* Incident Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Incident Description *
                        </label>
                        <Textarea
                            value={formData.incidentDescription}
                            onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                            placeholder="Describe what happened in detail:
• What was the nature of the crime/incident?
• How did it happen?
• What were the circumstances?
• What loss or injury was caused?
• Were there any witnesses?"
                            className="min-h-[150px] bg-white border-gray-200"
                        />
                    </div>

                    {/* Accused Details */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accused Details (if known)
                        </label>
                        <Textarea
                            value={formData.accusedDetails}
                            onChange={(e) => setFormData({ ...formData, accusedDetails: e.target.value })}
                            placeholder="Name, description, address, or any identifying information of the accused"
                            className="min-h-[80px] bg-white border-gray-200"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.incidentDescription.trim()}
                        className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating FIR Draft...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate FIR Draft
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Result Display */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-green-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-600">Generated FIR Draft</span>
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

                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                            {result.draft}
                        </div>

                        {/* Relevant Sections */}
                        {result.relevant_sections.length > 0 && (
                            <div className="mt-6">
                                <p className="text-sm font-bold text-gray-900 mb-2">Relevant Sections:</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.relevant_sections.map((sec, idx) => (
                                        <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                                            {sec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm font-medium text-blue-800 mb-2">Next Steps:</p>
                            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                {result.instructions.map((inst, idx) => (
                                    <li key={idx}>{inst}</li>
                                ))}
                            </ol>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    This is an AI-generated draft. Review carefully before submission.
                                    Police may ask you to modify details. For serious crimes,
                                    consider consulting a lawyer.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Helpful Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8"
                >
                    <h3 className="font-medium text-gray-900 mb-3">Helpful Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="https://cybercrime.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                        >
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                            <span className="block font-medium text-gray-900">Cyber Crime Portal</span>
                            <span className="text-xs text-gray-500">For online crimes</span>
                        </a>

                        <a
                            href="https://nalsa.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-xl bg-white/80 border border-gray-200 hover:border-saffron/30 transition-all group"
                        >
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-saffron mb-2" />
                            <span className="block font-medium text-gray-900">NALSA</span>
                            <span className="text-xs text-gray-500">Free legal aid</span>
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FIRGeneratorPage;
