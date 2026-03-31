"""
AI Features Module - 20+ Legal AI Features using Groq
Provides comprehensive legal assistance features for Indian law
"""

import httpx
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

# Groq API Configuration
from groq_client import GroqClient
groq = GroqClient()
DEFAULT_MODEL = "llama-3.3-70b-versatile"

# Government Portal Links
GOVT_PORTALS = {
    "indian_kanoon": "https://indiankanoon.org",
    "ecourts": "https://ecourts.gov.in",
    "cybercrime": "https://cybercrime.gov.in",
    "rti": "https://rtionline.gov.in",
    "nalsa": "https://nalsa.gov.in",
    "consumer_helpline": "https://consumerhelpline.gov.in",
    "eprocure": "https://eprocure.gov.in",
    "egazette": "https://egazette.nic.in",
    "prs_india": "https://prsindia.org",
    "uidai": "https://uidai.gov.in",
    "income_tax": "https://incometax.gov.in",
    "gst": "https://gst.gov.in",
    "mca": "https://mca.gov.in",
    "labour": "https://labour.gov.in"
}

# Pydantic Models
class AIFeatureRequest(BaseModel):
    query: str
    context: Optional[str] = None
    language: str = "en"

class CasePredictionRequest(BaseModel):
    case_facts: str
    case_type: str  # civil, criminal, family, property, etc.
    jurisdiction: str = "India"

class BailCheckRequest(BaseModel):
    offense: str
    section: str
    accused_details: Optional[str] = None

class FIRRequest(BaseModel):
    incident_description: str
    incident_date: str
    incident_location: str
    complainant_name: str
    accused_details: Optional[str] = None

class LegalTranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "hi"

class ConsumerComplaintRequest(BaseModel):
    product_service: str
    issue_description: str
    company_name: str
    purchase_date: str
    amount_involved: float

class CyberComplaintRequest(BaseModel):
    incident_type: str  # fraud, hacking, harassment, etc.
    incident_description: str
    evidence_details: Optional[str] = None

class PropertyVerifyRequest(BaseModel):
    document_type: str  # sale deed, title deed, agreement, etc.
    document_text: str
    property_location: str

class LaborAdviceRequest(BaseModel):
    issue_type: str  # salary, termination, harassment, leave, etc.
    employment_type: str  # permanent, contract, casual
    issue_description: str


async def call_groq(prompt: str, model: str = DEFAULT_MODEL, system_prompt: str = None) -> str:
    """Make a call to Groq API using GroqClient"""
    try:
        # Note: GroqClient is synchronous in its current implementation, 
        # but we wrap it for consistency in the async features module.
        content = groq.generate_legal_content(prompt, system_prompt or "You are a professional Indian Legal Assistant.")
        return content
    except Exception as e:
        return f"Error connecting to Groq: {str(e)}"


# ==================== 20+ AI FEATURES ====================

async def case_outcome_predictor(request: CasePredictionRequest) -> Dict[str, Any]:
    """
    Feature 1: Predict likely case outcome based on facts
    """
    system_prompt = """You are a Senior Advocate and Judicial Analyst at the Supreme Court of India.
    CRITICAL RULE: You MUST use the Bharatiya Nyaya Sanhita (BNS) for criminal offenses. 
    Do NOT use IPC sections as primary references.
    Analyze the case facts provided and predict the likely outcome by considering:
    1. Statutory provisions (BNS/BSA/BNSS) exclusively. Mention the equivalent legacy IPC/CrPC sections ONLY for historical mapping.
    2. Ratio Decidendi of recent Apex Court precedents.
    3. Constitutional safeguards (Part III) and procedural fairness.
    Provide a balanced, objective jurisdictional analysis with confidence scores."""
    
    prompt = f"""
    Case Type: {request.case_type}
    Jurisdiction: {request.jurisdiction}
    
    Case Facts:
    {request.case_facts}
    
    Please provide:
    1. Predicted Outcome (Favorable/Unfavorable/Uncertain)
    2. Confidence Level (percentage)
    3. Key Factors Affecting Outcome
    4. Relevant Precedents/Case Laws
    5. Recommended Legal Strategy
    6. Risk Assessment
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "prediction": result,
        "disclaimer": "This is AI-generated analysis for informational purposes only. Consult a licensed advocate for legal advice.",
        "related_links": {
            "indian_kanoon": GOVT_PORTALS["indian_kanoon"],
            "ecourts": GOVT_PORTALS["ecourts"]
        }
    }


async def legal_risk_analyzer(document_text: str, document_type: str) -> Dict[str, Any]:
    """
    Feature 2: Analyze legal risks in contracts/agreements
    """
    system_prompt = """You are an expert Corporate Counsel specializing in Indian Business Law (Indian Contract Act 1872, Companies Act 2013). 
    CRITICAL: Analyze the document with respect to the CURRENT Indian legal landscape (2024-2025). 
    Identify risks under the Indian Contract Act, Consumer Protection Act 2019, 
    Digital Personal Data Protection (DPDP) Act 2023, and Stamp Duty laws.
    Provide realistic, actionable insights for real-life scenario situations."""
    
    prompt = f"""
    Document Type: {document_type}
    
    Document Content:
    {document_text}
    
    Analyze for:
    1. High-Risk Clauses (with severity rating 1-10)
    2. Missing Essential Clauses
    3. Compliance Issues
    4. Unfair Terms (under Consumer Protection Act)
    5. Stamp Duty & Registration Requirements
    6. Recommendations for Improvement
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "analysis": result,
        "risk_score": "Calculated based on analysis",
        "disclaimer": "Professional legal review recommended before signing any document."
    }


async def bail_eligibility_checker(request: BailCheckRequest) -> Dict[str, Any]:
    """
    Feature 3: Check bail eligibility for an offense
    """
    system_prompt = """You are a Senior Criminal Law Expert. 
    CRITICAL: The Bharatiya Nagarik Suraksha Sanhita (BNSS), Bharatiya Nyaya Sanhita (BNS), and Bharatiya Sakshya Adhiniyam (BSA) ARE THE CURRENT LAWS OF INDIA as of July 1, 2024.
    Analyze bail eligibility under the BNSS (formerly CrPC). Consider Section 436-455 BNSS grounds, 
    Constitutional safeguards under Article 21 (Personal Liberty), and jurisdictional bail benchmarks 
    set by the Supreme Court in recent landmark judgments."""
    
    prompt = f"""
    Offense: {request.offense}
    Section: {request.section}
    Accused Details: {request.accused_details or "Not provided"}
    
    Determine:
    1. Is the offense bailable or non-bailable?
    2. Bail provisions under BNSS (Bharatiya Nagarik Suraksha Sanhita)
    3. Conditions for bail grant
    4. Likely bail amount (if bailable)
    5. Recommended approach for bail application
    6. Relevant case laws for bail in similar offenses
    7. Time frame for bail hearing
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "eligibility": result,
        "disclaimer": "This is preliminary guidance. Actual bail decisions depend on court's discretion.",
        "related_links": {
            "ecourts": GOVT_PORTALS["ecourts"],
            "nalsa": GOVT_PORTALS["nalsa"]
        }
    }


async def fir_complaint_generator(request: FIRRequest) -> Dict[str, Any]:
    """
    Feature 4: Generate FIR complaint draft
    """
    system_prompt = """You are an expert in drafting FIRs and Complaints under the Bharatiya Nagarik Suraksha Sanhita (BNSS). 
    CRITICAL: The BNSS and BNS are the CURRENT AND ACTIVE laws of India (effective July 1, 2024).
    Ensure the draft is legally sound for Indian Police Stations, correctly mapping incidents to BNS sections 
    and ensuring all jurisdictional and evidentiary basics required by Section 173 BNSS are covered."""
    
    prompt = f"""
    Generate an FIR complaint draft with the following details:
    
    Complainant: {request.complainant_name}
    Incident Date: {request.incident_date}
    Incident Location: {request.incident_location}
    Incident Description: {request.incident_description}
    Accused (if known): {request.accused_details or "Unknown"}
    
    Include:
    1. Proper FIR format
    2. Relevant sections under BNS/IPC
    3. Detailed statement of facts
    4. Prayer/Relief sought
    5. Declaration by complainant
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "fir_draft": result,
        "instructions": "Visit your nearest police station with ID proof and relevant documents.",
        "related_links": {
            "cybercrime": GOVT_PORTALS["cybercrime"]
        }
    }


async def legal_translation(request: LegalTranslationRequest) -> Dict[str, Any]:
    """
    Feature 5: Translate legal documents between English and Hindi
    """
    lang_names = {"en": "English", "hi": "Hindi"}
    
    system_prompt = f"""You are a Senior Legal Translator specializing in Indian Judicial English and Hindi. 
    Maintain absolute statutory accuracy, especially for terms in the Constitution of India and 
    Bharatiya Nyaya Sanhita. Ensure the translation adheres to the legal register of District/High Courts."""
    
    prompt = f"""
    Translate the following legal text from {lang_names.get(request.source_lang, request.source_lang)} 
    to {lang_names.get(request.target_lang, request.target_lang)}:
    
    {request.text}
    
    Requirements:
    1. Preserve legal terminology precisely
    2. Maintain formal legal register
    3. Keep formatting intact
    4. Note any terms that have no direct equivalent
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "translated_text": result,
        "source_language": request.source_lang,
        "target_language": request.target_lang
    }


async def judgment_simplifier(judgment_text: str) -> Dict[str, Any]:
    """
    Feature 6: Simplify complex court judgments
    """
    system_prompt = """You are a Legal Rapporteur and Court Clerking expert. 
    Simplify complex Indian judgments by clearly extracting the 'Ratio Decidendi' (Reason for Decision) 
    and 'Obiter Dicta' in plain language while maintaining citations and judicial rigor."""
    
    prompt = f"""
    Simplify this court judgment for a layperson:
    
    {judgment_text}
    
    Provide:
    1. Case Summary (2-3 sentences)
    2. Key Facts
    3. Legal Questions Involved
    4. Court's Decision (in simple terms)
    5. What This Means for You (practical implications)
    6. Key Legal Terms Explained
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "simplified_judgment": result,
        "original_length": len(judgment_text),
        "related_links": {
            "indian_kanoon": GOVT_PORTALS["indian_kanoon"]
        }
    }


async def section_finder(query: str) -> Dict[str, Any]:
    """
    Feature 7: Find relevant IPC/BNS sections for a situation
    """
    system_prompt = """You are a Legal Statutory Specialist. Find specific sections in the 
    Bharatiya Nyaya Sanhita (BNS) [Replacement for IPC] and Bharatiya Nagarik Suraksha Sanhita (BNSS) [formerly CrPC]. 
    Always provide the BNS-to-IPC mapping for historical reference and statutory continuity."""
    
    prompt = f"""
    Situation: {query}
    
    Find and explain:
    1. All Applicable BNS Sections (with section numbers)
    2. Corresponding Old IPC Sections (for reference)
    3. Procedural Sections under BNSS
    4. Any Special Law Provisions (POCSO, IT Act, etc.)
    5. Maximum Punishment for each offense
    6. Whether offense is Bailable/Non-bailable
    7. Whether offense is Cognizable/Non-cognizable
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "sections": result,
        "note": "BNS replaced IPC from July 1, 2024",
        "related_links": {
            "indian_kanoon": GOVT_PORTALS["indian_kanoon"],
            "prs_india": GOVT_PORTALS["prs_india"]
        }
    }


async def legal_cost_estimator(case_type: str, court_level: str, complexity: str) -> Dict[str, Any]:
    """
    Feature 8: Estimate legal fees and costs
    """
    system_prompt = """You are a Legal Auditor. Provide cost estimates for litigation in India 
    considering Advocate Fee Rules of various High Courts, the Court Fees Act 1870, 
    and standard Bar Council of India benchmarks for civil, criminal, and corporate matters."""
    
    prompt = f"""
    Estimate legal costs for:
    Case Type: {case_type}
    Court Level: {court_level}
    Complexity: {complexity}
    
    Provide estimates for:
    1. Advocate Fees (range)
    2. Court Fees
    3. Stamp Duty (if applicable)
    4. Documentation Costs
    5. Miscellaneous Expenses
    6. Total Estimated Cost Range
    7. Time Frame for Resolution
    8. Tips to Reduce Costs
    9. Free Legal Aid Options
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "cost_estimate": result,
        "free_legal_aid": GOVT_PORTALS["nalsa"],
        "disclaimer": "Actual costs may vary based on advocate and location."
    }


async def precedent_matcher(case_facts: str, legal_issue: str) -> Dict[str, Any]:
    """
    Feature 9: Find similar case precedents
    """
    system_prompt = """You are a Senior Legal Researcher specializing in the Apex Court and High Courts of India. 
    Find precedents focusing on landmark judgments that set 'Stare Decisis' for the legal issue provided. 
    Identify key 'Ingredients of the Offense' or 'Points for Determination' from relevant case laws."""
    
    prompt = f"""
    Find precedents for:
    Case Facts: {case_facts}
    Legal Issue: {legal_issue}
    
    Provide:
    1. Top 5 Relevant Supreme Court Judgments
    2. Top 3 Relevant High Court Judgments
    3. Brief of Each Judgment
    4. How Each Precedent Applies
    5. Distinguishing Factors (if any)
    6. Search Keywords for Further Research
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "precedents": result,
        "search_portal": GOVT_PORTALS["indian_kanoon"],
        "disclaimer": "Verify citations from original sources."
    }


async def consumer_complaint_helper(request: ConsumerComplaintRequest) -> Dict[str, Any]:
    """
    Feature 10: Generate consumer complaint
    """
    system_prompt = """You are an expert in the Consumer Protection Act, 2019. 
    Draft detailed Consumer Complaints for the District/State Commission, highlighting 'Deficiency of Service', 
    'Unfair Trade Practice', and ensuring compliance with Section 35 of the Act."""
    
    prompt = f"""
    Draft a consumer complaint for:
    Product/Service: {request.product_service}
    Company: {request.company_name}
    Issue: {request.issue_description}
    Purchase Date: {request.purchase_date}
    Amount: ₹{request.amount_involved}
    
    Include:
    1. Proper complaint format
    2. Facts chronologically
    3. Deficiency in service/product defect
    4. Consumer Protection Act provisions
    5. Relief/Compensation sought
    6. Relevant documents to attach
    7. Filing procedure
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    # Determine forum based on amount
    if request.amount_involved <= 5000000:  # 50 lakhs
        forum = "District Consumer Forum"
    elif request.amount_involved <= 20000000:  # 2 crores
        forum = "State Consumer Commission"
    else:
        forum = "National Consumer Commission"
    
    return {
        "complaint_draft": result,
        "appropriate_forum": forum,
        "helpline": "1800-11-4000 (National Consumer Helpline)",
        "portal": GOVT_PORTALS["consumer_helpline"]
    }


async def rti_application_generator(department: str, information_sought: str, applicant_name: str) -> Dict[str, Any]:
    """
    Feature 11: Generate RTI application
    """
    system_prompt = """You are a Senior RTI Consultant. Draft RTI Applications under 
    Section 6(1) of the Right to Information Act, 2005. Frame questions to avoid Section 8 exemptions 
    and ensure the application is addressed properly to the Central/State Public Information Officer."""
    
    prompt = f"""
    Generate RTI Application for:
    Department: {department}
    Information Sought: {information_sought}
    Applicant: {applicant_name}
    
    Include:
    1. Proper RTI application format
    2. Specific questions to ask
    3. Relevant RTI Act sections
    4. Fee details
    5. Timeline for response
    6. Appeal process (if denied)
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "rti_application": result,
        "fee": "₹10 for Central Government, varies for State",
        "portal": GOVT_PORTALS["rti"],
        "response_time": "30 days (normal), 45 days (if transferred)"
    }


async def cyber_complaint_helper(request: CyberComplaintRequest) -> Dict[str, Any]:
    """
    Feature 12: Help with cyber crime complaints
    """
    system_prompt = """You are a Cyber Law Expert specializing in the IT Act, 2000, and the Digital Personal Data Protection Act (DPDP) 2023. 
    Analyze cyber crimes and draft complaints for the National Cyber Crime Reporting Portal (NCRP), 
    citing specific sections like 66A, 66E, or 67A as applicable."""
    
    prompt = f"""
    Cyber Crime Complaint for:
    Type: {request.incident_type}
    Description: {request.incident_description}
    Evidence: {request.evidence_details or "Not specified"}
    
    Provide:
    1. Applicable IT Act Sections
    2. Applicable BNS/IPC Sections
    3. Complaint Draft
    4. Evidence to Preserve
    5. Step-by-step Filing Process
    6. Expected Timeline
    7. Immediate Protective Measures
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "guidance": result,
        "portal": GOVT_PORTALS["cybercrime"],
        "helpline": "1930 (Cyber Crime Helpline)",
        "immediate_action": "File complaint within 48 hours of incident for best results."
    }


async def property_document_verifier(request: PropertyVerifyRequest) -> Dict[str, Any]:
    """
    Feature 13: Verify property documents
    """
    system_prompt = """You are a Real Estate Attorney and Property Auditor. 
    Analyze documents like Sale Deeds, Allotment Letters, and Khata extracts under the 
    Registration Act 1908, RERA 2016, and the Transfer of Property Act 1882."""
    
    prompt = f"""
    Verify Property Document:
    Type: {request.document_type}
    Location: {request.property_location}
    Content: {request.document_text}
    
    Check:
    1. Essential Clauses Present/Missing
    2. Red Flags/Warning Signs
    3. Stamp Duty Compliance
    4. Registration Status Requirements
    5. Title Chain Issues
    6. Encumbrance Concerns
    7. Recommendations
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "verification_report": result,
        "advice": "Physical verification and Sub-Registrar records check recommended.",
        "disclaimer": "This is preliminary AI analysis. Get proper legal due diligence."
    }


async def marriage_registration_guide(state: str, marriage_type: str) -> Dict[str, Any]:
    """
    Feature 14: Marriage registration guidance
    """
    system_prompt = """You are a Family Law Attorney specialized in the Hindu Marriage Act, 1955, 
    the Special Marriage Act, 1954, and Muslim Personal Law procedures. Guide users through 
    civil and religious registration requirements in various Indian states."""
    
    prompt = f"""
    Marriage Registration Guide for:
    State: {state}
    Marriage Type: {marriage_type}
    
    Provide:
    1. Applicable Act
    2. Required Documents
    3. Eligibility Conditions
    4. Step-by-step Process
    5. Fees
    6. Timeline
    7. Where to Apply
    8. Common Issues and Solutions
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "guide": result,
        "note": "Process varies by state. Check local Marriage Registrar office."
    }


async def divorce_procedure_guide(marriage_type: str, divorce_type: str) -> Dict[str, Any]:
    """
    Feature 15: Divorce procedure guidance
    """
    system_prompt = """You are a Senior Family Law Counsel. Provide guidance on divorce proceedings 
    under HMA, SMA, and other Personal Laws. Focus on Section 13/13B (Mutual Consent) grounds, 
    Interim Maintenance (Section 24), and Child Custody guidelines set by the Supreme Court."""
    
    prompt = f"""
    Divorce Procedure Guide for:
    Marriage Type: {marriage_type}
    Divorce Type: {divorce_type}
    
    Explain:
    1. Grounds for Divorce
    2. Mutual vs Contested Divorce
    3. Required Documents
    4. Court Jurisdiction
    5. Step-by-step Procedure
    6. Cooling-off Period
    7. Alimony/Maintenance Considerations
    8. Child Custody Considerations
    9. Timeline
    10. Estimated Costs
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "procedure": result,
        "free_legal_aid": GOVT_PORTALS["nalsa"],
        "counseling_note": "Counseling is mandatory before divorce proceedings."
    }


async def labor_law_advisor(request: LaborAdviceRequest) -> Dict[str, Any]:
    """
    Feature 16: Workplace rights advisor
    """
    system_prompt = """You are an Industrial Relations and Labor Law Authority. 
    Analyze issues under the new Labor Codes (2020), the Industrial Disputes Act, 
    and state-specific Shops & Establishments Acts. Advise on statutory compliance and worker rights."""
    
    prompt = f"""
    Labor Law Advice for:
    Issue Type: {request.issue_type}
    Employment Type: {request.employment_type}
    Description: {request.issue_description}
    
    Provide:
    1. Applicable Labor Laws
    2. Employee Rights
    3. Employer Obligations
    4. Available Remedies
    5. Complaint Procedure
    6. Where to File Complaint
    7. Documentation Needed
    8. Important Deadlines
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "advice": result,
        "portal": GOVT_PORTALS["labour"],
        "helpline": "Shram Suvidha Portal for complaints"
    }


async def legal_news_summarizer(news_text: str) -> Dict[str, Any]:
    """
    Feature 17: Summarize legal news and developments
    """
    system_prompt = """You are a Legal Correspondent and Legislative Analyst. 
    Analyze Indian legal developments and statutory shifts to explain their practical impact 
    on citizens with constitutional and jurisprudential context."""
    
    prompt = f"""
    Summarize this legal news/development:
    {news_text}
    
    Provide:
    1. Key Headline (simple language)
    2. What Happened
    3. Who is Affected
    4. Practical Impact
    5. What Citizens Should Know
    6. Action Items (if any)
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "summary": result,
        "prs_india": GOVT_PORTALS["prs_india"]
    }


async def court_hearing_scheduler(case_type: str, court: str, location: str) -> Dict[str, Any]:
    """
    Feature 18: Court dates and procedures info
    """
    system_prompt = """You are a Court Administrative Specialist. Explain court procedures, 
    filing formalities, and hearing protocols (High Courts, District Courts, NCLT, DRT) 
    in line with the latest judicial notifications and the BNSS guidelines."""
    
    prompt = f"""
    Court Procedure Information for:
    Case Type: {case_type}
    Court: {court}
    Location: {location}
    
    Provide:
    1. Typical Hearing Schedule
    2. First Hearing Procedure
    3. Documents Required
    4. Court Fees
    5. Dress Code
    6. What to Expect
    7. How to Check Case Status
    8. Tips for Court Appearance
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "information": result,
        "case_status_portal": GOVT_PORTALS["ecourts"],
        "note": "Always verify hearing dates from court notice board or eCourts portal."
    }


async def legal_jargon_explainer(term: str) -> Dict[str, Any]:
    """
    Feature 19: Explain legal terms in simple language
    """
    system_prompt = """You are a Legal Educator specializing in Jurisprudence. 
    Explain Indian legal maxims and terms (like Res Judicata, Caveat Emptor, Writ) 
    in both English and the official Hindi 'Vidhi' terminology."""
    
    prompt = f"""
    Explain this legal term/concept: {term}
    
    Provide:
    1. Simple Definition (one line)
    2. Detailed Explanation (plain language)
    3. Hindi Equivalent (if applicable)
    4. Real-life Example
    5. Where This Term is Used
    6. Related Terms
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "explanation": result,
        "note": "Understanding legal terms helps you protect your rights."
    }


async def multi_document_analyzer(documents: List[str], analysis_type: str) -> Dict[str, Any]:
    """
    Feature 20: Analyze multiple documents together
    """
    system_prompt = """You are a Lead Legal Auditor and Analysis Specialist. 
    Compare multiple Indian legal documents for cross-statutory consistency, 
    conflict with BNS/BNSS, or violation of constitutional basic structures."""
    
    combined_docs = "\n\n---DOCUMENT SEPARATOR---\n\n".join(documents)
    
    prompt = f"""
    Analyze these documents together for: {analysis_type}
    
    Documents:
    {combined_docs}
    
    Provide:
    1. Document Overview/Summary
    2. Key Similarities
    3. Key Differences/Conflicts
    4. Missing Elements
    5. Legal Issues Identified
    6. Recommendations
    7. Priority Actions
    """
    
    result = await call_groq(prompt, system_prompt=system_prompt)
    
    return {
        "analysis": result,
        "documents_analyzed": len(documents),
        "analysis_type": analysis_type
    }


# ==================== ADDITIONAL UTILITY FEATURES ====================

async def get_government_links(category: str) -> Dict[str, Any]:
    """
    Get relevant government portal links for a category
    """
    categories = {
        "legal": ["indian_kanoon", "ecourts", "nalsa"],
        "consumer": ["consumer_helpline"],
        "cyber": ["cybercrime"],
        "rti": ["rti"],
        "tax": ["income_tax", "gst"],
        "corporate": ["mca"],
        "labour": ["labour"],
        "all": list(GOVT_PORTALS.keys())
    }
    
    selected_keys = categories.get(category.lower(), categories["all"])
    
    return {
        "category": category,
        "portals": {key: GOVT_PORTALS[key] for key in selected_keys if key in GOVT_PORTALS}
    }


# Feature summary for frontend directory
AI_FEATURES_DIRECTORY = [
    {"id": "case_predictor", "name": "Case Outcome Predictor", "icon": "Scale", "description": "Predict likely case outcomes based on facts"},
    {"id": "risk_analyzer", "name": "Legal Risk Analyzer", "icon": "Shield", "description": "Analyze legal risks in contracts"},
    {"id": "bail_checker", "name": "Bail Eligibility Checker", "icon": "Unlock", "description": "Check bail eligibility for offenses"},
    {"id": "fir_generator", "name": "FIR Complaint Generator", "icon": "FileWarning", "description": "Generate FIR complaint drafts"},
    {"id": "translator", "name": "Legal Translation", "icon": "Languages", "description": "Translate legal docs EN↔HI"},
    {"id": "judgment_simplifier", "name": "Judgment Simplifier", "icon": "BookOpen", "description": "Simplify complex judgments"},
    {"id": "section_finder", "name": "Section Finder", "icon": "Search", "description": "Find relevant IPC/BNS sections"},
    {"id": "cost_estimator", "name": "Legal Cost Estimator", "icon": "IndianRupee", "description": "Estimate legal proceedings costs"},
    {"id": "precedent_matcher", "name": "Precedent Matcher", "icon": "GitCompare", "description": "Find similar case precedents"},
    {"id": "consumer_complaint", "name": "Consumer Complaint Helper", "icon": "ShoppingBag", "description": "Generate consumer complaints"},
    {"id": "rti_generator", "name": "RTI Application Generator", "icon": "FileQuestion", "description": "Generate RTI applications"},
    {"id": "cyber_complaint", "name": "Cyber Crime Reporter", "icon": "Shield", "description": "Help with cyber crime complaints"},
    {"id": "property_verifier", "name": "Property Document Verifier", "icon": "Home", "description": "Verify property documents"},
    {"id": "marriage_guide", "name": "Marriage Registration Guide", "icon": "Heart", "description": "Marriage registration guidance"},
    {"id": "divorce_guide", "name": "Divorce Procedure Guide", "icon": "HeartCrack", "description": "Divorce procedure guidance"},
    {"id": "labor_advisor", "name": "Labor Law Advisor", "icon": "Briefcase", "description": "Workplace rights advisor"},
    {"id": "news_summarizer", "name": "Legal News Summarizer", "icon": "Newspaper", "description": "Summarize legal developments"},
    {"id": "court_scheduler", "name": "Court Hearing Info", "icon": "Calendar", "description": "Court procedures and timelines"},
    {"id": "jargon_explainer", "name": "Legal Jargon Explainer", "icon": "HelpCircle", "description": "Explain legal terms simply"},
    {"id": "multi_doc_analyzer", "name": "Multi-Document Analyzer", "icon": "Files", "description": "Analyze multiple docs together"},
]
