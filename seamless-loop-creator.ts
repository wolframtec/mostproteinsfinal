#!/usr/bin/env tsx
/**
 * Seamless Video Loop Creator
 * 
 * Creates a perfect infinite loop by crossfading the end of a video
 * back to its beginning. Ideal for videos that already almost loop
 * but need a smooth transition.
 * 
 * Usage:
 *   npx tsx seamless-loop-creator.ts <input-video> [fade-duration-seconds]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    ffmpeg.stderr.on('data', d => {
      stderr += d.toString();
      // Show progress
      const line = d.toString();
      if (line.includes('time=')) {
        const time = line.match(/time=[\d:.]+/)?.[0];
        if (time) process.stdout.write(`\r  ${time} `);
      }
    });
    ffmpeg.on('close', code => {
      process.stdout.write('\n');
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed: ${stderr.slice(-300)}`));
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

async function getVideoInfo(videoPath: string) {
  return new Promise<{width: number, height: number, fps: number, duration: number}>((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate',
      '-show_entries', 'format=duration',
      '-of', 'json',
      videoPath
    ]);
    let output = '';
    ffprobe.stdout.on('data', d => output += d.toString());
    ffprobe.on('close', code => {
      if (code === 0) {
        const data = JSON.parse(output);
        const [num, den] = data.streams[0].r_frame_rate.split('/').map(Number);
        resolve({
          width: data.streams[0].width,
          height: data.streams[0].height,
          fps: num / den,
          duration: parseFloat(data.format.duration)
        });
      } else reject(new Error('ffprobe failed'));
    });
  });
}

async function createSeamlessLoop(
  inputPath: string,
  outputPath: string,
  fadeDuration: number = 1.0
) {
  const info = await getVideoInfo(inputPath);
  console.log(`Input: ${info.width}x${info.height}, ${info.fps}fps, ${info.duration.toFixed(2)}s`);
  console.log(`Fade duration: ${fadeDuration}s\n`);
  
  const duration = info.duration;
  
  if (fadeDuration >= duration / 2) {
    throw new Error(`Fade duration (${fadeDuration}s) must be less than half the video duration (${duration}s)`);
  }
  
  // Strategy:
  // 1. Take the video
  // 2. Extract the beginning (fadeDuration seconds) - this will fade IN at the end
  // 3. Extract the main body (duration - fadeDuration) - this plays normally then fades OUT
  // 4. Crossfade the fade-out tail with the fade-in beginning
  
  const mainDuration = duration - fadeDuration;
  
  console.log('Creating seamless loop...');
  console.log(`  Main section: ${mainDuration.toFixed(2)}s (fades out at end)`);
  console.log(`  Crossfade with beginning: ${fadeDuration}s`);
  
  // Single-pass filter complex:
  // Input 0: The full video
  // [0:v]split[main][start] - split into two streams
  // [main]trim=0:mainDuration, fade=out:st=mainDuration-fadeDuration:d=fadeDuration[mainfade]
  // [start]trim=0:fadeDuration, fade=in:st=0:d=fadeDuration[startfade]  
  // [mainfade][startfade]overlay[output]
  
  const filterComplex = [
    `[0:v]split=2[main][start];`,
    `[main]trim=start=0:end=${mainDuration},setpts=PTS-STARTPTS,fade=t=out:st=${mainDuration - fadeDuration}:d=${fadeDuration}:alpha=1[mainfade];`,
    `[start]trim=start=0:end=${fadeDuration},setpts=PTS-STARTPTS,fade=t=in:st=0:d=${fadeDuration}:alpha=1[startfade];`,
    `[mainfade][startfade]overlay=(W-w)/2:(H-h)/2:format=auto[outv]`
  ].join('');
  
  await runFFmpeg([
    '-i', inputPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  ]);
  
  const outputDuration = await getDuration(outputPath);
  console.log(`\n✅ Created: ${outputPath}`);
  console.log(`   Duration: ${outputDuration.toFixed(2)}s`);
}

async function createMultiLoop(
  inputPath: string,
  outputPath: string,
  fadeDuration: number = 1.0,
  repetitions: number = 3
) {
  // Create a single seamless loop first
  const tempDir = path.join(path.dirname(outputPath), '.temp-loop');
  await fs.mkdir(tempDir, { recursive: true });
  
  const singleLoop = path.join(tempDir, 'single-loop.mp4');
  await createSeamlessLoop(inputPath, singleLoop, fadeDuration);
  
  // Then concatenate it multiple times
  console.log(`\nCreating ${repetitions} repetitions...`);
  
  const concatList = Array(repetitions).fill(`file '${path.resolve(singleLoop)}'`).join('\n');
  const listFile = path.join(tempDir, 'concat.txt');
  await fs.writeFile(listFile, concatList);
  
  await runFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    outputPath
  ]);
  
  // Cleanup
  await fs.unlink(listFile);
  await fs.unlink(singleLoop);
  await fs.rmdir(tempDir);
  
  const duration = await getDuration(outputPath);
  console.log(`\n✅ Multi-loop: ${outputPath}`);
  console.log(`   Duration: ${duration.toFixed(2)}s (${repetitions} loops)`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Seamless Video Loop Creator\n');
    console.log('Usage:');
    console.log('  npx tsx seamless-loop-creator.ts <input-video> [fade-duration] [repetitions]');
    console.log('\nExamples:');
    console.log('  npx tsx seamless-loop-creator.ts video.mp4');
    console.log('  npx tsx seamless-loop-creator.ts video.mp4 1.5');
    console.log('  npx tsx seamless-loop-creator.ts video.mp4 1.0 5');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const fadeDuration = parseFloat(args[1] || '1.0');
  const repetitions = parseInt(args[2] || '1');
  
  // Verify input exists
  try {
    await fs.access(inputPath);
  } catch {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }
  
  console.log('🔄 Seamless Video Loop Creator\n');
  console.log(`Input: ${inputPath}`);
  
  const outputName = `${path.basename(inputPath, path.extname(inputPath))}-seamless-loop.mp4`;
  const outputPath = path.join(path.dirname(inputPath), outputName);
  
  if (repetitions > 1) {
    await createMultiLoop(inputPath, outputPath, fadeDuration, repetitions);
  } else {
    await createSeamlessLoop(inputPath, outputPath, fadeDuration);
  }
  
  // Also copy to home for easy access
  const homeOutput = path.join('/Users/aaronalston', path.basename(outputPath));
  await fs.copyFile(outputPath, homeOutput);
  console.log(`\n📁 Copied to: ${homeOutput}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
