const BASE = 'https://api.alquran.cloud/v1';
async function request(path) {
  const response = await fetch(BASE + path);
  if (!response.ok) throw new Error('Tidak dapat mengambil data. Periksa koneksi internet.');
  const json = await response.json();
  if (json.code !== 200) throw new Error(json.status || 'Gagal memuat data.');
  return json.data;
}
export const getSurahs = () => request('/surah');
export const getSurah = n => request('/surah/' + n + '/editions/quran-uthmani,id.indonesian');
export const getJuz = async n => Promise.all([
  request('/juz/' + n + '/quran-uthmani'),
  request('/juz/' + n + '/id.indonesian')
]);

export const getSurahAudio = (n, edition = 'ar.alafasy') => request('/surah/' + n + '/' + edition);

export const getJuzAudio = (n, edition = 'ar.alafasy') => request('/juz/' + n + '/' + edition);

export const searchAyahs = keyword => request('/search/' + encodeURIComponent(keyword) + '/all/id.indonesian');

export const getSurahWordTranslations = async n => {
  const url = 'https://api.quran.com/api/v4/verses/by_chapter/' + n + '?language=id&words=true&word_fields=text_uthmani,translation&translations=33&per_page=300';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Terjemahan per kata belum dapat dimuat.');
  const json = await response.json();
  return Object.fromEntries((json.verses || []).map(v => [v.verse_key, v.words || []]));
};
