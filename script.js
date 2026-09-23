// Ambil harga & kontak dari prices.js (harus di-load SEBELUM file ini di index.html)
function ov(key, fallback){
  const val = (typeof KAYZ_PRICES !== 'undefined') ? KAYZ_PRICES[key] : undefined;
  return (val !== undefined && val !== null && val !== '') ? val : fallback;
}

const SERVICES = {
'Instagram (IG)': [
{label:'Like', rate:Number(ov('ig_like_rate',10)), unit:'like', min:Number(ov('ig_like_min',10)), presets:[10,100,250,500]},
{label:'Views', rate:Number(ov('ig_views_rate',1)), unit:'views', min:Number(ov('ig_views_min',100)), presets:[100,1000,5000,10000]},
{label:'Followers', rate:Number(ov('ig_followers_rate',50)), unit:'followers', min:Number(ov('ig_followers_min',20)), presets:[20,100,250,500]}
],
'TikTok (TT)': [
{label:'Like', rate:Number(ov('tt_like_rate',10)), unit:'like', min:Number(ov('tt_like_min',10)), presets:[10,100,250,500]},
{label:'Views', rate:Number(ov('tt_views_rate',1)), unit:'views', min:Number(ov('tt_views_min',100)), presets:[100,500,1000,5000]},
{label:'Followers', rate:Number(ov('tt_followers_rate',50)), unit:'followers', min:Number(ov('tt_followers_min',10)), presets:[10,50,100,500]}
],
'WhatsApp (WA)': [
{label:'Pengikut', rate:Number(ov('wa_pengikut_rate',10)), unit:'pengikut', min:Number(ov('wa_pengikut_min',10)), presets:[10,100,250,500]},
{label:'Reaction', rate:Number(ov('wa_reaction_rate',1)), unit:'reaction', min:Number(ov('wa_reaction_min',10)), presets:[10,100,1000,5000], note:'Pilih mix acak atau 1 emoji'},
{label:'Polling Vote', rate:Number(ov('wa_vote_rate',40)), unit:'vote', min:Number(ov('wa_vote_min',10)), presets:[10,25,50,100]}
]
};
const platformRow = document.getElementById('platformRow');
const layananRow = document.getElementById('layananRow');
const reactionField = document.getElementById('reactionField');
const reactionRow = document.getElementById('reactionRow');
const rateHint = document.getElementById('rateHint');
const jumlah = document.getElementById('jumlah');
const qtyQuick = document.getElementById('qtyQuick');
const target = document.getElementById('target');
const orderBtn = document.getElementById('orderBtn');
const toast = document.getElementById('toast');
const bdLayanan = document.getElementById('bdLayanan');
const bdRate = document.getElementById('bdRate');
const bdJumlah = document.getElementById('bdJumlah');
const bdTotal = document.getElementById('bdTotal');
let currentService = null; // {label, rate, unit, platform}
let reactionChoice = null; // {label, emoji}
function fmtRp(n){
return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}
function setupSingleSelect(row, onChange){
row.querySelectorAll('.chip').forEach(chip => {
chip.addEventListener('click', () => {
row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
chip.classList.add('active');
row.closest('.field').classList.remove('invalid');
if(onChange) onChange(chip);
});
});
}
setupSingleSelect(platformRow, (chip) => {
renderLayanan(chip.dataset.val);
});
function renderLayanan(platform){
const list = SERVICES[platform] || [];
layananRow.innerHTML = '';
list.forEach(svc => {
const btn = document.createElement('button');
btn.className = 'chip pink';
btn.textContent = svc.label;
btn.dataset.rate = svc.rate;
btn.dataset.unit = svc.unit;
btn.dataset.label = svc.label;
btn.dataset.min = svc.min;
btn.dataset.presets = svc.presets.join(',');
btn.dataset.note = svc.note || '';
layananRow.appendChild(btn);
});
currentService = null;
rateHint.textContent = '';
jumlah.value = '';
jumlah.min = 1;
qtyQuick.innerHTML = '';
updateBreakdown();
layananRow.querySelectorAll('.chip').forEach(chip => {
chip.addEventListener('click', () => {
layananRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
chip.classList.add('active');
layananRow.closest('.field').classList.remove('invalid');
currentService = {
label: chip.dataset.label,
rate: Number(chip.dataset.rate),
unit: chip.dataset.unit,
min: Number(chip.dataset.min),
presets: chip.dataset.presets.split(',').map(Number),
note: chip.dataset.note,
platform: platform
};
jumlah.min = currentService.min;
rateHint.textContent = `Tarif: ${fmtRp(currentService.rate)} per ${currentService.unit} · minimal ${currentService.min.toLocaleString('id-ID')} ${currentService.unit}` + (currentService.note ? ` · ${currentService.note}` : '');
renderQtyQuick(currentService);
reactionChoice = null;
if(currentService.unit === 'reaction'){
reactionField.style.display = 'block';
reactionRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
} else {
reactionField.style.display = 'none';
}
updateBreakdown();
});
});
}
setupSingleSelect(reactionRow, (chip) => {
reactionChoice = { label: chip.dataset.val, emoji: chip.dataset.emoji };
});
function renderQtyQuick(svc){
qtyQuick.innerHTML = '';
svc.presets.forEach(p => {
const b = document.createElement('button');
b.type = 'button';
b.className = 'qty-btn';
b.textContent = p.toLocaleString('id-ID');
b.addEventListener('click', () => {
jumlah.value = p;
jumlah.closest('.field').classList.remove('invalid');
updateBreakdown();
});
qtyQuick.appendChild(b);
});
}
function getActiveVal(row){
const el = row.querySelector('.chip.active');
return el ? el.dataset.val : null;
}
function updateBreakdown(){
if(!currentService || !jumlah.value || Number(jumlah.value) <= 0){
bdLayanan.textContent = currentService ? `${currentService.label} (${currentService.platform})` : '-';
bdRate.textContent = currentService ? `${fmtRp(currentService.rate)} / ${currentService.unit}` : '-';
bdJumlah.textContent = '-';
bdTotal.textContent = fmtRp(0);
return;
}
const qty = Number(jumlah.value);
const total = qty * currentService.rate;
bdLayanan.textContent = `${currentService.label} (${currentService.platform})`;
bdRate.textContent = `${fmtRp(currentService.rate)} / ${currentService.unit}`;
bdJumlah.textContent = `${qty.toLocaleString('id-ID')} ${currentService.unit}`;
bdTotal.textContent = fmtRp(total);
}
jumlah.addEventListener('input', updateBreakdown);
function clearErrors(){
document.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));
document.querySelectorAll('.err').forEach(e => e.classList.remove('show'));
}
function validate(){
clearErrors();
let valid = true;
const platform = getActiveVal(platformRow);
if(!platform){
platformRow.closest('.field').classList.add('invalid');
document.getElementById('err-platform').classList.add('show');
valid = false;
}
if(!currentService){
layananRow.closest('.field').classList.add('invalid');
document.getElementById('err-layanan').classList.add('show');
valid = false;
}
if(!jumlah.value || Number(jumlah.value) <= 0){
jumlah.closest('.field').classList.add('invalid');
document.getElementById('err-jumlah').textContent = 'Jumlah wajib diisi (minimal 1).';
document.getElementById('err-jumlah').classList.add('show');
valid = false;
} else if(currentService && Number(jumlah.value) < currentService.min){
jumlah.closest('.field').classList.add('invalid');
document.getElementById('err-jumlah').textContent = `Jumlah minimal ${currentService.min.toLocaleString('id-ID')} ${currentService.unit}.`;
document.getElementById('err-jumlah').classList.add('show');
valid = false;
}
if(currentService && currentService.unit === 'reaction' && !reactionChoice){
reactionField.classList.add('invalid');
document.getElementById('err-reaction').classList.add('show');
valid = false;
}
if(!target.value.trim()){
target.closest('.field').classList.add('invalid');
document.getElementById('err-target').classList.add('show');
valid = false;
}
return valid;
}
function buildText(){
const platform = getActiveVal(platformRow);
const qty = Number(jumlah.value);
const total = qty * currentService.rate;
const targetVal = target.value.trim();
const layananLabel = currentService.unit === 'reaction' && reactionChoice
? `Reaction (${reactionChoice.label})`
: currentService.label;
return `*꒰꒰͡🔮 ִ ׄ SUNTIK SOSIAL MEDIA*\n\n˙ . platform/aplikasi : ${platform}\n˙ . layanan suntik : ${layananLabel}\n˙ . jumlah : ${qty.toLocaleString('id-ID')} ${currentService.unit}\n˙ . target : ${targetVal}\n˙ . total harga : ${fmtRp(total)}`;
}
const WA_NUMBER = ov('wa_number', '6285142017734');
const WA_CHANNEL = ov('wa_channel', 'https://wa.me/channel/xxxxxxxx');
const WA_GROUP = ov('wa_group', 'https://chat.whatsapp.com/xxxxxxxx');
orderBtn.addEventListener('click', () => {
if(!validate()) return;
const text = buildText();
const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
toast.classList.add('show');
setTimeout(() => toast.classList.remove('show'), 2200);
window.open(url, '_blank');
});
function renderRateGrid(){
const grid = document.getElementById('rateGrid');
if(!grid) return;
const ig = SERVICES['Instagram (IG)'];
const tt = SERVICES['TikTok (TT)'];
const wa = SERVICES['WhatsApp (WA)'];
const find = (list, label) => list.find(s => s.label === label);
const igLike = find(ig,'Like'), ttLike = find(tt,'Like');
const igViews = find(ig,'Views'), ttViews = find(tt,'Views');
const igFol = find(ig,'Followers'), ttFol = find(tt,'Followers');
const waPeng = find(wa,'Pengikut');
const waReact = find(wa,'Reaction');
const waVote = find(wa,'Polling Vote');
grid.innerHTML = `
<div class="rate-card"><b>${fmtRp(igLike.rate)}</b><span>per Like — IG min ${igLike.min}, TT min ${ttLike.min}</span></div>
<div class="rate-card"><b>${fmtRp(igViews.rate)}</b><span>per View — IG min ${igViews.min}, TT min ${ttViews.min}</span></div>
<div class="rate-card"><b>${fmtRp(waPeng.rate)}</b><span>per Pengikut (WA, min ${waPeng.min})</span></div>
<div class="rate-card"><b>${fmtRp(igFol.rate)}</b><span>per Followers — IG min ${igFol.min}, TT min ${ttFol.min}</span></div>
<div class="rate-card"><b>${fmtRp(waReact.rate)}</b><span>per Reaction (WA, min ${waReact.min}, pilih mix atau 1 emoji)</span></div>
<div class="rate-card"><b>${fmtRp(waVote.rate)}</b><span>per Vote Polling (WA, min ${waVote.min})</span></div>
`;
}
renderRateGrid();
const marqueeBar = document.getElementById('marqueeBar');
const marqueeTrack = document.getElementById('marqueeTrack');
const helpOverlay = document.getElementById('helpOverlay');
const helpClose = document.getElementById('helpClose');
const helpChat = document.getElementById('helpChat');
const helpChannel = document.getElementById('helpChannel');
const helpGroup = document.getElementById('helpGroup');
const marqueeMsg = '📣 Perlu bantuan? Ketuk di sini untuk chat admin, gabung saluran & group Kayz';
marqueeTrack.innerHTML = `<span>${marqueeMsg}</span><span>${marqueeMsg}</span>`;
helpChat.href = `https://wa.me/${WA_NUMBER}`;
helpChannel.href = WA_CHANNEL;
helpGroup.href = WA_GROUP;
function openHelp(){ helpOverlay.classList.add('show'); }
function closeHelp(){ helpOverlay.classList.remove('show'); }
marqueeBar.addEventListener('click', openHelp);
helpClose.addEventListener('click', closeHelp);
helpOverlay.addEventListener('click', (e) => {
if(e.target === helpOverlay) closeHelp();
});
const tutSteps = [
{
icon:'👋', title:'Selamat datang di Kayz!',
body:'Bingung mulai dari mana? Ikuti langkah-langkah cepat ini biar order kamu langsung diproses tanpa ribet.',
target:null
},
{
icon:'1️⃣', title:'Pilih Platform',
body:'Klik salah satu platform dulu: <b>IG</b> (Instagram), <b>TT</b> (TikTok), atau <b>WA</b> (WhatsApp).',
target:'platformRow'
},
{
icon:'2️⃣', title:'Pilih Layanan Suntik',
body:'Setelah platform dipilih, opsi layanan bakal muncul di sini — pilih salah satu: Like, Views, Followers, Pengikut, Reaction, atau Polling Vote.',
target:'layananRow'
},
{
icon:'3️⃣', title:'Isi Jumlah',
body:'Masukin jumlah sesuai kebutuhan kamu di sini. Perhatikan <b>minimal</b> tiap layanan ya, ada catatan tarifnya di bawah kolom ini.',
target:'jumlah'
},
{
icon:'4️⃣', title:'Isi Target',
body:'Masukin link postingan atau username target di sini — pastikan linknya benar dan bisa diakses publik.',
target:'target'
},
{
icon:'5️⃣', title:'Cek Total & Kirim Pesanan',
body:'Total harga otomatis muncul di bagian rincian ini. Kalau sudah pas, klik tombol ini — WhatsApp bakal kebuka otomatis dengan pesanan lengkap kamu.',
target:['breakdownBox','orderBtn']
}
];
let tutIndex = 0;
let spotlightRAF = null;
const tutOverlay = document.getElementById('tutOverlay');
const tutIcon = document.getElementById('tutIcon');
const tutTitle = document.getElementById('tutTitle');
const tutBody = document.getElementById('tutBody');
const tutStepLabel = document.getElementById('tutStepLabel');
const tutDots = document.getElementById('tutDots');
const tutBack = document.getElementById('tutBack');
const tutNext = document.getElementById('tutNext');
const tutSkip = document.getElementById('tutSkip');
const helpFab = document.getElementById('helpFab');
function renderTutStep(){
const step = tutSteps[tutIndex];
tutIcon.textContent = step.icon;
tutTitle.textContent = step.title;
tutBody.innerHTML = step.body;
tutStepLabel.textContent = `Langkah ${tutIndex + 1}/${tutSteps.length}`;
tutDots.innerHTML = '';
tutSteps.forEach((_, i) => {
const d = document.createElement('span');
d.className = 'tut-dot' + (i === tutIndex ? ' active' : '');
tutDots.appendChild(d);
});
tutBack.classList.toggle('hidden', tutIndex === 0);
tutNext.textContent = tutIndex === tutSteps.length - 1 ? 'Mulai Order' : 'Lanjut';
moveSpotlight(step.target);
}

function moveSpotlight(target){
const box = document.getElementById('tutHighlight');
box.classList.remove('show');
if(spotlightRAF){ cancelAnimationFrame(spotlightRAF); spotlightRAF = null; }
if(!target){
const cx = window.innerWidth / 2;
const cy = window.innerHeight / 2;
box.style.top = cy + 'px';
box.style.left = cx + 'px';
box.style.width = '0px';
box.style.height = '0px';
requestAnimationFrame(() => box.classList.add('show'));
return;
}
const ids = Array.isArray(target) ? target : [target];
// Highlight the whole labeled field (number + title + input), not just the
// bare input/chip-row, so steps like "2 Layanan Suntik" zoom in on the
// heading too instead of only the small hint text inside it.
const els = ids.map(id => document.getElementById(id))
.filter(Boolean)
.map(el => el.closest('.field') || el);
if(els.length === 0){
return;
}
// The tutorial modal is pinned to the bottom of the screen, so scrolling
// must leave room for it instead of centering blindly (which can hide
// the highlighted element, e.g. the WhatsApp order button, behind it).
const modal = document.querySelector('.tut-modal');
const modalHeight = modal ? modal.getBoundingClientRect().height : 0;
const safeTop = 20;
const safeBottom = modalHeight + 20;
const rects0 = els.map(el => el.getBoundingClientRect());
const docTop = Math.min(...rects0.map(r => r.top)) + window.scrollY;
const docBottom = Math.max(...rects0.map(r => r.bottom)) + window.scrollY;
const elHeight = docBottom - docTop;
const availableHeight = Math.max(window.innerHeight - safeTop - safeBottom, 50);
let targetScroll;
if(elHeight <= availableHeight){
targetScroll = docTop - safeTop - (availableHeight - elHeight) / 2;
} else {
targetScroll = docTop - safeTop;
}
window.scrollTo({top: Math.max(targetScroll, 0), behavior:'smooth'});
// Different browsers finish (or fake) smooth scrolling at very different
// speeds, so guessing a fixed delay before measuring the element's
// position is unreliable — on some phones it fires too early and the
// highlight box lands in the wrong spot. Instead, keep re-measuring the
// element every frame for a little while so the box continuously tracks
// wherever it actually is and always ends up correct, no matter how the
// browser scrolls.
if(spotlightRAF) cancelAnimationFrame(spotlightRAF);
const trackUntil = performance.now() + 1500;
function trackBox(){
const rects = els.map(el => el.getBoundingClientRect());
const top = Math.min(...rects.map(r => r.top));
const left = Math.min(...rects.map(r => r.left));
const right = Math.max(...rects.map(r => r.right));
const bottom = Math.max(...rects.map(r => r.bottom));
const pad = 10;
box.style.top = (top - pad) + 'px';
box.style.left = (left - pad) + 'px';
box.style.width = (right - left + pad * 2) + 'px';
box.style.height = (bottom - top + pad * 2) + 'px';
box.classList.add('show');
if(performance.now() < trackUntil){
spotlightRAF = requestAnimationFrame(trackBox);
} else {
spotlightRAF = null;
}
}
trackBox();
}
function openTutorial(){
tutIndex = 0;
renderTutStep();
tutOverlay.classList.add('show');
}
function closeTutorial(){
tutOverlay.classList.remove('show');
document.getElementById('tutHighlight').classList.remove('show');
if(spotlightRAF){ cancelAnimationFrame(spotlightRAF); spotlightRAF = null; }
try { localStorage.setItem('kayz_suntik_tutorial_seen', '1'); } catch(e) {}
// When the tutorial ends, bring the user back up to the top of the form
// (Platform/Aplikasi) so they start filling it out from step 1, with no
// leftover highlight box.
const first = document.getElementById('platformRow');
const firstField = first ? (first.closest('.field') || first) : null;
if(firstField){
firstField.scrollIntoView({behavior:'smooth', block:'start'});
} else {
window.scrollTo({top: 0, behavior:'smooth'});
}
}
tutNext.addEventListener('click', () => {
tutNext.disabled = true;
document.getElementById('tutHighlight').classList.remove('show');
setTimeout(() => {
if(tutIndex < tutSteps.length - 1){
tutIndex++;
renderTutStep();
} else {
closeTutorial();
}
tutNext.disabled = false;
}, 1000);
});
tutBack.addEventListener('click', () => {
if(tutIndex > 0){
tutIndex--;
renderTutStep();
}
});
tutSkip.addEventListener('click', closeTutorial);
helpFab.addEventListener('click', openTutorial);
try {
if(!localStorage.getItem('kayz_suntik_tutorial_seen')){
setTimeout(openTutorial, 700);
}
} catch(e) { /* localStorage blocked, skip auto-tutorial */ }