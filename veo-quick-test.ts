#!/usr/bin/env tsx
/**
 * Veo 3.1 Quick Test
 * 
 * Rapid iteration tool for testing prompts without the full project workflow.
 * Generates a single extension and shows the result immediately.
 * 
 * Usage:
 *   npx tsx veo-quick-test.ts ./source.mp4 "your prompt here"
 * 
 * Or interactive:
 *   npx tsx veo-quick-test.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q: string): Promise<string> {
  return new Promise(r => rl.question(q, r));
}

async function fileToDataUrl(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'mp4' ? 'video/mp4' : 'video/quicktime';
  return `data:${mimeType};base64,${data.toString('base64')}`;
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  await fs.writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function generateExtension(params: {
  videoDataUrl?: string;
  videoUrl?: string;
  prompt: string;
  resolution?: '720p' | '1080p';
  duration?: 5 | 8;
  seed?: number;
}): Promise<{ id: string; status: string; videoUrl?: string; error?: string }> {
  const res = await fetch('https://nano-gpt.com/api/generate-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'veo3-1-extend',
      prompt: params.prompt,
      videoUrl: params.videoUrl,
      videoDataUrl: params.videoDataUrl,
      resolution: params.resolution || '720p',
      duration: params.duration || 5,
      seed: params.seed,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

async function checkStatus(id: string) {
  const res = await fetch(`https://nano-gpt.com/api/video/status?id=${id}`, {
    headers: { 'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}` },
  });
  return res.json();
}

async function openVideo(videoPath: string) {
  // Try to open with system default player
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [videoPath], { detached: true, stdio: 'ignore' });
}

async function createSideBySide(sourcePath: string, extendedPath: string, outputPath: string) {
  // Use ffmpeg to create side-by-side comparison
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', sourcePath,
      '-i', extendedPath,
      '-filter_complex', '[0:v][1:v]hstack=inputs=2[v]',
      '-map', '[v]',
      '-c:v', 'libx264',
      '-crf', '23',
      outputPath
    ], { stdio: 'pipe' });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed: ${code}`));
    });
  });
}

async function main() {
  console.log('🧪 Veo 3.1 Quick Test\n');

  if (!process.env.NANOGPT_API_KEY) {
    console.error('❌ Set NANOGPT_API_KEY first');
    process.exit(1);
  }

  // Get arguments
  const args = process.argv.slice(2);
  let sourceVideo: string;
  let prompt: string;
  
  if (args.length >= 2) {
    sourceVideo = args[0];
    prompt = args.slice(1).join(' ');
  } else {
    sourceVideo = await ask('Source video path: ');
    prompt = await ask('Prompt: ');
  }

  // Defaults
  const resolution = await ask('Resolution (720p/1080p) [720p]: ') || '720p' as '720p' | '1080p';
  const duration = parseInt(await ask('Duration (5/8) [5]: ') || '5') as 5 | 8;
  const seedInput = await ask('Seed (empty for random): ');
  const seed = seedInput ? parseInt(seedInput) : undefined;

  // Create temp directory
  const tempDir = `./veo-tests/test-${Date.now()}`;
  await fs.mkdir(tempDir, { recursive: true });

  console.log('\n📤 Uploading source video...');
  const dataUrl = await fileToDataUrl(sourceVideo);

  console.log('🎬 Submitting extension job...');
  console.log(`Prompt: ${prompt}`);
  
  const job = await generateExtension({
    videoDataUrl: dataUrl,
    prompt,
    resolution,
    duration,
    seed,
  });

  console.log(`Job ID: ${job.id}`);
  console.log('⏳ Waiting for generation (this may take 30-120 seconds)...\n');

  // Poll for completion
  let lastStatus = '';
  const startTime = Date.now();
  
  while (true) {
    const status = await checkStatus(job.id);
    
    if (status.status !== lastStatus) {
      lastStatus = status.status;
      console.log(`Status: ${status.status} (${((Date.now() - startTime) / 1000).toFixed(0)}s)`);
    }
    
    if (status.status === 'completed' && status.videoUrl) {
      console.log('\n✅ Generation complete!');
      
      // Download
      const extendedPath = path.join(tempDir, 'extended.mp4');
      console.log('📥 Downloading...');
      await downloadVideo(status.videoUrl, extendedPath);
      
      // Create comparison
      console.log('🎞️  Creating side-by-side comparison...');
      const comparisonPath = path.join(tempDir, 'comparison.mp4');
      try {
        await createSideBySide(sourceVideo, extendedPath, comparisonPath);
        console.log(`\n✨ Comparison saved: ${comparisonPath}`);
      } catch {
        console.log('\n⚠️  Could not create comparison, but extended video is saved');
      }
      
      // Save info
      const infoPath = path.join(tempDir, 'info.txt');
      await fs.writeFile(infoPath, `
Test Date: ${new Date().toISOString()}
Source: ${sourceVideo}
Prompt: ${prompt}
Resolution: ${resolution}
Duration: ${duration}s
Seed: ${seed || 'random'}
Job ID: ${job.id}
Result URL: ${status.videoUrl}

Files:
  - extended.mp4: The AI-generated extension
  - comparison.mp4: Side-by-side with source (if created)
`);

      console.log(`\n📁 Files saved to: ${tempDir}`);
      console.log(`   - extended.mp4`);
      console.log(`   - comparison.mp4`);
      console.log(`   - info.txt`);
      
      // Ask to open
      const open = await ask('\nOpen videos now? (y/n): ');
      if (open.toLowerCase().startsWith('y')) {
        await openVideo(extendedPath);
      }
      
      // Ask to retry
      const retry = await ask('\nTry again with different prompt? (y/n): ');
      if (retry.toLowerCase().startsWith('y')) {
        const newPrompt = await ask('New prompt: ');
        const newSeed = await ask('New seed (empty for random): ');
        process.argv = ['', '', sourceVideo, newPrompt];
        // Re-run with new args would need different approach
        console.log('\nRun again with:');
        console.log(`  npx tsx veo-quick-test.ts "${sourceVideo}" "${newPrompt}"`);
      }
      
      break;
    }
    
    if (status.status === 'failed') {
      console.error(`\n❌ Generation failed: ${status.error}`);
      break;
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }

  rl.close();
}

main().catch(console.error);
