import React from "react";
import { Link } from "react-router-dom";
import { Timeline } from "@/components/ui/timeline";
import { CheckCircle2, Check, ArrowRight } from "lucide-react";

export default function TimelineSection() {
  const data = [
    {
      title: "Ancient Law",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                The roots of Indian jurisprudence stretch back millennia, guided by the principles of Dharma. Ancient texts like the Arthashastra and Manusmriti formed early frameworks for statecraft, justice, and social conduct.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-saffron/20 text-saffron text-xs">x</span>
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">Dharma as Justice</span>
                    <span className="text-xs text-gray-500">Law was intertwined with righteousness and moral duty.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-saffron/20 text-saffron text-xs">x</span>
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">The Arthashastra</span>
                    <span className="text-xs text-gray-500">Chanakya's treatise established early principles of civil and criminal law.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
               <img
                src="/ancient-law.png"
                alt="Ancient Indian Law"
                className="rounded-xl object-cover h-64 w-full shadow-2xl border border-gray-200"
              />
            </div>
        </div>
      ),
    },
    {
      title: "The Constitution",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div>
               <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                 Adopted in 1950, the Constitution of India is the supreme law of the land. Crafted by the Constituent Assembly under the chairmanship of Dr. B.R. Ambedkar, it establishes a sovereign, socialist, secular, and democratic republic.
               </p>
               <div className="flex flex-col gap-4">
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-navy-india/10 text-navy-india">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-navy-india">Fundamental Rights</span>
                     <span className="text-xs text-gray-500">Guaranteeing equality, freedom, and justice to all citizens.</span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-navy-india/10 text-navy-india">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-navy-india">Longest Written Constitution</span>
                     <span className="text-xs text-gray-500">A comprehensive document blending global democratic principles.</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="relative">
                <img
                  src="/indian-constitution.png"
                  alt="Constitution of India"
                  className="rounded-xl object-cover h-full min-h-[300px] w-full shadow-2xl border border-gray-200"
                />
             </div>
        </div>
      ),
    },
    {
      title: "Digital Era",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                Today, Indian law is entering a new digital frontier. With the new Bharatiya Nyaya Sanhita (BNS) replacing colonial codes and AI tools making legal knowledge universally accessible, justice is evolving for the 21st century.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                     <h4 className="text-sm font-bold text-navy-india mb-1">AI Assistance</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">Instant mapping between legacy IPC and new BNS statutes.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                     <h4 className="text-sm font-bold text-navy-india mb-1">Empowering Citizens</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">Bringing constitutional rights and legal awareness to the fingertips of a billion people.</p>
                  </div>
              </div>
            </div>
            <div className="relative h-full min-h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 group">
                <img
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2000&auto=format&fit=crop"
                  alt="Future of Law"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-navy-india/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Link to="/chat" className="bg-white text-navy-india px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-xl">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                   </Link>
                </div>
            </div>
        </div>
      ),
    },
  ];
  return (
    <div className="w-full bg-white/50 backdrop-blur-sm relative overflow-hidden">
      {/* Subtle tricolor accents for the section */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-white to-green-india opacity-30" />
      
      <Timeline 
        data={data} 
        title="History of Indian Law"
        description="From ancient Dharma and the Constitution to the modern Digital India era."
      />
    </div>
  );
}
