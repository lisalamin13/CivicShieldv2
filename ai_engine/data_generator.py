import json
import random

# Categories of ethical issues
CATEGORIES = {
    "Bribery": [
        "Someone offered me money to favor their company.",
        "I saw a manager accepting cash from a vendor.",
        "A client is offering gifts in exchange for secrets."
    ],
    "Financial Fraud": [
        "I think the accounting department is faking the numbers.",
        "Money is missing from the project fund.",
        "Someone is using the company credit card for personal shopping."
    ],
    "Workplace Harassment": [
        "My supervisor is making me feel uncomfortable.",
        "I am being bullied because of my background.",
        "There is a toxic environment in my department."
    ],
    "Safety Violation": [
        "The equipment in the factory is broken and dangerous.",
        "Nobody is wearing safety gear in the construction zone.",
        "The company is dumping chemicals into the local river."
    ]
}

# Advisor Response Templates
TEMPLATES = [
    "According to ethical guidelines, this situation involves {category}. You should document all evidence and submit a secure report through the CivicShield portal.",
    "This sounds like a serious case of {category}. Your identity will be protected if you report this through our encrypted channel.",
    "Handling {category} requires careful attention. I recommend using the 'Submit Report' button to provide all details safely and anonymously.",
    "Under company policy, {category} is strictly prohibited. Please provide a detailed report so the ethics committee can investigate."
]

def generate_dataset(num_samples=100):
    dataset = []
    
    for _ in range(num_samples):
        # Pick a random category and scenario
        category = random.choice(list(CATEGORIES.keys()))
        question = random.choice(CATEGORIES[category])
        
        # Pick a random response template
        response = random.choice(TEMPLATES).format(category=category.lower())
        
        # Format for Instruction-Tuning (Common AI training format)
        entry = {
            "instruction": "You are the CivicShield AI Ethics Advisor. Provide professional advice for the following concern.",
            "input": question,
            "output": response
        }
        dataset.append(entry)
        
    return dataset

if __name__ == "__main__":
    print("🧬 Generating Synthetic Ethics Dataset...")
    
    # Generate 200 samples
    data = generate_dataset(200)
    
    # Save to JSONL (Standard format for training AI models)
    output_file = "ethics_training_data.jsonl"
    with open(output_file, "w") as f:
        for entry in data:
            f.write(json.dumps(entry) + "\n")
            
    print(f"✅ SUCCESS! Created {len(data)} training examples.")
    print(f"📂 File saved as: {output_file}")
