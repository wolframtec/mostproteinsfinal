#!/usr/bin/env tsx
/**
 * DNA → Flesh Infinite Loop Creator (Auto/CLI Version)
 * 
 * Usage:
 *   npx tsx dna-flesh-loop-auto.ts --style=2 --extensions=2 --assembly=pingpong
 * 
 * Options:
 *   --style: 1=cycle, 2=organic, 3=spiral, 4=metamorphosis
 *   --extensions: 1-4 (default: 2)
 *   --assembly: forward, pingpong, or none
 *   --seed: starting seed (default: 42)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video_compressed.mp4';
const PROJECT_DIR = './dna-flesh-loop-project';

const PROMPT_TEMPLATES: Record<string, string[]> = {
  '1': [
    "Continue the biological transformation seamlessly from the final frame. The realistic flesh tissue continues to pulse and flow with microscopic DNA helix patterns visible beneath the surface. Seamless organic motion.",
    "Extend the morphing sequence from the flesh state. The tissue gradually reveals spiral genetic patterns within its structure, transitioning back toward the DNA helix form. Maintain biological realism.",
  ],
  '2': [
    "Continue the organic flesh motion from the final frame. The living tissue pulses with biological rhythm, maintaining the same lighting and texture. Subtle DNA helix shadows dance within the flesh.",
    "Extend the realistic flesh sequence. The tissue moves with living fluidity, veins and cellular structures visible. The motion continues naturally as if the transformation never ends.",
  ],
  '3': [
    "Continue from the flesh state - spiral DNA patterns emerge organically from the tissue, weaving through the flesh like genetic code surfacing. Maintain photorealistic biological detail.",
    "The transformation continues: DNA helix structures spiral outward from the realistic flesh, twisting and rotating in an endless genetic dance. Seamless morphing motion.",
  ],
  '4': [
    "Continue the endless metamorphosis from the realistic flesh. The tissue flows like liquid biology, constantly shifting between cellular flesh and spiraling DNA structures. Perfect seamless loop potential.",
    "Extend the biological cycle - the flesh state dissolves into microscopic genetic spirals, which then reconstitute into tissue. Continuous, seamless transformation without beginning or end.",
  ],
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      parsed[key] = value || 'true';
    }
  }
  
  return {
    style: parsed.style || '2',
    extensions: parseInt(parsed.extensions || '2'),
    assembly: parsed.assembly || 'pingpong',
    seed: parseInt(parsed.seed || '42'),
    prompt: parsed.prompt,
  };
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

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
  const reversedDir = path.join(PROJECT_DIR, 'reversed');
  await fs.mkdir(reversedDir, { recursive: true });
  
  const reversedPaths: string[] = [];
  
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
  const config = parseArgs();
  
  console.log('🧬 DNA → Flesh Infinite Loop Creator (Auto)\n');
  
  if (!process.env.NANOGPT_API_KEY) {
    console.error('❌ Set NANOGPT_API_KEY');
    process.exit(1);
  }
  
  if (!(await fileExists(SOURCE_VIDEO))) {
    console.error(`❌ Source not found: ${SOURCE_VIDEO}`);
    process.exit(1);
  }
  
  console.log(`Source: DNA_Sequence_to_Realistic_Flesh_Video.mp4`);
  console.log(`Style: ${config.style} | Extensions: ${config.extensions} | Assembly: ${config.assembly}`);
  console.log(`Using model: veo3-1-extend\n`);
  
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  await fs.mkdir(path.join(PROJECT_DIR, 'segments'), { recursive: true });
  
  const prompts = config.prompt 
    ? [config.prompt] 
    : (PROMPT_TEMPLATES[config.style] || PROMPT_TEMPLATES['2']);
  
  console.log('📤 Uploading source video...');
  const sourceDataUrl = await fileToDataUrl(SOURCE_VIDEO);
  
  const segmentPaths: string[] = [];
  let lastVideoUrl: string | undefined;
  
  for (let i = 0; i < config.extensions; i++) {
    const prompt = prompts[i % prompts.length];
    const seed = config.seed + i;
    
    console.log(`\n🎬 Extension ${i+1}/${config.extensions}`);
    console.log(`Prompt: ${prompt.slice(0, 60)}...`);
    console.log(`Seed: ${seed}`);
    
    const job = await submitExtension({
      videoDataUrl: i === 0 ? sourceDataUrl : undefined,
      videoUrl: i > 0 ? lastVideoUrl : undefined,
      prompt,
      seed,
    });
    
    console.log(`Job: ${job.id}`);
    console.log('Waiting (this takes 30-120 seconds)...');
    
    let result: any;
    while (true) {
      result = await checkStatus(job.id);
      if (result.status === 'completed' || result.status === 'failed') break;
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
    }
    console.log('');
    
    if (result.status !== 'completed' || !result.videoUrl) {
      console.error(`❌ Failed: ${result.error}`);
      continue;
    }
    
    console.log('✅ Complete! Downloading...');
    lastVideoUrl = result.videoUrl;
    
    const segPath = path.join(PROJECT_DIR, 'segments', `ext_${i+1}.mp4`);
    await downloadVideo(result.videoUrl, segPath);
    segmentPaths.push(segPath);
    
    // Save URL
    const logPath = path.join(PROJECT_DIR, 'urls.txt');
    await fs.appendFile(logPath, `Extension ${i+1}: ${result.videoUrl}\nPrompt: ${prompt}\nSeed: ${seed}\n\n`);
  }
  
  if (segmentPaths.length === 0) {
    console.log('\n❌ No segments generated');
    return;
  }
  
  console.log(`\n✅ Generated ${segmentPaths.length} extensions`);
  
  if (config.assembly === 'pingpong') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-infinite-loop.mp4');
    console.log('\n🎬 Creating ping-pong loop...');
    await createLoop(SOURCE_VIDEO, segmentPaths, output);
    console.log(`\n✨ INFINITE LOOP CREATED: ${output}`);
    
  } else if (config.assembly === 'forward') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-forward.mp4');
    console.log('\n🎬 Creating forward sequence...');
    
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
    
    console.log(`\n✨ FORWARD SEQUENCE: ${output}`);
  }
  
  console.log(`\n📁 All files in: ${PROJECT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
