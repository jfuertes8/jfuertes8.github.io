import sharp from 'sharp';
import { rename, unlink } from 'fs/promises';
import path from 'path';

const inputDir = './src/photos/spain';
const images = ['cathedral.jpg', 'town_hall.jpg', 'palomas.jpg'];

for (const image of images) {
  const inputPath = path.join(inputDir, image);
  const tempPath = path.join(inputDir, `temp_${image}`);

  await sharp(inputPath)
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(tempPath);

  await unlink(inputPath);
  await rename(tempPath, inputPath);
  console.log(`${image}: optimized`);
}

console.log('Done!');
