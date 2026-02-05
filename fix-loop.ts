#!/usr/bin/env tsx
/**
 * Fix the DNA → Flesh loop with proper seamless transitions
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PROJECT_DIR = './dna-flesh-loop-project';
const SOURCE_VIDEO = '/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video_compressed.mp4';

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    ffmpeg.stderr.on('data', d => stderr += d.toString());
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg ${code}: ${stderr.slice(-200)}`));
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

async function createCrossfadeLoop(
  source: string,
  ext1: string,
  ext2: string,
  output: string,
  fadeDuration: number = 1
) {
  const dur1 = await getDuration(source);
  const dur2 = await getDuration(ext1);
  const dur3 = await getDuration(ext2);
  
  console.log(`Durations: source=${dur1}s, ext1=${dur2}s, ext2=${dur3}s`);
  
  // Create crossfaded sequence: source -> ext1 -> ext2 -> source
  // Using xfade filter for smooth transitions
  
  const filterComplex = [
    // Input 0 (source) and Input 1 (ext1)
    `[0:v]trim=start=0:end=${dur1 - fadeDuration},setpts=PTS-STARTPTS[v0];`,
    `[1:v]trim=start=${fadeDuration}:end=${dur2},setpts=PTS-STARTPTS[v1];`,
    `[2:v]trim=start=${fadeDuration}:end=${dur3},setpts=PTS-STARTPTS[v2];`,
    
    // Crossfade source to ext1
    `[v0][v1]xfade=transition=fade:duration=${fadeDuration}:offset=${dur1 - fadeDuration}[t1];`,
    
    // Crossfade result to ext2
    `[t1][v2]xfade=transition=fade:duration=${fadeDuration}:offset=${dur1 + dur2 - fadeDuration * 2}[outv]`,
  ].join('');
  
  console.log('Creating crossfade loop...');
  await runFFmpeg([
    '-i', source,
    '-i', ext1,
    '-i', ext2,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-movflags', '+faststart',
    output
  ]);
}

async function createSimpleLoop(
  source: string,
  ext1: string,
  ext2: string,
  output: string
) {
  console.log('Creating simple forward loop...');
  
  // Just concatenate forward: source + ext1 + ext2
  const concatList = [source, ext1, ext2]
    .map(p => `file '${path.resolve(p)}'`)
    .join('\n');
  
  const listFile = path.join(PROJECT_DIR, '.concat-simple.txt');
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

async function createPingPongLoop(
  source: string,
  ext1: string,
  ext2: string,
  output: string
) {
  console.log('Creating ping-pong loop...');
  
  const reversedDir = path.join(PROJECT_DIR, 'reversed');
  await fs.mkdir(reversedDir, { recursive: true });
  
  // Reverse ext2
  const rev2 = path.join(reversedDir, 'rev2_fixed.mp4');
  console.log('  Reversing ext2...');
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
  const rev1 = path.join(reversedDir, 'rev1_fixed.mp4');
  console.log('  Reversing ext1...');
  await runFFmpeg([
    '-i', ext1,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    rev1
  ]);
  
  // Reverse source
  const revSource = path.join(reversedDir, 'rev_source.mp4');
  console.log('  Reversing source...');
  await runFFmpeg([
    '-i', source,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    revSource
  ]);
  
  // Concatenate: source + ext1 + ext2 + rev2 + rev1 + revSource
  const concatList = [source, ext1, ext2, rev2, rev1, revSource]
    .map(p => `file '${path.resolve(p)}'`)
    .join('\n');
  
  const listFile = path.join(PROJECT_DIR, '.concat-pingpong.txt');
  await fs.writeFile(listFile, concatList);
  
  console.log('  Concatenating...');
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
  console.log('🔧 Fixing DNA → Flesh Loop\n');
  
  const source = SOURCE_VIDEO;
  const ext1 = path.join(PROJECT_DIR, 'segments', 'ext_1.mp4');
  const ext2 = path.join(PROJECT_DIR, 'segments', 'ext_2.mp4');
  
  // Check files exist
  for (const f of [source, ext1, ext2]) {
    try {
      await fs.access(f);
    } catch {
      console.error(`Missing: ${f}`);
      process.exit(1);
    }
  }
  
  console.log('Options:');
  console.log('  [1] Simple forward (source + ext1 + ext2)');
  console.log('  [2] Ping-pong with all reversals');
  console.log('  [3] Crossfade transitions');
  console.log('  [4] Generate new extensions with better prompts');
  
  // Default to option 2 for better loop
  const choice = '2';
  
  if (choice === '1') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-forward-fixed.mp4');
    await createSimpleLoop(source, ext1, ext2, output);
    console.log(`\n✅ Forward loop: ${output}`);
    
  } else if (choice === '2') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-infinite-loop-fixed.mp4');
    await createPingPongLoop(source, ext1, ext2, output);
    
    const duration = await getDuration(output);
    console.log(`\n✅ Ping-pong loop: ${output}`);
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    
    // Copy to home
    await fs.copyFile(output, '/Users/aaronalston/dna-flesh-infinite-loop-fixed.mp4');
    console.log(`   Copied to: ~/dna-flesh-infinite-loop-fixed.mp4`);
    
  } else if (choice === '3') {
    const output = path.join(PROJECT_DIR, 'dna-flesh-crossfade.mp4');
    await createCrossfadeLoop(source, ext1, ext2, output, 1.5);
    console.log(`\n✅ Crossfade loop: ${output}`);
    
  } else if (choice === '4') {
    console.log('\nTo generate new extensions, run:');
    console.log('  npx tsx dna-flesh-loop-auto.ts --style=2 --extensions=2 --assembly=none');
  }
}

main().catch(console.error);
