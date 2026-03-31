import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getLegalNews } from "@/services/groqService";
import { Newspaper, Calendar, ExternalLink, Loader2, Scale } from "lucide-react";
import { Badge } from "./ui/badge";

interface NewsItem {
    title: string;
    summary: string;
    date: string;
    category: string;
    source_url?: string;
}

const LegalNews = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await getLegalNews();
                setNews(data);
            } catch (error) {
                console.error("Failed to fetch news:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-saffron animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Curating latest legal updates...</p>
            </div>
        );
    }

    return (
        <section className="py-20 px-4">
            <div className="container max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                    <div className="max-w-2xl">
                        <span className="micro-label mb-4 block">Real-time Intelligence</span>
                        <h2 className="editorial-heading mb-4">
                            Recent <span className="premium-gradient-text">Legal Updates</span>
                        </h2>
                        <p className="editorial-subtitle text-left">
                            Stay informed with the latest Supreme Court judgments, statutory changes, and legal news from across India.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-navy-india/40 bg-white/50 px-4 py-2 rounded-full border border-gray-200">
                        <Scale className="w-3 h-3 text-saffron" />
                        Updated Live via AI
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group glass-tricolor-card p-6 flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="secondary" className="bg-saffron/10 text-saffron border-saffron/20">
                                    {item.category}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {item.date}
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-saffron transition-colors">
                                {item.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                                {item.summary}
                            </p>
                            
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legal Bulletin</span>
                                <button className="text-saffron hover:text-saffron-dark transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LegalNews;
