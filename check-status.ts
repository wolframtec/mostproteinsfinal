#!/usr/bin/env tsx
/**
 * Check video generation status and download result
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_DIR = './dna-flesh-loop-project';

async function checkStatus(id: string) {
  const res = await fetch(`https://nano-gpt.com/api/video/status?id=${id}`, {
    headers: { 'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}` },
  });
  return res.json();
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  console.log('Downloading...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  await fs.writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
  console.log(`Saved: ${outputPath}`);
}

async function main() {
  const jobId = process.argv[2] || 'vid_mla1k3lja967ue22b';
  
  if (!process.env.NANOGPT_API_KEY) {
    console.error('Set NANOGPT_API_KEY');
    process.exit(1);
  }
  
  console.log(`Checking status: ${jobId}\n`);
  
  const status = await checkStatus(jobId);
  console.log('Status:', status.status);
  
  if (status.status === 'completed' && status.videoUrl) {
    console.log('Video URL:', status.videoUrl);
    
    await fs.mkdir(PROJECT_DIR, { recursive: true });
    await fs.mkdir(path.join(PROJECT_DIR, 'segments'), { recursive: true });
    
    const outputPath = path.join(PROJECT_DIR, 'segments', 'ext_1.mp4');
    await downloadVideo(status.videoUrl, outputPath);
    
    // Save URL
    await fs.writeFile(
      path.join(PROJECT_DIR, 'urls.txt'),
      `Extension 1: ${status.videoUrl}\n`
    );
    
    console.log('\n✅ Extension 1 saved!');
    console.log('Run the generator again to create Extension 2 and assemble the loop.');
    
  } else if (status.status === 'failed') {
    console.error('Generation failed:', status.error);
  } else {
    console.log('Still processing. Check again in 30 seconds.');
  }
}

main().catch(console.error);
