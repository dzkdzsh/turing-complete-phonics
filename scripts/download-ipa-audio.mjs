// download-ipa-audio.mjs — 从 serverhiccups/ipa-chart 仓库下载所有 IPA 音素音频
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://raw.githubusercontent.com/serverhiccups/ipa-chart/master/public/sounds/';
const OUT_DIR = path.join('D:', 'Downloads', 'phonics_48');

// English 48 phonemes mapping: IPA symbol → Wikimedia Commons filename
// Files that exist in the repo (monophthongs + consonants)
const ENGLISH_PHONEME_FILES = {
  // Vowels (monophthongs) — 12
  'i_long': 'Close Front Unrounded Vowel.ogg',
  'i_short': 'Near-close Front Unrounded Vowel.ogg',
  'e': 'Close-mid Front Unrounded Vowel.ogg',
  'ae': 'Near-open Front Unrounded Vowel.ogg',
  'er_long': 'Open-mid Central Unrounded Vowel.ogg',
  'schwa': 'Mid Central Vowel.ogg',
  'a_long': 'Open Back Unrounded Vowel.ogg',
  'u_short': 'Open-mid Back Unrounded Vowel.ogg',
  'or_long': 'Open-mid Back Rounded Vowel.ogg',
  'o_short': 'Open Back Rounded Vowel.ogg',
  'u_long': 'Close Back Rounded Vowel.ogg',
  'u_hook': 'Near-close Near-back Rounded Vowel.ogg',

  // Consonants — 24
  'p': 'Voiceless Bilabial Plosive.ogg',
  'b': 'Voiced Bilabial Plosive.ogg',
  't': 'Voiceless Alveolar Plosive.ogg',
  'd': 'Voiced Alveolar Plosive.ogg',
  'k': 'Voiceless Velar Plosive.ogg',
  'g': 'Voiced Velar Plosive.ogg',
  'f': 'Voiceless Labiodental Fricative.ogg',
  'v': 'Voiced Labiodental Fricative.ogg',
  'th1': 'Voiceless Dental Fricative.ogg',
  'th2': 'Voiced Dental Fricative.ogg',
  's': 'Voiceless Alveolar Fricative.ogg',
  'z': 'Voiced Alveolar Fricative.ogg',
  'sh': 'Voiceless Postalveolar Fricative.ogg',
  'zh': 'Voiced Postalveolar Fricative.ogg',
  'h': 'Voiceless Glottal Fricative.ogg',
  'm': 'Voiced Bilabial Nasal.ogg',
  'n': 'Voiced Alveolar Nasal.ogg',
  'ng': 'Voiced Velar Nasal.ogg',
  'l': 'Voiced Alveolar Lateral Approximant.ogg',
  'r': 'Voiced Alveolar Approximant.ogg',
  'w': 'Voiced Labial-velar Fricative.ogg',
  'y': 'Voiced Palatal Approximant.ogg',
  'ch': null,   // affricate — not in repo, use /t/+/ʃ/
  'j_voiced': null, // affricate /dʒ/ — not in repo
  // /tr/ /dr/ /ts/ /dz/ — not individual IPA sounds in this repo
};

async function downloadFile(filename) {
  const url = BASE_URL + encodeURI(filename);
  const outPath = path.join(OUT_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(outPath)) {
    console.log(`  [SKIP] ${filename} (already exists)`);
    return true;
  }

  return new Promise((resolve) => {
    const file = fs.createWriteStream(outPath);
    https.get(url, (res) => {
      if (res.statusCode === 302) {
        // Follow redirect
        https.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`  [OK] ${filename}`);
            resolve(true);
          });
        }).on('error', (err) => {
          console.error(`  [FAIL] ${filename}: ${err.message}`);
          resolve(false);
        });
        return;
      }
      if (res.statusCode !== 200) {
        console.error(`  [FAIL] ${filename}: HTTP ${res.statusCode}`);
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  [OK] ${filename}`);
        resolve(true);
      });
    }).on('error', (err) => {
      console.error(`  [FAIL] ${filename}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`Created: ${OUT_DIR}`);
  }

  const filesToDownload = Object.entries(ENGLISH_PHONEME_FILES)
    .filter(([_, filename]) => filename !== null)
    .map(([key, filename]) => ({ key, filename }));

  console.log(`\nDownloading ${filesToDownload.length} English phoneme audio files...\n`);

  let success = 0;
  let fail = 0;

  // Download sequentially to avoid rate limiting
  for (const { key, filename } of filesToDownload) {
    const ok = await downloadFile(filename);
    if (ok) success++;
    else fail++;
  }

  console.log(`\nDone! Downloaded: ${success}, Failed: ${fail}`);
  console.log(`Files saved to: ${OUT_DIR}`);

  // Print which phonemes don't have direct files (affricates/diphthongs)
  const missing = Object.entries(ENGLISH_PHONEME_FILES)
    .filter(([_, f]) => f === null)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.log(`\nNote: These phonemes have no single-file in the repo (affricates/diphthongs): ${missing.join(', ')}`);
    console.log('You may want to source these from elsewhere or synthesize from component sounds.');
  }
}

main().catch(console.error);
