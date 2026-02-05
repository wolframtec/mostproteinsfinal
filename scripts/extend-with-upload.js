#!/usr/bin/env node

/**
 * Extend Video with Direct Upload to NanoGPT
 * 
 * This version uploads the video file directly to NanoGPT for extension.
 * 
 * Usage:
 *   node scripts/extend-with-upload.js <input-video>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const CONFIG = {
  apiKey: process.env.NANOGPT_API_KEY,
  baseUrl: 'https://api.nano-gpt.com',
};

const inputFile = process.argv[2];
const prompt = process.argv[3] || 'Seamless continuation, looping animation';

if (!inputFile) {
  console.log('Usage: node scripts/extend-with-upload.js <video-file> [prompt]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

if (!CONFIG.apiKey) {
  console.error('NANOGPT_API_KEY not set');
  process.exit(1);
}

console.log('Uploading and extending video...');
console.log(`File: ${inputFile}`);
console.log(`Size: ${(fs.statSync(inputFile).size / 1024 / 1024).toFixed(2)} MB`);

// Using Node's built-in https for multipart upload
const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
const fileData = fs.readFileSync(inputFile);
const fileName = path.basename(inputFile);

// Build multipart body
const preFile = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="video"; filename="${fileName}"\r\n` +
  `Content-Type: video/mp4\r\n\r\n`
);

const postFile = Buffer.from(
  `\r\n--${boundary}\r\n` +
  `Content-Disposition: form-data; name="model"\r\n\r\n` +
  `veo3-1-extend\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="prompt"\r\n\r\n` +
  `${prompt}\r\n` +
  `--${boundary}--\r\n`
);

const body = Buffer.concat([preFile, fileData, postFile]);

const options = {
  hostname: 'api.nano-gpt.com',
  port: 443,
  path: '/v1/video/generations',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CONFIG.apiKey}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

console.log('\nUploading... (this may take a moment for large files)');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Upload successful!');
      console.log(`Generation ID: ${response.id}`);
      console.log('\nTo check status, run:');
      console.log(`  curl -H "Authorization: Bearer $NANOGPT_API_KEY" \\`);
      console.log(`    https://api.nano-gpt.com/v1/video/generations/${response.id}`);
    } catch (e) {
      console.error('Response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Upload failed:', err.message);
});

req.write(body);
req.end();
