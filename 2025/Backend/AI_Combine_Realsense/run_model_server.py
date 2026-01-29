import torch
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from flask import Flask, request, jsonify
from qwen_vl_utils import process_vision_info
from PIL import Image
from pyngrok import ngrok

# ================= CONFIGURATION =================
# Path to your Fine-Tuned Model (can be local path or Hugging Face ID)
MODEL_PATH = "/home/anyone/SmartFarm_Master2025/Plant-Monitoring-System-2025-Master/2025/Backend/AI_Combine_Realsense/finetuned_model"  # <--- UPDATE THIS
NGROK_TOKEN = "YOUR_NGROK_TOKEN"  # <--- UPDATE THIS

# ================= LOAD MODEL =================
print(f"⚙️ Loading Qwen2.5-VL on GPU (8GB VRAM)...")

# 8GB VRAM is tight for 7B models, so we MUST use 4-bit or 8-bit
bnb_config = None
try:
    from transformers import BitsAndBytesConfig

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,  # 4-bit is safest for 8GB VRAM
        bnb_4bit_compute_dtype=torch.float16
    )
except ImportError:
    print("Warning: bitsandbytes not found, trying standard load (might OOM).")

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    MODEL_PATH,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)
processor = AutoProcessor.from_pretrained(MODEL_PATH, trust_remote_code=True)
print("✅ Model Loaded Successfully!")

# ================= START FLASK + NGROK =================
app = Flask(__name__)
ngrok.set_auth_token(NGROK_TOKEN)
public_url = ngrok.connect(5000).public_url
print(f"\n🚀 SERVER IS READY! \n🔗 PUBLIC URL: {public_url}\n")


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image"}), 400

        file = request.files['image']
        image = Image.open(file.stream).convert("RGB")

        # Prepare inputs
        messages = [
            {"role": "user", "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": "Identify the disease in this tomato leaf."}
            ]}
        ]

        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to(model.device)

        # Generate
        generated_ids = model.generate(**inputs, max_new_tokens=128)
        output_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

        # Clean response
        response_clean = output_text.split("assistant\n")[-1].strip()

        return jsonify({"response": response_clean})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000)