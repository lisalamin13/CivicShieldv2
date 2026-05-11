from datasets import load_dataset
import pandas as pd

def download_and_save(dataset_name):
    print(f"📡 Downloading {dataset_name} (Safety & Ethics Dataset)...")
    
    try:
        # Loading the PKU-SafeRLHF dataset (High-quality Ethical AI data)
        # This is one of the most respected datasets for teaching AI rules.
        ds = load_dataset(dataset_name)
        
        # Convert to a Pandas DataFrame (taking the 'train' split)
        df = pd.DataFrame(ds['train'])
        
        # Save as CSV
        filename = "pku_safe_ethics_data.csv"
        df.to_csv(filename, index=False)
        
        print(f"✅ SUCCESS! File saved as: {filename}")
        print(f"📊 Total examples: {len(df)}")
        print("\n--- SAMPLE ETHICAL COMPARISON ---")
        # Show a few examples of 'Better' vs 'Worse' ethical choices
        if 'prompt' in df.columns:
            print(df[['prompt', 'response_0', 'response_1']].head(2))
        
    except Exception as e:
        print(f"❌ Error downloading {dataset_name}: {e}")

if __name__ == "__main__":
    # Using the PKU-SafeRLHF dataset - the modern standard for AI Ethics
    download_and_save("PKU-Alignment/PKU-SafeRLHF")
