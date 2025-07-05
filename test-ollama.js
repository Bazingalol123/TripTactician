// Test script to verify Ollama setup with llama3.1:8b
async function testOllama() {
  console.log('🦙 Testing Ollama connection...');
  
  const OLLAMA_BASE_URL = 'http://localhost:11434';
  const MODEL = 'llama3.1:8b';
  
  try {
    // Test 1: Check if Ollama is running
    console.log('1️⃣ Checking if Ollama service is running...');
    const healthResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    
    if (!healthResponse.ok) {
      throw new Error(`Ollama not running. Start it with: ollama serve`);
    }
    
    const models = await healthResponse.json();
    console.log('✅ Ollama is running!');
    console.log('📋 Available models:', models.models?.map(m => m.name).join(', ') || 'None');
    
    // Test 2: Check if llama3.1:8b model is available
    console.log('2️⃣ Checking if llama3.1:8b model is available...');
    const modelExists = models.models?.some(m => m.name.includes('llama3.1:8b'));
    
    if (!modelExists) {
      console.log('❌ llama3.1:8b model not found');
      console.log('💡 Install it with: ollama pull llama3.1:8b');
      return;
    }
    
    console.log('✅ llama3.1:8b model is available!');
    
    // Test 3: Test simple chat completion
    console.log('3️⃣ Testing chat completion...');
    const chatResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: 'Say "Hello from llama3.1:8b!" and nothing else.' }
        ],
        stream: false
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API test successful!');
      console.log('🤖 Model response:', chatData.message?.content || 'No response');
    } else {
      console.log('❌ Chat API failed, trying generate API...');
      
      // Test 4: Fallback to generate API
      const generateResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          prompt: 'Say "Hello from llama3.1:8b!" and nothing else.',
          stream: false
        })
      });
      
      if (generateResponse.ok) {
        const generateData = await generateResponse.json();
        console.log('✅ Generate API test successful!');
        console.log('🤖 Model response:', generateData.response || 'No response');
      } else {
        console.log('❌ Both chat and generate APIs failed');
        const errorText = await generateResponse.text();
        console.log('Error:', errorText);
      }
    }
    
    console.log('\n🎉 Ollama setup verification complete!');
    
  } catch (error) {
    console.error('❌ Ollama test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure Ollama is installed: https://ollama.ai');
    console.log('2. Start Ollama service: ollama serve');
    console.log('3. Install the model: ollama pull llama3.1:8b');
    console.log('4. Check if running: curl http://localhost:11434/api/tags');
  }
}

// Run the test
testOllama().catch(console.error); 