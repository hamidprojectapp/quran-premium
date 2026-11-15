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

export const getSurahAudio = n => request('/surah/' + n + '/ar.alafasy');
