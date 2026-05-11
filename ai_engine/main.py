from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, GenerationConfig, AutoModelForCausalLM, AutoTokenizer
import torch
import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

app = FastAPI(title="CivicShield Local AI Engine v5.4")

print("--- CIVICSHIELD AI ENGINE v5.4 (LoRA Mode) ---")

# 1. Load the Classifier
print("🚀 [1/2] Loading Classifier...")
classifier = pipeline(
    "zero-shot-classification", 
    model="valhalla/distilbart-mnli-12-3",
    device=0 if torch.cuda.is_available() else -1
)

# 2. Load the Chatbot
print("💬 [2/2] Loading Custom Advisor Brain...")

# Paths
base_model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
base_path = os.path.dirname(os.path.abspath(__file__))
adapter_path = os.path.join(base_path, "checkpoint-600")

try:
    if os.path.exists(adapter_path):
        print(f"🧬 Detected LoRA Adapter at: {adapter_path}")
        print(f"🧠 Loading Base Model ({base_model_id})...")
        
        # Load base model and tokenizer
        tokenizer = AutoTokenizer.from_pretrained(base_model_id)
        model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None
        )
        
        # Load the Adapter on top
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, adapter_path)
        print("✨ SUCCESS: Custom Fine-Tuned Adapter Loaded!")
        
        # Create pipeline with the merged model
        chatbot = pipeline(
            "text-generation", 
            model=model, 
            tokenizer=tokenizer
        )
    else:
        raise FileNotFoundError("Adapter folder not found.")
except Exception as e:
    print(f"⚠️ Could not load custom model: {e}")
    print("🔄 Falling back to standard TinyLlama.")
    chatbot = pipeline(
        "text-generation", 
        model=base_model_id,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device=0 if torch.cuda.is_available() else -1
    )

# Create a clean generation config that explicitly unsets max_length to stop the warning
gen_config = GenerationConfig(
    max_new_tokens=100, # Reduced for faster response
    do_sample=True,
    temperature=0.7,
    top_k=50,
    top_p=0.95,
    pad_token_id=2,
    eos_token_id=2,
    max_length=None 
)

print("✅ ALL SYSTEMS ONLINE!")

class AnalysisRequest(BaseModel):
    title: str
    description: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@app.post("/analyze")
async def analyze_report(req: AnalysisRequest):
    text = f"{req.title}. {req.description}"
    candidate_labels = ["Financial Fraud", "Workplace Harassment", "Safety Violation", "Bribery", "Discrimination"]
    result = classifier(text, candidate_labels)
    top_cat = result['labels'][0]
    score = int(result['scores'][0] * 100)
    
    return {
        "summary": f"Local AI Analysis: Detected {top_cat}.",
        "category": top_cat,
        "priority": "High" if score > 70 else "Medium",
        "redFlagScore": score,
        "isUrgent": score > 70,
        "keywords": [top_cat],
        "sentimentScore": -0.5
    }

@app.post("/chat")
async def chat_advisor(req: ChatRequest):
    try:
        policy_context = req.context if req.context else "Standard ethical guidelines apply."
        if len(policy_context) > 3500:
            policy_context = policy_context[:3500] + "... [Truncated]"
        
        prompt = (
            f"<|system|>\nYou are the CivicShield AI Ethics Advisor. Use the following company policies to guide the user.\n"
            f"Policies: {policy_context}</s>\n"
            f"<|user|>\n{req.message}</s>\n"
            f"<|assistant|>\n"
        )
        
        gen = chatbot(
            prompt, 
            generation_config=gen_config,
            truncation=True
        )
        
        full_text = gen[0]['generated_text']
        
        if "<|assistant|>" in full_text:
            response = full_text.split("<|assistant|>")[1].strip()
        else:
            response = full_text.replace(prompt, "").strip()
            
        return {"response": response}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "I am here to support you. Please ensure you report any serious concerns through our secure portal."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
