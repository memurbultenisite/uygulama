// Memur Bülteni – Instagram paylaşımlarını uygulamaya haber olarak aktarır.
// GitHub Actions saatte bir çalıştırır. Gizli değerler: IG_TOKEN (zorunlu), GH_PAT (isteğe bağlı, belirteç yenileme için).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HABER_DOSYA = path.join(KOK, "data/haberler.js");
const IG_KLASOR = path.join(KOK, "data/ig");
const DURUM_DOSYA = path.join(IG_KLASOR, "durum.json");
const ENFAZLA = 60;
const TOKEN = (process.env.IG_TOKEN || "").trim();
// EAA… ile başlayan belirteç: Facebook Graph (süresiz sistem kullanıcısı belirteci). IG… ile başlayan: Instagram Graph.
const FB_TIPI = TOKEN.startsWith("EAA");
const API = FB_TIPI ? "https://graph.facebook.com" : "https://graph.instagram.com";
const IG_ID = (process.env.IG_USER_ID || "17841480070033918").trim();
const TEST = process.env.IG_TEST_JSON; // yerel deneme için

/* ---------- Yardımcılar ---------- */
const lowerTr = s => String(s).replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
const istanbul = iso => {
  const d = new Date(iso);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map(x => [x.type, x.value]));
  return { tarih: `${p.year}-${p.month}-${p.day}`, saat: `${p.hour}:${p.minute}` };
};
const EMOJI_BAS = /^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}‍️•▪️►▶️➡️⚡️❗️‼️📢📣🔴🚨🟥⭕️✅☑️✔️|:\-–—]+/u;
const SONDAKIKA = /son\s*dak[iıİI]ka|🔴|🚨|#sondakika|acil\b|flaş|flas/i;

const KATEGORI = [
  ["İŞKUR", ["işkur", "iup", "işgücü uyum", "toplum yararına", "typ"]],
  ["KPSS & Sınav", ["kpss", "ösym", "sınav", "tercih", "ales", "yds", "ekpss", "taban puan"]],
  ["Maaş & Zam", ["maaş", "zam", "enflasyon farkı", "toplu sözleşme", "ikramiye", "katsayı", "ücret", "tazminat", "memur maaşı"]],
  ["Emeklilik", ["emekli", "eyt", "sgk", "prim gün"]],
  ["Sendika", ["sendika", "memur-sen", "kamu-sen", "kesk", "grev", "konfederasyon"]],
  ["Öğretmen", ["öğretmen", "meb", "okul", "milli eğitim", "millî eğitim", "akademi"]],
  ["Atama", ["atama", "tayin", "kararname", "görevden", "vali", "becayiş", "görevlendirme"]],
  ["Mevzuat", ["resmi gazete", "resmî gazete", "yönetmelik", "kanun", "genelge", "cumhurbaşkanı kararı", "teklif"]],
  ["Alım & İlan", ["alım", "alımı", "ilan", "personel alacak", "kadro", "başvuru", "sözleşmeli personel", "işçi alacak", "memur alacak"]]
];
function kategoriBul(metin, etiketler){
  const m = lowerTr(metin), e = etiketler.map(lowerTr).join(" ");
  let en = null, enP = 0;
  KATEGORI.forEach(([ad, kel], i) => {
    let p = 0;
    kel.forEach(k => { if (m.includes(k)) p += 1; if (e.includes(k.replace(/\s/g, ""))) p += 3; });
    if (p > enP) { en = ad; enP = p; }
  });
  return en || "Genel";
}
function kisalt(s, n){ if (s.length <= n) return s; const k = s.slice(0, n); const b = k.lastIndexOf(" "); return (b > n * 0.6 ? k.slice(0, b) : k).replace(/[\s,.;:–-]+$/, "") + "…"; }

/* Instagram açıklamasını başlık / özet / metin olarak böler */
export function cevir(g){
  const ham = (g.caption || "").replace(/\r/g, "");
  const etiketler = [...ham.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(x => x[1]);
  const satirlar = ham.split("\n").map(x => x.trim());
  // yalnızca etiket/mention içeren satırları ve "takip et" kalıplarını at
  const temiz = satirlar.filter(x => !/^([#@][\p{L}\p{N}_.]+\s*)+$/u.test(x) && !/takip\s*et|bildirimleri\s*aç|profil(imiz)?deki\s*link/i.test(x));
  const ilk = temiz.findIndex(x => /\p{L}/u.test(x));
  let baslik = ilk >= 0 ? temiz[ilk] : "";
  baslik = baslik.replace(EMOJI_BAS, "").replace(/^(son\s*dak[iıİI]ka|flaş|flas|flaş haber)\s*[:!\-–—|]*\s*/i, "").replace(EMOJI_BAS, "").replace(/\s*#[\p{L}\p{N}_]+/gu, "").trim();
  let govde = temiz.slice(ilk + 1).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (baslik.length > 110) { govde = (baslik + "\n\n" + govde).trim(); baslik = kisalt(baslik, 100); }
  if (!baslik) baslik = "Memur Bülteni paylaşımı";
  const ilkParagraf = govde.split(/\n\s*\n/)[0].replace(/\n/g, " ").replace(EMOJI_BAS, "").trim();
  const ozet = ilkParagraf ? kisalt(ilkParagraf, 200) : "";
  const metin = ozet && govde.startsWith(ilkParagraf) && ozet === ilkParagraf ? govde.slice(ilkParagraf.length).trim() : govde;
  const z = istanbul(g.timestamp);
  return {
    id: "ig_" + g.id,
    tarih: z.tarih, saat: z.saat,
    kategori: kategoriBul(ham, etiketler),
    manset: true,
    sonDakika: SONDAKIKA.test(ham) || undefined,
    baslik, ozet, metin,
    kaynak: "Memur Bülteni · Instagram",
    kaynakUrl: g.permalink,
    gorsel: null
  };
}

/* ---------- Instagram API ---------- */
async function ig(yol, param = {}){
  const u = new URL(API + yol);
  Object.entries({ ...param, access_token: TOKEN }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const m = j.error ? `${j.error.type || ""} ${j.error.code || ""}: ${j.error.message || ""}` : `HTTP ${r.status}`;
    throw new Error("Instagram API hatası – " + m);
  }
  return j;
}
async function paylasimlariGetir(){
  if (TEST) return JSON.parse(fs.readFileSync(TEST, "utf8")).data;
  const alan = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}";
  let j = await ig((FB_TIPI ? "/" + IG_ID : "/me") + "/media", { fields: alan, limit: 50 });
  let L = j.data || [];
  while (L.length < ENFAZLA && j.paging && j.paging.next) {
    const r = await fetch(j.paging.next); j = await r.json(); if (!j.data) break; L = L.concat(j.data);
  }
  return L.slice(0, ENFAZLA);
}
function gorselAdresi(g){
  if (g.media_type === "VIDEO") return g.thumbnail_url || null;
  if (g.media_type === "CAROUSEL_ALBUM") {
    const c = (g.children && g.children.data || [])[0];
    if (c) return c.media_type === "VIDEO" ? c.thumbnail_url : c.media_url;
  }
  return g.media_url || g.thumbnail_url || null;
}
async function gorselIndir(g){
  const dosya = path.join(IG_KLASOR, g.id + ".jpg");
  if (fs.existsSync(dosya)) return true;
  const u = gorselAdresi(g); if (!u) return false;
  if (TEST) { fs.writeFileSync(dosya, "test"); return true; }
  try {
    const r = await fetch(u); if (!r.ok) return false;
    fs.writeFileSync(dosya, Buffer.from(await r.arrayBuffer()));
    return true;
  } catch (e) { return false; }
}

/* ---------- Belirteç yenileme (60 gün geçerli, haftada bir yenilenir) ---------- */
async function belirteciYenile(durum){
  const pat = (process.env.GH_PAT || "").trim(), depo = process.env.GITHUB_REPOSITORY;
  if (!pat || !depo || TEST || FB_TIPI) return; // süresiz belirteç yenilenmez
  const son = durum.sonYenileme ? Date.parse(durum.sonYenileme) : 0;
  if (Date.now() - son < 7 * 864e5) return;
  try {
    const j = await ig("/refresh_access_token", { grant_type: "ig_refresh_token" });
    if (!j.access_token) return;
    console.log("::add-mask::" + j.access_token);
    execFileSync("gh", ["secret", "set", "IG_TOKEN", "--repo", depo], { input: j.access_token, env: { ...process.env, GH_TOKEN: pat }, stdio: ["pipe", "ignore", "inherit"] });
    durum.sonYenileme = new Date().toISOString();
    durum.gecerlilik = Math.round((j.expires_in || 0) / 86400) + " gün";
    console.log("Belirteç yenilendi.");
  } catch (e) { console.log("Belirteç yenilenemedi: " + e.message); }
}

/* ---------- Ana akış ---------- */
async function main(){
  if (!TOKEN && !TEST) { console.error("IG_TOKEN gizli değeri tanımlı değil."); process.exit(1); }
  fs.mkdirSync(IG_KLASOR, { recursive: true });
  const durum = fs.existsSync(DURUM_DOSYA) ? JSON.parse(fs.readFileSync(DURUM_DOSYA, "utf8")) : {};

  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(HABER_DOSYA, "utf8"), ctx);
  const H = ctx.window.MB_HABERLER || { haberler: [] };
  const elle = (H.haberler || []).filter(x => !String(x.id).startsWith("ig_"));
  const eskiIg = new Map((H.haberler || []).filter(x => String(x.id).startsWith("ig_")).map(x => [x.id, x]));

  const paylasimlar = await paylasimlariGetir();
  const yeni = [];
  for (const g of paylasimlar) {
    const h = cevir(g);
    if (await gorselIndir(g)) h.gorsel = "data/ig/" + g.id + ".jpg";
    if (!h.sonDakika) delete h.sonDakika;
    // elle düzeltilmiş kategori/başlık varsa koru
    const e = eskiIg.get(h.id);
    if (e && e.elle) Object.assign(h, { kategori: e.kategori, baslik: e.baslik, ozet: e.ozet, metin: e.metin, manset: e.manset, sonDakika: e.sonDakika, elle: true });
    yeni.push(h);
  }

  // kullanılmayan görselleri sil
  const kalan = new Set(yeni.map(h => path.basename(h.gorsel || "")));
  for (const f of fs.readdirSync(IG_KLASOR)) if (f.endsWith(".jpg") && !kalan.has(f)) fs.unlinkSync(path.join(IG_KLASOR, f));

  const tum = [...yeni, ...elle].sort((a, b) => (b.tarih + (b.saat || "00:00")).localeCompare(a.tarih + (a.saat || "00:00")));
  const eskiMetin = JSON.stringify((H.haberler || []));
  if (JSON.stringify(tum) !== eskiMetin) {
    H.haberler = tum;
    H.guncelleme = istanbul(new Date().toISOString()).tarih;
    const bas = "/* Memur Bülteni haberleri. Instagram paylaşımları (id: ig_...) otomatik eklenir; elle eklenen haberler korunur.\n   Bir Instagram haberinin kategorisini/başlığını elle düzeltirsen \"elle\": true ekle, otomatik güncelleme üzerine yazmaz. */\n";
    fs.writeFileSync(HABER_DOSYA, bas + "window.MB_HABERLER = " + JSON.stringify(H, null, 1) + ";\n");
    console.log(`Güncellendi: ${yeni.length} Instagram haberi, ${elle.length} elle eklenen haber.`);
  } else console.log("Yeni paylaşım yok.");

  await belirteciYenile(durum);
  durum.sonCalisma = new Date().toISOString();
  durum.sonPaylasim = paylasimlar[0] ? paylasimlar[0].timestamp : durum.sonPaylasim;
  // durum dosyasını sadece içerik değiştiyse yaz (her saat gereksiz commit olmasın)
  const d2 = { ...durum }; delete d2.sonCalisma;
  const eskiD = fs.existsSync(DURUM_DOSYA) ? JSON.parse(fs.readFileSync(DURUM_DOSYA, "utf8")) : {}; delete eskiD.sonCalisma;
  if (JSON.stringify(d2) !== JSON.stringify(eskiD)) fs.writeFileSync(DURUM_DOSYA, JSON.stringify(durum, null, 1) + "\n");
}

if (import.meta.url === "file://" + process.argv[1]) main().catch(e => { console.error(e.message); process.exit(1); });
