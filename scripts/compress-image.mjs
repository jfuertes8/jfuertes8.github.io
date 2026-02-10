import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || 'src/photos/spain/expo_tower.jpg';

async function compressImage(inputFile) {
  const resolvedPath = path.resolve(inputFile);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  const originalSize = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`Original size: ${originalSize} MB`);

  const ext = path.extname(resolvedPath);
  const basename = path.basename(resolvedPath, ext);
  const dirname = path.dirname(resolvedPath);
  const tempPath = path.join(dirname, `${basename}_compressed${ext}`);

  try {
    const metadata = await sharp(resolvedPath).metadata();
    
    let pipeline = sharp(resolvedPath)
      .withMetadata(); // Preserve EXIF/metadata

    // Determine output format based on original
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      pipeline = pipeline.jpeg({ 
        quality: 85, 
        progressive: true,
        mozjpeg: true 
      });
    } else if (metadata.format === 'png') {
      pipeline = pipeline.png({ 
        quality: 85, 
        progressive: true,
        compressionLevel: 9 
      });
    } else if (metadata.format === 'webp') {
      pipeline = pipeline.webp({ 
        quality: 85,
        effort: 6 
      });
    } else {
      // Default to JPEG for other formats
      pipeline = pipeline.jpeg({ 
        quality: 85, 
        progressive: true 
      });
    }

    // If image is very large, optionally resize (keep max dimension 3000px)
    if (metadata.width > 3000 || metadata.height > 3000) {
      console.log('Large image detected, resizing to max 3000px...');
      pipeline = pipeline.resize(3000, 3000, { 
        fit: 'inside',
        withoutEnlargement: true 
      });
    }

    await pipeline.toFile(tempPath);

    const newStats = fs.statSync(tempPath);
    const newSize = (newStats.size / 1024 / 1024).toFixed(2);
    const reduction = (((stats.size - newStats.size) / stats.size) * 100).toFixed(1);

    console.log(`Compressed size: ${newSize} MB`);
    console.log(`Reduction: ${reduction}%`);

    // Replace original with compressed version
    fs.renameSync(tempPath, resolvedPath);
    console.log(`✓ Image compressed and saved: ${resolvedPath}`);

  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error('Error compressing image:', error.message);
    process.exit(1);
  }
}

compressImage(inputPath);
