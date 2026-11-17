import './style.css';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import {dailyDuas} from './data/daily-duas.js';
import {getSurahs,getSurah,getJuz,getJuzAudio,getSurahAudio,searchAyahs,getSurahWordTranslations} from './services/quran-api.js';
const app=document.querySelector('#app');
const S={page:'home',surahs:[],surah:null,detailType:'surah',detailName:'',search:'',searchAyahQuery:'',searchResults:[],searchLoading:false,bookmarks:JSON.parse(localStorage.getItem('quran-bookmarks')||'[]'),last:JSON.parse(localStorage.getItem('quran-last-read')||'null'),loading:false,reciter:localStorage.getItem('quran-reciter')||'ar.alafasy',arabicSize:localStorage.getItem('quran-arabic-size')||'30',translationSize:localStorage.getItem('quran-translation-size')||'13',lineSpacing:localStorage.getItem('quran-line-spacing')||'2.0',theme:localStorage.getItem('quran-theme')||'dark',wordTranslations:{},showWordTranslation:false,quranList:'surah',detailReturnPage:'quran',ibadahTool:null,previousIbadahTool:null};
let tasbih=0;
let audioPlayer=null;
let activeAudioButton=null;
let qiblaListener=null;
let qiblaBearing=0;
let currentHeading=0;
let prayerCountdownTimer=null;
let prayerSchedule=JSON.parse(localStorage.getItem('quran-prayer-schedule')||'null');
let prayerAlarmSyncAt=0;
let prayerLocation=JSON.parse(localStorage.getItem('quran-prayer-location')||'null');
const defaultPrayerSettings=()=>Object.fromEntries(['Subuh','Zuhur','Ashar','Magrib','Isya'].map(n=>[n,{enabled:true,lead:'0',sound:n==='Subuh'?'fajr':'adhan'}]));
let prayerSettings=JSON.parse(localStorage.getItem('quran-prayer-settings')||'null')||defaultPrayerSettings();
function updateQiblaDisplay(){const ring=document.querySelector('#qibla-ring');const needle=document.querySelector('#qibla-needle');if(ring)ring.style.transform='rotate('+(-currentHeading)+'deg)';if(needle)needle.style.transform='translate(-50%,-50%) rotate('+((qiblaBearing-currentHeading+360)%360)+'deg)';}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SURAH_MEANINGS={
1:'Pembukaan',2:'Sapi Betina',3:'Keluarga Imran',4:'Wanita',5:'Hidangan',6:'Binatang Ternak',7:'Tempat Tertinggi',8:'Rampasan Perang',9:'Pengampunan',10:'Nabi Yunus',11:'Nabi Hud',12:'Nabi Yusuf',13:'Guruh',14:'Nabi Ibrahim',15:'Al-Hijr',16:'Lebah',17:'Perjalanan Malam',18:'Gua',19:'Maryam',20:'Taha',21:'Para Nabi',22:'Haji',23:'Orang-orang Mukmin',24:'Cahaya',25:'Pembeda',26:'Para Penyair',27:'Semut',28:'Kisah-Kisah',29:'Laba-laba',30:'Bangsa Romawi',31:'Luqman',32:'Sujud',33:'Golongan yang Bersekutu',34:'Kaum Saba’',35:'Pencipta',36:'Yasin',37:'Yang Bersaf-saf',38:'Sad',39:'Rombongan',40:'Yang Maha Pengampun',41:'Yang Dijelaskan',42:'Musyawarah',43:'Perhiasan',44:'Kabut',45:'Yang Berlutut',46:'Bukit Pasir',47:'Nabi Muhammad',48:'Kemenangan',49:'Kamar-Kamar',50:'Qaf',51:'Angin yang Menerbangkan',52:'Bukit',53:'Bintang',54:'Bulan',55:'Maha Pengasih',56:'Hari Kiamat',57:'Besi',58:'Wanita yang Mengajukan Gugatan',59:'Pengusiran',60:'Wanita yang Diuji',61:'Barisan',62:'Hari Jumat',63:'Orang-orang Munafik',64:'Hari Dinampakkan Kesalahan',65:'Talak',66:'Pengharaman',67:'Kerajaan',68:'Pena',69:'Hari yang Pasti Terjadi',70:'Tempat-Tempat Naik',71:'Nabi Nuh',72:'Jin',73:'Orang yang Berselimut',74:'Orang yang Berkemul',75:'Hari Kiamat',76:'Manusia',77:'Malaikat yang Diutus',78:'Berita Besar',79:'Malaikat yang Mencabut Nyawa',80:'Bermuka Masam',81:'Penggulungan',82:'Terbelah',83:'Orang-orang Curang',84:'Terbelah',85:'Gugusan Bintang',86:'Yang Datang pada Malam Hari',87:'Yang Maha Tinggi',88:'Hari Pembalasan',89:'Fajar',90:'Negeri',91:'Matahari',92:'Malam',93:'Waktu Duha',94:'Kelapangan',95:'Buah Tin',96:'Segumpal Darah',97:'Kemuliaan',98:'Bukti Nyata',99:'Guncangan',100:'Kuda Perang yang Berlari Kencang',101:'Hari Kiamat',102:'Bermegah-megahan',103:'Masa',104:'Pengumpat',105:'Gajah',106:'Suku Quraisy',107:'Barang-barang Berguna',108:'Nikmat yang Banyak',109:'Orang-orang Kafir',110:'Pertolongan',111:'Gejolak Api',112:'Ikhlas',113:'Waktu Subuh',114:'Manusia'
};
const save=()=>localStorage.setItem('quran-bookmarks',JSON.stringify(S.bookmarks));
const nav=(p,t,i)=>'<button class="nav-item '+(S.page===p?'active':'')+'" data-page="'+p+'"><span>'+i+'</span>'+t+'</button>';
function render(){
 app.innerHTML='<div class="shell"><header><div class="logo">۞</div><div><b>Quran <em>Premium</em></b><small>Teman dekat dalam setiap ayat</small></div><span class="profile">A</span></header><main>'+content()+'</main><nav>'+nav('home','Beranda','⌂')+nav('quran','Al-Qur’an','۞')+nav('bookmark','Tersimpan','♡')+nav('ibadah','Ibadah','☾')+nav('settings','Lainnya','⚙')+'</nav></div>';
}
function content(){
 if(S.page==='home')return home();
 if(S.page==='quran')return quran();
 if(S.page==='detail')return detail();
 if(S.page==='bookmark')return bookmarks();
 if(S.page==='ibadah')return ibadah();
 const reciters=[['ar.alafasy','Mishary Rashid Alafasy'],['ar.abdurrahmaansudais','Abdurrahman As-Sudais'],['ar.husary','Mahmoud Khalil Al-Husary'],['ar.husarymujawwad','Mahmoud Khalil Al-Husary (Mujawwad)'],['ar.minshawi','Muhammad Siddiq Al-Minshawi'],['ar.muhammadayyoub','Muhammad Ayyub'],['ar.muhammadjibreel','Muhammad Jibreel'],['ar.mahermuaiqly','Maher Al-Muaiqly'],['ar.shaatree','Abu Bakr Ash-Shaatree']];
 const arabicOptions=[['26','Kecil'],['30','Sedang'],['34','Besar'],['38','Sangat besar']];
 const translationOptions=[['12','Kecil'],['13','Sedang'],['15','Besar'],['17','Sangat besar']];
 const spacingOptions=[['1.6','Rapat'],['2.0','Normal'],['2.4','Renggang'],['2.8','Sangat renggang']];
 const selected=(items,value)=>items.find(x=>x[0]===value)?.[1]||items[0][1];
 return '<div class="heading"><label>PREFERENSI</label><h1>Pengaturan</h1><p>Quran Premium versi 1.0.0 · Developer Abdul Hamid</p></div><div class="panel"><b>Qari murottal</b><p>Pilih suara pelantun Al-Qur’an untuk pemutaran ayat.</p><button class="native-setting-button" data-native-picker="reciter"><span>'+esc(reciters.find(r=>r[0]===S.reciter)?.[1]||reciters[0][1])+'</span><span>›</span></button><small>Pilihan digunakan untuk audio ayat pada surah maupun juz.</small></div><div class="panel reading-settings"><b>Mode baca nyaman</b><p>Atur tampilan ayat sesuai kenyamanan membaca.</p><label>Ukuran tulisan Arab</label><button class="native-setting-button" data-native-picker="arabic"><span>'+selected(arabicOptions,S.arabicSize)+'</span><span>›</span></button><label>Ukuran terjemahan</label><button class="native-setting-button" data-native-picker="translation"><span>'+selected(translationOptions,S.translationSize)+'</span><span>›</span></button><label>Jarak antarbaris</label><button class="native-setting-button" data-native-picker="spacing"><span>'+selected(spacingOptions,S.lineSpacing)+'</span><span>›</span></button><small>Pengaturan tersimpan otomatis dan diterapkan saat membaca ayat.</small></div><div class="panel theme-settings"><b>Tema aplikasi</b><p>Pilih tampilan yang paling nyaman untuk membaca Al-Qur’an.</p><div class="theme-options"><button class="theme-choice '+(S.theme==='dark'?'selected':'')+'" data-theme-choice="dark">🌙 Gelap</button><button class="theme-choice '+(S.theme==='light'?'selected':'')+'" data-theme-choice="light">☀️ Terang</button><button class="theme-choice '+(S.theme==='system'?'selected':'')+'" data-theme-choice="system">⚙️ Sistem</button></div><small>Tema tersimpan otomatis dan pilihan Sistem mengikuti pengaturan tampilan Android.</small></div><div class="panel"><b>Data Al-Qur’an</b><p>Diambil secara online dari AlQuran Cloud API.</p></div><div class="panel about-developer"><label>TENTANG APLIKASI</label><h2>Quran Premium</h2><p>Dibuat dengan sepenuh hati untuk menemani perjalanan membaca Al-Qur’an.</p><div class="credit-row"><span>Developer</span><b>Abdul Hamid</b></div><div class="credit-row"><span>UI/UX Design</span><b>Abdul Hamid</b></div><div class="credit-row"><span>Project Owner</span><b>Abdul Hamid</b></div><div class="credit-row"><span>Versi Aplikasi</span><b>1.0.0</b></div><a class="github-project-link" href="https://github.com/hamidprojectapp/quran-premium" target="_blank" rel="noopener noreferrer"><span>GitHub Project</span><b>hamidprojectapp/quran-premium ↗</b></a><small class="app-credit-footer">© 2026 Abdul Hamid · Quran Premium</small></div>';
}
function home(){
 const last=S.last?'<button class="continue" data-open="'+S.last.number+'" data-ayah="'+(S.last.ayah||1)+'"><span>۞</span><div><b>'+esc(S.last.name)+'</b><small>Lanjutkan membaca · Ayat '+S.last.ayah+'</small></div>›</button>':'<button class="continue" data-page="quran"><span>۞</span><div><b>Mulai membaca</b><small>Pilih surah untuk memulai</small></div>›</button>';
 return '<section class="hero"><label>ASSALAMUALAIKUM</label><h1>Temukan ketenangan<br>di setiap <i>ayat-Nya.</i></h1><p>Luangkan waktu sejenak untuk membaca Al-Qur’an hari ini.</p><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></section><section class="panel verse"><label>AYAT PILIHAN</label><div class="arabic">فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</div><p>“Maka sesungguhnya bersama kesulitan ada kemudahan.”</p><small>QS. Al-Insyirah: 5</small></section><div class="heading"><label>LANJUTKAN PERJALANAN</label><h2>Terakhir dibaca</h2></div>'+last+'<div class="heading"><label>JELAJAHI</label><h2>Menu utama</h2></div><div class="tiles"><button data-page="quran"><b>۞</b>Mushaf<small>114 Surah</small></button><button data-page="bookmark"><b>♡</b>Bookmark<small>Ayat tersimpan</small></button><button data-page="ibadah"><b>☾</b>Ruang ibadah<small>Teman harian</small></button><button data-page="ibadah" data-tool="tasbih"><b>◉</b>Tasbih<small>Dzikir harian</small></button></div>';
}
function juzListMarkup(){return Array.from({length:30},(_,i)=>'<button class="surah" data-juz="'+(i+1)+'"><span class="number">'+(i+1)+'</span><span><b>Juz '+(i+1)+'</b><small>Buka bagian juz '+(i+1)+'</small></span><strong>جزء</strong></button>').join('');}
function quran(){
 const list=S.surahs.filter(x=>(x.name+' '+x.englishName+' '+x.number).toLowerCase().includes(S.search.toLowerCase()));
 const juzMode=S.quranList==='juz';
 return '<div class="heading"><label>MUSHAF DIGITAL</label><h1>Al-Qur’an</h1><p>Jelajahi 114 surah dan 30 juz.</p></div><div class="search">⌕ <input id="search" placeholder="Cari nama surah..." value="'+esc(S.search)+'"></div><div class="panel ayah-search-panel"><b>Cari ayat dalam terjemahan</b><p>Masukkan kata atau kalimat bahasa Indonesia.</p><div class="ayah-search-row"><input id="ayah-search" placeholder="Contoh: sesungguhnya Allah..." value="'+esc(S.searchAyahQuery)+'"><button data-search-ayah>⌕ Cari</button></div></div><div id="ayah-search-results">'+(S.searchLoading?'<p class="empty">Mencari ayat...</p>':S.searchResults.length?S.searchResults.map(searchResultCard).join(''):'')+'</div><div class="switch"><button class="'+(!juzMode?'selected':'')+'" data-list="surah">Daftar Surah</button><button class="'+(juzMode?'selected':'')+'" data-list="juz">Daftar Juz</button></div><div id="list">'+(S.loading?'<p class="empty">Memuat daftar surah...</p>':(juzMode?juzListMarkup():(list.map(card).join('')||'<p class="empty">Surah tidak ditemukan.</p>')))+'</div>';
}
function searchResultCard(m){return '<button class="search-result" data-open="'+m.surah.number+'" data-ayah="'+m.numberInSurah+'"><span><b>'+esc(m.surah.name)+' · Ayat '+m.numberInSurah+'</b><small>'+esc(m.text)+'</small></span>›</button>';}
function card(s){const makki=s.revelationType==='Meccan';const category=makki?'Makkiyah':'Madaniyah';const place=makki?'Makkah':'Madinah';const meaning=SURAH_MEANINGS[s.number]||s.englishNameTranslation||s.englishName;return '<button class="surah" data-open="'+s.number+'"><span class="number">'+s.number+'</span><span><b>'+esc(s.name)+'</b><small>'+esc(s.englishName)+' · '+category+' · Turun di '+place+' · '+s.numberOfAyahs+' ayat</small><small class="surah-meaning">Arti nama: '+esc(meaning)+'</small></span><strong>'+esc(s.name)+'</strong></button>';}
function detail(){
 if(!S.surah)return '<p class="empty">Memuat ayat...</p>';
 const a=S.surah[0],t=S.surah[1],audio=S.surah[2];
 const isJuz=S.detailType==='juz';
 return '<button class="back" data-detail-back>‹ Kembali ke daftar</button><section class="surah-hero"><label>'+(isJuz?'AL-QUR’AN · JUZ':'SURAH '+a.number)+'</label><h1>'+esc(S.detailName||a.name)+'</h1><p>'+a.numberOfAyahs+' Ayat</p></section>'+(isJuz?'':'<div class="word-toggle-row"><span>Terjemahan per kata</span><button class="read-mark" data-toggle-words>'+(S.showWordTranslation?'Sembunyikan arti':'Tampilkan arti')+'</button></div>')+'<div class="arabic bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>'+a.ayahs.map((v,i)=>{const surahNumber=v.surah?.number||a.number;const surahName=v.surah?.name||a.name;const saved=S.bookmarks.some(b=>b.surah===surahNumber&&b.ayah===v.numberInSurah);const surahTag=isJuz&&i>0&&a.ayahs[i-1].surah?.number!==surahNumber?'<small class="ayah-surah">'+esc(surahName)+'</small>':'';return '<article class="ayah" id="ayah-'+surahNumber+'-'+v.numberInSurah+'">'+surahTag+'<div class="ayah-top"><span class="number">'+v.numberInSurah+'</span><div class="ayah-actions">'+(audio?.ayahs?.[i]?.audio?'<button class="audio-play" data-audio="'+esc(audio.ayahs[i].audio)+'">▶ Dengarkan</button>':'')+'<button class="read-mark" data-progress="'+surahNumber+':'+v.numberInSurah+'" data-name="'+esc(surahName)+'">Tandai dibaca</button><button class="heart '+(saved?'saved':'')+'" data-save="'+surahNumber+':'+v.numberInSurah+'" data-name="'+esc(surahName)+'" data-ar="'+esc(v.text)+'" data-tr="'+esc(t.ayahs[i]?.text||'')+'">'+(saved?'♥':'♡')+'</button></div></div><div class="arabic">'+(S.showWordTranslation&&!isJuz?wordTranslationMarkup(surahNumber,v.numberInSurah,v.text):v.text)+'</div><p>'+esc(t.ayahs[i]?.text||'')+'</p></article>';}).join('');
}
function renderDuaList(query=''){
 const filtered=dailyDuas.filter(d=>(d.title+' '+d.meaning+' '+d.source).toLowerCase().includes(query.toLowerCase()));
 return '<div class="dua-search"><input id="dua-search" placeholder="Cari doa harian..." value="'+esc(query)+'"></div><div class="dua-count">'+filtered.length+' dari '+dailyDuas.length+' doa</div><div class="dua-list">'+(filtered.map((d,i)=>'<article class="dua-card"><div class="dua-card-top"><span class="number">'+(dailyDuas.indexOf(d)+1)+'</span><b>'+esc(d.title)+'</b></div><div class="arabic dua-arabic">'+d.arabic+'</div><p class="dua-latin">'+esc(d.latin)+'</p><p class="dua-meaning">'+esc(d.meaning)+'</p><small class="dua-source">Sumber: '+esc(d.source)+'</small></article>').join('')||'<p class="empty">Doa tidak ditemukan.</p>')+'</div>';
}
function prayerMarkup(){
 const saved=prayerLocation?'<small class="prayer-location">Lokasi terakhir: '+esc(prayerLocation.label||'Lokasi tersimpan')+'</small>':'';
 return '<div class="panel tool prayer-tool"><label>WAKTU IBADAH</label><h2>Jadwal Sholat</h2><p>Jadwal harian berdasarkan lokasi perangkat, metode Kemenag RI, dan Ashar Syafi’i.</p><div class="prayer-date" id="prayer-date">Memuat tanggal…</div><div class="prayer-next"><small>WAKTU SHOLAT BERIKUTNYA</small><b id="prayer-next-name">—</b><strong id="prayer-countdown">--:--:--</strong></div><div class="prayer-grid prayer-times" id="prayer-times"><div class="prayer-empty">Tekan tombol untuk mengambil jadwal sholat.</div></div><button class="gold-button" id="locate">⌖ Gunakan lokasi GPS</button>'+saved+'<button class="prayer-settings-entry" data-tool="prayer-settings"><span class="prayer-settings-icon">♢</span><span><b>Pengingat Sholat</b><small>Atur notifikasi, waktu pengingat, dan suara adzan</small></span><strong>Atur ›</strong></button><div id="result" class="prayer-result"></div></div>';
}
function prayerSettingsMarkup(){
 return '<div class="panel tool prayer-settings-page"><label>PREFERENSI PENGINGAT</label><h2>Pengingat Sholat</h2><p>Atur pengingat secara terpisah untuk setiap waktu sholat.</p><div class="reminder-test-actions"><button class="gold-button" data-prayer-test="adhan">Tes Adzan Lengkap</button><button class="reset" data-prayer-test="fajr">Tes Adzan Subuh</button><button class="reset" data-prayer-stop>Hentikan Suara</button></div>'+['Subuh','Zuhur','Ashar','Magrib','Isya'].map(n=>{const v=prayerSettings[n]||{enabled:true,lead:'0',sound:n==='Subuh'?'fajr':'adhan'};return '<div class="reminder-row"><div class="reminder-top"><b>'+n+'</b><label class="reminder-switch"><input type="checkbox" data-prayer-enabled="'+n+'" '+(v.enabled?'checked':'')+'><span></span></label></div><div class="reminder-controls"><div class="reminder-picker-field"><label>Waktu pengingat</label><button class="native-setting-button prayer-native-picker" data-prayer-picker="lead" data-prayer-name="'+n+'"><span class="picker-value">'+({0:'Tepat waktu sholat',5:'5 menit sebelumnya',10:'10 menit sebelumnya',15:'15 menit sebelumnya',30:'30 menit sebelumnya'}[v.lead]||'Tepat waktu sholat')+'</span><span>›</span></button></div><div class="reminder-picker-field"><label>Suara adzan</label><button class="native-setting-button prayer-native-picker" data-prayer-picker="sound" data-prayer-name="'+n+'"><span class="picker-value">'+({adhan:'Adzan lengkap',fajr:'Adzan Subuh',short:'Notifikasi pendek',silent:'Senyap'}[v.sound]||'Adzan lengkap')+'</span><span>›</span></button></div></div></div>';}).join('')+'<button class="reset" data-prayer-exact-settings="true">Aktifkan izin Alarm &amp; pengingat</button><small class="reminder-footnote">Pengingat Android dijadwalkan setelah izin notifikasi dan alarm diberikan. Pemutaran adzan memerlukan berkas audio res/raw/adhan.mp3 dan adhan_fajr.mp3. Notifikasi pendek dan senyap tidak memerlukan berkas audio.</small></div>';
}
function renderPrayerSchedule(){
 const out=document.querySelector('#prayer-times');if(!out||!prayerSchedule)return;
 const t=prayerSchedule.timings;
 const items=[['Subuh',t.Fajr],['Zuhur',t.Dhuhr],['Ashar',t.Asr],['Magrib',t.Maghrib],['Isya',t.Isha]];
 out.innerHTML=items.map(x=>'<div><small>'+x[0]+'</small><b>'+esc(String(x[1]).slice(0,5))+'</b></div>').join('');
 const date=document.querySelector('#prayer-date');if(date)date.textContent=(prayerSchedule.date?.hijri?.weekday?.ar||'')+' · '+(prayerSchedule.date?.readable||'')+' · '+(prayerSchedule.date?.hijri?.date||'')+' H';
 updatePrayerCountdown();
 syncPrayerReminders();
 if(prayerCountdownTimer)clearInterval(prayerCountdownTimer);
 prayerCountdownTimer=setInterval(updatePrayerCountdown,1000);
}
async function syncPrayerReminders({force=false}={}){
 const plugin=window.Capacitor?.Plugins?.PrayerReminder;
 const location=prayerLocation||JSON.parse(localStorage.getItem('quran-prayer-location')||'null');
 if(!plugin||!location?.latitude||!location?.longitude)return;
 const last=Number(localStorage.getItem('quran-prayer-alarms-synced-at')||0);
 if(!force&&Date.now()-last<12*60*60*1000)return;
 const map={Subuh:'Fajr',Zuhur:'Dhuhr',Ashar:'Asr',Magrib:'Maghrib',Isya:'Isha'};
 const events=[];
 const now=new Date();
 try{
  for(let offset=0;offset<3;offset++){
   const monthDate=new Date(now.getFullYear(),now.getMonth()+offset,1);
   const year=monthDate.getFullYear(),month=monthDate.getMonth()+1;
   const url='https://api.aladhan.com/v1/calendar/'+year+'/'+month+'?latitude='+location.latitude+'&longitude='+location.longitude+'&method=20&school=0';
   const response=await fetch(url);
   if(!response.ok)throw Error('Kalender waktu sholat tidak dapat diunduh.');
   const json=await response.json();
   if(json.code!==200||!Array.isArray(json.data))throw Error('Kalender waktu sholat tidak tersedia.');
   for(const day of json.data){
    const dateParts=String(day.date?.gregorian?.date||'').split('-');
    if(dateParts.length!==3)continue;
    const [dd,mm,yyyy]=dateParts;
    for(const [name,key] of Object.entries(map)){
     const setting=prayerSettings[name]||{enabled:true,lead:'0',sound:name==='Subuh'?'fajr':'adhan'};
     if(!setting.enabled)continue;
     const timeParts=String(day.timings?.[key]||'').match(/^(\d{1,2}):(\d{2})/);
     if(!timeParts)continue;
     const alarmDate=new Date(Number(yyyy),Number(mm)-1,Number(dd),Number(timeParts[1]),Number(timeParts[2]),0,0);
     alarmDate.setMinutes(alarmDate.getMinutes()-Number(setting.lead||0));
     if(alarmDate.getTime()<=Date.now())continue;
     const dateKey=yyyy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0');
     events.push({id:dateKey+'-'+name,name,at:alarmDate.getTime(),sound:setting.sound||'short',enabled:true});
    }
   }
  }
  const result=await plugin.schedule({events});
  localStorage.setItem('quran-prayer-alarms-synced-at',String(Date.now()));
  prayerAlarmSyncAt=Date.now();
  const note=document.querySelector('.reminder-footnote');
  if(note)note.textContent=result.exactAlarmAllowed?'Alarm sholat untuk sekitar 3 bulan ke depan sudah dijadwalkan di Android.':'Alarm tersimpan, tetapi izin Alarm & pengingat tepat waktu perlu diaktifkan di pengaturan Android.';
 }catch(error){
  console.warn('Pengingat sholat belum dapat dijadwalkan:',error);
  const note=document.querySelector('.reminder-footnote');
  if(note)note.textContent='Jadwal alarm belum berhasil diperbarui. Periksa koneksi internet dan izin alarm Android.';
 }
}
function updatePrayerCountdown(){
 if(!prayerSchedule)return;
 const t=prayerSchedule.timings,now=new Date(),names=[['Subuh',t.Fajr],['Zuhur',t.Dhuhr],['Ashar',t.Asr],['Magrib',t.Maghrib],['Isya',t.Isha]];
 let next=null,nextDate=null;
 for(const item of names){const parts=String(item[1]).split(':');const d=new Date();d.setHours(Number(parts[0]),Number(parts[1]),0,0);if(d>now){next=item[0];nextDate=d;break;}}
 if(!next){const parts=String(t.Fajr).split(':');next='Subuh';nextDate=new Date();nextDate.setDate(nextDate.getDate()+1);nextDate.setHours(Number(parts[0]),Number(parts[1]),0,0);}
 const diff=Math.max(0,Math.floor((nextDate-now)/1000)),h=String(Math.floor(diff/3600)).padStart(2,'0'),m=String(Math.floor(diff%3600/60)).padStart(2,'0'),sec=String(diff%60).padStart(2,'0');
 const n=document.querySelector('#prayer-next-name'),c=document.querySelector('#prayer-countdown');if(n)n.textContent=next;if(c)c.textContent=h+':'+m+':'+sec;
}
function wordTranslationMarkup(surahNumber,ayahNumber,fallback){
 const words=S.wordTranslations[surahNumber+':'+ayahNumber];
 if(!words?.length)return fallback;
 return '<div class="word-by-word">'+words.filter(w=>w.char_type_name==='word').map(w=>'<span class="word-item"><span class="word-arabic">'+esc(w.text_uthmani||'')+'</span><small>'+esc(w.translation?.text||'')+'</small></span>').join('')+'</div>';
}
function bookmarks(){
 return '<div class="heading"><label>KOLEKSI PRIBADI</label><h1>Ayat tersimpan</h1><p>Ayat pilihan yang ingin dibaca kembali.</p></div>'+(S.bookmarks.length?S.bookmarks.map(b=>'<button class="saved" data-open="'+b.surah+'" data-ayah="'+b.ayah+'"><b>♥</b><span><strong>'+esc(b.name)+' · Ayat '+b.ayah+'</strong><small>'+esc(b.translation)+'</small></span>›</button>').join(''):'<div class="panel empty">♡<br><b>Belum ada ayat tersimpan</b><p>Tekan ikon hati pada ayat untuk menyimpannya.</p></div>');
}
function ibadah(){
 return '<div class="heading ibadah-heading"><label>TEMAN IBADAH</label><h1>Ruang ibadah</h1><p>Semua kebutuhan ibadah harian dalam satu tempat.</p></div><div class="feature-list ibadah-grid"><button data-tool="prayer"><span class="feature-icon">☼</span><span><b>Jadwal Salat</b><small>Waktu salat & hitung mundur</small></span><strong>›</strong></button><button data-tool="qibla"><span class="feature-icon">⌖</span><span><b>Arah Kiblat</b><small>Kompas menuju Ka’bah</small></span><strong>›</strong></button><button data-tool="tasbih"><span class="feature-icon">◉</span><span><b>Tasbih Digital</b><small>Penghitung dzikir harian</small></span><strong>›</strong></button><button data-tool="duas"><span class="feature-icon">☾</span><span><b>Doa Harian</b><small>25 doa sehari-hari</small></span><strong>›</strong></button><button class="feature-wide" data-tool="asma"><span class="feature-icon">✧</span><span><b>Asmaul Husna</b><small>99 nama-nama Allah</small></span><strong>›</strong></button></div><div id="tool"></div>';
}
async function load(){
 if(S.surahs.length)return;S.loading=true;render();
 try{S.surahs=await getSurahs();}catch(e){toast(e.message);}
 S.loading=false;render();
}
async function openSurah(n,ayah=1){
 S.page='detail';S.detailType='surah';S.detailName='';S.surah=null;render();
 try{S.surah=await getSurah(n);S.wordTranslations={};S.showWordTranslation=false;try{S.wordTranslations=await getSurahWordTranslations(n);}catch(wordError){console.warn('Terjemahan per kata tidak tersedia:',wordError);}try{S.surah.push(await getSurahAudio(n,S.reciter));}catch(audioError){console.warn('Audio murottal tidak tersedia:',audioError);}const info=S.surahs.find(x=>x.number===Number(n));S.last={number:Number(n),name:info?.name||S.surah[0].name,ayah:Number(ayah)||1};localStorage.setItem('quran-last-read',JSON.stringify(S.last));}
 catch(e){toast(e.message);S.page='quran';}
 render();window.scrollTo(0,0);
 if(S.surah){const target=document.getElementById('ayah-'+Number(n)+'-'+(Number(ayah)||1));if(target)target.scrollIntoView({behavior:'smooth',block:'center'});}
}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),3000);}
async function position(){let permission=await Geolocation.checkPermissions();if(permission.location!=='granted'){permission=await Geolocation.requestPermissions();}if(permission.location!=='granted')throw Error('Izin lokasi belum diberikan. Aktifkan izin Lokasi untuk Quran Premium melalui Pengaturan Android.');const result=await Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:20000,maximumAge:0});if(!Number.isFinite(result.coords?.latitude)||!Number.isFinite(result.coords?.longitude))throw Error('Koordinat GPS tidak valid. Pastikan lokasi perangkat aktif.');return result.coords;}
function savePrayerSchedule(data){prayerSchedule=data;localStorage.setItem('quran-prayer-schedule',JSON.stringify(data));localStorage.setItem('quran-prayer-schedule-saved-at',String(Date.now()));}
async function fetchPrayerSchedule(coords,{silent=false}={}){const url='https://api.aladhan.com/v1/timings?latitude='+coords.latitude+'&longitude='+coords.longitude+'&method=20&school=0';const response=await fetch(url);if(!response.ok)throw Error('Tidak dapat terhubung ke layanan jadwal sholat.');const json=await response.json();if(json.code!==200||!json.data?.timings)throw Error('Data jadwal sholat tidak tersedia.');savePrayerSchedule(json.data);await syncPrayerReminders({force:true});if(!silent)toast('Jadwal sholat dan alarm beberapa bulan ke depan berhasil diperbarui.');if(S.page==='ibadah'&&S.ibadahTool==='prayer')renderPrayerSchedule();return json.data;}
let prayerOnboardingLayer=null;
let prayerOnboardingLocationGranted=false;
let prayerOnboardingWaitingForExactAlarm=false;
let prayerOnboardingLegacyOnly=false;
async function finishPrayerOnboarding(){
 if(prayerOnboardingLayer){prayerOnboardingLayer.remove();prayerOnboardingLayer=null;}
 prayerOnboardingWaitingForExactAlarm=false;
 if(prayerOnboardingLegacyOnly){localStorage.setItem('quran-first-permissions-done','1');localStorage.setItem('quran-exact-alarm-onboarding-v1','1');prayerOnboardingLegacyOnly=false;return;}
 let locationGranted=false,notificationGranted=false;
 try{const status=await Geolocation.checkPermissions();locationGranted=status.location==='granted';}catch(error){console.warn('Verifikasi izin lokasi:',error);}
 try{const reminder=window.Capacitor?.Plugins?.PrayerReminder;if(reminder){const status=await reminder.checkNotificationPermission();notificationGranted=!!status?.granted;}else notificationGranted=Notification.permission==='granted';}catch(error){console.warn('Verifikasi izin notifikasi:',error);}
 localStorage.setItem('quran-first-permissions-done','1');
 if(locationGranted){
  try{const coords=await position();prayerLocation={latitude:coords.latitude,longitude:coords.longitude,label:coords.latitude.toFixed(3)+', '+coords.longitude.toFixed(3)};localStorage.setItem('quran-prayer-location',JSON.stringify(prayerLocation));await fetchPrayerSchedule(coords,{silent:true});}
  catch(error){console.warn('GPS/jadwal sholat:',error);toast(error.message||'Jadwal sholat belum dapat dimuat.');}
 }else toast('Izin lokasi belum aktif. Aktifkan melalui Pengaturan Android agar GPS dan jadwal sholat dapat digunakan.');
 if(!notificationGranted)toast('Izin notifikasi belum aktif. Pengingat sholat tidak dapat menampilkan notifikasi.');
 if(locationGranted&&notificationGranted)toast('Izin lokasi dan notifikasi terverifikasi. Jadwal sholat sedang disiapkan.');
}
async function showExactAlarmStep(){
 if(!prayerOnboardingLayer)return;
 const plugin=window.Capacitor?.Plugins?.PrayerReminder;
 if(!plugin){await finishPrayerOnboarding();return;}
 let allowed=false;
 try{const result=await plugin.checkExactAlarmPermission();allowed=!!result?.allowed;}catch(error){console.warn('Pemeriksaan izin alarm:',error);}
 if(allowed){await finishPrayerOnboarding();return;}
 prayerOnboardingLayer.querySelector('.permission-dialog').innerHTML='<div class="permission-symbol">◷</div><label>PENGATURAN PENTING</label><h2>Aktifkan Alarm &amp; pengingat</h2><p>Agar azan dan pengingat sholat dapat dijadwalkan tepat waktu, Android memerlukan izin khusus ini. Izin ini berbeda dari izin notifikasi.</p><div class="permission-benefit"><span>◷</span><div><b>Alarm &amp; pengingat</b><small>Izinkan Quran Premium menjadwalkan alarm sholat</small></div></div><button class="gold-button" data-exact-alarm-open>Aktifkan Sekarang</button><button class="reset" data-permission-later>Nanti saja</button>';
 prayerOnboardingLayer.querySelector('[data-exact-alarm-open]').addEventListener('click',async()=>{try{prayerOnboardingWaitingForExactAlarm=true;await plugin.openExactAlarmSettings();}catch(error){prayerOnboardingWaitingForExactAlarm=false;toast('Pengaturan Alarm & pengingat tidak dapat dibuka.');console.error(error);}});
 prayerOnboardingLayer.querySelector('[data-permission-later]').addEventListener('click',async()=>{await finishPrayerOnboarding();});
}
function showPermissionOnboarding(){
 if(localStorage.getItem('quran-first-permissions-done')==='1'){
  if(localStorage.getItem('quran-exact-alarm-onboarding-v1')==='1')return;
  const plugin=window.Capacitor?.Plugins?.PrayerReminder;
  if(!plugin)return;
  plugin.checkExactAlarmPermission().then(result=>{
   if(result?.allowed){localStorage.setItem('quran-exact-alarm-onboarding-v1','1');return;}
   prayerOnboardingLegacyOnly=true;
   const layer=document.createElement('div');prayerOnboardingLayer=layer;layer.className='permission-onboarding';
   layer.innerHTML='<div class="permission-dialog"><div class="permission-symbol">◷</div><label>PEMBARUAN PENTING</label><h2>Aktifkan Alarm &amp; pengingat</h2><p>Agar azan dan pengingat sholat dapat dijadwalkan tepat waktu, Android memerlukan izin khusus ini. Izin ini berbeda dari izin notifikasi.</p><div class="permission-benefit"><span>◷</span><div><b>Alarm &amp; pengingat</b><small>Izinkan Quran Premium menjadwalkan alarm sholat</small></div></div><button class="gold-button" data-exact-alarm-open>Aktifkan Sekarang</button><button class="reset" data-permission-later>Nanti saja</button></div>';
   document.body.append(layer);
   layer.querySelector('[data-exact-alarm-open]').addEventListener('click',async()=>{try{prayerOnboardingWaitingForExactAlarm=true;await plugin.openExactAlarmSettings();}catch(error){prayerOnboardingWaitingForExactAlarm=false;toast('Pengaturan Alarm & pengingat tidak dapat dibuka.');console.error(error);}});
   layer.querySelector('[data-permission-later]').addEventListener('click',async()=>{await finishPrayerOnboarding();});
  }).catch(error=>console.warn('Pemeriksaan izin alarm saat pembaruan:',error));
  return;
 }
 const layer=document.createElement('div');prayerOnboardingLayer=layer;layer.className='permission-onboarding';
 layer.innerHTML='<div class="permission-dialog"><div class="permission-symbol">۞</div><label>PENGATURAN AWAL</label><h2>Aktifkan layanan ibadah</h2><p>Berikan izin yang diperlukan agar jadwal sholat, notifikasi, dan alarm azan dapat bekerja dengan baik.</p><div class="permission-benefit"><span>⌖</span><div><b>Lokasi perangkat</b><small>Menentukan waktu sholat setempat</small></div></div><div class="permission-benefit"><span>♧</span><div><b>Notifikasi</b><small>Mengirim pengingat waktu sholat</small></div></div><div class="permission-benefit"><span>◷</span><div><b>Alarm &amp; pengingat</b><small>Menjadwalkan azan tepat waktu melalui pengaturan Android</small></div></div><button class="gold-button" data-permission-start>Mulai pengaturan</button><button class="reset" data-permission-later>Nanti saja</button></div>';
 document.body.append(layer);
 layer.querySelector('[data-permission-later]').addEventListener('click',async()=>{prayerOnboardingLocationGranted=false;await finishPrayerOnboarding();});
 layer.querySelector('[data-permission-start]').addEventListener('click',async()=>{const action=layer.querySelector('[data-permission-start]');action.disabled=true;action.textContent='Meminta izin…';try{let status=await Geolocation.checkPermissions();if(status.location!=='granted')status=await Geolocation.requestPermissions();prayerOnboardingLocationGranted=status.location==='granted';}catch(error){console.warn('Izin lokasi:',error);}try{const reminder=window.Capacitor?.Plugins?.PrayerReminder;if(reminder){await reminder.requestNotificationPermission();const status=await reminder.checkNotificationPermission();}else if('Notification'in window&&Notification.permission==='default'){await Notification.requestPermission();}}catch(error){console.warn('Izin notifikasi:',error);}await showExactAlarmStep();});
}
async function initializePrayerExperience(){try{const cached=localStorage.getItem('quran-prayer-schedule');if(cached){prayerSchedule=JSON.parse(cached);if(prayerSchedule?.timings)syncPrayerReminders();}}catch(error){localStorage.removeItem('quran-prayer-schedule');}showPermissionOnboarding();if(localStorage.getItem('quran-first-permissions-done')==='1'){try{const status=await Geolocation.checkPermissions();if(status.location==='granted'){const coords=await position();prayerLocation={latitude:coords.latitude,longitude:coords.longitude,label:coords.latitude.toFixed(3)+', '+coords.longitude.toFixed(3)};localStorage.setItem('quran-prayer-location',JSON.stringify(prayerLocation));await fetchPrayerSchedule(coords,{silent:true});}}catch(error){console.warn('Pemulihan jadwal sholat:',error);}}}
function tool(name){
 const box=document.querySelector('#tool');if(!box)return;
 S.previousIbadahTool=S.ibadahTool;S.ibadahTool=name;
 const heading=document.querySelector('.ibadah-heading'),menu=document.querySelector('.ibadah-grid');if(heading)heading.hidden=true;if(menu)menu.hidden=true;
 if(name==='tasbih')box.innerHTML='<div class="panel tool"><label>DZIKIR HARIAN</label><h2>Tasbih Digital</h2><div class="count" id="count">'+tasbih+'</div><p>Subhanallah · Alhamdulillah · Allahu Akbar</p><button class="gold-button" id="tap">TAP UNTUK BERDZIKIR</button><button class="reset" id="reset">Atur ulang</button></div>';
 if(name==='duas')box.innerHTML='<div class="panel tool"><label>DOA HARIAN</label><h2>25 Doa Harian</h2><p>Kumpulan doa sehari-hari beserta bacaan Arab, latin, arti, dan sumber.</p>'+renderDuaList()+'</div>';
 if(name==='asma'){
 const names=[
 ['الرَّحْمَٰنُ','Ar-Rahman','Yang Maha Pengasih'],['الرَّحِيمُ','Ar-Rahim','Yang Maha Penyayang'],['الْمَلِكُ','Al-Malik','Yang Maha Merajai'],['الْقُدُّوسُ','Al-Quddus','Yang Maha Suci'],['السَّلَامُ','As-Salam','Yang Maha Memberi Keselamatan'],['الْمُؤْمِنُ','Al-Mu’min','Yang Maha Memberi Keamanan'],['الْمُهَيْمِنُ','Al-Muhaymin','Yang Maha Memelihara'],['الْعَزِيزُ','Al-Aziz','Yang Maha Perkasa'],['الْجَبَّارُ','Al-Jabbar','Yang Maha Kuasa'],['الْمُتَكَبِّرُ','Al-Mutakabbir','Yang Maha Megah'],['الْخَالِقُ','Al-Khaliq','Yang Maha Pencipta'],['الْبَارِئُ','Al-Bari','Yang Maha Mengadakan'],['الْمُصَوِّرُ','Al-Musawwir','Yang Maha Membentuk Rupa'],['الْغَفَّارُ','Al-Ghaffar','Yang Maha Pengampun'],['الْقَهَّارُ','Al-Qahhar','Yang Maha Menundukkan'],['الْوَهَّابُ','Al-Wahhab','Yang Maha Pemberi Karunia'],['الرَّزَّاقُ','Ar-Razzaq','Yang Maha Pemberi Rezeki'],['الْفَتَّاحُ','Al-Fattah','Yang Maha Pembuka Rahmat'],['الْعَلِيمُ','Al-Alim','Yang Maha Mengetahui'],['الْقَابِضُ','Al-Qabid','Yang Maha Menyempitkan'],['الْبَاسِطُ','Al-Basit','Yang Maha Melapangkan'],['الْخَافِضُ','Al-Khafid','Yang Maha Merendahkan'],['الرَّافِعُ','Ar-Rafi','Yang Maha Meninggikan'],['الْمُعِزُّ','Al-Mu’izz','Yang Maha Memuliakan'],['الْمُذِلُّ','Al-Mudhill','Yang Maha Menghinakan'],['السَّمِيعُ','As-Sami','Yang Maha Mendengar'],['الْبَصِيرُ','Al-Basir','Yang Maha Melihat'],['الْحَكَمُ','Al-Hakam','Yang Maha Menetapkan'],['الْعَدْلُ','Al-Adl','Yang Maha Adil'],['اللَّطِيفُ','Al-Latif','Yang Maha Lembut'],['الْخَبِيرُ','Al-Khabir','Yang Maha Mengenal'],['الْحَلِيمُ','Al-Halim','Yang Maha Penyantun'],['الْعَظِيمُ','Al-Azim','Yang Maha Agung'],['الْغَفُورُ','Al-Ghafur','Yang Maha Pengampun'],['الشَّكُورُ','Ash-Shakur','Yang Maha Menghargai'],['الْعَلِيُّ','Al-Ali','Yang Maha Tinggi'],['الْكَبِيرُ','Al-Kabir','Yang Maha Besar'],['الْحَفِيظُ','Al-Hafiz','Yang Maha Memelihara'],['الْمُقِيتُ','Al-Muqit','Yang Maha Pemberi Kecukupan'],['الْحَسِيبُ','Al-Hasib','Yang Maha Membuat Perhitungan'],['الْجَلِيلُ','Al-Jalil','Yang Maha Luhur'],['الْكَرِيمُ','Al-Karim','Yang Maha Pemurah'],['الرَّقِيبُ','Ar-Raqib','Yang Maha Mengawasi'],['الْمُجِيبُ','Al-Mujib','Yang Maha Mengabulkan'],['الْوَاسِعُ','Al-Wasi','Yang Maha Luas'],['الْحَكِيمُ','Al-Hakim','Yang Maha Bijaksana'],['الْوَدُودُ','Al-Wadud','Yang Maha Mengasihi'],['الْمَجِيدُ','Al-Majid','Yang Maha Mulia'],['الْبَاعِثُ','Al-Ba’ith','Yang Maha Membangkitkan'],['الشَّهِيدُ','Ash-Shahid','Yang Maha Menyaksikan'],['الْحَقُّ','Al-Haqq','Yang Maha Benar'],['الْوَكِيلُ','Al-Wakil','Yang Maha Memelihara'],['الْقَوِيُّ','Al-Qawiyy','Yang Maha Kuat'],['الْمَتِينُ','Al-Matin','Yang Maha Kokoh'],['الْوَلِيُّ','Al-Waliyy','Yang Maha Melindungi'],['الْحَمِيدُ','Al-Hamid','Yang Maha Terpuji'],['الْمُحْصِي','Al-Muhsi','Yang Maha Menghitung'],['الْمُبْدِئُ','Al-Mubdi','Yang Maha Memulai'],['الْمُعِيدُ','Al-Mu’id','Yang Maha Mengembalikan'],['الْمُحْيِي','Al-Muhyi','Yang Maha Menghidupkan'],['الْمُمِيتُ','Al-Mumit','Yang Maha Mematikan'],['الْحَيُّ','Al-Hayy','Yang Maha Hidup'],['الْقَيُّومُ','Al-Qayyum','Yang Maha Mandiri'],['الْوَاجِدُ','Al-Wajid','Yang Maha Menemukan'],['الْمَاجِدُ','Al-Majid','Yang Maha Mulia'],['الْوَاحِدُ','Al-Wahid','Yang Maha Esa'],['الْأَحَدُ','Al-Ahad','Yang Maha Tunggal'],['الصَّمَدُ','As-Samad','Tempat Meminta Segala Sesuatu'],['الْقَادِرُ','Al-Qadir','Yang Maha Menentukan'],['الْمُقْتَدِرُ','Al-Muqtadir','Yang Maha Berkuasa'],['الْمُقَدِّمُ','Al-Muqaddim','Yang Maha Mendahulukan'],['الْمُؤَخِّرُ','Al-Mu’akhkhir','Yang Maha Mengakhirkan'],['الْأَوَّلُ','Al-Awwal','Yang Maha Awal'],['الْآخِرُ','Al-Akhir','Yang Maha Akhir'],['الظَّاهِرُ','Az-Zahir','Yang Maha Nyata'],['الْبَاطِنُ','Al-Batin','Yang Maha Tersembunyi'],['الْوَالِي','Al-Wali','Yang Maha Memerintah'],['الْمُتَعَالِي','Al-Muta’ali','Yang Maha Tinggi'],['الْبَرُّ','Al-Barr','Yang Maha Dermawan'],['التَّوَّابُ','At-Tawwab','Yang Maha Penerima Tobat'],['الْمُنْتَقِمُ','Al-Muntaqim','Yang Maha Pemberi Balasan'],['الْعَفُوُّ','Al-Afuww','Yang Maha Pemaaf'],['الرَّؤُوفُ','Ar-Ra’uf','Yang Maha Belas Kasih'],['مَالِكُ الْمُلْكِ','Malikul Mulk','Yang Maha Menguasai Kerajaan'],['ذُو الْجَلَالِ وَالْإِكْرَامِ','Dzul Jalali wal Ikram','Yang Memiliki Kebesaran dan Kemuliaan'],['الْمُقْسِطُ','Al-Muqsit','Yang Maha Adil'],['الْجَامِعُ','Al-Jami','Yang Maha Mengumpulkan'],['الْغَنِيُّ','Al-Ghaniyy','Yang Maha Kaya'],['الْمُغْنِي','Al-Mughni','Yang Maha Memberi Kekayaan'],['الْمَانِعُ','Al-Mani','Yang Maha Mencegah'],['الضَّارُّ','Ad-Darr','Yang Maha Menentukan Bahaya'],['النَّافِعُ','An-Nafi','Yang Maha Memberi Manfaat'],['النُّورُ','An-Nur','Yang Maha Bercahaya'],['الْهَادِي','Al-Hadi','Yang Maha Memberi Petunjuk'],['الْبَدِيعُ','Al-Badi','Yang Maha Pencipta Keindahan'],['الْبَاقِي','Al-Baqi','Yang Maha Kekal'],['الْوَارِثُ','Al-Warith','Yang Maha Pewaris'],['الرَّشِيدُ','Ar-Rashid','Yang Maha Membimbing'],['الصَّبُورُ','As-Sabur','Yang Maha Sabar']
 ];
 box.innerHTML='<div class="panel tool"><label>ASMAUL HUSNA</label><h2>99 Nama Allah</h2><p>Mengenal dan menghayati nama-nama Allah yang indah.</p></div><div class="asma-list">'+names.map((n,i)=>'<article class="asma-item"><span class="number">'+(i+1)+'</span><div><div class="arabic">'+n[0]+'</div><b>'+n[1]+'</b><small>'+n[2]+'</small></div></article>').join('')+'</div>';
 }
 if(name==='prayer'){box.innerHTML=prayerMarkup();if(prayerSchedule)renderPrayerSchedule();else if(prayerLocation)fetchPrayerSchedule(prayerLocation,{silent:true}).catch(error=>console.warn('Jadwal sholat:',error));}
 if(name==='prayer-settings')box.innerHTML=prayerSettingsMarkup();
 if(name==='qibla')box.innerHTML='<div class="panel tool qibla-panel"><label>ARAH KIBLAT</label><h2>Kompas Kiblat</h2><p>Arah Ka’bah berdasarkan lokasi dan sensor kompas perangkat.</p><div class="qibla-compass"><div class="qibla-ring" id="qibla-ring"><span class="north">U</span><span class="east">T</span><span class="south">S</span><span class="west">B</span></div><div class="qibla-needle" id="qibla-needle"><span></span></div><div class="qibla-center">۞</div></div><div class="qibla-degree" id="qibla-degree">--°</div><div class="qibla-direction" id="qibla-direction">Arah kiblat belum dihitung</div><button class="gold-button" id="locate">Aktifkan kompas & lokasi</button><div class="qibla-status" id="result">Pastikan GPS aktif dan jauhkan ponsel dari benda bermagnet.</div></div>';
 box.insertAdjacentHTML('afterbegin','<button class="back ibadah-back" data-ibadah-back>‹ Kembali ke Ruang Ibadah</button>');
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-ibadah-back')){S.ibadahTool=null;S.previousIbadahTool=null;if(prayerCountdownTimer){clearInterval(prayerCountdownTimer);prayerCountdownTimer=null;}const h=document.querySelector('.ibadah-heading'),m=document.querySelector('.ibadah-grid'),box=document.querySelector('#tool');if(h)h.hidden=false;if(m)m.hidden=false;if(box)box.innerHTML='';return;}
 if(b.hasAttribute('data-detail-back')){handleHardwareBack();return;}
 if(b.dataset.themeChoice){S.theme=b.dataset.themeChoice;localStorage.setItem('quran-theme',S.theme);applyTheme();render();toast('Tema aplikasi diperbarui.');return;}
 if(b.dataset.page){S.ibadahTool=null;S.previousIbadahTool=null;if(qiblaListener){qiblaListener.remove();qiblaListener=null;window.Capacitor?.Plugins?.QiblaCompass?.stop();}S.page=b.dataset.page;render();if(S.page==='quran')load();}
 if(b.hasAttribute('data-search-ayah')){const q=document.querySelector('#ayah-search')?.value.trim();if(!q){toast('Masukkan kata yang ingin dicari.');return;}S.searchAyahQuery=q;S.searchLoading=true;S.searchResults=[];document.querySelector('#ayah-search-results').innerHTML='<p class="empty">Mencari ayat...</p>';try{const data=await searchAyahs(q);S.searchResults=data.matches||[];document.querySelector('#ayah-search-results').innerHTML=S.searchResults.length?S.searchResults.map(searchResultCard).join(''):'<p class="empty">Ayat tidak ditemukan.</p>';}catch(err){document.querySelector('#ayah-search-results').innerHTML='<p class="empty">'+esc(err.message)+'</p>';}finally{S.searchLoading=false;}}
 if(b.hasAttribute('data-toggle-words')){S.showWordTranslation=!S.showWordTranslation;render();return;}
 if(b.dataset.open){S.detailReturnPage=S.page;openSurah(b.dataset.open,b.dataset.ayah||1);}
 if(b.dataset.list==='juz'){S.quranList='juz';document.querySelectorAll('[data-list]').forEach(x=>x.classList.toggle('selected',x.dataset.list==='juz'));document.querySelector('#list').innerHTML=juzListMarkup();}
 if(b.dataset.list==='surah'){S.quranList='surah';S.search='';render();}
 if(b.dataset.nativePicker){
  const reciters=[['ar.alafasy','Mishary Rashid Alafasy'],['ar.abdurrahmaansudais','Abdurrahman As-Sudais'],['ar.husary','Mahmoud Khalil Al-Husary'],['ar.husarymujawwad','Mahmoud Khalil Al-Husary (Mujawwad)'],['ar.minshawi','Muhammad Siddiq Al-Minshawi'],['ar.muhammadayyoub','Muhammad Ayyub'],['ar.muhammadjibreel','Muhammad Jibreel'],['ar.mahermuaiqly','Maher Al-Muaiqly'],['ar.shaatree','Abu Bakr Ash-Shaatree']];
  const groups={reciter:{title:'Pilih Qari',items:reciters},arabic:{title:'Ukuran tulisan Arab',items:[['26','Kecil'],['30','Sedang'],['34','Besar'],['38','Sangat besar']]},translation:{title:'Ukuran terjemahan',items:[['12','Kecil'],['13','Sedang'],['15','Besar'],['17','Sangat besar']]},spacing:{title:'Jarak antarbaris',items:[['1.6','Rapat'],['2.0','Normal'],['2.4','Renggang'],['2.8','Sangat renggang']]}};
  const group=groups[b.dataset.nativePicker],key=b.dataset.nativePicker;
  try{
   const plugin=window.Capacitor?.Plugins?.NativePicker;
   if(!plugin){toast('Dialog native tersedia pada aplikasi Android.');return;}
   const current=key==='reciter'?S.reciter:key==='arabic'?S.arabicSize:key==='translation'?S.translationSize:S.lineSpacing;
   const selectedIndex=Math.max(0,group.items.findIndex(x=>x[0]===current));
   const result=await plugin.show({title:group.title,options:group.items.map(x=>x[1]),selectedIndex});
   if(result?.cancelled||result?.index==null)return;
   const value=group.items[result.index][0];
   if(key==='reciter'){S.reciter=value;localStorage.setItem('quran-reciter',value);toast('Qari disimpan.');}
   if(key==='arabic'){S.arabicSize=value;localStorage.setItem('quran-arabic-size',value);applyReadingSettings();toast('Ukuran tulisan Arab disimpan.');}
   if(key==='translation'){S.translationSize=value;localStorage.setItem('quran-translation-size',value);applyReadingSettings();toast('Ukuran terjemahan disimpan.');}
   if(key==='spacing'){S.lineSpacing=value;localStorage.setItem('quran-line-spacing',value);applyReadingSettings();toast('Jarak antarbaris disimpan.');}
   render();
  }catch(err){toast('Tidak dapat membuka pilihan native.');console.error(err);}
 }
 if(b.dataset.tool){if(b.dataset.tool!=='prayer'&&prayerCountdownTimer){clearInterval(prayerCountdownTimer);prayerCountdownTimer=null;}if(b.dataset.tool!=='qibla'&&qiblaListener){qiblaListener.remove();qiblaListener=null;window.Capacitor?.Plugins?.QiblaCompass?.stop();}tool(b.dataset.tool);}
 if(b.dataset.tool&&b.dataset.tool!=='duas'&&audioPlayer&&!audioPlayer.paused){audioPlayer.pause();if(activeAudioButton)activeAudioButton.textContent='▶ Dengarkan';activeAudioButton=null;}
 if(b.dataset.audio){const url=b.dataset.audio;if(audioPlayer&&activeAudioButton===b){if(audioPlayer.paused){audioPlayer.play();b.textContent='Ⅱ Jeda';}else{audioPlayer.pause();b.textContent='▶ Lanjutkan';}return;}if(audioPlayer)audioPlayer.pause();if(activeAudioButton)activeAudioButton.textContent='▶ Dengarkan';document.querySelectorAll('.ayah.playing').forEach(x=>x.classList.remove('playing'));const currentAyah=b.closest('.ayah');if(currentAyah){currentAyah.classList.add('playing');currentAyah.scrollIntoView({behavior:'smooth',block:'center'});const key=currentAyah.id.replace('ayah-','').split('-').map(Number);S.last={number:key[0],name:S.surahs.find(x=>x.number===key[0])?.name||S.detailName,ayah:key[1]};localStorage.setItem('quran-last-read',JSON.stringify(S.last));}audioPlayer=new Audio(url);activeAudioButton=b;b.textContent='Ⅱ Jeda';audioPlayer.addEventListener('ended',()=>{const finishedButton=activeAudioButton;if(finishedButton)finishedButton.textContent='▶ Dengarkan';activeAudioButton=null;const buttons=[...document.querySelectorAll('.audio-play')];const next=buttons[buttons.indexOf(finishedButton)+1];if(next)next.click();else document.querySelectorAll('.ayah.playing').forEach(x=>x.classList.remove('playing'));});audioPlayer.addEventListener('error',()=>{toast('Audio gagal diputar. Periksa koneksi internet.');if(activeAudioButton)activeAudioButton.textContent='▶ Dengarkan';activeAudioButton=null;});audioPlayer.play().catch(()=>{toast('Audio tidak dapat diputar.');b.textContent='▶ Dengarkan';activeAudioButton=null;});}
 if(b.dataset.progress){const [s,a]=b.dataset.progress.split(':').map(Number);S.last={number:s,name:b.dataset.name,ayah:a};localStorage.setItem('quran-last-read',JSON.stringify(S.last));toast('Terakhir dibaca disimpan: '+b.dataset.name+' ayat '+a);render();}
 if(b.dataset.save){const [s,a]=b.dataset.save.split(':').map(Number);const i=S.bookmarks.findIndex(x=>x.surah===s&&x.ayah===a);if(i>=0)S.bookmarks.splice(i,1);else S.bookmarks.push({surah:s,ayah:a,name:b.dataset.name,text:b.dataset.ar,translation:b.dataset.tr});save();render();}
 if(b.dataset.juz){S.detailReturnPage='quran';S.page='detail';S.detailType='juz';S.detailName='Juz '+b.dataset.juz;S.surah=null;if(audioPlayer){audioPlayer.pause();audioPlayer=null;activeAudioButton=null;}render();try{const pair=await getJuz(b.dataset.juz);const ar=pair[0],tr=pair[1];S.surah=[{number:ar.ayahs[0].surah.number,name:S.detailName,englishName:S.detailName,numberOfAyahs:ar.ayahs.length,ayahs:ar.ayahs.map(x=>({...x,numberInSurah:x.numberInSurah}))},{ayahs:tr.ayahs.map(x=>({text:x.text}))}];try{S.surah.push(await getJuzAudio(b.dataset.juz,S.reciter));}catch(audioError){console.warn('Audio juz tidak tersedia:',audioError);toast('Ayat berhasil dimuat, tetapi audio qari belum tersedia.');}}catch(err){toast(err.message);S.page='quran';}render();}
 if(b.dataset.prayerPicker){
  const name=b.dataset.prayerName,key=b.dataset.prayerPicker;
  const groups={lead:{title:'Waktu pengingat · '+name,items:[['0','Tepat waktu sholat'],['5','5 menit sebelumnya'],['10','10 menit sebelumnya'],['15','15 menit sebelumnya'],['30','30 menit sebelumnya']]},sound:{title:'Pilih suara adzan · '+name,items:[['adhan','Adzan lengkap'],['fajr','Adzan Subuh'],['short','Notifikasi pendek'],['silent','Senyap']]}};
  const group=groups[key],plugin=window.Capacitor?.Plugins?.NativePicker;
  if(!plugin){toast('Pilihan Material tersedia pada aplikasi Android.');return;}
  const current=prayerSettings[name]?.[key]??(key==='lead'?'0':'adhan');
  try{
   const result=await plugin.show({title:group.title,options:group.items.map(x=>x[1]),selectedIndex:Math.max(0,group.items.findIndex(x=>x[0]===String(current)))});
   if(result?.cancelled||result?.index==null)return;
   if(!prayerSettings[name])prayerSettings[name]={enabled:true,lead:'0',sound:name==='Subuh'?'fajr':'adhan'};
   prayerSettings[name][key]=group.items[result.index][0];
   localStorage.setItem('quran-prayer-settings',JSON.stringify(prayerSettings));
   const label=document.querySelector('[data-prayer-picker="'+key+'"][data-prayer-name="'+name+'"] .picker-value');
   if(label)label.textContent=group.items[result.index][1];
   syncPrayerReminders({force:true});
   toast('Pengaturan '+name+' disimpan.');
  }catch(error){console.error(error);toast('Pilihan tidak dapat dibuka.');}
  return;
 }
 if(b.dataset.prayerTest){const plugin=window.Capacitor?.Plugins?.PrayerReminder;if(!plugin){toast('Tes audio tersedia pada aplikasi Android.');return;}try{await plugin.testAdhan({sound:b.dataset.prayerTest});toast('Tes suara dimulai. Gunakan Hentikan Suara untuk berhenti.');}catch(error){toast('Audio adzan belum tersedia atau gagal diputar.');console.error(error);}return;}
 if(b.hasAttribute('data-prayer-stop')){const plugin=window.Capacitor?.Plugins?.PrayerReminder;if(plugin)await plugin.stopAdhan();toast('Perintah menghentikan suara dikirim.');return;}
 if(b.dataset.prayerExactSettings){const plugin=window.Capacitor?.Plugins?.PrayerReminder;if(plugin){await plugin.openExactAlarmSettings();}else toast('Pengaturan alarm tersedia pada aplikasi Android.');return;}
 if(b.id==='tap'){tasbih++;document.querySelector('#count').textContent=tasbih;}
 if(b.id==='reset'){tasbih=0;document.querySelector('#count').textContent=0;}
 if(b.id==='locate'){const out=document.querySelector('#result');out.textContent='Mengambil lokasi...';try{const c=await position();const isPrayer=!!b.closest('.prayer-tool');if(isPrayer){prayerLocation={latitude:c.latitude,longitude:c.longitude,label:c.latitude.toFixed(3)+', '+c.longitude.toFixed(3)};localStorage.setItem('quran-prayer-location',JSON.stringify(prayerLocation));const url='https://api.aladhan.com/v1/timings?latitude='+c.latitude+'&longitude='+c.longitude+'&method=20&school=0';const r=await fetch(url);const j=await r.json();if(j.code!==200)throw Error('Data jadwal sholat tidak tersedia.');savePrayerSchedule(j.data);out.textContent='Jadwal berhasil diperbarui dari lokasi GPS.';const loc=document.querySelector('.prayer-location');if(loc)loc.textContent='Lokasi GPS: '+prayerLocation.label;renderPrayerSchedule();}else{const toRad=x=>x*Math.PI/180;const lat1=toRad(c.latitude),lat2=toRad(21.422487),dLon=toRad(39.826206-c.longitude);const y=Math.sin(dLon)*Math.cos(lat2);const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);qiblaBearing=(Math.atan2(y,x)*180/Math.PI+360)%360;document.querySelector('#qibla-degree').textContent=qiblaBearing.toFixed(1)+'°';document.querySelector('#qibla-direction').textContent='Azimut kiblat dari utara';out.textContent='Lokasi ditemukan. Mengaktifkan sensor kompas...';const compass=window.Capacitor?.Plugins?.QiblaCompass;if(!compass)throw Error('Kompas native belum tersedia. Sinkronkan dan build ulang aplikasi Android.');if(qiblaListener){await qiblaListener.remove();qiblaListener=null;}qiblaListener=await compass.addListener('heading',event=>{currentHeading=Number(event.heading)||0;updateQiblaDisplay();});await compass.start();out.textContent='Kompas aktif. Putar ponsel perlahan hingga jarum mengarah ke atas.';}}catch(err){out.textContent=err.message;}}
});
function applyTheme(){const prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=S.theme==='system'?(prefersDark?'dark':'light'):S.theme;document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('selected',b.dataset.themeChoice===S.theme));}
if(window.matchMedia){window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(S.theme==='system')applyTheme();});}
function applyReadingSettings(){document.documentElement.style.setProperty('--arabic-size',S.arabicSize+'px');document.documentElement.style.setProperty('--arabic-line-height',S.lineSpacing);document.documentElement.style.setProperty('--translation-size',S.translationSize+'px');}
applyReadingSettings();
applyTheme();
document.addEventListener('change',e=>{if(e.target.id==='reciter-select'){S.reciter=e.target.value;localStorage.setItem('quran-reciter',S.reciter);toast('Pilihan qari disimpan. Buka surah berikutnya untuk menggunakan suara ini.');}if(e.target.id==='arabic-size'){S.arabicSize=e.target.value;localStorage.setItem('quran-arabic-size',S.arabicSize);applyReadingSettings();toast('Ukuran tulisan Arab disimpan.');}if(e.target.id==='translation-size'){S.translationSize=e.target.value;localStorage.setItem('quran-translation-size',S.translationSize);applyReadingSettings();toast('Ukuran terjemahan disimpan.');}if(e.target.id==='line-spacing'){S.lineSpacing=e.target.value;localStorage.setItem('quran-line-spacing',S.lineSpacing);applyReadingSettings();toast('Jarak antarbaris disimpan.');}});
document.addEventListener('change',e=>{const n=e.target.dataset.prayerEnabled||e.target.dataset.prayerLead||e.target.dataset.prayerSound;if(n){if(!prayerSettings[n])prayerSettings[n]={enabled:true,lead:'0',sound:n==='Subuh'?'fajr':'adhan'};if(e.target.dataset.prayerEnabled)prayerSettings[n].enabled=e.target.checked;if(e.target.dataset.prayerLead)prayerSettings[n].lead=e.target.value;if(e.target.dataset.prayerSound)prayerSettings[n].sound=e.target.value;localStorage.setItem('quran-prayer-settings',JSON.stringify(prayerSettings));syncPrayerReminders({force:true});toast('Pengaturan pengingat '+n+' disimpan.');}});
document.addEventListener('input',e=>{if(e.target.id==='dua-search'){const box=document.querySelector('#tool');if(box){const query=e.target.value;const filtered=dailyDuas.filter(d=>(d.title+' '+d.meaning+' '+d.source).toLowerCase().includes(query.toLowerCase()));const count=box.querySelector('.dua-count');if(count)count.textContent=filtered.length+' dari '+dailyDuas.length+' doa';const list=box.querySelector('.dua-list');if(list)list.innerHTML=filtered.map(d=>'<article class=\"dua-card\"><div class=\"dua-card-top\"><span class=\"number\">'+(dailyDuas.indexOf(d)+1)+'</span><b>'+esc(d.title)+'</b></div><div class=\"arabic dua-arabic\">'+d.arabic+'</div><p class=\"dua-latin\">'+esc(d.latin)+'</p><p class=\"dua-meaning\">'+esc(d.meaning)+'</p><small class=\"dua-source\">Sumber: '+esc(d.source)+'</small></article>').join('')||'<p class=\"empty\">Doa tidak ditemukan.</p>';}}if(e.target.id==='search'){S.search=e.target.value;const arr=S.surahs.filter(x=>(x.name+' '+x.englishName+' '+x.number).toLowerCase().includes(S.search.toLowerCase()));document.querySelector('#list').innerHTML=arr.map(card).join('')||'<p class="empty">Surah tidak ditemukan.</p>'; }});
function handleHardwareBack(){
 if(S.page==='ibadah'&&S.ibadahTool){
  if(S.ibadahTool==='prayer-settings'&&S.previousIbadahTool==='prayer'){tool('prayer');return;}
  if(prayerCountdownTimer){clearInterval(prayerCountdownTimer);prayerCountdownTimer=null;}
  if(qiblaListener){qiblaListener.remove();qiblaListener=null;window.Capacitor?.Plugins?.QiblaCompass?.stop();}
  S.ibadahTool=null;S.previousIbadahTool=null;
  const heading=document.querySelector('.ibadah-heading'),menu=document.querySelector('.ibadah-grid'),box=document.querySelector('#tool');
  if(heading)heading.hidden=false;if(menu)menu.hidden=false;if(box)box.innerHTML='';
  return;
 }
 if(S.page==='detail'){
  if(audioPlayer&&!audioPlayer.paused){audioPlayer.pause();if(activeAudioButton)activeAudioButton.textContent='▶ Dengarkan';activeAudioButton=null;}
  const target=S.detailReturnPage||'quran';S.page=target;S.surah=null;S.showWordTranslation=false;render();
  if(target==='quran')load();
  return;
 }
 if(S.page!=='home'){S.page='home';S.ibadahTool=null;S.previousIbadahTool=null;render();return;}
 if(window.confirm('Keluar dari Quran Premium?'))App.exitApp();
}
async function verifyExactAlarmPermissionOnResume(){
 const plugin=window.Capacitor?.Plugins?.PrayerReminder;
 if(!plugin||(!prayerOnboardingWaitingForExactAlarm&&!prayerOnboardingLayer))return;
 try{
  const result=await plugin.checkExactAlarmPermission();
  if(result?.allowed){
   if(prayerOnboardingLayer)await finishPrayerOnboarding();
   else{localStorage.setItem('quran-exact-alarm-onboarding-v1','1');prayerOnboardingWaitingForExactAlarm=false;prayerOnboardingLegacyOnly=false;}
  }else if(prayerOnboardingWaitingForExactAlarm)toast('Izin Alarm & pengingat belum aktif. Silakan aktifkan lalu kembali ke Quran Premium.');
 }catch(error){console.warn('Pemeriksaan ulang izin alarm:',error);}
}
if(window.Capacitor?.isNativePlatform?.()){
 App.addListener('backButton',handleHardwareBack).catch(error=>console.warn('Listener tombol kembali tidak aktif:',error));
 App.addListener('appStateChange',async({isActive})=>{if(isActive)await verifyExactAlarmPermissionOnResume();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')verifyExactAlarmPermissionOnResume();});
 window.addEventListener('focus',()=>verifyExactAlarmPermissionOnResume());
}
render();
initializePrayerExperience();
