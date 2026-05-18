from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import torch
import os
import logging
import warnings

# Completely silence all transformers warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
logging.getLogger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

app = FastAPI(title="CivicShield Ultra-Light AI v5.9")

print("--- CIVICSHIELD ULTRA-LIGHT AI v5.9 (Full Suite) ---")
print(" Designed for maximum speed on any laptop.")

# 1. Load the Classifier (This is fast and efficient)
print(" [1/3] Loading Analysis Tool...")
classifier = pipeline(
    "zero-shot-classification", 
    model="valhalla/distilbart-mnli-12-3",
    device=-1 # Force CPU for stability
)

# 2. Load the SmolLM Model
print(" [2/3] Preparing AI Brain...")
model_id = "HuggingFaceTB/SmolLM2-135M-Instruct"
try:
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        torch_dtype=torch.float32, # CPU friendly
        low_cpu_mem_usage=True
    )
    print(" ULTRA-LIGHT BRAIN ONLINE!")
except Exception as e:
    print(f" Error loading: {e}")

class AnalysisRequest(BaseModel):
    title: str
    description: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""
    history: list = []

@app.post("/analyze")
async def analyze_report(req: AnalysisRequest):
    print(f" Analyzing: {req.title}")
    try:
        # 1. Classification (Fast)
        text = f"{req.title}. {req.description}"
        candidate_labels = ["Financial Fraud", "Workplace Harassment", "Safety Violation", "Bribery", "Discrimination", "Other"]
        class_result = classifier(text, candidate_labels)
        cat = class_result['labels'][0]
        score = int(class_result['scores'][0] * 100)
        
        # 2. Executive Summary (using SmolLM2)
        summary_prompt = (
            f"<|im_start|>system\nYou are a professional compliance auditor. "
            f"Write a highly condensed, supportive 2-to-3 sentence executive summary of this report. "
            f"Do NOT copy the title or description verbatim. Focus only on the core allegation. Keep it extremely brief.<|im_end|>\n"
            f"<|im_start|>user\nTitle: {req.title}\nDescription: {req.description}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        
        sum_inputs = tokenizer(summary_prompt, return_tensors="pt")
        with torch.no_grad():
            sum_outputs = model.generate(
                **sum_inputs, 
                max_new_tokens=90, # lower limit to enforce conciseness
                temperature=0.3, # Low temperature for factual summary
                pad_token_id=tokenizer.eos_token_id
            )
        
        summary = tokenizer.decode(sum_outputs[0][sum_inputs.input_ids.shape[-1]:], skip_special_tokens=True).strip()
        summary = summary.split("<|im_end|>")[0].strip()

        # Clean up any potential prompt duplication or overflow
        if summary.lower().startswith("title:") or len(summary) > 250:
            # Fallback/Truncation if model repeated inputs
            summary = f"Allegations of {req.title.lower()} have been flagged. The report is undergoing a security review."

        # Keep strictly to 2-3 sentences
        sentences = [s.strip() for s in summary.split('.') if s.strip()]
        if len(sentences) > 3:
            summary = ". ".join(sentences[:3]) + "."
        elif len(sentences) > 0 and not summary.endswith('.'):
            summary += "."

        # Fallback if summary failed
        if len(summary) < 10:
            summary = f"Potential {cat} detected. The report involves allegations of {req.title.lower()} that require immediate investigation."

        return {
            "summary": summary,
            "category": cat,
            "priority": "Urgent" if score > 85 else ("High" if score > 60 else "Medium"),
            "redFlagScore": score,
            "isUrgent": score > 70,
            "keywords": [cat],
            "sentimentScore": -0.5
        }
    except Exception as e:
        print(f" Analysis error: {e}")
        return {"category": "Other", "priority": "Medium", "redFlagScore": 50}

@app.post("/chat")
async def chat_advisor(req: ChatRequest):
    print(f"User: {req.message}")
    
    try:
        # Official ChatML template for SmolLM2-Instruct
        is_first = len(req.history) == 0
        
        if is_first:
            system_msg = "You are the CivicShield Ethics Advisor. Your ONLY job for this first message is to say: 'Yes, you can report that. I am here to help you through the process. What would you like to know more about?'"
        else:
            system_msg = f"You are the CivicShield Ethics Advisor. Be concise and supportive. Use the following policies to guide the user: {req.context}"

        # Build ChatML prompt
        prompt = f"<|im_start|>system\n{system_msg}<|im_end|>\n"
        
        # Add history
        for m in req.history[-3:]:
            role = "user" if m.get('role') == 'user' else "assistant"
            prompt += f"<|im_start|>{role}\n{m.get('content')}<|im_end|>\n"
            
        # Add current message
        prompt += f"<|im_start|>user\n{req.message}<|im_end|>\n<|im_start|>assistant\n"
        
        inputs = tokenizer(prompt, return_tensors="pt")
        input_len = inputs.input_ids.shape[-1]
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs, 
                max_new_tokens=256,
                do_sample=True, 
                temperature=0.4,    # Lower for even more focus
                repetition_penalty=1.1,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True).strip()
        
        # Robust cleanup for ChatML tags
        response = response.split("<|im_end|>")[0].split("<|im_start|>")[0].strip()
        
        # Clean up any trailing incomplete sentence or incomplete list item
        if not response.endswith(('.', '!', '?')):
            last_punc = max(response.rfind('.'), response.rfind('!'), response.rfind('?'))
            if last_punc != -1:
                response = response[:last_punc + 1]

        # Fallback if the model gives an empty or weirdly short response
        if len(response) < 5:
            response = "Yes, you can report that. I am here to help you through the process and ensure your identity remains protected."
        
        print(f" AI: {response}")
        return {"response": response}
    except Exception as e:
        print(f" Error: {e}")
        return {"response": "I am here to support you. Please ensure you report any serious concerns safely."}


class ReassuranceRequest(BaseModel):
    title: str
    status: str
    resolution_note: str = ""

@app.post("/reassure")
async def generate_reassurance(req: ReassuranceRequest):
    print(f" Generating reassurance for: {req.title} ({req.status})")
    try:
        # Prompt specifically designed to offer comfort and update the user
        system_msg = (
            "You are the CivicShield Security System. "
            "Write a highly reassuring, direct, and confidential status update message addressed to the anonymous Whistleblower. "
            "Tell them the matter has been thoroughly investigated and resolved, and they can rest assured that their identity remains 100% protected. "
            "Do NOT use any names, brand names, or placeholders like [Name], [Company], [Manager], [Manager's Name], or brackets. "
            "Keep the message extremely concise, strictly 2 sentences maximum."
        )
        
        user_msg = f"Report Title: {req.title}\nNew Status: {req.status}"
        if req.resolution_note:
            user_msg += f"\nResolution Details: {req.resolution_note}"
            
        prompt = (
            f"<|im_start|>system\n{system_msg}<|im_end|>\n"
            f"<|im_start|>user\n{user_msg}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        
        inputs = tokenizer(prompt, return_tensors="pt")
        input_len = inputs.input_ids.shape[-1]
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs, 
                max_new_tokens=80, # lower limits to enforce conciseness
                do_sample=True, 
                temperature=0.4,
                repetition_penalty=1.1,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True).strip()
        response = response.split("<|im_end|>")[0].split("<|im_start|>")[0].strip()
        
        # Clean up any potential bracketed placeholders
        import re
        response = re.sub(r'\[.*?\]', 'our compliance team', response)
        response = re.sub(r'\(.*?\)', '', response)
        
        # Keep strictly to 2 sentences maximum
        sentences = [s.strip() for s in response.split('.') if s.strip()]
        if len(sentences) > 2:
            response = ". ".join(sentences[:2]) + "."
        elif len(sentences) > 0 and not response.endswith('.'):
            response += "."

        if len(response) < 10:
            response = f"This matter has been thoroughly investigated and resolved. Please rest assured that appropriate action has been taken and your identity remains 100% anonymous."
            
        print(f" AI Reassurance: {response}")
        return {"response": response}
    except Exception as e:
        print(f" Reassurance error: {e}")
        return {"response": "This matter has been thoroughly investigated and resolved. Please rest assured that appropriate action has been taken and your identity remains 100% anonymous."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
