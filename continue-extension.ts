#!/usr/bin/env tsx
/**
 * Continue generating extension 2 and assemble loop
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PROJECT_DIR = './dna-flesh-loop-project';
const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video_compressed.mp4';
const EXT1_VIDEO = 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/0d9fee0792f440aca403ffff7ea7c65c/0.mp4';

const PROMPT = "Extend the realistic flesh sequence. The tissue moves with living fluidity, veins and cellular structures visible. The motion continues naturally as if the transformation never ends.";

async function submitExtension(params: {
  videoUrl: string;
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

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  await fs.writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    ffmpeg.stderr.on('data', d => stderr += d.toString());
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg ${code}`));
    });
  });
}

async function createLoop(source: string, ext1: string, ext2: string, output: string) {
  const reversedDir = path.join(PROJECT_DIR, 'reversed');
  await fs.mkdir(reversedDir, { recursive: true });
  
  // Reverse ext2
  const rev2 = path.join(reversedDir, 'rev_2.mp4');
  console.log('Reversing extension 2...');
  await runFFmpeg([
    '-i', ext2,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    rev2
  ]);
  
  // Reverse ext1
  const rev1 = path.join(reversedDir, 'rev_1.mp4');
  console.log('Reversing extension 1...');
  await runFFmpeg([
    '-i', ext1,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    rev1
  ]);
  
  // Concatenate: source + ext1 + ext2 + rev2 + rev1
  const concatList = [source, ext1, ext2, rev2, rev1]
    .map(p => `file '${path.resolve(p)}'`)
    .join('\n');
  
  const listFile = path.join(PROJECT_DIR, '.concat.txt');
  await fs.writeFile(listFile, concatList);
  
  console.log('Creating final loop...');
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
  if (!process.env.NANOGPT_API_KEY) {
    console.error('Set NANOGPT_API_KEY');
    process.exit(1);
  }
  
  console.log('🎬 Generating Extension 2\n');
  console.log(`Using Extension 1 as source: ${EXT1_VIDEO.slice(0, 60)}...`);
  console.log(`Prompt: ${PROMPT.slice(0, 60)}...`);
  console.log('Seed: 43\n');
  
  // Submit job using videoUrl (not dataUrl)
  const job = await submitExtension({
    videoUrl: EXT1_VIDEO,
    prompt: PROMPT,
    seed: 43,
  });
  
  console.log(`Job: ${job.id || job.requestId}`);
  console.log('Waiting (30-120 seconds)...\n');
  
  const jobId = job.id || job.requestId;
  let result: any;
  
  while (true) {
    result = await checkStatus(jobId);
    const status = result.data?.status || result.status;
    
    if (status === 'COMPLETED' || status === 'completed') {
      const videoUrl = result.data?.output?.video?.url || result.videoUrl;
      console.log('\n✅ Extension 2 complete!');
      console.log('Downloading...');
      
      const ext2Path = path.join(PROJECT_DIR, 'segments', 'ext_2.mp4');
      await downloadVideo(videoUrl, ext2Path);
      console.log(`Saved: ${ext2Path}`);
      
      // Save URL
      await fs.appendFile(
        path.join(PROJECT_DIR, 'urls.txt'),
        `Extension 2: ${videoUrl}\nPrompt: ${PROMPT}\nSeed: 43\n\n`
      );
      
      // Create loop
      console.log('\n🎬 Creating infinite loop...');
      const outputPath = path.join(PROJECT_DIR, 'dna-flesh-infinite-loop.mp4');
      await createLoop(
        SOURCE_VIDEO,
        path.join(PROJECT_DIR, 'segments', 'ext_1.mp4'),
        ext2Path,
        outputPath
      );
      
      console.log(`\n✨ INFINITE LOOP CREATED: ${outputPath}`);
      
      // Get duration
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        outputPath
      ]);
      let duration = '';
      ffprobe.stdout.on('data', d => duration += d.toString());
      await new Promise(r => ffprobe.on('close', r));
      console.log(`Duration: ${parseFloat(duration).toFixed(1)}s`);
      
      break;
    }
    
    if (status === 'FAILED' || status === 'failed') {
      console.error('Generation failed:', result);
      break;
    }
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(console.error);
