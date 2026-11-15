import './style.css';
import {getSurahs,getSurah,getJuz} from './services/quran-api.js';
const app=document.querySelector('#app');
const S={page:'home',surahs:[],surah:null,detailType:'surah',detailName:'',search:'',bookmarks:JSON.parse(localStorage.getItem('quran-bookmarks')||'[]'),last:JSON.parse(localStorage.getItem('quran-last-read')||'null'),loading:false};
let tasbih=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
 return '<div class="heading"><label>PREFERENSI</label><h1>Pengaturan</h1><p>Quran Premium versi 1.0.0 · Developer Abdul Hamid</p></div><div class="panel"><b>Tampilan premium</b><p>Mode gelap hijau emerald dan emas.</p><b>Data Al-Qur’an</b><p>Diambil secara online dari AlQuran Cloud API.</p></div>';
}
function home(){
 const last=S.last?'<button class="continue" data-open="'+S.last.number+'" data-ayah="'+(S.last.ayah||1)+'"><span>۞</span><div><b>'+esc(S.last.name)+'</b><small>Lanjutkan membaca · Ayat '+S.last.ayah+'</small></div>›</button>':'<button class="continue" data-page="quran"><span>۞</span><div><b>Mulai membaca</b><small>Pilih surah untuk memulai</small></div>›</button>';
 return '<section class="hero"><label>ASSALAMUALAIKUM</label><h1>Temukan ketenangan<br>di setiap <i>ayat-Nya.</i></h1><p>Luangkan waktu sejenak untuk membaca Al-Qur’an hari ini.</p><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></section><section class="panel verse"><label>AYAT PILIHAN</label><div class="arabic">فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</div><p>“Maka sesungguhnya bersama kesulitan ada kemudahan.”</p><small>QS. Al-Insyirah: 5</small></section><div class="heading"><label>LANJUTKAN PERJALANAN</label><h2>Terakhir dibaca</h2></div>'+last+'<div class="heading"><label>JELAJAHI</label><h2>Menu utama</h2></div><div class="tiles"><button data-page="quran"><b>۞</b>Mushaf<small>114 Surah</small></button><button data-page="bookmark"><b>♡</b>Bookmark<small>Ayat tersimpan</small></button><button data-page="ibadah"><b>☾</b>Ruang ibadah<small>Teman harian</small></button><button data-page="ibadah" data-tool="tasbih"><b>◉</b>Tasbih<small>Dzikir harian</small></button></div>';
}
function quran(){
 const list=S.surahs.filter(x=>(x.name+' '+x.englishName+' '+x.number).toLowerCase().includes(S.search.toLowerCase()));
 return '<div class="heading"><label>MUSHAF DIGITAL</label><h1>Al-Qur’an</h1><p>Jelajahi 114 surah dan 30 juz.</p></div><div class="search">⌕ <input id="search" placeholder="Cari nama surah..." value="'+esc(S.search)+'"></div><div class="switch"><button class="selected" data-list="surah">Daftar Surah</button><button data-list="juz">Daftar Juz</button></div><div id="list">'+(S.loading?'<p class="empty">Memuat daftar surah...</p>':list.map(card).join('')||'<p class="empty">Surah tidak ditemukan.</p>')+'</div>';
}
function card(s){return '<button class="surah" data-open="'+s.number+'"><span class="number">'+s.number+'</span><span><b>'+esc(s.name)+'</b><small>'+esc(s.englishName)+' · '+s.numberOfAyahs+' ayat</small></span><strong>'+esc(s.name)+'</strong></button>';}
function detail(){
 if(!S.surah)return '<p class="empty">Memuat ayat...</p>';
 const a=S.surah[0],t=S.surah[1];
 const isJuz=S.detailType==='juz';
 return '<button class="back" data-page="quran">‹ Kembali ke daftar</button><section class="surah-hero"><label>'+(isJuz?'AL-QUR’AN · JUZ':'SURAH '+a.number)+'</label><h1>'+esc(S.detailName||a.name)+'</h1><p>'+a.numberOfAyahs+' Ayat</p></section><div class="arabic bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>'+a.ayahs.map((v,i)=>{const surahNumber=v.surah?.number||a.number;const surahName=v.surah?.name||a.name;const saved=S.bookmarks.some(b=>b.surah===surahNumber&&b.ayah===v.numberInSurah);const surahTag=isJuz&&i>0&&a.ayahs[i-1].surah?.number!==surahNumber?'<small class="ayah-surah">'+esc(surahName)+'</small>':'';return '<article class="ayah" id="ayah-'+surahNumber+'-'+v.numberInSurah+'">'+surahTag+'<div class="ayah-top"><span class="number">'+v.numberInSurah+'</span><div class="ayah-actions"><button class="read-mark" data-progress="'+surahNumber+':'+v.numberInSurah+'" data-name="'+esc(surahName)+'">Tandai dibaca</button><button class="heart '+(saved?'saved':'')+'" data-save="'+surahNumber+':'+v.numberInSurah+'" data-name="'+esc(surahName)+'" data-ar="'+esc(v.text)+'" data-tr="'+esc(t.ayahs[i]?.text||'')+'">'+(saved?'♥':'♡')+'</button></div></div><div class="arabic">'+v.text+'</div><p>'+esc(t.ayahs[i]?.text||'')+'</p></article>';}).join('');
}
function bookmarks(){
 return '<div class="heading"><label>KOLEKSI PRIBADI</label><h1>Ayat tersimpan</h1><p>Ayat pilihan yang ingin dibaca kembali.</p></div>'+(S.bookmarks.length?S.bookmarks.map(b=>'<button class="saved" data-open="'+b.surah+'" data-ayah="'+b.ayah+'"><b>♥</b><span><strong>'+esc(b.name)+' · Ayat '+b.ayah+'</strong><small>'+esc(b.translation)+'</small></span>›</button>').join(''):'<div class="panel empty">♡<br><b>Belum ada ayat tersimpan</b><p>Tekan ikon hati pada ayat untuk menyimpannya.</p></div>');
}
function ibadah(){
 return '<div class="heading"><label>TEMAN IBADAH</label><h1>Ruang ibadah</h1><p>Lengkapi rutinitas ibadah harianmu.</p></div><div class="feature-list"><button data-tool="prayer">☼ <span><b>Jadwal salat</b><small>Waktu salat berdasarkan lokasi</small></span>›</button><button data-tool="qibla">⌖ <span><b>Arah kiblat</b><small>Hitung arah Ka’bah</small></span>›</button><button data-tool="tasbih">◉ <span><b>Tasbih digital</b><small>Hitung dzikir harian</small></span>›</button><button data-tool="duas">☾ <span><b>Doa harian</b><small>Doa pilihan</small></span>›</button><button data-tool="asma">✧ <span><b>Asmaul Husna</b><small>Nama-nama Allah</small></span>›</button></div><div id="tool"></div>';
}
async function load(){
 if(S.surahs.length)return;S.loading=true;render();
 try{S.surahs=await getSurahs();}catch(e){toast(e.message);}
 S.loading=false;render();
}
async function openSurah(n,ayah=1){
 S.page='detail';S.detailType='surah';S.detailName='';S.surah=null;render();
 try{S.surah=await getSurah(n);const info=S.surahs.find(x=>x.number===Number(n));S.last={number:Number(n),name:info?.name||S.surah[0].name,ayah:Number(ayah)||1};localStorage.setItem('quran-last-read',JSON.stringify(S.last));}
 catch(e){toast(e.message);S.page='quran';}
 render();window.scrollTo(0,0);
 if(S.surah){const target=document.getElementById('ayah-'+Number(n)+'-'+(Number(ayah)||1));if(target)target.scrollIntoView({behavior:'smooth',block:'center'});}
}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),3000);}
async function position(){return new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok(p.coords),()=>no(Error('Akses lokasi ditolak atau tidak tersedia.')),{enableHighAccuracy:true,timeout:12000}):no(Error('Lokasi tidak didukung.')));}
function tool(name){
 const box=document.querySelector('#tool');if(!box)return;
 if(name==='tasbih')box.innerHTML='<div class="panel tool"><label>DZIKIR HARIAN</label><h2>Tasbih Digital</h2><div class="count" id="count">'+tasbih+'</div><p>Subhanallah · Alhamdulillah · Allahu Akbar</p><button class="gold-button" id="tap">TAP UNTUK BERDZIKIR</button><button class="reset" id="reset">Atur ulang</button></div>';
 if(name==='duas')box.innerHTML='<div class="panel tool"><label>DOA HARIAN</label><h2>Doa sebelum tidur</h2><div class="arabic">بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا</div><p>“Dengan nama-Mu, ya Allah, aku mati dan aku hidup.”</p><small>HR. Bukhari</small></div>';
 if(name==='asma')box.innerHTML='<div class="panel tool"><label>ASMAUL HUSNA</label><h2>99 Nama Allah</h2><div class="arabic">الرَّحْمَٰنُ</div><b>Ar-Rahman</b><p>Yang Maha Pengasih</p><small>Daftar lengkap akan dilengkapi pada tahap berikutnya.</small></div>';
 if(name==='prayer'||name==='qibla')box.innerHTML='<div class="panel tool"><label>IBADAH</label><h2>'+(name==='prayer'?'Jadwal salat':'Arah kiblat')+'</h2><p>Izinkan lokasi perangkat untuk menghitung '+(name==='prayer'?'waktu salat':'arah kiblat')+'.</p><button class="gold-button" id="locate">Gunakan lokasi saya</button><div id="result"></div></div>';
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.page){S.page=b.dataset.page;render();if(S.page==='quran')load();}
 if(b.dataset.open)openSurah(b.dataset.open,b.dataset.ayah||1);
 if(b.dataset.list==='juz'){document.querySelector('#list').innerHTML=Array.from({length:30},(_,i)=>'<button class="surah" data-juz="'+(i+1)+'"><span class="number">'+(i+1)+'</span><span><b>Juz '+(i+1)+'</b><small>Buka bagian juz '+(i+1)+'</small></span><strong>جزء</strong></button>').join('');}
 if(b.dataset.list==='surah'){S.search='';render();}
 if(b.dataset.tool)tool(b.dataset.tool);
 if(b.dataset.progress){const [s,a]=b.dataset.progress.split(':').map(Number);S.last={number:s,name:b.dataset.name,ayah:a};localStorage.setItem('quran-last-read',JSON.stringify(S.last));toast('Terakhir dibaca disimpan: '+b.dataset.name+' ayat '+a);render();}
 if(b.dataset.save){const [s,a]=b.dataset.save.split(':').map(Number);const i=S.bookmarks.findIndex(x=>x.surah===s&&x.ayah===a);if(i>=0)S.bookmarks.splice(i,1);else S.bookmarks.push({surah:s,ayah:a,name:b.dataset.name,text:b.dataset.ar,translation:b.dataset.tr});save();render();}
 if(b.dataset.juz){S.page='detail';S.detailType='juz';S.detailName='Juz '+b.dataset.juz;S.surah=null;render();try{const pair=await getJuz(b.dataset.juz);const ar=pair[0],tr=pair[1];S.surah=[{number:ar.ayahs[0].surah.number,name:S.detailName,englishName:S.detailName,numberOfAyahs:ar.ayahs.length,ayahs:ar.ayahs.map(x=>({...x,numberInSurah:x.numberInSurah}))},{ayahs:tr.ayahs.map(x=>({text:x.text}))}];}catch(err){toast(err.message);S.page='quran';}render();}
 if(b.id==='tap'){tasbih++;document.querySelector('#count').textContent=tasbih;}
 if(b.id==='reset'){tasbih=0;document.querySelector('#count').textContent=0;}
 if(b.id==='locate'){const out=document.querySelector('#result');out.textContent='Mengambil lokasi...';try{const c=await position();const url=b.closest('.tool').querySelector('h2').textContent.includes('salat')?'https://api.aladhan.com/v1/timings?latitude='+c.latitude+'&longitude='+c.longitude+'&method=20':'https://api.aladhan.com/v1/qibla/'+c.latitude+'/'+c.longitude;const r=await fetch(url);const j=await r.json();if(j.code!==200)throw Error('Data tidak tersedia.');if(j.data.timings){const t=j.data.timings;out.innerHTML='<div class="prayer-grid">'+[['Subuh',t.Fajr],['Terbit',t.Sunrise],['Zuhur',t.Dhuhr],['Asar',t.Asr],['Magrib',t.Maghrib],['Isya',t.Isha]].map(x=>'<div><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('')+'</div>';}else out.innerHTML='<div class="count">'+Number(j.data.direction).toFixed(1)+'°</div><p>Arah kiblat dari utara searah jarum jam.</p>';}catch(err){out.textContent=err.message;}}
});
document.addEventListener('input',e=>{if(e.target.id==='search'){S.search=e.target.value;const arr=S.surahs.filter(x=>(x.name+' '+x.englishName+' '+x.number).toLowerCase().includes(S.search.toLowerCase()));document.querySelector('#list').innerHTML=arr.map(card).join('')||'<p class="empty">Surah tidak ditemukan.</p>'; }});
render();
