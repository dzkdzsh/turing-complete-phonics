// Download standard phoneme audio with proper Unicode handling
import { writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'C:/Users/liuke/Desktop/turing-complete-phonics/public/assets/audio/standard';

// These use actual Unicode characters in filenames on the server
const FILES = {
  // Consonants with special chars
  'dzh.mp3':  'https://yingyuyinbiao.com/wp-content/uploads/2020/09/%CA%A4-j_sound.mp3', // ʤ
  'tsh.mp3':  'https://yingyuyinbiao.com/wp-content/uploads/2020/09/%CA%A7-ch_sound.mp3', // ʧ
  'ng.mp3':   'https://yingyuyinbiao.com/wp-content/uploads/2020/10/%C5%8B.mp3', // ŋ
  'sh.mp3':   'https://yingyuyinbiao.com/wp-content/uploads/2021/10/%CA%83-sh_sound.mp3', // ʃ
  'zh.mp3':   'https://yingyuyinbiao.com/wp-content/uploads/2021/12/%CA%92-zh_sound.mp3', // ʒ
  'voiced_th.mp3':    'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C3%B0-voiced_th.mp3', // ð
  'unvoiced_th.mp3':  'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%CE%B8-unvoiced_th.mp3', // θ
  // Vowels with special chars
  'ae.mp3':         'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C3%A6.mp3', // æ
  'o_short.mp3':    'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%92.mp3', // ɒ
  'o_long.mp3':     'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%94-long.mp3', // ɔ:
  'oi.mp3':         'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%94%C9%AA.mp3', // ɔɪ
  'schwa.mp3':      'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%99.mp3', // ə
  'schwa_long.mp3': 'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%99-long.mp3', // ə:
  'ia.mp3':         'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%AA%C9%99.mp3', // ɪə
  'u_short.mp3':    'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%CA%8A.mp3', // ʊ
  'ua.mp3':         'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%CA%8A%C9%99.mp3', // ʊə
  'u_turn.mp3':     'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%CA%8C.mp3', // ʌ
  'ou.mp3':         'https://yingyuyinbiao.com/wp-content/uploads/2021/01/%C9%99U.mp3', // əʊ
};

let count = 0;
for (const [name, url] of Object.entries(FILES)) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.log(`FAIL ${name}: HTTP ${resp.status}`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    // Check it's actually audio, not HTML
    if (buf[0] === 0x3c) { // '<' = HTML
      console.log(`FAIL ${name}: got HTML, not audio`);
      continue;
    }
    writeFileSync(join(DIR, name), buf);
    console.log(`OK   ${name}: ${buf.length} bytes`);
    count++;
  } catch (e) {
    console.log(`ERR  ${name}: ${e.message}`);
  }
}
console.log(`\nDownloaded ${count}/${Object.keys(FILES).length} files`);
