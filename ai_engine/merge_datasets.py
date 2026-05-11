import pandas as pd
import json
import os

def merge():
    print("🧬 Creating the Master Ethics Dataset...")
    
    master_data = []

    # 1. Load Synthetic Data (Specific to CivicShield)
    synthetic_file = "ethics_training_data.jsonl"
    if os.path.exists(synthetic_file):
        print("📥 Loading Synthetic Data...")
        with open(synthetic_file, "r") as f:
            for line in f:
                master_data.append(json.loads(line))
        print(f"✅ Added {len(master_data)} synthetic samples.")
    else:
        print("⚠️ Warning: Synthetic data not found. Run data_generator.py first.")

    # 2. Load PKU Safety Data (General Ethics)
    pku_file = "pku_safe_ethics_data.csv"
    if os.path.exists(pku_file):
        print("📥 Loading PKU Safety Data...")
        df = pd.read_csv(pku_file)
        
        # Take a sample of 200 high-quality ethical comparisons
        # Format them to match our 'instruction/input/output' structure
        for _, row in df.head(200).iterrows():
            entry = {
                "instruction": "You are the CivicShield AI Ethics Advisor. Evaluate the following prompt and provide a safe, ethical response.",
                "input": str(row['prompt']),
                # In RLHF data, 'response_0' is usually a good response
                "output": str(row['response_0']) 
            }
            master_data.append(entry)
        print(f"✅ Added 200 professional samples from PKU dataset.")
    else:
        print("⚠️ Warning: PKU dataset not found. Run download_dataset.py first.")

    # 3. Save the Master Dataset
    output_file = "master_ethics_dataset.jsonl"
    with open(output_file, "w") as f:
        for entry in master_data:
            f.write(json.dumps(entry) + "\n")
            
    print(f"🏁 MASTER DATASET READY: {output_file}")
    print(f"📈 Total Training Samples: {len(master_data)}")

if __name__ == "__main__":
    merge()
