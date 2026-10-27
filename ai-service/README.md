# 🧠 RentHub AI Microservice: Local Listing Description Generator

This subproject is an **offline-capable, local Open-Source AI Microservice** built for the RentHub rental marketplace. It uses PyTorch, Hugging Face Transformers (`google/flan-t5-base`), and FastAPI to generate accurate, attractive rental listing descriptions without paying for external cloud APIs (such as OpenAI or Google Gemini).

---

## 🏛️ Academic & Architectural Concepts

### 1. Polyglot Microservice Architecture
Instead of loading massive PyTorch machine learning models into the Node.js runtime, RentHub employs a **polyglot microservice pattern**:
* **Node.js/Express (`backend/`)**: Handles transactional business logic, MongoDB persistence, JWT authentication, Stripe payments, and booking calendars.
* **FastAPI Microservice (`ai-service/`)**: Dedicated purely to asynchronous tensor operations, text tokenization, and neural autoregressive generation.
* **Decoupling Benefit**: The Node.js event loop is never blocked by CPU-intensive matrix multiplications during inference.

```
 RentHub React Client (port 5173)
   │
   ├──> Node.js Express Backend (port 5000) ──> MongoDB Database
   │
   └──> Python AI Service (port 8000)       ──> Local Model Weights in RAM
```

### 2. Encoder-Decoder (Seq2Seq) Model Architecture
* The default engine uses **`google/flan-t5-base`** (Instruction-Tuned T5 architecture).
* **Encoder**: Encodes the structured input prompt containing the title, category, accessories, and condition into dense continuous vector representations.
* **Decoder**: Generates description tokens autoregressively, attending to both previous generated tokens and the encoder's representations via cross-attention.

### 3. Tokenization & Detokenization
Computers operate on numbers, not text:
1. **Subword Tokenization (SentencePiece)**: Converts raw input strings into numerical token vectors (e.g. `Sony Alpha` $\rightarrow$ `[14294, 9182]`).
2. **Inference**: Neural network predicts token probability distributions over a 32,128-token vocabulary.
3. **Detokenization**: Transforms the output token array back into natural UTF-8 English text.

### 4. Hyperparameter Tuning & Grounding
* **`temperature` (0.65)**: Scales logits prior to softmax. Lower values minimize hallucinations and maintain adherence to provided equipment specifications.
* **`top_p` (0.9 - Nucleus Sampling)**: Selects from the smallest subset of candidate tokens whose cumulative probability $\ge 0.9$, discarding improbable words.
* **`repetition_penalty` (1.2)**: Disincentivizes repetitive loops by discounting the logits of previously sampled tokens.
* **`no_repeat_ngram_size` (3)**: Explicitly bans any 3-gram from repeating.

### 5. Data Privacy & Offline Resilience
* Model weights (~990 MB) are permanently stored in the local Hugging Face cache (`~/.cache/huggingface/hub/`).
* Once downloaded, the service operates **100% offline with zero internet access**.
* No customer or host listing data is ever sent to third parties or cloud servers.

---

## ⚡ Measured Hardware Benchmarks (Actual Execution)

| Metric | Measured Value | Notes |
| :--- | :--- | :--- |
| **Model** | `google/flan-t5-base` | 247M parameters, 32-bit/16-bit safetensors |
| **Compute Device** | `CPU` (Intel/AMD) | CUDA automatically detected if NVIDIA GPU available |
| **Memory Delta** | ~680.59 MB RAM | Loaded once in memory during FastAPI startup lifespan |
| **Total Process Footprint** | ~1,027 MB RAM | Safely runs on 8 GB / 16 GB consumer laptops |
| **Inference Latency** | ~3.8 – 5.9 seconds | Generates 70–120 grounded tokens per description |

---

## 🚀 Quickstart & Running Locally

### 1. Environment Activation
```bash
# From the project root
cd ai-service

# On Windows (PowerShell):
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate
```

### 2. Run the Service
```bash
python main.py
```
* The API will start on: **`http://127.0.0.1:8000`**
* Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**
* Health Endpoint: **`http://127.0.0.1:8000/api/health`**

### 3. Run Automated Tests
```bash
pytest test_api.py -v
```

---

## 🔌 API Specification

### `POST /api/generate-description`
**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "title": "Sony Alpha A7 IV Camera + 24-70mm GM Lens",
  "category": "Photography & Cameras",
  "features": "24-70mm f/2.8 lens, 2 rechargeable batteries, 128GB SD card, padded case",
  "condition": "Like New",
  "location": "Indiranagar, Bangalore"
}
```

**Response Body (200 OK):**
```json
{
  "description": "A used Sony Alpha A7 IV camera with a 24-70mm f/2.8 lens and a high-speed SD card. It includes the following accessories: 24-70mm f/2.8 lens, 2 rechargeable batteries, 128GB high-speed SD card, and padded carrying case. Maintained carefully and ready for your next project or event. Book with confidence on RentHub!",
  "metrics": {
    "inference_time_seconds": 5.998,
    "input_tokens": 141,
    "output_tokens": 70,
    "device": "cpu",
    "model_name": "google/flan-t5-base"
  },
  "source": "local_open_source_model"
}
```
