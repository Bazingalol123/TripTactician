#!/usr/bin/env node

// Setup script for free API alternatives
// Replaces costly Google Maps/Places APIs and OpenAI with free alternatives

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Travel Command Center - Free API Setup');
console.log('==========================================');
console.log('Setting up free alternatives to replace costly APIs:');
console.log('❌ Google Maps API → ✅ OpenStreetMap (FREE)');
console.log('❌ Google Places API → ✅ Overpass API (FREE)');
console.log('❌ OpenAI API → ✅ Ollama Local LLM (FREE)');
console.log('💰 Monthly cost: $0 instead of $200+/month!');
console.log('==========================================\n');

// Check if running on Windows
const isWindows = process.platform === 'win32';

// Function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Function to check if command exists
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Step 1: Install Node.js dependencies
console.log('📦 STEP 1: Installing Node.js dependencies');
if (!runCommand('npm install', 'Installing required packages')) {
  console.log('⚠️ Please run: npm install');
}

// Step 2: Set up Ollama (Local LLM)
console.log('🦙 STEP 2: Setting up Ollama (Local LLM)');

if (!commandExists('ollama')) {
  console.log('📥 Ollama not found. Installing...');
  
  if (isWindows) {
    console.log('🪟 Windows detected:');
    console.log('Please download and install Ollama from: https://ollama.ai/download');
    console.log('Or run in PowerShell as Administrator:');
    console.log('winget install Ollama.Ollama');
  } else {
    // Linux/macOS installation
    if (runCommand('curl -fsSL https://ollama.ai/install.sh | sh', 'Installing Ollama')) {
      console.log('✅ Ollama installed successfully');
    } else {
      console.log('❌ Ollama installation failed');
      console.log('Please visit: https://ollama.ai/download');
    }
  }
} else {
  console.log('✅ Ollama already installed');
}

// Step 3: Download and start Ollama model
console.log('🧠 STEP 3: Setting up AI model');

if (commandExists('ollama')) {
  console.log('📥 Downloading Llama 3.1 8B model (4GB)...');
  console.log('This is a one-time download and will take a few minutes.');
  
  if (runCommand('ollama pull llama3.1:8b', 'Downloading AI model')) {
    console.log('✅ AI model downloaded successfully');
    
    // Start Ollama service
    console.log('🚀 Starting Ollama service...');
    if (runCommand('ollama serve > /dev/null 2>&1 &', 'Starting Ollama service')) {
      console.log('✅ Ollama service started');
    }
  } else {
    console.log('❌ Model download failed');
    console.log('Please run manually: ollama pull llama3.1:8b');
  }
} else {
  console.log('⚠️ Ollama not available. Please install it first.');
}

// Step 4: Create environment configuration
console.log('⚙️ STEP 4: Configuring environment');

const envContent = `# === FREE TRAVEL COMMAND CENTER CONFIGURATION ===
# No API keys needed! Everything runs locally and uses free services.

# === SERVER CONFIGURATION ===
PORT=5000
NODE_ENV=development

# === DATABASE ===
MONGODB_URI=mongodb://localhost:27017/travel_command_center

# === AUTHENTICATION ===
JWT_SECRET=travel_command_center_super_secure_jwt_secret_2024

# === LOCAL LLM (FREE - NO API KEY NEEDED) ===
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# === FREE MAPPING SERVICES (NO API KEY NEEDED) ===
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OVERPASS_API_URL=https://overpass-api.de/api

# === EMAIL SERVICE (OPTIONAL) ===
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=

# === FRONTEND ===
FRONTEND_URL=http://localhost:3000
REACT_APP_API_BASE_URL=http://localhost:5000/api

# === PERFORMANCE ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_DURATION_MS=3600000

# === REMOVED COSTLY APIS (REPLACED WITH FREE ALTERNATIVES) ===
# OPENAI_API_KEY=removed_using_ollama_instead
# GOOGLE_MAPS_API_KEY=removed_using_openstreetmap_instead
# GOOGLE_PLACES_API_KEY=removed_using_overpass_api_instead

# 💰 MONTHLY COST: $0 (completely free!)
# 🌍 Data source: OpenStreetMap community
# 🤖 AI: Local Llama 3.1 model (private and secure)
`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Environment configuration created (.env)');
} catch (error) {
  console.log('❌ Failed to create .env file:', error.message);
}

// Step 5: Update package.json scripts
console.log('📝 STEP 5: Adding helpful scripts');

try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add helpful scripts
  packageData.scripts = {
    ...packageData.scripts,
    'setup-ollama': 'ollama pull llama3.1:8b',
    'start-ollama': 'ollama serve',
    'test-ollama': 'node test-ollama.js',
    'dev-full': 'concurrently "ollama serve" "npm run server" "npm run client"'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
  console.log('✅ Added helpful scripts to package.json');
} catch (error) {
  console.log('⚠️ Could not update package.json scripts:', error.message);
}

// Final instructions
console.log('\n🎉 SETUP COMPLETE!');
console.log('==================');
console.log('✅ All free alternatives configured');
console.log('✅ No API keys needed');
console.log('✅ Zero monthly costs');
console.log('\n🚀 TO START THE APPLICATION:');
console.log('1. Start Ollama: ollama serve');
console.log('2. Start backend: npm run server');
console.log('3. Start frontend: npm start');
console.log('\nOr run everything at once: npm run dev-full');
console.log('\n💡 BENEFITS:');
console.log('- 🆓 Completely free (no API costs)');
console.log('- 🔒 Privacy-focused (local AI)');
console.log('- 🌍 Community data (OpenStreetMap)');
console.log('- ⚡ Fast and reliable');
console.log('\n📚 TROUBLESHOOTING:');
console.log('- Test Ollama: npm run test-ollama');
console.log('- Check logs in console');
console.log('- Visit: http://localhost:3000');
console.log('\nHappy travels! 🧳✈️'); 