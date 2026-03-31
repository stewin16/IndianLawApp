import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, MessageSquare, FileText, BookOpen, MapPin, Shield, Mail, Phone, Globe, ExternalLink, Heart } from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const features = [
        { name: "Legal Chat", path: "/chat", icon: MessageSquare },
        { name: "Document Drafter", path: "/draft", icon: FileText },
        { name: "Summarizer", path: "/summarize", icon: BookOpen },
        { name: "IPC vs BNS", path: "/compare", icon: Scale },
        { name: "Lawyer Finder", path: "/tools/lawyer-finder", icon: MapPin },
        { name: "Risk Analyzer", path: "/tools/risk-analyzer", icon: Shield },
    ];

    const resources = [
        { name: "Indian Kanoon", url: "https://indiankanoon.org", external: true },
        { name: "eCourts", url: "https://ecourts.gov.in", external: true },
        { name: "NALSA (Free Legal Aid)", url: "https://nalsa.gov.in", external: true },
        { name: "Cyber Crime Portal", url: "https://cybercrime.gov.in", external: true },
        { name: "RTI Online", url: "https://rtionline.gov.in", external: true },
        { name: "Consumer Helpline", url: "https://consumerhelpline.gov.in", external: true },
    ];

    const legalLinks = [
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Terms of Service", path: "/terms" },
        { name: "Disclaimer", path: "/disclaimer" },
    ];

    return (
        <footer className="relative bg-white pt-24 pb-12 border-t border-gray-100 overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-saffron/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-india/5 rounded-full blur-[120px] -z-10" />

            {/* Tricolor Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-saffron via-white to-green-india w-full z-10" />

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="inline-flex items-center gap-4 mb-8 group">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-premium group-hover:rotate-6 transition-all duration-500 border border-navy-india/10 p-2">
                                <img src="/logo.png" alt="LegalAi Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-serif font-bold text-navy-india tracking-tighter">LegalAi</span>
                                <span className="text-[10px] font-mono font-bold text-gray-400 tracking-[0.2em] uppercase">Digital_India</span>
                            </div>
                        </Link>
                        <p className="text-gray-500 text-lg leading-relaxed mb-10 font-light max-w-sm">
                            The definitive AI-powered legal intelligence platform for the Indian legal ecosystem. Empowering citizens with instant legal clarity.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <Heart className="w-3 h-3 text-saffron fill-saffron" />
                                Built with Pride in India
                            </div>
                        </div>
                    </div>

                    {/* Features Column */}
                    <div className="lg:col-span-2">
                        <h3 className="font-mono text-[11px] font-bold text-navy-india uppercase tracking-[0.2em] mb-8">System_Modules</h3>
                        <ul className="space-y-4">
                            {features.map((feature) => (
                                <li key={feature.path}>
                                    <Link
                                        to={feature.path}
                                        className="group flex items-center gap-3 text-gray-500 hover:text-navy-india transition-all duration-300 text-sm font-medium"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-navy-india/5 transition-colors">
                                            <feature.icon className="w-4 h-4 text-gray-400 group-hover:text-navy-india transition-colors" />
                                        </div>
                                        {feature.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Government Resources Column */}
                    <div className="lg:col-span-3">
                        <h3 className="font-mono text-[11px] font-bold text-navy-india uppercase tracking-[0.2em] mb-8">Legal_Network</h3>
                        <ul className="space-y-4">
                            {resources.map((resource) => (
                                <li key={resource.url}>
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 text-gray-500 hover:text-navy-india transition-all duration-300 text-sm font-medium"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-navy-india/5 transition-colors">
                                            <Globe className="w-4 h-4 text-gray-400 group-hover:text-navy-india transition-colors" />
                                        </div>
                                        <span className="flex-1">{resource.name}</span>
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div className="lg:col-span-3">
                        <h3 className="font-mono text-[11px] font-bold text-navy-india uppercase tracking-[0.2em] mb-8">Access_Point</h3>
                        <div className="space-y-6">
                            <a
                                href="mailto:support@legalai.in"
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-saffron/30 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-saffron/10 transition-colors">
                                    <Mail className="w-5 h-5 text-gray-400 group-hover:text-saffron transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Email_Support</span>
                                    <span className="text-sm font-semibold text-gray-900">support@legalai.in</span>
                                </div>
                            </a>

                            <a
                                href="tel:+911234567890"
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-green-india/30 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-green-india/10 transition-colors">
                                    <Phone className="w-5 h-5 text-gray-400 group-hover:text-green-india transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Phone_Direct</span>
                                    <span className="text-sm font-semibold text-gray-900">+91 12345 67890</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mb-16 p-8 rounded-[2rem] bg-gray-50 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-saffron" />
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                            <Shield className="w-6 h-6 text-saffron" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            <strong className="text-gray-900 uppercase tracking-widest font-mono text-[10px] block mb-2">Legal_Disclaimer_Protocol</strong>
                            LegalAI is an AI-powered informational tool and does not constitute legal advice.
                            Information provided should not be relied upon as a substitute for professional legal counsel.
                            For complex legal matters, accidents, criminal cases, or any serious legal issues,
                            please consult a qualified advocate. For free legal aid, contact
                            <a href="https://nalsa.gov.in" target="_blank" rel="noopener noreferrer" className="text-navy-india font-bold hover:underline ml-1">NALSA (National Legal Services Authority)</a>.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="text-sm font-medium text-gray-400">
                            © {currentYear} LegalAI Platform. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            {legalLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-xs font-bold text-gray-400 hover:text-navy-india transition-colors uppercase tracking-widest"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-50 border border-green-100">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono font-bold text-green-700 uppercase tracking-widest">System_Status: Online</span>
                        </div>
                        <div className="h-8 w-[2px] bg-gray-100 hidden md:block" />
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-saffron border-2 border-white shadow-sm" />
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border border-navy-india/20" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-india border-2 border-white shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
