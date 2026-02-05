#!/usr/bin/env node

/**
 * Extend Existing Video with NanoGPT Veo 3.1
 * 
 * Takes your existing video and extends it for a seamless loop.
 * 
 * Usage:
 *   node scripts/extend-existing-video.js <input-video> [options]
 * 
 * Examples:
 *   node scripts/extend-existing-video.js public/videos/closeup.mp4
 *   node scripts/extend-existing-video.js public/videos/background.mp4 --prompt "DNA continuation"
 *   node scripts/extend-existing-video.js public/videos/closeup.mp4 --duration 8 --split
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
  apiKey: process.env.NANOGPT_API_KEY,
  baseUrl: process.env.NANOGPT_BASE_URL || 'https://api.nano-gpt.com',
  model: 'veo3-1-extend',
  pollInterval: 5000,
  maxPolls: 60,
};

// Parse arguments
const inputFile = process.argv[2];
const args = process.argv.slice(3);

const options = {
  prompt: getArgValue(args, '--prompt') || 'Seamless continuation, looping animation',
  duration: parseInt(getArgValue(args, '--duration') || '8'),
  output: getArgValue(args, '--output'),
  split: args.includes('--split'),
  zoomDuration: parseInt(getArgValue(args, '--zoom-duration') || '5'),
};

function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

// Validate
if (!inputFile) {
  console.log('🎬 Extend Existing Video with NanoGPT Veo 3.1\n');
  console.log('Usage:');
  console.log('  node scripts/extend-existing-video.js <input-video> [options]\n');
  console.log('Options:');
  console.log('  --prompt <text>        Prompt for extension (default: "Seamless continuation")');
  console.log('  --duration <seconds>   Extension duration (default: 8)');
  console.log('  --output <name>        Output filename');
  console.log('  --split                Auto-split for zoom-then-loop pattern');
  console.log('  --zoom-duration <sec>  Zoom portion duration if splitting (default: 5)\n');
  console.log('Examples:');
  console.log('  node scripts/extend-existing-video.js public/videos/closeup.mp4');
  console.log('  node scripts/extend-existing-video.js public/videos/background.mp4 --prompt "DNA helix continuation" --split');
  process.exit(0);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: File not found: ${inputFile}`);
  process.exit(1);
}

if (!CONFIG.apiKey) {
  console.error('❌ Error: NANOGPT_API_KEY not set');
  console.error('   export NANOGPT_API_KEY="your-key-here"');
  process.exit(1);
}

// Get file info
const fileSize = fs.statSync(inputFile).size;
const fileExt = path.extname(inputFile);
const fileName = path.basename(inputFile, fileExt);
const fileDir = path.dirname(inputFile);

console.log('🎬 Extending Existing Video\n');
console.log(`Input: ${inputFile}`);
console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Prompt: "${options.prompt}"`);
console.log(`Duration: ${options.duration}s\n`);

// Read file and convert to base64
function fileToBase64(filePath) {
  return fs.readFileSync(filePath, { encoding: 'base64' });
}

// Make API request
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
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Check generation status
async function checkStatus(generationId) {
  const url = `${CONFIG.baseUrl}/v1/video/generations/${generationId}`;
  const response = await makeRequest(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${CONFIG.apiKey}` }
  });
  return response.data;
}

// Poll for completion
async function pollForCompletion(generationId) {
  console.log('⏳ Waiting for extension generation...');
  
  for (let i = 0; i < CONFIG.maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.pollInterval));
    
    const status = await checkStatus(generationId);
    const progress = status.status;
    
    if (progress === 'completed') {
      console.log('✅ Extension complete!');
      return status;
    } else if (progress === 'failed') {
      throw new Error(`Generation failed: ${status.error || 'Unknown error'}`);
    } else {
      process.stdout.write(`   Progress: ${progress} (${i + 1}/${CONFIG.maxPolls})\r`);
    }
  }
  
  throw new Error('Timeout: Generation took too long');
}

// Download file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(dest);
    
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
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

// Main function
async function main() {
  try {
    // For file upload, we need to use multipart/form-data or base64
    // NanoGPT API might support URL references or direct upload
    // Let's try with a publicly accessible URL first
    
    console.log('📤 Preparing video for extension...');
    
    // Option 1: If video is already deployed, use the public URL
    const deployedUrl = `https://mostproteins.com/videos/${path.basename(inputFile)}`;
    
    // Option 2: Create a data URI (for small files, may not work with all APIs)
    // For now, let's assume the file needs to be uploaded or referenced by URL
    
    // Check if file is too large for base64 (limit ~10MB for most APIs)
    if (fileSize > 10 * 1024 * 1024) {
      console.log('⚠️  File is large. Using local path reference...');
      console.log('   Note: API may require the video to be publicly accessible');
    }
    
    // Try to use the deployed URL or create temp hosting
    // For now, let's use a placeholder approach
    console.log('📡 Sending extend request to NanoGPT...\n');
    
    const url = `${CONFIG.baseUrl}/v1/video/generations`;
    
    // Prepare request body
    const body = JSON.stringify({
      model: CONFIG.model,
      prompt: options.prompt,
      duration: options.duration,
      // Video reference - API may require URL or base64
      video_url: deployedUrl, // Try public URL first
      // Alternatively, if API supports base64:
      // video: fileSize < 10 * 1024 * 1024 ? fileToBase64(inputFile) : undefined,
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
      console.error('API Error:', response.data);
      throw new Error(`API Error: ${response.status}`);
    }

    console.log(`✅ Request accepted: ${response.data.id}\n`);

    // Poll for completion
    const result = await pollForCompletion(response.data.id);
    
    // Generate output filename
    const timestamp = Date.now();
    const outputName = options.output 
      ? `${options.output}.mp4`
      : `${fileName}-extended-${timestamp}.mp4`;
    const outputPath = path.join(fileDir, outputName);

    // Download extended video
    console.log('\n📥 Downloading extended video...');
    await downloadFile(result.video_url, outputPath);
    
    const outputSize = fs.statSync(outputPath).size;
    console.log(`✅ Saved: ${outputPath}`);
    console.log(`   Size: ${(outputSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Optionally split for zoom-then-loop
    if (options.split) {
      console.log('✂️  Splitting for zoom-then-loop pattern...');
      
      try {
        await execPromise('ffmpeg -version');
        
        const zoomPath = path.join(fileDir, 'zoom.mp4');
        const closeupPath = path.join(fileDir, 'closeup.mp4');
        
        // Create zoom portion (first N seconds)
        console.log(`   Creating zoom.mp4 (first ${options.zoomDuration}s)...`);
        await execPromise(
          `ffmpeg -y -i "${outputPath}" -t ${options.zoomDuration} -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${zoomPath}"`
        );
        
        // Create closeup loop portion (rest)
        console.log('   Creating closeup.mp4 (remaining)...');
        await execPromise(
          `ffmpeg -y -ss 00:00:${options.zoomDuration} -i "${outputPath}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${closeupPath}"`
        );
        
        console.log(`✅ Split complete:`);
        console.log(`   - ${zoomPath}`);
        console.log(`   - ${closeupPath}\n`);
        
      } catch (err) {
        console.log('⚠️  ffmpeg not available, skipping split');
        console.log('   Install ffmpeg to enable auto-splitting');
      }
    }

    console.log('✨ Done!');
    console.log('\nNext steps:');
    console.log(`   1. Preview: open "${outputPath}"`);
    if (options.split) {
      console.log('   2. Test locally: npm run dev');
      console.log('   3. Deploy: npm run build && npm run deploy');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
