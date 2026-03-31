import { motion } from "framer-motion";

interface TricolorBackgroundProps {
    intensity?: "subtle" | "medium" | "strong";
    showOrbs?: boolean;
}

/**
 * Premium Indian Tricolor Gradient Background
 * MUCH DARKER AND MORE VISIBLE - as per user request
 */
const TricolorBackground = ({
    intensity = "strong",
    showOrbs = true
}: TricolorBackgroundProps) => {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Dynamic CSS-based background */}
            <div className="tricolor-bg" />

            {/* Ashoka Chakra - Subtle background element */}
            <div className="chakra-bg">
                <svg viewBox="0 0 100 100" className="w-full h-full text-navy-india">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    {[...Array(24)].map((_, i) => (
                        <line
                            key={i}
                            x1="50"
                            y1="50"
                            x2={50 + 40 * Math.cos((i * 15 * Math.PI) / 180)}
                            y2={50 + 40 * Math.sin((i * 15 * Math.PI) / 180)}
                            stroke="currentColor"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>
            </div>

            {/* Additional animated orbs for depth */}
            {showOrbs && (
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 153, 51, 0.15) 0%, transparent 70%)',
                            filter: 'blur(120px)',
                        }}
                        animate={{
                            x: [0, 100, 0],
                            y: [0, 50, 0],
                            scale: [1, 1.2, 1],
                            rotate: [0, 45, 0],
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-[-15%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(19, 136, 8, 0.12) 0%, transparent 70%)',
                            filter: 'blur(140px)',
                        }}
                        animate={{
                            x: [0, -120, 0],
                            y: [0, -80, 0],
                            scale: [1, 1.3, 1],
                            rotate: [0, -30, 0],
                        }}
                        transition={{
                            duration: 40,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                            filter: 'blur(100px)',
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            )}
            
            {/* Subtle overlay for depth - avoiding external asset 403 errors */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-black/5 mix-blend-overlay" />
        </div>
    );
};

export default TricolorBackground;
