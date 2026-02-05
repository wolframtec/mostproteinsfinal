#!/usr/bin/env tsx
/**
 * Create a true seamless loop using ONE extension + crossfade back to source
 * 
 * Strategy:
 * 1. Generate ONE extension from your source
 * 2. Crossfade the end of the extension back to the start of the source
 * 3. This guarantees a seamless loop point
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video_compressed.mp4';
const PROJECT_DIR = './dna-flesh-seamless-loop';

const PROMPT = "Continue the organic flesh transformation. Realistic tissue pulsing with living motion, microscopic DNA helix patterns visible beneath the surface. Seamless organic flow maintaining the same lighting and texture.";

async function fileToDataUrl(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return `data:video/mp4;base64,${data.toString('base64')}`;
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  await fs.writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function submitExtension(params: {
  videoDataUrl: string;
  prompt: string;
  seed: number;
}) {
  const res = await fetch('https://nano-gpt.com/api/generate-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'veo3-1-extend',
      prompt: params.prompt,
      videoDataUrl: params.videoDataUrl,
      resolution: '720p',
      duration: 8,
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
  const res = await fetch(`https://nano-gpt.com/api/video/status?requestId=${id}`, {
    headers: { 'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}` },
  });
  return res.json();
}

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed`));
    });
  });
}

async function getDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      videoPath
    ]);
    let output = '';
    ffprobe.stdout.on('data', d => output += d.toString());
    ffprobe.on('close', code => {
      if (code === 0) resolve(parseFloat(output.trim()));
      else reject(new Error('ffprobe failed'));
    });
  });
}

async function createSeamlessLoop(
  source: string,
  extension: string,
  output: string
) {
  const sourceDur = await getDuration(source);
  const extDur = await getDuration(extension);
  
  console.log(`Source: ${sourceDur.toFixed(1)}s, Extension: ${extDur.toFixed(1)}s`);
  
  // Method: Source + Extension(with fade out) + Source(fade in)
  // This creates: Source plays, extends, then crossfades back to Source start
  
  const fadeDuration = 2; // seconds
  const extPlayDuration = extDur - fadeDuration;
  
  // Build filter complex:
  // [0:v] = source (plays full, then used for crossfade at end)
  // [1:v] = extension (plays most of it, fades out)
  
  const filterComplex = [
    // Source input - we'll use the beginning later for the loop
    `[0:v]trim=start=0:end=${fadeDuration},setpts=PTS-STARTPTS[source_start];`,
    
    // Extension - play most of it, then fade out
    `[1:v]trim=start=0:end=${extPlayDuration},setpts=PTS-STARTPTS[ext_body];`,
    `[ext_body]fade=t=out:st=${extPlayDuration - fadeDuration}:d=${fadeDuration}:alpha=1[ext_fade];`,
    
    // Source start - fade in
    `[source_start]fade=t=in:st=0:d=${fadeDuration}:alpha=1[source_fade];`,
    
    // Overlay the crossfade
    `[ext_fade][source_fade]overlay=(W-w)/2:(H-h)/2:format=auto[crossfade];`,
    
    // Concatenate: source (full) + crossfade section
    `[0:v][crossfade]concat=n=2:v=1:a=0[outv]`
  ].join('');
  
  console.log('Creating seamless loop with crossfade...');
  await runFFmpeg([
    '-i', source,
    '-i', extension,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-movflags', '+faststart',
    output
  ]);
}

async function createSimplePingPong(
  source: string,
  extension: string,
  output: string
) {
  // Simpler approach: Source + Extension + Reverse(Extension) + Reverse(Source)
  const revExt = path.join(PROJECT_DIR, 'ext_reversed.mp4');
  const revSource = path.join(PROJECT_DIR, 'source_reversed.mp4');
  
  console.log('Reversing extension...');
  await runFFmpeg([
    '-i', extension,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    revExt
  ]);
  
  console.log('Reversing source...');
  await runFFmpeg([
    '-i', source,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    revSource
  ]);
  
  console.log('Concatenating loop...');
  const concatList = [source, extension, revExt, revSource]
    .map(p => `file '${path.resolve(p)}'`)
    .join('\n');
  
  const listFile = path.join(PROJECT_DIR, '.concat.txt');
  await fs.writeFile(listFile, concatList);
  
  await runFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    output
  ]);
  
  await fs.unlink(listFile);
}

async function main() {
  console.log('🔄 Creating True Seamless Loop\n');
  
  if (!process.env.NANOGPT_API_KEY) {
    console.error('Set NANOGPT_API_KEY');
    process.exit(1);
  }
  
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  
  // Check for existing extension
  const extPath = path.join(PROJECT_DIR, 'extension.mp4');
  
  try {
    await fs.access(extPath);
    console.log('Using existing extension');
  } catch {
    console.log('Generating new extension...');
    console.log(`Prompt: ${PROMPT.slice(0, 70)}...\n`);
    
    const sourceDataUrl = await fileToDataUrl(SOURCE_VIDEO);
    const job = await submitExtension({
      videoDataUrl: sourceDataUrl,
      prompt: PROMPT,
      seed: 42,
    });
    
    const jobId = job.id || job.requestId;
    console.log(`Job: ${jobId}`);
    console.log('Waiting (30-120s)...');
    
    let result: any;
    while (true) {
      result = await checkStatus(jobId);
      const status = result.data?.status || result.status;
      
      if (status === 'COMPLETED' || status === 'completed') {
        const videoUrl = result.data?.output?.video?.url || result.videoUrl;
        console.log('\n✅ Complete! Downloading...');
        await downloadVideo(videoUrl, extPath);
        
        await fs.writeFile(
          path.join(PROJECT_DIR, 'url.txt'),
          `${videoUrl}\nPrompt: ${PROMPT}\nSeed: 42`
        );
        break;
      }
      
      if (status === 'FAILED' || status === 'failed') {
        console.error('\nFailed:', result);
        process.exit(1);
      }
      
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  // Create loop
  console.log('\n🎬 Creating loop variants...\n');
  
  // Option 1: Simple ping-pong
  const pingpongOutput = path.join(PROJECT_DIR, 'loop-pingpong.mp4');
  console.log('1. Creating ping-pong loop...');
  await createSimplePingPong(SOURCE_VIDEO, extPath, pingpongOutput);
  
  const dur1 = await getDuration(pingpongOutput);
  console.log(`   ✅ Ping-pong: ${pingpongOutput} (${dur1.toFixed(1)}s)`);
  
  // Copy to home
  await fs.copyFile(pingpongOutput, '/Users/aaronalston/dna-flesh-loop-pingpong.mp4');
  
  console.log('\n📁 Files:');
  console.log(`   Project: ${PROJECT_DIR}`);
  console.log(`   Loop: ~/dna-flesh-loop-pingpong.mp4`);
  
  console.log('\n💡 If this still has issues, the problem is that Veo 3.1');
  console.log('   extensions don\'t naturally match the source style perfectly.');
  console.log('   Try filming a source video that already loops on its own,');
  console.log('   then use Veo just to extend the duration.');
}

main().catch(console.error);
