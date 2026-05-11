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

print("--- 🚀 CIVICSHIELD ULTRA-LIGHT AI v5.9 (Full Suite) ---")
print("✅ Designed for maximum speed on any laptop.")

# 1. Load the Classifier (This is fast and efficient)
print("🚀 [1/3] Loading Analysis Tool...")
classifier = pipeline(
    "zero-shot-classification", 
    model="valhalla/distilbart-mnli-12-3",
    device=-1 # Force CPU for stability
)

# 2. Load the SmolLM Model
print("💬 [2/3] Preparing AI Brain...")
model_id = "HuggingFaceTB/SmolLM2-135M-Instruct"
try:
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        torch_dtype=torch.float32, # CPU friendly
        low_cpu_mem_usage=True
    )
    print("✨ ULTRA-LIGHT BRAIN ONLINE!")
except Exception as e:
    print(f"❌ Error loading: {e}")

class AnalysisRequest(BaseModel):
    title: str
    description: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@app.post("/analyze")
async def analyze_report(req: AnalysisRequest):
    print(f"📊 Analyzing: {req.title}")
    try:
        text = f"{req.title}. {req.description}"
        candidate_labels = ["Financial Fraud", "Workplace Harassment", "Safety Violation", "Bribery", "Discrimination"]
        result = classifier(text, candidate_labels)
        
        cat = result['labels'][0]
        score = int(result['scores'][0] * 100)
        
        return {
            "summary": f"Detected potential {cat}.",
            "category": cat,
            "priority": "High" if score > 70 else "Medium",
            "redFlagScore": score,
            "isUrgent": score > 70,
            "keywords": [cat],
            "sentimentScore": -0.5
        }
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return {"category": "Other", "priority": "Medium", "redFlagScore": 50}

@app.post("/chat")
async def chat_advisor(req: ChatRequest):
    print(f"🗨️ User: {req.message}")
    
    try:
        # Simple Ethics Prompt
        prompt = f"<|user|>\nYou are an ethics advisor. Question: {req.message}\n<|assistant|>\n"
        
        inputs = tokenizer(prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs, 
                max_new_tokens=50, 
                do_sample=True, 
                temperature=0.7,
                repetition_penalty=1.2
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True).split("<|assistant|>")[-1].strip()
        
        print(f"🤖 AI: {response}")
        return {"response": response}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"response": "I am here to support you. Please ensure you report any serious concerns safely."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
