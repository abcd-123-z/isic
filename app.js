const audio=document.getElementById('audio');
const content=document.getElementById('content');
const search=document.getElementById('search');
const state={tracks:[],current:-1,shuffle:false,repeat:false,view:'home',favorites:new Set(JSON.parse(localStorage.getItem('favorites')||'[]')),folderName:''};

const $=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=s=>{if(!isFinite(s))return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60);return`${m}:${String(sec).padStart(2,'0')}`};
const saveFav=()=>localStorage.setItem('favorites',JSON.stringify([...state.favorites]));
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function render(){
  const q=search.value.trim().toLowerCase();
  let list=state.tracks.filter(t=>!q || `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q));
  if(state.view==='favorites') list=list.filter(t=>state.favorites.has(t.id));
  const title=state.view==='home'?'เพลงของคุณ':state.view==='library'?'คลังเพลง':state.view==='favorites'?'รายการโปรด':'เพลย์ลิสต์';
  let body='';
  if(!state.tracks.length) body=`<div class="hero"><h1>เพลงของคุณ</h1><p class="muted">ไม่มีโฆษณา ไม่มีบัญชี และเพลงไม่ต้องอัปโหลดขึ้นอินเทอร์เน็ต</p></div><div class="empty"><h2>เริ่มต้นใช้งาน</h2><p>กด “เพิ่มโฟลเดอร์เพลง” แล้วเลือกโฟลเดอร์ที่มีไฟล์เพลงของคุณ</p><button class="outline" onclick="pickFolder()">＋ เลือกโฟลเดอร์เพลง</button><p class="muted">รองรับ MP3, M4A, AAC, WAV, OGG, FLAC*<br><small>*การเล่น FLAC ขึ้นกับ browser</small></p></div>`;
  else body=`<div class="hero"><h1>${esc(title)}</h1><p class="muted">${list.length} เพลง${state.folderName?' · '+esc(state.folderName):''}</p></div><table class="table"><tbody>${list.map((t,i)=>`<tr onclick="playId('${t.id}')"><td>${i+1}</td><td><strong>${esc(t.title)}</strong><div class="sub">${esc(t.artist||'ไม่ทราบศิลปิน')}</div></td><td>${esc(t.album||'')}</td><td>${fmt(t.duration)}</td><td><button class="icon-btn" onclick="event.stopPropagation();toggleFavorite('${t.id}')">${state.favorites.has(t.id)?'♥':'♡'}</button></td></tr>`).join('')}</tbody></table>`;
  content.innerHTML=body;
}
async function pickFolder(){
  if(!window.showDirectoryPicker){toast('Browser นี้ยังไม่รองรับการเลือกโฟลเดอร์โดยตรง');return}
  try{
    const dir=await window.showDirectoryPicker({mode:'read'});
    state.folderName=dir.name; state.tracks=[];
    await scanDir(dir);
    state.tracks.sort((a,b)=>a.title.localeCompare(b.title));
    $('storageStatus').textContent=`คลัง: ${state.folderName} · ${state.tracks.length} เพลง`;
    render(); toast(`เพิ่ม ${state.tracks.length} เพลงแล้ว`);
  }catch(e){if(e.name!=='AbortError')toast('ไม่สามารถอ่านโฟลเดอร์ได้')}
}
async function scanDir(dir){
  for await(const [name,handle] of dir.entries()){
    if(handle.kind==='file' && /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(name)){
      const file=await handle.getFile();
      const id=crypto.randomUUID();
      state.tracks.push({id,name,title:name.replace(/\.[^.]+$/,''),artist:'',album:'',duration:0,file});
    }else if(handle.kind==='directory') await scanDir(handle);
  }
}
window.pickFolder=pickFolder;
function playId(id){const i=state.tracks.findIndex(t=>t.id===id);if(i>=0)play(i)}
function play(i){
  state.current=i;const t=state.tracks[i];if(!t)return;
  audio.src=URL.createObjectURL(t.file);audio.play().catch(()=>toast('กดปุ่ม Play เพื่อเริ่มเล่น'));
  $('nowTitle').textContent=t.title;$('nowArtist').textContent=t.artist||'ไม่ทราบศิลปิน';
  $('favoriteBtn').textContent=state.favorites.has(t.id)?'♥':'♡';
  if('mediaSession' in navigator){
    navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'Yotra Music',album:t.album||''});
    navigator.mediaSession.setActionHandler('play',()=>audio.play());
    navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack',prev);
    navigator.mediaSession.setActionHandler('nexttrack',next);
    navigator.mediaSession.setActionHandler('seekbackward',()=>audio.currentTime=Math.max(0,audio.currentTime-10));
    navigator.mediaSession.setActionHandler('seekforward',()=>audio.currentTime=Math.min(audio.duration,audio.currentTime+10));
  }
}
function next(){
  if(!state.tracks.length)return;
  let i=state.current;
  if(state.shuffle)i=Math.floor(Math.random()*state.tracks.length);else i=(i+1)%state.tracks.length;
  play(i);
}
function prev(){if(audio.currentTime>3){audio.currentTime=0;return}let i=(state.current-1+state.tracks.length)%state.tracks.length;play(i)}
function toggleFavorite(id){state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);saveFav();if(state.current>=0 && state.tracks[state.current].id===id)$('favoriteBtn').textContent=state.favorites.has(id)?'♥':'♡';render()}
$('playBtn').onclick=()=>audio.paused?(state.current<0?play(0):audio.play()):audio.pause();
$('nextBtn').onclick=next;$('prevBtn').onclick=prev;
$('shuffleBtn').onclick=()=>{state.shuffle=!state.shuffle;$('shuffleBtn').style.color=state.shuffle?'#fff':'#aaa'};
$('repeatBtn').onclick=()=>{state.repeat=!state.repeat;$('repeatBtn').style.color=state.repeat?'#fff':'#aaa'};
$('favoriteBtn').onclick=()=>{if(state.current>=0)toggleFavorite(state.tracks[state.current].id)};
$('volume').oninput=e=>audio.volume=e.target.value;
$('progress').oninput=e=>{if(audio.duration)audio.currentTime=(e.target.value/100)*audio.duration};
audio.addEventListener('play',()=>{$('playBtn').textContent='Ⅱ'});
audio.addEventListener('pause',()=>{$('playBtn').textContent='▶'});
audio.addEventListener('loadedmetadata',()=>{$('duration').textContent=fmt(audio.duration);if(state.current>=0)state.tracks[state.current].duration=audio.duration});
audio.addEventListener('timeupdate',()=>{ $('currentTime').textContent=fmt(audio.currentTime); $('progress').value=audio.duration?(audio.currentTime/audio.duration)*100:0});
audio.addEventListener('ended',()=>{if(state.repeat){audio.currentTime=0;audio.play()}else next()});
search.oninput=render;
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()});
$('pickFolder').onclick=pickFolder;
$('mobileMenu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
audio.volume=.9;
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
