# 🤖 Local LLM Setup Guide

## Overview
This guide shows how to replace OpenAI with local LLMs to save costs and maintain privacy.

## 🦙 Option 1: Ollama

### A. GUI Installation (Easier)
1. **Download:** [https://ollama.ai/download](https://ollama.ai/download)
2. **Install:** Run the installer for your OS
3. **Open:** Ollama Desktop app
4. **Download models:** Use the GUI interface

### B. Command Line Installation
```bash
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### Download Models
```bash
# Fast but good quality (4GB RAM)
ollama pull llama3.1:8b

# Best quality (requires 40GB+ RAM)
ollama pull llama3.1:70b

# Multilingual, good for international travel
ollama pull mistral:7b

# Chinese travel planning
ollama pull qwen2.5:7b
```

### Environment Configuration
Add to your `server/.env` file:
```env
# Use Ollama instead of OpenAI
LLM_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Comment out OpenAI (save costs)
# OPENAI_API_KEY=your_key_here
```

### Start Ollama
```bash
# Start Ollama service
ollama serve

# Test it works
ollama run llama3.1:8b "Plan a 3-day trip to Rome"
```

## 🖥️ Option 2: LM Studio (Best GUI Experience)

### Installation
1. **Download:** [https://lmstudio.ai/](https://lmstudio.ai/)
2. **Install:** Run installer (Windows/Mac/Linux)
3. **Open:** LM Studio application
4. **Discover:** Browse available models
5. **Download:** Select "Llama 3.1 8B Instruct" (4.7GB)
6. **Local Server:** Go to "Local Server" tab
7. **Start Server:** Click "Start Server" on port 1234

### Configuration
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:1234
OLLAMA_MODEL=llama-3.1-8b-instruct
```

### Why LM Studio?
- ✅ **No terminal commands** required
- ✅ **Beautiful interface** for model management
- ✅ **Built-in chat** to test models
- ✅ **Easy server setup** with one click
- ✅ **Model recommendations** based on your hardware

## 🌐 Option 3: GPT4All (Completely Offline)

### Installation
1. **Download:** [https://gpt4all.io/](https://gpt4all.io/)
2. **Install:** Run installer for your OS
3. **Open:** GPT4All application
4. **Download:** Choose a model (Llama 3.1 recommended)
5. **Chat:** Test the model in the built-in interface

### Features
- ✅ **Completely offline** - no internet required
- ✅ **Multiple models** included
- ✅ **Privacy-focused** - data never leaves your device
- ✅ **Simple setup** - just download and run

*Note: GPT4All doesn't provide an API server, so you'd need to use it separately from our travel app*

## 🎨 Option 4: Jan.ai (Modern Interface)

### Installation
1. **Download:** [https://jan.ai/](https://jan.ai/)
2. **Install:** Modern desktop application
3. **Browse:** Model marketplace
4. **Download:** Select your preferred model
5. **Start:** Local API server

### Configuration
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:1337
OLLAMA_MODEL=your-selected-model
```

## 🚀 Option 5: Cloud-Based (No Installation)

### Groq (Fastest)
- **Website:** [https://groq.com/](https://groq.com/)
- **Speed:** Ultra-fast inference
- **Cost:** Free tier available
- **Setup:** Just get API key, no installation

### Together.ai
- **Website:** [https://together.ai/](https://together.ai/)
- **Models:** Many open-source options
- **Cost:** Much cheaper than OpenAI
- **Setup:** API key only

## 🚀 Option 6: Production Setup

### Using vLLM (High Performance)
```bash
# Install vLLM
pip install vllm

# Start server
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --port 8000

# Configuration
OLLAMA_BASE_URL=http://localhost:8000
```

## 📊 Model Comparison

| Model | Size | RAM Needed | Speed | Quality | Best For |
|-------|------|------------|-------|---------|----------|
| Llama 3.1 8B | 4.7GB | 8GB | Fast | Good | General travel |
| Llama 3.1 70B | 40GB | 80GB | Slow | Excellent | Complex itineraries |
| Mistral 7B | 4.1GB | 8GB | Fast | Good | Multilingual |
| Qwen 2.5 7B | 4.4GB | 8GB | Fast | Good | Asian destinations |

## 🔧 Testing Your Setup

### 1. Check Ollama is Running
```bash
curl http://localhost:11434/api/tags
```

### 2. Test the Integration
```bash
# Start your server
cd server && npm start

# Check health endpoint
curl http://localhost:5000/api/health
```

### 3. Generate a Test Trip
Use the frontend to create a trip and select "🤖 AI Generated" mode.

## 💡 Optimization Tips

### For Better Performance:
1. **Use GPU acceleration** if available
2. **Increase context length** for longer trips
3. **Fine-tune prompts** for your specific use case

### For Better Quality:
1. **Use larger models** (70B vs 8B)
2. **Add travel-specific system prompts**
3. **Implement RAG** with travel knowledge base

## 🔄 Switching Between Providers

You can easily switch between OpenAI and local LLMs:

```env
# Use OpenAI (costs money)
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Use local Ollama (free)
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
```

## 🚨 Troubleshooting

### Common Issues:

**Ollama not responding:**
```bash
# Check if running
ps aux | grep ollama

# Restart service
ollama serve
```

**Out of memory:**
- Use smaller model (8B instead of 70B)
- Close other applications
- Increase swap space

**Slow responses:**
- Use GPU acceleration
- Reduce max_tokens
- Use smaller model

**Poor quality responses:**
- Use larger model
- Adjust temperature
- Improve system prompts

## 🎯 Next Steps

1. **Set up Ollama** with Llama 3.1 8B
2. **Test with simple trip** (Rome, 3 days)
3. **Compare quality** with OpenAI
4. **Optimize prompts** for better results
5. **Consider fine-tuning** for your specific needs

## 💰 Cost Comparison

| Provider | Cost per 1M tokens | Monthly (100 trips) |
|----------|-------------------|---------------------|
| OpenAI GPT-4 | $30 | ~$150 |
| OpenAI GPT-3.5 | $2 | ~$10 |
| **Local LLM** | **$0** | **$0** |

*Plus electricity costs (~$0.10/hour)* 