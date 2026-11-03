// Ambil harga & kontak dari prices.js (harus di-load SEBELUM file ini di index.html)
function ov(key, fallback){
  const val = (typeof KAYZ_PRICES !== 'undefined') ? KAYZ_PRICES[key] : undefined;
  return (val !== undefined && val !== null && val !== '') ? val : fallback;
}

const SERVICES = {
'Instagram (IG)': [
{label:'Like', rate:Number(ov('ig_like_rate',10)), unit:'like', min:Number(ov('ig_like_min',10)), permanent:ov('ig_like_permanent',true), presets:[10,100,250,500]},
{label:'Views', rate:Number(ov('ig_views_rate',1)), unit:'views', min:Number(ov('ig_views_min',100)), permanent:ov('ig_views_permanent',true), presets:[100,1000,5000,10000]},
{label:'Followers', rate:Number(ov('ig_followers_rate',50)), unit:'followers', min:Number(ov('ig_followers_min',20)), permanent:ov('ig_followers_permanent',false), presets:[20,100,250,500]}
],
'TikTok (TT)': [
{label:'Like', rate:Number(ov('tt_like_rate',10)), unit:'like', min:Number(ov('tt_like_min',10)), permanent:ov('tt_like_permanent',true), presets:[10,100,250,500]},
{label:'Views', rate:Number(ov('tt_views_rate',1)), unit:'views', min:Number(ov('tt_views_min',100)), permanent:ov('tt_views_permanent',true), presets:[100,500,1000,5000]},
{label:'Followers', rate:Number(ov('tt_followers_rate',50)), unit:'followers', min:Number(ov('tt_followers_min',10)), permanent:ov('tt_followers_permanent',false), presets:[10,50,100,500]}
],
'WhatsApp (WA)': [
{label:'Pengikut', rate:Number(ov('wa_pengikut_rate',10)), unit:'pengikut', min:Number(ov('wa_pengikut_min',10)), permanent:ov('wa_pengikut_permanent',false), presets:[10,100,250,500]},
{label:'Reaction', rate:Number(ov('wa_reaction_rate',1)), unit:'reaction', min:Number(ov('wa_reaction_min',10)), permanent:ov('wa_reaction_permanent',true), presets:[10,100,1000,5000], note:'Pilih mix acak atau 1 emoji'},
{label:'Polling Vote', rate:Number(ov('wa_vote_rate',40)), unit:'vote', min:Number(ov('wa_vote_min',10)), permanent:ov('wa_vote_permanent',true), presets:[10,25,50,100]}
]
};
function permText(isPerm){
return isPerm
? ov('note_permanent','Permanen (tidak akan turun)')
: ov('note_nonpermanent','Tidak permanen (bisa turun sewaktu-waktu)');
}

// ---------- ANTI-UBAH-HARGA (dipakai bareng oleh script.js & verify.html) ----------
function deepFreeze(o){
Object.values(o).forEach(v => { if(v && typeof v === 'object') deepFreeze(v); });
return Object.freeze(o);
}
deepFreeze(SERVICES);
if(typeof KAYZ_PRICES !== 'undefined') Object.freeze(KAYZ_PRICES);

const MAX_QTY = 1000000;

function fmtRp(n){
return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}
function calcTotal(svc, qty){
return Math.round(svc.rate * qty);
}
function findService(platform, label){
return (SERVICES[platform] || []).find(s => s.label === label) || null;
}

// Hash kecil (cyrb53) buat kode verifikasi pesanan
function cyrb53(str, seed){
let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
for(let i = 0, ch; i < str.length; i++){
ch = str.charCodeAt(i);
h1 = Math.imul(h1 ^ ch, 2654435761);
h2 = Math.imul(h2 ^ ch, 1597334677);
}
h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const SIGN_SALT = 'kayz.id/2026';
function orderCode(o){
const s = [o.platform, o.layanan, o.qty, o.total, o.target].join('|') + '|' + SIGN_SALT;
return 'KZ-' + cyrb53(s, 7).toString(36).toUpperCase().padStart(8, '0');
}
