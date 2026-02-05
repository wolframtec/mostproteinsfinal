#!/usr/bin/env tsx
/**
 * DNA → Flesh Infinite Loop Creator
 * Tailored for: DNA_Sequence_to_Realistic_Flesh_Video.mp4
 * 
 * This script creates a seamless infinite loop from your DNA transformation video.
 * The Veo 3.1 extension will continue from the FINAL FRAME (the realistic flesh)
 * and generate the next phase of the transformation.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video.mp4';
const PROJECT_DIR = './dna-flesh-loop-project';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q: string): Promise<string> {
  return new Promise(r => rl.question(q, r));
}

// Prompts specifically designed for DNA→Flesh transformation
const PROMPT_TEMPLATES = {
  cycle: [
    "Continue the biological transformation seamlessly from the final frame. The realistic flesh tissue continues to pulse and flow with microscopic DNA helix patterns visible beneath the surface. Seamless organic motion.",
    "Extend the morphing sequence from the flesh state. The tissue gradually reveals spiral genetic patterns within its structure, transitioning back toward the DNA helix form. Maintain biological realism.",
    "Continue from the realistic flesh - the organic tissue flows like living matter with subtle spiral DNA structures emerging from within, creating a perpetual transformation cycle.",
    "The flesh continues its living metamorphosis. Microscopic DNA sequences spiral within the tissue, surfacing and subsiding in an endless biological rhythm. Seamless, organic flow."
  ],
  
  organic_flow: [
    "Continue the organic flesh motion from the final frame. The living tissue pulses with biological rhythm, maintaining the same lighting and texture. Subtle DNA helix shadows dance within the flesh.",
    "Extend the realistic flesh sequence. The tissue moves with living fluidity, veins and cellular structures visible. The motion continues naturally as if the transformation never ends."
  ],
  
  spiral_dna: [
    "Continue from the flesh state - spiral DNA patterns emerge organically from the tissue, weaving through the flesh like genetic code surfacing. Maintain photorealistic biological detail.",
    "The transformation continues: DNA helix structures spiral outward from the realistic flesh, twisting and rotating in an endless genetic dance. Seamless morphing motion."
  ],
  
  infinite_metamorphosis: [
    "Continue the endless metamorphosis from the realistic flesh. The tissue flows like liquid biology, constantly shifting between cellular flesh and spiraling DNA structures. Perfect seamless loop potential.",
    "Extend the biological cycle - the flesh state dissolves into microscopic genetic spirals, which then reconstitute into tissue. Continuous, seamless transformation without beginning or end."
  ]
};

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function fileToDataUrl(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  const base64 = data.toString('base64');
  return `data:video/mp4;base64,${base64}`;
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
  seed?: number;
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
      resolution: '720p', // Match source
      duration: 8,        // Match source
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

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    ffmpeg.stderr.on('data', d => stderr += d.toString());
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg ${code}: ${stderr.slice(-500)}`));
    });
  });
}

async function createLoop(source: string, segments: string[], output: string) {
  // Ping-pong: forward + reversed
  const reversedDir = path.join(PROJECT_DIR, 'reversed');
  await fs.mkdir(reversedDir, { recursive: true });
  
  const reversedPaths: string[] = [];
  
  // Reverse each segment (in reverse order)
  for (let i = segments.length - 1; i >= 0; i--) {
    const reversed = path.join(reversedDir, `rev_${i+1}.mp4`);
    console.log(`  Reversing segment ${i+1}...`);
    await runFFmpeg([
      '-i', segments[i],
      '-vf', 'reverse',
      '-af', 'areverse',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      reversed
    ]);
    reversedPaths.push(reversed);
  }
  
  // Concatenate all
  const concatList = [source, ...segments, ...reversedPaths]
    .map(p => `file '${path.resolve(p)}'`)
    .join('\n');
  
  const listFile = path.join(PROJECT_DIR, '.concat.txt');
  await fs.writeFile(listFile, concatList);
  
  console.log('  Concatenating final loop...');
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
  console.log('🧬 DNA → Flesh Infinite Loop Creator\n');
  
  if (!process.env.NANOGPT_API_KEY) {
    console.error('❌ Set NANOGPT_API_KEY first');
    process.exit(1);
  }
  
  if (!(await fileExists(SOURCE_VIDEO))) {
    console.error(`❌ Source video not found: ${SOURCE_VIDEO}`);
    process.exit(1);
  }
  
  console.log(`Source: DNA_Sequence_to_Realistic_Flesh_Video.mp4`);
  console.log(`Resolution: 1280x720 | Duration: 8s`);
  console.log(`Project dir: ${PROJECT_DIR}\n`);
  
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  await fs.mkdir(path.join(PROJECT_DIR, 'segments'), { recursive: true });
  
  // Choose prompt style
  console.log('Choose transformation style:');
  console.log('  [1] Cycle (DNA → Flesh → DNA loop)');
  console.log('  [2] Organic Flow (continuous flesh pulsing)');
  console.log('  [3] Spiral DNA (DNA helixes emerging from flesh)');
  console.log('  [4] Infinite Metamorphosis (constant shifting)');
  console.log('  [c] Custom prompt');
  
  const styleChoice = await ask('\nChoice: ');
  
  let prompts: string[];
  if (styleChoice === '1') prompts = PROMPT_TEMPLATES.cycle;
  else if (styleChoice === '2') prompts = PROMPT_TEMPLATES.organic_flow;
  else if (styleChoice === '3') prompts = PROMPT_TEMPLATES.spiral_dna;
  else if (styleChoice === '4') prompts = PROMPT_TEMPLATES.infinite_metamorphosis;
  else {
    const custom = await ask('Enter your custom prompt: ');
    prompts = [custom];
  }
  
  // How many extensions?
  const numExt = parseInt(await ask('\nHow many extensions? (1-4) [2]: ') || '2');
  
  // Upload source once
  console.log('\n📤 Uploading source video...');
  const sourceDataUrl = await fileToDataUrl(SOURCE_VIDEO);
  
  const segmentPaths: string[] = [];
  let lastVideoUrl: string | undefined;
  
  // Generate extensions
  for (let i = 0; i < numExt; i++) {
    const prompt = prompts[i % prompts.length];
    const seed = 42 + i;
    
    console.log(`\n🎬 Extension ${i+1}/${numExt}`);
    console.log(`Prompt: ${prompt.slice(0, 80)}...`);
    
    const job = await submitExtension({
      videoDataUrl: i === 0 ? sourceDataUrl : undefined,
      videoUrl: i > 0 ? lastVideoUrl : undefined,
      prompt,
      seed,
    });
    
    console.log(`Job: ${job.id} | Waiting...`);
    
    // Poll
    let result: any;
    while (true) {
      result = await checkStatus(job.id);
      if (result.status === 'completed' || result.status === 'failed') break;
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
    }
    
    if (result.status !== 'completed' || !result.videoUrl) {
      console.error(`\n❌ Failed: ${result.error}`);
      const retry = await ask('Retry this segment? (y/n): ');
      if (retry.toLowerCase().startsWith('y')) {
        i--; // Retry same index
        continue;
      }
      break;
    }
    
    console.log('\n✅ Complete! Downloading...');
    lastVideoUrl = result.videoUrl;
    
    const segPath = path.join(PROJECT_DIR, 'segments', `ext_${i+1}.mp4`);
    await downloadVideo(result.videoUrl, segPath);
    segmentPaths.push(segPath);
    
    // Preview option
    const preview = await ask('Open to preview? (y/n): ');
    if (preview.toLowerCase().startsWith('y')) {
      const platform = process.platform;
      const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
      spawn(cmd, [segPath], { detached: true, stdio: 'ignore' });
    }
    
    // Save URL log
    const logPath = path.join(PROJECT_DIR, 'urls.txt');
    await fs.appendFile(logPath, `Extension ${i+1}: ${result.videoUrl}\nPrompt: ${prompt}\nSeed: ${seed}\n\n`);
  }
  
  if (segmentPaths.length === 0) {
    console.log('\nNo segments generated. Exiting.');
    rl.close();
    return;
  }
  
  // Assembly
  console.log('\n🎬 Assembly Options:');
  console.log('  [1] Forward only (source → extensions)');
  console.log('  [2] Ping-pong loop (forward + reversed)');
  console.log('  [3] Just save segments, no assembly');
  
  const assembly = await ask('\nChoice: ');
  
  if (assembly === '1') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-forward.mp4');
    console.log('Creating forward sequence...');
    
    const concatList = [SOURCE_VIDEO, ...segmentPaths]
      .map(p => `file '${path.resolve(p)}'`)
      .join('\n');
    const listFile = path.join(PROJECT_DIR, '.concat.txt');
    await fs.writeFile(listFile, concatList);
    
    await runFFmpeg([
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      output
    ]);
    await fs.unlink(listFile);
    
    console.log(`\n✅ Forward sequence: ${output}`);
    
  } else if (assembly === '2') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-infinite-loop.mp4');
    console.log('Creating infinite loop (this may take a minute)...');
    await createLoop(SOURCE_VIDEO, segmentPaths, output);
    console.log(`\n✅ Infinite loop created: ${output}`);
    
  } else {
    console.log('\nSegments saved. You can assemble manually later.');
  }
  
  console.log(`\n📁 All files in: ${PROJECT_DIR}`);
  rl.close();
}

main().catch(console.error);
