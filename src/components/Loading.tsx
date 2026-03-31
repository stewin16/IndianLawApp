import { Loader2, Scale } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
    size?: "sm" | "md" | "lg";
}

const Loading = ({ message = "Loading...", fullScreen = false, size = "md" }: LoadingProps) => {
    const sizeClasses = {
        sm: { icon: "w-6 h-6", text: "text-sm", container: "p-4" },
        md: { icon: "w-10 h-10", text: "text-base", container: "p-8" },
        lg: { icon: "w-16 h-16", text: "text-lg", container: "p-12" },
    };

    const content = (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center ${sizeClasses[size].container}`}
        >
            {/* Animated Logo */}
            <div className="relative mb-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className={`${sizeClasses[size].icon} rounded-full border-4 border-navy-india/10 border-t-saffron`}
                />
                <div className="absolute inset-0 flex items-center justify-center p-1.5">
                    <img src="/logo.png" className="w-full h-full object-contain mb-1" alt="" />
                </div>
            </div>

            {/* Loading Text */}
            <p className={`text-gray-600 ${sizeClasses[size].text} font-medium`}>{message}</p>

            {/* Animated Dots */}
            <div className="flex gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2 h-2 rounded-full bg-navy-india/60"
                    />
                ))}
            </div>
        </motion.div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return content;
};

// Page Loading Skeleton
export const PageLoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-24">
            {/* Header Skeleton */}
            <div className="mb-12 text-center">
                <div className="h-8 w-32 mx-auto mb-4 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-12 w-64 mx-auto mb-2 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-6 w-96 mx-auto bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-48 bg-gray-200 rounded-2xl animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Inline Loading Spinner
export const InlineLoader = ({ className = "" }: { className?: string }) => (
    <Loader2 className={`w-4 h-4 animate-spin ${className}`} />
);

// Button Loading State
export const ButtonLoader = () => (
    <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
    </div>
);

export default Loading;
