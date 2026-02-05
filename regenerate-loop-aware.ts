#!/usr/bin/env tsx
/**
 * Generate loop-aware extensions with explicit loop instructions
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video_compressed.mp4';
const PROJECT_DIR = './dna-flesh-loop-project-v2';

// Prompts specifically designed to create loopable content
const LOOP_PROMPTS = [
  "Continue from the realistic flesh final frame. The organic tissue pulses with living rhythm, maintaining identical lighting and texture. This is frame 1 of a seamless loop - the motion must end where it can connect back to the beginning.",
  
  "Extend the flesh sequence with fluid organic motion. The tissue flows like living matter with subtle DNA patterns emerging within. Design this as a transition segment that can loop seamlessly - the final frame should visually rhyme with organic tissue.",
  
  "Continue the biological transformation. The flesh shows microscopic genetic spirals surfacing and subsiding. Create a perfect loop point - the motion should feel infinite, ending in a state that matches the start of the sequence."
];

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
  videoDataUrl?: string;
  videoUrl?: string;
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
      videoUrl: params.videoUrl,
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
      else reject(new Error(`FFmpeg ${code}`));
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

async function createSimpleLoop(segments: string[], output: string) {
  // Crossfade between segments for smoother loop
  const inputs = segments.map((s, i) => ['-i', s]).flat();
  
  // Create filter complex for crossfading
  const filters = segments.map((_, i) => {
    const dur = 8; // target duration
    return `[${i}:v]trim=duration=${dur},fade=t=out:st=${dur-0.5}:d=0.5[v${i}]`;
  }).join(';');
  
  const concat = segments.map((_, i) => `[v${i}]`).join('') + 
    `concat=n=${segments.length}:v=1:a=0[outv]`;
  
  await runFFmpeg([
    ...inputs,
    '-filter_complex', `${filters};${concat}`,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    output
  ]);
}

async function main() {
  console.log('🔄 Generating Loop-Aware Extensions\n');
  
  if (!process.env.NANOGPT_API_KEY) {
    console.error('Set NANOGPT_API_KEY');
    process.exit(1);
  }
  
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  await fs.mkdir(path.join(PROJECT_DIR, 'segments'), { recursive: true });
  
  console.log('Uploading source...');
  const sourceDataUrl = await fileToDataUrl(SOURCE_VIDEO);
  
  const segments: string[] = [];
  let lastVideoUrl: string | undefined;
  
  for (let i = 0; i < 3; i++) {
    const prompt = LOOP_PROMPTS[i];
    const seed = 100 + i;
    
    console.log(`\n🎬 Extension ${i+1}/3`);
    console.log(`Prompt: ${prompt.slice(0, 70)}...`);
    
    const job = await submitExtension({
      videoDataUrl: i === 0 ? sourceDataUrl : undefined,
      videoUrl: i > 0 ? lastVideoUrl : undefined,
      prompt,
      seed,
    });
    
    const jobId = job.id || job.requestId;
    console.log(`Job: ${jobId}`);
    console.log('Waiting...');
    
    let result: any;
    while (true) {
      result = await checkStatus(jobId);
      const status = result.data?.status || result.status;
      
      if (status === 'COMPLETED' || status === 'completed') {
        const videoUrl = result.data?.output?.video?.url || result.videoUrl;
        console.log('✅ Complete!');
        
        const segPath = path.join(PROJECT_DIR, 'segments', `ext_${i+1}.mp4`);
        await downloadVideo(videoUrl, segPath);
        segments.push(segPath);
        
        lastVideoUrl = videoUrl;
        
        // Save info
        await fs.appendFile(
          path.join(PROJECT_DIR, 'info.txt'),
          `Ext ${i+1}: ${videoUrl}\nSeed: ${seed}\nPrompt: ${prompt}\n\n`
        );
        break;
      }
      
      if (status === 'FAILED' || status === 'failed') {
        console.error('Failed:', result);
        break;
      }
      
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  if (segments.length === 0) {
    console.log('No segments generated');
    return;
  }
  
  console.log(`\n✅ Generated ${segments.length} segments`);
  
  // Create simple concatenated version
  console.log('\nCreating concatenated video...');
  const concatOutput = path.join(PROJECT_DIR, 'dna-flesh-concat.mp4');
  
  const concatList = [SOURCE_VIDEO, ...segments]
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
    concatOutput
  ]);
  
  await fs.unlink(listFile);
  
  const duration = await getDuration(concatOutput);
  console.log(`\n✅ Concatenated: ${concatOutput} (${duration.toFixed(1)}s)`);
  
  // Copy to home
  await fs.copyFile(concatOutput, '/Users/aaronalston/dna-flesh-concat.mp4');
  console.log(`Copied to: ~/dna-flesh-concat.mp4`);
  
  console.log('\n⚠️  Note: For a true infinite loop, the content must naturally connect.');
  console.log('Try the concatenated version first. If it flows well, we can create a ping-pong version.');
}

main().catch(console.error);
