// Memur Bülteni – Instagram paylaşımlarını uygulamaya haber olarak aktarır.
// GitHub Actions saatte bir çalıştırır. Gizli değerler: IG_TOKEN (zorunlu), GH_PAT (isteğe bağlı, belirteç yenileme için).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HABER_DOSYA = path.join(KOK, "data/haberler.js");
const ILAN_DOSYA = path.join(KOK, "data/ig-ilanlar.js");
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

/* ---------- İlan satırlarını ayrıştır ----------
   Açıklamanın sonundaki şu satırlar bir paylaşımı İlanlar sekmesine de ekler:
     İl: Bursa
     Son gün: 05.12.2026
     KPSS: P3 en az 70      (ya da: KPSS şartsız)
     Başvuru: https://...   (ya da: e-Devlet / Kariyer Kapısı)
     Kurum: ... (isteğe bağlı)   Kişi: 40 (isteğe bağlı)
   "Son gün" satırı olmayan paylaşım ilan sayılmaz. */
const ILAN_SATIR = /^[\s•▪►▶️➡️📍📅📌🗓️✅🔹🔸-]*(?:[İIiı]l|son\s*g[üu]n|kpss|ba[şs]vuru|kurum|ki[şs]i|kontenjan)\s*[:：]/iu;
const anahtar = (satir, re) => { const m = satir.match(re); return m ? m[1].trim() : ""; };
const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];
const AYLAR = ["ocak","şubat","mart","nisan","mayıs","haziran","temmuz","ağustos","eylül","ekim","kasım","aralık"];
// "ilan, ilanı, ilana, ilanlar, ilanları…" geçen paylaşım ilandır; "ilan edildi / ilan etti" gibi duyurular hariç.
const ILAN_KELIME = /(^|[^\p{L}])ilan(ı|a|lar|ları|ın|ına|da|ında|lara)?(?![\p{L}])(?!\s+(edil|et|olun))/iu;
const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export function ilanCoz(ham, yayin){
  const metin = ham.replace(/\r/g, "");
  const kucuk = lowerTr(metin);
  const satirlar = metin.split("\n").map(x => x.trim());
  const bul = re => { for (const x of satirlar) { const v = anahtar(x, re); if (v) return v; } return ""; };
  const onEk = "^[\\s•▪►▶️➡️📍📅📌🗓️✅🔹🔸-]*";
  const R = k => new RegExp(onEk + k + "\\s*[:：]\\s*(.+)$", "iu");
  const sonSatir = bul(R("son\\s*g[üu]n"));
  if (!ILAN_KELIME.test(kucuk) && !sonSatir) return null;

  // Son tarih: önce "Son gün:" satırı, yoksa metindeki en geç tarih (yayın tarihinden sonraki)
  const tarihler = [];
  const kaynak = sonSatir || metin;
  for (const m of kaynak.matchAll(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/g)) tarihler.push(iso(m[3], m[2], m[1]));
  for (const m of lowerTr(kaynak).matchAll(new RegExp("(\\d{1,2})\\s+(" + AYLAR.join("|") + ")(?:\\s+(\\d{4}))?", "g"))) {
    const ay = AYLAR.indexOf(m[2]) + 1, py = Number(yayin.slice(0, 4)), pm = Number(yayin.slice(5, 7));
    tarihler.push(iso(m[3] || (ay < pm ? py + 1 : py), ay, m[1]));
  }
  // Son başvuru tarihini seç: "son başvuru / … kadar / … sona erecek" yanındaki tarih öncelikli;
  // yoksa yayından sonraki 60 gün içindeki en geç tarih (program bitiş tarihleri gibi uzak tarihler elenir).
  const sinir = new Date(Date.parse(yayin) + 60 * 864e5).toISOString().slice(0, 10);
  const lk = lowerTr(kaynak);
  const yakin = [];
  const tarihRe = new RegExp("(\\d{1,2})[./-](\\d{1,2})[./-](\\d{4})|(\\d{1,2})\\s+(" + AYLAR.join("|") + ")(?:\\s+(\\d{4}))?", "g");
  for (const m of lk.matchAll(tarihRe)) {
    const once = lk.slice(Math.max(0, m.index - 40), m.index).split("\n").pop(), sonra = lk.slice(m.index + m[0].length, m.index + m[0].length + 40).split("\n")[0];
    const programTarihi = /program|başlangıç|kura|işbaşı|sınav/.test(once);
    if (!programTarihi && (/son\s*(başvuru|gün|tarih)|başvuru\s*tarih|başvurular[^.]*$|kapan/.test(once) || /^(?:['’][a-zçğıöşü]{0,4})?[ \t,]*(?:\d{4}[ \t]*)?(?:tarihine[ \t]+)?(?:(?:pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)[ \t]+)?(?:günü[ \t]+)?(kadar|sona|bit|son\b)/.test(sonra))) {
      let t;
      if (m[1]) t = iso(m[3], m[2], m[1]);
      else { const ay = AYLAR.indexOf(m[5]) + 1, py = Number(yayin.slice(0, 4)), pm = Number(yayin.slice(5, 7)); t = iso(m[6] || (ay < pm ? py + 1 : py), ay, m[4]); }
      if (t >= yayin) yakin.push(t);
    }
  }
  const gecerli = tarihler.filter(t => t >= yayin && t <= sinir).sort();
  const son = sonSatir && tarihler.length ? tarihler.sort().pop() : yakin.length ? yakin.sort().pop() : gecerli.length ? gecerli[gecerli.length - 1] : null;

  // İl: "İl:" satırı ya da metinde geçen ilk il adı
  let il = bul(R("[İIiı]l")).replace(/[.\s]+$/, "");
  if (!il) {
    let en = null, enI = Infinity;
    for (const ad of ILLER) { const m = kucuk.match(new RegExp("(^|[^\\p{L}])" + lowerTr(ad) + "(?![\\p{L}]{3})", "u")); if (m && m.index < enI) { en = ad; enI = m.index; } }
    il = en || "";
  }

  // KPSS
  const kpssSatir = bul(R("kpss"));
  const k = lowerTr(kpssSatir || metin);
  const sartsiz = /kpss\s*(ş|s)arts[ıi]z|kpss'?\s*siz|kpss\s*(ş|s)art[ıi]\s*(aranma|yok|olmadan)|kpss\s*(puan[ıi]\s*)?(aranmaks[ıi]z[ıi]n|gerekmeden|olmadan)/.test(k) || (kpssSatir && /(ş|s)arts[ıi]z|yok|aranmaz/.test(k));
  const puan = sartsiz ? [] : [...new Set([...(kpssSatir || metin).matchAll(/\bP\s?(\d{1,3})\b/gi)].map(m => "P" + m[1]))];
  const enAzM = sartsiz ? null : (k.match(/(?:en\s*az|min(?:imum)?|taban)\s*(\d{2,3})/) || k.match(/(\d{2,3})\s*(?:ve\s*üzeri\s*)?kpss/) || k.match(/kpss\D{0,12}(\d{2,3})\s*(?:puan|ve)/));
  const kpssVar = /kpss/.test(k);
  const kisiSatir = bul(R("(?:ki[şs]i|kontenjan)"));
  const kisiM = (kisiSatir || "").match(/\d+/) || kucuk.match(/(\d{1,3}(?:\.\d{3})?)\s*(?:kişi|personel|işçi|memur|sözleşmeli|polis|öğretmen|uzman|mühendis|şoför|güvenlik|temizlik)/);
  const basv = bul(R("ba[şs]vuru"));
  const url = ((basv || metin).match(/https?:\/\/\S+/) || [])[0] || "";
  const yer = url ? "" : basv ? basv.replace(/[.\s]+$/, "") : /e-?devlet/.test(kucuk) ? "e-Devlet" : /kariyer\s*kap/.test(kucuk) ? "Kariyer Kapısı" : /işkur/.test(kucuk) ? "İŞKUR" : "";
  return {
    il: il || "Türkiye geneli",
    son,
    puan: sartsiz ? [] : (puan.length ? puan : kpssVar ? ["KPSS"] : []),
    kpssBilinmiyor: !sartsiz && !kpssVar ? true : undefined,
    enAz: enAzM ? Number(enAzM[1]) : null,
    kont: kisiM ? Number(String(kisiM[1] || kisiM[0]).replace(/\./g, "")) : null,
    yer, url,
    kurum: bul(R("kurum"))
  };
}

/* Instagram açıklamasını başlık / özet / metin olarak böler */
export function cevir(g){
  const ham = (g.caption || "").replace(/\r/g, "");
  const etiketler = [...ham.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(x => x[1]);
  const satirlar = ham.split("\n").map(x => x.trim());
  // yalnızca etiket/mention içeren satırları ve "takip et" kalıplarını at
  const temiz = satirlar.filter(x => !/^([#@][\p{L}\p{N}_.]+\s*)+$/u.test(x) && !/takip\s*et|bildirimleri\s*aç|profil(imiz)?deki\s*link/i.test(x) && !ILAN_SATIR.test(x));
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
  const yeni = [], ilanlar = [];
  for (const g of paylasimlar) {
    const h = cevir(g);
    if (await gorselIndir(g)) h.gorsel = "data/ig/" + g.id + ".jpg";
    if (!h.sonDakika) delete h.sonDakika;
    // elle düzeltilmiş kategori/başlık varsa koru
    const e = eskiIg.get(h.id);
    if (e && e.elle) Object.assign(h, { kategori: e.kategori, baslik: e.baslik, ozet: e.ozet, metin: e.metin, manset: e.manset, sonDakika: e.sonDakika, elle: true });
    yeni.push(h);
    const ic = ilanCoz(g.caption || "", h.tarih);
    if (ic) ilanlar.push({ id: h.id, baslik: h.baslik, kurum: ic.kurum, il: ic.il, puan: ic.puan, kpssBilinmiyor: ic.kpssBilinmiyor, enAz: ic.enAz, kont: ic.kont, yer: ic.yer, son: ic.son, yayin: h.tarih, url: ic.url || h.kaynakUrl, kaynak: h.kaynakUrl, haber: h.id, ig: true });
  }

  // İlanlar: yeni ayrıştırılanlar + eskiden kalan ve süresi dolmamış olanlar (60 paylaşım penceresinden çıksa bile)
  const bugun = istanbul(new Date().toISOString()).tarih;
  let eskiIlan = [];
  if (fs.existsSync(ILAN_DOSYA)) { const c2 = { window: {} }; vm.createContext(c2); try { vm.runInContext(fs.readFileSync(ILAN_DOSYA, "utf8"), c2); eskiIlan = (c2.window.MB_IG_ILANLAR || {}).ilanlar || []; } catch (e) {} }
  const ilanIds = new Set(ilanlar.map(x => x.id));
  const otuzGunOnce = istanbul(new Date(Date.now() - 30 * 864e5).toISOString()).tarih;
  const acik = x => x.son ? x.son >= bugun : x.yayin >= otuzGunOnce;
  const tumIlan = [...ilanlar, ...eskiIlan.filter(x => !ilanIds.has(x.id))].filter(acik).sort((a, b) => (a.son || "9999").localeCompare(b.son || "9999"));
  const ilanMetin = "/* Instagram paylaşımlarından otomatik çıkarılan ilanlar (scripts/instagram.mjs yazar). Elle düzenleme. */\nwindow.MB_IG_ILANLAR = " + JSON.stringify({ guncelleme: bugun, ilanlar: tumIlan }, null, 1) + ";\n";
  const eskiIlanMetin = fs.existsSync(ILAN_DOSYA) ? fs.readFileSync(ILAN_DOSYA, "utf8") : "";
  if (eskiIlanMetin.replace(/"guncelleme": "[^"]*"/, "") !== ilanMetin.replace(/"guncelleme": "[^"]*"/, "")) { fs.writeFileSync(ILAN_DOSYA, ilanMetin); console.log(`İlanlar güncellendi: ${tumIlan.length} açık ilan.`); }

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
