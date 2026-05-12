import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
import os

# 1. Configuration
MODEL_NAME = "HuggingFaceTB/SmolLM2-135M-Instruct"
DATASET_PATH = "ethics_training_data.jsonl"
OUTPUT_DIR = "./civicshield_custom_model"

def train():
    print(f"🚀 Starting Fine-Tuning for {MODEL_NAME}...")

    # Check for GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🖥️ Using device: {device}")

    # 2. Load Tokenizer and Model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME, 
        torch_dtype=torch.float32, # CPU friendly
        device_map=None if device == "cpu" else "auto"
    )

    # 3. Load Dataset
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    def tokenize_function(examples):
        # Format: Official ChatML for SmolLM2
        prompts = [
            f"<|im_start|>system\n{instr}<|im_end|>\n<|im_start|>user\n{inp}<|im_end|>\n<|im_start|>assistant\n{out}<|im_end|>"
            for instr, inp, out in zip(examples["instruction"], examples["input"], examples["output"])
        ]
        return tokenizer(prompts, truncation=True, padding="max_length", max_length=256)

    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset.column_names)

    # 4. Training Arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=3,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=100,
        eval_strategy="no",
        fp16=(device == "cuda"),
        push_to_hub=False,
    )

    # 5. Start Training
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    print("🛠️ Training in progress... This may take a while.")
    trainer.train()

    # 6. Save the Custom Brain
    print(f"✅ Training Complete! Saving to {OUTPUT_DIR}")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

if __name__ == "__main__":
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: {DATASET_PATH} not found. Run data_generator.py first!")
    else:
        train()
