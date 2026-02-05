#!/usr/bin/env node

/**
 * NanoGPT Veo 3.1 Video Generation Script
 * 
 * This script generates videos using Google's Veo 3.1 model through NanoGPT API.
 * It can create seamless loops by using the extend feature.
 * 
 * Usage:
 *   node scripts/generate-video-loop.js "Your prompt here"
 * 
 * Environment Variables:
 *   NANOGPT_API_KEY - Your NanoGPT API key
 *   NANOGPT_BASE_URL - API base URL (optional, defaults to https://api.nano-gpt.com)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  apiKey: process.env.NANOGPT_API_KEY,
  baseUrl: process.env.NANOGPT_BASE_URL || 'https://api.nano-gpt.com',
  model: 'veo3-1-extend',
  outputDir: path.join(__dirname, '../public/videos'),
  pollInterval: 5000, // 5 seconds
  maxPolls: 60, // 5 minutes max wait
};

// Validate API key
if (!CONFIG.apiKey) {
  console.error('❌ Error: NANOGPT_API_KEY environment variable is required');
  console.error('\nSet it with:');
  console.error('  export NANOGPT_API_KEY="your-api-key-here"');
  console.error('\nGet your API key from: https://nano-gpt.com/dashboard/api');
  process.exit(1);
}

// Parse command line arguments
const prompt = process.argv[2];
const options = {
  duration: process.argv.includes('--duration') 
    ? parseInt(process.argv[process.argv.indexOf('--duration') + 1]) 
    : 8,
  aspectRatio: process.argv.includes('--aspect') 
    ? process.argv[process.argv.indexOf('--aspect') + 1] 
    : '16:9',
  outputName: process.argv.includes('--output') 
    ? process.argv[process.argv.indexOf('--output') + 1] 
    : null,
  extend: process.argv.includes('--extend'),
  loop: process.argv.includes('--loop'),
};

if (!prompt) {
  console.log('🎬 NanoGPT Veo 3.1 Video Generator\n');
  console.log('Usage:');
  console.log('  node scripts/generate-video-loop.js "Your prompt here" [options]\n');
  console.log('Options:');
  console.log('  --duration <seconds>  Video duration (default: 8)');
  console.log('  --aspect <ratio>      Aspect ratio: 16:9, 9:16, 1:1 (default: 16:9)');
  console.log('  --output <name>       Output filename (default: auto-generated)');
  console.log('  --extend              Use extend mode for longer videos');
  console.log('  --loop                Generate a seamless loop\n');
  console.log('Examples:');
  console.log('  node scripts/generate-video-loop.js "DNA helix rotating in dark void"');
  console.log('  node scripts/generate-video-loop.js "Abstract biotech particles" --duration 10 --loop');
  console.log('  node scripts/generate-video-loop.js "Microscopic cell division" --aspect 9:16 --output mobile-bg\n');
  process.exit(0);
}

// Utility: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Utility: Download file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(dest);
    
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Generate video
async function generateVideo(prompt, options = {}) {
  const url = `${CONFIG.baseUrl}/v1/video/generations`;
  
  const body = JSON.stringify({
    model: CONFIG.model,
    prompt: prompt,
    duration: options.duration || 8,
    aspect_ratio: options.aspectRatio || '16:9',
    // For seamless loops, add loop-specific instructions to prompt
    ...(options.loop && {
      prompt: `${prompt}. Seamless loop, perfectly looping animation, first frame matches last frame.`,
    }),
  });

  console.log('🎨 Sending request to NanoGPT...');
  console.log(`   Prompt: "${prompt}"`);
  console.log(`   Model: ${CONFIG.model}`);
  console.log(`   Duration: ${options.duration}s`);
  console.log(`   Aspect Ratio: ${options.aspectRatio}`);
  console.log();

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body: body
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

// Check generation status
async function checkStatus(generationId) {
  const url = `${CONFIG.baseUrl}/v1/video/generations/${generationId}`;
  
  const response = await makeRequest(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CONFIG.apiKey}`,
    }
  });

  return response.data;
}

// Poll for completion
async function pollForCompletion(generationId) {
  console.log('⏳ Waiting for video generation...');
  
  for (let i = 0; i < CONFIG.maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.pollInterval));
    
    const status = await checkStatus(generationId);
    const progress = status.status;
    
    if (progress === 'completed') {
      console.log('✅ Video generation complete!');
      return status;
    } else if (progress === 'failed') {
      throw new Error(`Generation failed: ${status.error || 'Unknown error'}`);
    } else {
      process.stdout.write(`   Progress: ${progress} (${i + 1}/${CONFIG.maxPolls})\r`);
    }
  }
  
  throw new Error('Timeout: Video generation took too long');
}

// Extend video (for seamless loops)
async function extendVideo(videoUrl, prompt) {
  console.log('\n🔄 Extending video for seamless loop...');
  
  const url = `${CONFIG.baseUrl}/v1/video/generations`;
  
  const body = JSON.stringify({
    model: CONFIG.model,
    prompt: `${prompt} (continuation, seamless loop)`,
    video_url: videoUrl,
    duration: 8,
  });

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body: body
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Extend API Error: ${response.status}`);
  }

  return response.data;
}

// Main execution
async function main() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Generate video
    const generation = await generateVideo(prompt, options);
    console.log(`   Generation ID: ${generation.id}\n`);

    // Poll for completion
    const result = await pollForCompletion(generation.id);
    
    // Determine output filename
    const timestamp = Date.now();
    const safePrompt = prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = options.outputName 
      ? `${options.outputName}.mp4`
      : `veo-${safePrompt}-${timestamp}.mp4`;
    const outputPath = path.join(CONFIG.outputDir, filename);

    // Download video
    console.log('\n📥 Downloading video...');
    console.log(`   URL: ${result.video_url}`);
    await downloadFile(result.video_url, outputPath);
    
    console.log(`\n✨ Video saved to: ${outputPath}`);
    console.log(`   Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

    // Optional: Extend for seamless loop
    if (options.extend || options.loop) {
      console.log('\n🔄 Creating seamless loop...');
      const extendResult = await extendVideo(result.video_url, prompt);
      const extendedStatus = await pollForCompletion(extendResult.id);
      
      const extendFilename = filename.replace('.mp4', '-extended.mp4');
      const extendPath = path.join(CONFIG.outputDir, extendFilename);
      
      await downloadFile(extendedStatus.video_url, extendPath);
      console.log(`\n✨ Extended video saved to: ${extendPath}`);
    }

    // Suggest next steps
    console.log('\n📋 Next steps:');
    console.log(`   1. Preview: open ${outputPath}`);
    console.log(`   2. Copy to project: cp ${outputPath} public/videos/background.mp4`);
    console.log(`   3. Rebuild: npm run build && npm run deploy`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
main();
