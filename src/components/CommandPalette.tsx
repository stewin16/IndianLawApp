import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  MessageSquare,
  Zap,
  FileText,
  BookOpen,
  Scale,
  Shield,
  AlertTriangle,
  Languages,
  Briefcase,
  Home,
  LayoutDashboard,
  ShoppingBag,
  FileQuestion,
  IndianRupee,
  HelpCircle,
  Gavel,
  CheckCircle,
  Monitor,
  Heart,
  HeartCrack,
  HardHat
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all rounded-full glass-premium hover:bg-muted/50 group border border-navy-india/10"
      >
        <Search className="w-4 h-4 text-navy-india/60 group-hover:text-navy-india" />
        <span className="hidden md:inline-block text-navy-india/60 group-hover:text-navy-india">Search laws...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="max-h-[450px]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Access">
            <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/features"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>AI Features Hub</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="AI Legal Tools">
            <CommandItem onSelect={() => runCommand(() => navigate("/chat"))}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Legal AI Chat</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/compare"))}>
              <Zap className="mr-2 h-4 w-4" />
              <span>BNS vs IPC Comparison</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/summarize"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Case Summarizer</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/draft"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Document Drafter</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Specialized Tools">
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/case-predictor"))}>
              <Scale className="mr-2 h-4 w-4" />
              <span>Case Outcome Predictor</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/fir-generator"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>FIR Generator</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/bail-checker"))}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Bail Eligibility Checker</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/translator"))}>
              <Languages className="mr-2 h-4 w-4" />
              <span>Legal Translator</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/lawyer-finder"))}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Lawyer Finder</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/consumer-complaint"))}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Consumer Complaint</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/rti-generator"))}>
              <FileQuestion className="mr-2 h-4 w-4" />
              <span>RTI Application</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/cost-estimator"))}>
              <IndianRupee className="mr-2 h-4 w-4" />
              <span>Legal Cost Estimator</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/jargon-explainer"))}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Legal Jargon Explainer</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/judgment-simplifier"))}>
              <Gavel className="mr-2 h-4 w-4" />
              <span>Judgment Simplifier</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/property-verifier"))}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Property Verifier</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/cyber-complaint"))}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Cyber Crime Reporter</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/marriage-guide"))}>
              <Heart className="mr-2 h-4 w-4" />
              <span>Marriage Registration</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/divorce-guide"))}>
              <HeartCrack className="mr-2 h-4 w-4" />
              <span>Divorce Procedure</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tools/labor-advisor"))}>
              <HardHat className="mr-2 h-4 w-4" />
              <span>Labor Law Advisor</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
