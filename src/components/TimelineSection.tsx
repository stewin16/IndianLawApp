import React from "react";
import { Link } from "react-router-dom";
import { Timeline } from "@/components/ui/timeline";
import { CheckCircle2, Check, ArrowRight } from "lucide-react";

export default function TimelineSection() {
  const data = [
    {
      title: "The Legacy",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                For over 160 years, the Indian Penal Code (IPC) served as the cornerstone of criminal justice. However, its colonial roots and fragmented structure became increasingly difficult to navigate in the digital age.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-saffron/20 text-saffron text-xs">x</span>
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">Colonial Legacy</span>
                    <span className="text-xs text-gray-500">Statutes designed for a different era, lacking modern context.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-saffron/20 text-saffron text-xs">x</span>
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">Manual Lookup</span>
                    <span className="text-xs text-gray-500">Lawyers spending hours cross-referencing physical volumes.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
               <img
                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop"
                alt="Old Legal Books"
                className="rounded-xl object-cover h-64 w-full shadow-2xl border border-gray-200"
              />
            </div>
        </div>
      ),
    },
    {
      title: "The Transition",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div>
               <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                 The introduction of Bharatiya Nyaya Sanhita (BNS) marks a historic shift. LegalAI acts as the bridge, providing instant mapping between legacy IPC and the new Sanhitas.
               </p>
               <div className="flex flex-col gap-4">
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-navy-india/10 text-navy-india">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-navy-india">Instant BNS Mapping</span>
                     <span className="text-xs text-gray-500">Find the equivalent BNS section for any legacy IPC provision.</span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-navy-india/10 text-navy-india">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-navy-india">AI-Powered Synthesis</span>
                     <span className="text-xs text-gray-500">Advanced AI models synthesize changes, highlighting key legal shifts in real-time.</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2000&auto=format&fit=crop"
                  alt="Modern Justice"
                  className="rounded-xl object-cover h-full min-h-[300px] w-full shadow-2xl border border-gray-200"
                />
             </div>
        </div>
      ),
    },
    {
      title: "The Future",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-800 text-sm md:text-base font-normal mb-6 leading-relaxed">
                LegalAI v1.0 is just the beginning. We are building a future where legal intelligence is accessible to every Indian citizen, powered by the world's most capable AI.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                     <h4 className="text-sm font-bold text-navy-india mb-1">24/7 Access</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">Legal guidance available anytime, anywhere.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                     <h4 className="text-sm font-bold text-navy-india mb-1">Bilingual Support</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">Bridging the language gap in Indian law.</p>
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
        title="The Evolution of Justice"
        description="Bridging the gap between legacy statutes and the modern Digital India era."
      />
    </div>
  );
}
