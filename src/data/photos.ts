import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import exifReader from 'exif-reader';
import sharp from 'sharp';

export interface Photo {
  src: ImageMetadata;
  country: string;
  orientation: 'horizontal' | 'vertical';
  filename: string;
  key: string;
  title: string;
  subtitle: string;
  mapsUrl: string | null;
}

interface CaptionEntry {
  title?: string;
  subtitle?: string;
}

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/photos/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

function loadCaptions(): Record<string, CaptionEntry> {
  const captionsPath = path.resolve('src/photos/captions.yml');
  try {
    const raw = fs.readFileSync(captionsPath, 'utf-8');
    return (yaml.load(raw) as Record<string, CaptionEntry>) ?? {};
  } catch {
    return {};
  }
}

function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function readGps(filePath: string): Promise<string | null> {
  try {
    const metadata = await sharp(filePath).metadata();
    if (!metadata.exif) return null;

    const exif = exifReader(metadata.exif);
    const lat = exif?.GPSLatitude ?? exif?.gps?.GPSLatitude;
    const lon = exif?.GPSLongitude ?? exif?.gps?.GPSLongitude;
    const latRef = exif?.GPSLatitudeRef ?? exif?.gps?.GPSLatitudeRef;
    const lonRef = exif?.GPSLongitudeRef ?? exif?.gps?.GPSLongitudeRef;

    if (lat == null || lon == null) return null;

    let latVal: number;
    let lonVal: number;

    if (typeof lat === 'number') {
      latVal = lat;
      lonVal = lon as number;
    } else if (Array.isArray(lat)) {
      latVal = lat[0] + lat[1] / 60 + lat[2] / 3600;
      lonVal =
        (lon as number[])[0] +
        (lon as number[])[1] / 60 +
        (lon as number[])[2] / 3600;
    } else {
      return null;
    }

    if (latRef === 'S') latVal = -latVal;
    if (lonRef === 'W') lonVal = -lonVal;

    return `https://www.google.com/maps?q=${latVal.toFixed(6)},${lonVal.toFixed(6)}`;
  } catch {
    return null;
  }
}

let photosCache: Photo[] | null = null;

export async function getPhotos(): Promise<Photo[]> {
  if (photosCache) return photosCache;

  const captions = loadCaptions();

  const photos = await Promise.all(
    Object.entries(imageModules).map(async ([globPath, mod]) => {
      const parts = globPath.split('/');
      const photosIdx = parts.indexOf('photos');
      const country = parts[photosIdx + 1];
      const filename = parts[parts.length - 1];
      const key = `${country}/${filename}`;
      const img = mod.default;
      const orientation: Photo['orientation'] =
        img.width >= img.height ? 'horizontal' : 'vertical';

      const caption = captions[key];
      const title = caption?.title ?? filenameToTitle(filename);
      const subtitle = caption?.subtitle ?? '';

      const diskPath = path.resolve('src/photos', key);
      const mapsUrl = await readGps(diskPath);

      return { src: img, country, orientation, filename, key, title, subtitle, mapsUrl };
    }),
  );

  photosCache = photos;
  return photos;
}

export async function getCountries(): Promise<string[]> {
  const photos = await getPhotos();
  return [...new Set(photos.map((p) => p.country))].sort();
}
