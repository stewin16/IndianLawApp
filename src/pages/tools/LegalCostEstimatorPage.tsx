import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, Calculator, PieChart, Sparkles, 
    CheckCircle, Shield, Info, Scale, 
    Coins, Gavel, Calendar
} from "lucide-react";

type FeeStructure = {
    drafting: [number, number];
    filing: [number, number];
    appearance: [number, number];
};

const LegalCostEstimatorPage = () => {
    const [court, setCourt] = useState("District");
    const [caseType, setCaseType] = useState("Civil");
    const [duration, setDuration] = useState(1);
    const [isCalculated, setIsCalculated] = useState(false);

    // Mock Fee Logic based on Indian Market Averages (2024)
    const getFeeData = (): FeeStructure => {
        if (court === "Supreme") return { drafting: [50000, 150000], filing: [15000, 40000], appearance: [100000, 500000] };
        if (court === "High") return { drafting: [15000, 45000], filing: [5000, 15000], appearance: [25000, 75000] };
        return { drafting: [5000, 15000], filing: [2000, 8000], appearance: [5000, 15000] };
    };

    const calculateTotal = () => {
        const data = getFeeData();
        const hearings = duration * 10; // Assume 1 hearing per month avg over years? No, hearings are fewer.
        const hearingsEstimate = Math.max(5, duration * 6);
        
        const min = data.drafting[0] + data.filing[0] + (data.appearance[0] * hearingsEstimate);
        const max = data.drafting[1] + data.filing[1] + (data.appearance[1] * hearingsEstimate);
        
        return { min, max, hearings: hearingsEstimate };
    };

    const result = calculateTotal();

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
                        <Calculator className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                        Legal <span className="premium-gradient-text">Cost Estimator</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Financial transparency in legal matters. Get an data-driven estimate 
                        of litigation costs across various Indian courts.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
                    {/* Inputs */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                                <Gavel className="w-4 h-4 text-saffron" />
                                1. Select Jurisdiction
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {["Supreme", "High", "District"].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCourt(c)}
                                        className={`px-4 py-4 rounded-xl border-2 transition-all text-sm font-bold ${
                                            court === c 
                                            ? "border-navy-india bg-navy-india text-white shadow-lg" 
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                        }`}
                                    >
                                        {c} Court
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                                <Scale className="w-4 h-4 text-saffron" />
                                2. Case Category
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {["Civil", "Criminal", "Corporate", "Matrimonial", "Consumer"].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setCaseType(v)}
                                        className={`px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
                                            caseType === v 
                                            ? "border-saffron bg-saffron text-white shadow-md shadow-saffron/20" 
                                            : "border-gray-100 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                                <Calendar className="w-4 h-4 text-saffron" />
                                3. Expected Duration (Years)
                            </h3>
                            <div className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-gray-100">
                                <span className="text-2xl font-black text-navy-india w-8">{duration}</span>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={duration} 
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="flex-1 accent-navy-india"
                                />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year(s)</span>
                            </div>
                        </section>

                        <Button 
                            onClick={() => setIsCalculated(true)}
                            className="w-full h-14 btn-navy rounded-xl uppercase tracking-widest font-bold"
                        >
                            Calculate Estimate
                        </Button>
                    </div>

                    {/* Results */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {isCalculated ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-premium rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl overflow-hidden relative"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-saffron via-white to-green-india" />
                                    
                                    <div className="mb-8">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-saffron" />
                                            Estimated Expenditure
                                        </h4>
                                        <div className="text-5xl font-black text-gray-900 tracking-tighter">
                                            ₹{result.min.toLocaleString()} <span className="text-2xl text-gray-300 font-normal mx-2">-</span> ₹{result.max.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Calculated for {court} Court adjudication
                                        </p>
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-gray-50 flex flex-col justify-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expected Hearings</span>
                                                <span className="text-xl font-bold text-navy-india">~ {result.hearings}</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-gray-50 flex flex-col justify-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Court Level</span>
                                                <span className="text-xl font-bold text-navy-india">{court}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.2em] mb-2">Cost Breakdown Overview</h5>
                                            {[
                                                { label: "Drafting & Briefing", icon: Info },
                                                { label: "Lump Sum Gov. Court Fees", icon: Info },
                                                { label: "Variable Appearance Fees", icon: Info }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
                                                    <span className="text-gray-500">{item.label}</span>
                                                    <item.icon className="w-3.5 h-3.5 text-gray-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                                        <Shield className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                                        <p className="text-[11px] text-blue-800/80 leading-relaxed italic">
                                            Estimates are based on standard professional fee ranges. Actual costs vary significantly by advocate experience and case complexity.
                                        </p>
                                    </div>

                                    <Button onClick={() => setIsCalculated(false)} variant="ghost" className="w-full mt-6 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-navy-india">
                                        Recalculate
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[550px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center bg-white/40"
                                >
                                    <PieChart className="w-16 h-16 text-gray-100 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-gray-300">Estimator Standby</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed">
                                        Configure the case details on the left to see the projected litigation costs in the Indian legal system.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-24 p-10 bg-white rounded-[3rem] border border-gray-100">
                    <h3 className="text-2xl font-serif font-bold text-navy-india mb-8 text-center">Costing Factors in 2024</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                                <Coins className="w-5 h-5 text-orange-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Court Fees</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Varies by state (e.g. Court Fee Acts) and claim amount. Typically around 1-5% for money recovery suits in civil courts.</p>
                        </div>
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                                <Gavel className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Seniority</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Senior Advocates charge exponentially more for final arguments compared to Junior colleagues.</p>
                        </div>
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Adjournments</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Litigation duration directly correlates with total appearances, increasing travel and daily hearing costs.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default LegalCostEstimatorPage;
