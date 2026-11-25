/*
 * KPSS Tercih Robotu – DEMO VERİ DOSYASI
 * --------------------------------------
 * Bu dosyadaki kurumlar, kadrolar, nitelik kodları ve puanlar ÖRNEKTİR, gerçek değildir.
 * Gerçek ÖSYM verisi geldiğinde yalnızca bu dosya değiştirilir; arayüz koduna dokunmak gerekmez.
 *
 * Yapı:
 *  demo            : true ise sayfada "Demo · Örnek veriler" etiketi görünür.
 *  donemler        : Tercih yapılan (güncel) dönemler. sira = kronolojik sıra.
 *  gecmisDonemler  : Sonuçları açıklanmış geçmiş dönemler.
 *  duzeyler        : Eğitim düzeyi → puan türü.
 *  programlar      : Adayın seçebileceği mezuniyet programları.
 *  kodlar          : Nitelik kodları. Belge kodlarında "kisa" kartta görünen kısa addır.
 *                     tur: "genel" (o düzeyde her program), "program" (belirli bölüm), "belge" (ek şart).
 *  kadrolar        : Güncel dönem kadroları. sartlar = [[A, B], [C]] → (A VEYA B) VE C.
 *  gecmis          : Geçmiş yerleştirme sonuçları. taban metin olarak, nokta ondalık ayırıcıyla yazılır.
 *  kaynak / sonucBelgesi : Resmî bağlantılar. Demo kayıtlarında bilerek boş (null) bırakıldı.
 */
(function () {
  const donemler = [
    { id: "2026-2", ad: "2026/2 Yerleştirme", sira: 5 },
    { id: "2026-1", ad: "2026/1 Yerleştirme", sira: 4 }
  ];
  const gecmisDonemler = [
    { id: "2025-2", ad: "2025/2", sira: 3 },
    { id: "2025-1", ad: "2025/1", sira: 2 },
    { id: "2024-2", ad: "2024/2", sira: 1 }
  ];
  const duzeyler = {
    // birim: bu düzeyde mezuniyete ne dendiği · ornekProgram: arama kutusundaki örnek (programlar listesinden)
    lisans:      { ad: "Lisans",      puanTuru: "P3",  birim: "bölüm",   alanEtiketi: "Mezuniyet bölümün",  ornekProgram: "isletme" },
    onlisans:    { ad: "Ön lisans",   puanTuru: "P93", birim: "program", alanEtiketi: "Mezuniyet programın", ornekProgram: "yasli-bakimi" },
    ortaogretim: { ad: "Ortaöğretim", puanTuru: "P94", birim: "alan",    alanEtiketi: "Mezuniyet alanın",    ornekProgram: "bilisim-alani" }
  };
  const programlar = [
    // Lisans
    { id: "isletme", ad: "İşletme", duzey: "lisans" },
    { id: "iktisat", ad: "İktisat", duzey: "lisans" },
    { id: "kamu-yonetimi", ad: "Kamu Yönetimi", duzey: "lisans" },
    { id: "hukuk", ad: "Hukuk", duzey: "lisans" },
    { id: "bilgisayar-muh", ad: "Bilgisayar Mühendisliği", duzey: "lisans" },
    { id: "hemsirelik", ad: "Hemşirelik", duzey: "lisans" },
    { id: "sosyal-hizmet", ad: "Sosyal Hizmet", duzey: "lisans" },
    { id: "fizyoterapi-rehab", ad: "Fizyoterapi ve Rehabilitasyon", duzey: "lisans" },
    { id: "cocuk-gelisimi-l", ad: "Çocuk Gelişimi", duzey: "lisans" },
    { id: "tarih", ad: "Tarih", duzey: "lisans" },
    // Ön lisans
    { id: "fizyoterapi", ad: "Fizyoterapi", duzey: "onlisans" },
    { id: "yasli-bakimi", ad: "Yaşlı Bakımı", duzey: "onlisans" },
    { id: "buro-yonetimi", ad: "Büro Yönetimi ve Yönetici Asistanlığı", duzey: "onlisans" },
    { id: "bilgisayar-prog", ad: "Bilgisayar Programcılığı", duzey: "onlisans" },
    { id: "tibbi-dok", ad: "Tıbbi Dokümantasyon ve Sekreterlik", duzey: "onlisans" },
    { id: "muhasebe-vergi", ad: "Muhasebe ve Vergi Uygulamaları", duzey: "onlisans" },
    { id: "cocuk-gelisimi", ad: "Çocuk Gelişimi", duzey: "onlisans" },
    { id: "elektrik", ad: "Elektrik", duzey: "onlisans" },
    { id: "adalet", ad: "Adalet", duzey: "onlisans" },
    { id: "turizm", ad: "Turizm ve Otel İşletmeciliği", duzey: "onlisans" },
    // Ortaöğretim
    { id: "lise-genel", ad: "Lise (alan belirtmeden)", duzey: "ortaogretim" },
    { id: "saglik-alani", ad: "Sağlık Hizmetleri Alanı", duzey: "ortaogretim" },
    { id: "bilisim-alani", ad: "Bilişim Teknolojileri Alanı", duzey: "ortaogretim" },
    { id: "muhasebe-alani", ad: "Muhasebe ve Finansman Alanı", duzey: "ortaogretim" },
    { id: "buro-alani", ad: "Büro Yönetimi Alanı", duzey: "ortaogretim" }
  ];
  const kodlar = {
    // Genel (bölüm fark etmez)
    D4001: { tur: "genel", duzey: "lisans", aciklama: "Herhangi bir lisans programından mezun olmak (bölüm fark etmez)." },
    D3001: { tur: "genel", duzey: "onlisans", aciklama: "Herhangi bir ön lisans programından mezun olmak (bölüm fark etmez)." },
    D2001: { tur: "genel", duzey: "ortaogretim", aciklama: "Herhangi bir ortaöğretim kurumundan mezun olmak (alan fark etmez)." },
    // Lisans programları
    D4211: { tur: "program", program: "isletme", aciklama: "İşletme lisans programından mezun olmak." },
    D4213: { tur: "program", program: "iktisat", aciklama: "İktisat lisans programından mezun olmak." },
    D4215: { tur: "program", program: "kamu-yonetimi", aciklama: "Kamu Yönetimi lisans programından mezun olmak." },
    D4217: { tur: "program", program: "hukuk", aciklama: "Hukuk lisans programından mezun olmak." },
    D4221: { tur: "program", program: "bilgisayar-muh", aciklama: "Bilgisayar Mühendisliği lisans programından mezun olmak." },
    D4223: { tur: "program", program: "hemsirelik", aciklama: "Hemşirelik lisans programından mezun olmak." },
    D4225: { tur: "program", program: "sosyal-hizmet", aciklama: "Sosyal Hizmet lisans programından mezun olmak." },
    D4227: { tur: "program", program: "fizyoterapi-rehab", aciklama: "Fizyoterapi ve Rehabilitasyon lisans programından mezun olmak." },
    D4229: { tur: "program", program: "cocuk-gelisimi-l", aciklama: "Çocuk Gelişimi lisans programından mezun olmak." },
    // Ön lisans programları
    D3101: { tur: "program", program: "fizyoterapi", aciklama: "Fizyoterapi ön lisans programından mezun olmak." },
    D3103: { tur: "program", program: "yasli-bakimi", aciklama: "Yaşlı Bakımı ön lisans programından mezun olmak." },
    D3105: { tur: "program", program: "buro-yonetimi", aciklama: "Büro Yönetimi ve Yönetici Asistanlığı ön lisans programından mezun olmak." },
    D3107: { tur: "program", program: "bilgisayar-prog", aciklama: "Bilgisayar Programcılığı ön lisans programından mezun olmak." },
    D3109: { tur: "program", program: "tibbi-dok", aciklama: "Tıbbi Dokümantasyon ve Sekreterlik ön lisans programından mezun olmak." },
    D3111: { tur: "program", program: "muhasebe-vergi", aciklama: "Muhasebe ve Vergi Uygulamaları ön lisans programından mezun olmak." },
    D3113: { tur: "program", program: "cocuk-gelisimi", aciklama: "Çocuk Gelişimi ön lisans programından mezun olmak." },
    D3115: { tur: "program", program: "elektrik", aciklama: "Elektrik ön lisans programından mezun olmak." },
    D3117: { tur: "program", program: "adalet", aciklama: "Adalet ön lisans programından mezun olmak." },
    // Ortaöğretim alanları
    D2101: { tur: "program", program: "saglik-alani", aciklama: "Ortaöğretim Sağlık Hizmetleri Alanından mezun olmak." },
    D2103: { tur: "program", program: "bilisim-alani", aciklama: "Ortaöğretim Bilişim Teknolojileri Alanından mezun olmak." },
    D2105: { tur: "program", program: "muhasebe-alani", aciklama: "Ortaöğretim Muhasebe ve Finansman Alanından mezun olmak." },
    D2107: { tur: "program", program: "buro-alani", aciklama: "Ortaöğretim Büro Yönetimi Alanından mezun olmak." },
    // Ek belge / özel şartlar
    D7101: { tur: "belge", kisa: "Güvenlik kimlik kartı", ad: "Silahlı güvenlik kimlik kartı", aciklama: "Geçerli silahlı özel güvenlik görevlisi kimlik kartına sahip olmak." },
    D7103: { tur: "belge", kisa: "Ehliyet", ad: "B sınıfı sürücü belgesi", aciklama: "En az B sınıfı sürücü belgesine sahip olmak." },
    D7105: { tur: "belge", kisa: "İlk yardım sertifikası", ad: "İlk yardım sertifikası", aciklama: "Geçerli ilk yardım eğitim sertifikasına sahip olmak." },
    D7107: { tur: "belge", kisa: "Bilgisayar sertifikası", ad: "Bilgisayar işletmenliği sertifikası", aciklama: "Bilgisayar işletmenliği sertifikasına sahip olmak." }
  };

  // Kısa yazım yardımcıları
  const K = (kod, donem, duzey, kurum, unvan, il, ilce, kontenjan, sartlar, cinsiyet) =>
    ({ kod, donem, duzey, kurum, unvan, il, ilce, kontenjan, sartlar, cinsiyet: cinsiyet || null, kaynak: null });
  const H = (donem, duzey, kurum, unvan, il, ilce, sartlar, kontenjan, taban, cinsiyet) =>
    ({ donem, duzey, kurum, unvan, il, ilce, sartlar, kontenjan, taban, cinsiyet: cinsiyet || null, sonucBelgesi: null });

  const SAG = "Örnek Sağlık Kurumu", AIL = "Örnek Aile ve Sosyal Hizmet Kurumu", ADL = "Örnek Adalet Kurumu",
        UNI = "Örnek Üniversitesi", BEL = "Örnek Belediye Hizmetleri Kurumu", GEL = "Örnek Gelir Kurumu", EGT = "Örnek Eğitim Kurumu";

  const kadrolar = [
    // ===== 2026/2 · Ön lisans =====
    K("D20001", "2026-2", "onlisans", SAG, "Fizyoterapi Teknikeri", "Batman", "Merkez", 2, [["D3101"]]),
    K("D20002", "2026-2", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Diyarbakır", "Bağlar", 3, [["D3103"]]),
    K("D20003", "2026-2", "onlisans", SAG, "Koruma ve Güvenlik Görevlisi", "Batman", "Merkez", 4, [["D3001"], ["D7101"]]),
    K("D20004", "2026-2", "onlisans", AIL, "Bakım Elemanı", "Diyarbakır", "Kayapınar", 2, [["D3101", "D3103"], ["D7103"]]),
    K("D20005", "2026-2", "onlisans", UNI, "Fizyoterapi Teknikeri", "Diyarbakır", "Sur", 1, [["D3101"]], "K"),
    K("D20006", "2026-2", "onlisans", BEL, "Memur", "Batman", "Merkez", 3, [["D3001"]]),
    K("D20007", "2026-2", "onlisans", SAG, "Tıbbi Sekreter", "Batman", "Merkez", 2, [["D3109"]]),
    K("D20008", "2026-2", "onlisans", ADL, "Zabıt Kâtibi", "Diyarbakır", "Yenişehir", 4, [["D3117", "D3105"], ["D7107"]]),
    K("D20009", "2026-2", "onlisans", SAG, "Fizyoterapi Teknikeri", "İstanbul", "Fatih", 3, [["D3101"]]),
    K("D20010", "2026-2", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Ankara", "Çankaya", 2, [["D3103"]]),
    K("D20011", "2026-2", "onlisans", EGT, "Bilgisayar İşletmeni", "Van", "İpekyolu", 2, [["D3107", "D3105"]]),
    K("D20012", "2026-2", "onlisans", GEL, "Veri Hazırlama ve Kontrol İşletmeni", "Mardin", "Artuklu", 2, [["D3111", "D3105"]]),
    K("D20013", "2026-2", "onlisans", EGT, "Çocuk Gelişimci", "Gaziantep", "Şahinbey", 1, [["D3113"]]),
    K("D20014", "2026-2", "onlisans", BEL, "Elektrik Teknikeri", "Şanlıurfa", "Haliliye", 1, [["D3115"], ["D7103"]]),
    K("D20015", "2026-2", "onlisans", SAG, "Yaşlı Bakım Teknikeri", "İzmir", "Konak", 1, [["D3103"], ["D7105"]]),
    K("D20016", "2026-2", "onlisans", UNI, "Memur", "Erzurum", "Yakutiye", 2, [["D3001"]]),
    // ===== 2026/2 · Lisans =====
    K("D10001", "2026-2", "lisans", GEL, "Gelir Uzman Yardımcısı", "Ankara", "Çankaya", 5, [["D4211", "D4213", "D4215", "D4217"]]),
    K("D10002", "2026-2", "lisans", ADL, "Zabıt Kâtibi", "Batman", "Merkez", 3, [["D4001"]]),
    K("D10003", "2026-2", "lisans", SAG, "Hemşire", "Diyarbakır", "Bağlar", 6, [["D4223"]]),
    K("D10004", "2026-2", "lisans", AIL, "Sosyal Çalışmacı", "Batman", "Merkez", 2, [["D4225"]]),
    K("D10005", "2026-2", "lisans", UNI, "Fizyoterapist", "Diyarbakır", "Sur", 1, [["D4227"]]),
    K("D10006", "2026-2", "lisans", EGT, "Mühendis (Bilgisayar)", "İstanbul", "Kadıköy", 2, [["D4221"]]),
    K("D10007", "2026-2", "lisans", BEL, "Memur", "İzmir", "Bornova", 4, [["D4001"], ["D7103"]]),
    K("D10008", "2026-2", "lisans", AIL, "Çocuk Gelişimci", "Van", "Tuşba", 2, [["D4229"]]),
    K("D10009", "2026-2", "lisans", SAG, "Koruma ve Güvenlik Görevlisi", "Batman", "Merkez", 2, [["D4001"], ["D7101"]], "E"),
    K("D10010", "2026-2", "lisans", GEL, "Memur", "Trabzon", "Ortahisar", 3, [["D4001"]]),
    // ===== 2026/2 · Ortaöğretim =====
    K("D30001", "2026-2", "ortaogretim", SAG, "Memur", "Batman", "Merkez", 3, [["D2001"]]),
    K("D30002", "2026-2", "ortaogretim", EGT, "Bilgisayar İşletmeni", "Diyarbakır", "Bağlar", 2, [["D2103"], ["D7107"]]),
    K("D30003", "2026-2", "ortaogretim", ADL, "Mübaşir", "Mardin", "Artuklu", 2, [["D2001"]], "E"),
    K("D30004", "2026-2", "ortaogretim", GEL, "Memur", "Gaziantep", "Şehitkamil", 2, [["D2105", "D2107"]]),
    K("D30005", "2026-2", "ortaogretim", SAG, "Sağlık Teknisyeni", "Van", "İpekyolu", 2, [["D2101"], ["D7105"]]),
    K("D30006", "2026-2", "ortaogretim", BEL, "Şoför", "Batman", "Merkez", 1, [["D2001"], ["D7103"]]),
    // ===== 2026/1 (ayrı dönem) =====
    K("E20001", "2026-1", "onlisans", SAG, "Fizyoterapi Teknikeri", "Batman", "Merkez", 1, [["D3101"]]),
    K("E20002", "2026-1", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Batman", "Merkez", 2, [["D3103"]]),
    K("E10001", "2026-1", "lisans", ADL, "Zabıt Kâtibi", "Batman", "Merkez", 2, [["D4001"]]),
    K("E30001", "2026-1", "ortaogretim", SAG, "Memur", "Batman", "Merkez", 2, [["D2001"]])
  ];

  const gecmis = [
    // Fizyoterapi Teknikeri · Batman Merkez (iki karşılaştırılabilir dönem + ilçesi farklı bir kayıt)
    H("2025-2", "onlisans", SAG, "Fizyoterapi Teknikeri", "Batman", "Merkez", [["D3101"]], 1, "78.42315"),
    H("2025-1", "onlisans", SAG, "Fizyoterapi Teknikeri", "Batman", "Merkez", [["D3101"]], 2, "76.90120"),
    H("2024-2", "onlisans", SAG, "Fizyoterapi Teknikeri", "Batman", "Kozluk", [["D3101"]], 1, "74.11800"),
    // Yaşlı Bakım Teknikeri · Diyarbakır Bağlar (eşit puan senaryosu: 75,12340)
    H("2025-2", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Diyarbakır", "Bağlar", [["D3103"]], 2, "75.12340"),
    H("2024-2", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Diyarbakır", "Bağlar", [["D3103"]], 3, "73.50210"),
    // Koruma ve Güvenlik · Batman (bir kayıt aynı, bir kayıt belge şartı farklı → eşleşmemeli)
    H("2025-2", "onlisans", SAG, "Koruma ve Güvenlik Görevlisi", "Batman", "Merkez", [["D3001"], ["D7101"]], 3, "71.80450"),
    H("2025-1", "onlisans", SAG, "Koruma ve Güvenlik Görevlisi", "Batman", "Merkez", [["D3001"]], 5, "79.20000"),
    // D20004 Bakım Elemanı → bilerek geçmiş yok
    H("2025-2", "onlisans", UNI, "Fizyoterapi Teknikeri", "Diyarbakır", "Sur", [["D3101"]], 1, "80.11200", "K"),
    H("2025-2", "onlisans", BEL, "Memur", "Batman", "Merkez", [["D3001"]], 2, "82.00000"),
    H("2025-1", "onlisans", BEL, "Memur", "Batman", "Merkez", [["D3001"]], 4, "81.45000"),
    H("2025-2", "onlisans", ADL, "Zabıt Kâtibi", "Diyarbakır", "Yenişehir", [["D3117", "D3105"], ["D7107"]], 3, "77.66500"),
    H("2025-2", "onlisans", SAG, "Fizyoterapi Teknikeri", "İstanbul", "Fatih", [["D3101"]], 2, "84.30010"),
    H("2025-1", "onlisans", AIL, "Yaşlı Bakım Teknikeri", "Ankara", "Çankaya", [["D3103"]], 1, "83.02000"),
    H("2025-2", "onlisans", EGT, "Bilgisayar İşletmeni", "Van", "İpekyolu", [["D3107", "D3105"]], 2, "72.40000"),
    H("2025-2", "onlisans", UNI, "Memur", "Erzurum", "Yakutiye", [["D3001"]], 2, "80.75500"),
    // Lisans
    H("2025-2", "lisans", GEL, "Gelir Uzman Yardımcısı", "Ankara", "Çankaya", [["D4211", "D4213", "D4215", "D4217"]], 4, "86.21000"),
    H("2025-2", "lisans", ADL, "Zabıt Kâtibi", "Batman", "Merkez", [["D4001"]], 2, "79.60500"),
    H("2025-1", "lisans", ADL, "Zabıt Kâtibi", "Batman", "Merkez", [["D4001"]], 3, "78.90000"),
    H("2025-2", "lisans", SAG, "Hemşire", "Diyarbakır", "Bağlar", [["D4223"]], 8, "74.90300"),
    H("2025-2", "lisans", AIL, "Sosyal Çalışmacı", "Batman", "Merkez", [["D4225"]], 1, "76.33000"),
    H("2025-1", "lisans", EGT, "Mühendis (Bilgisayar)", "İstanbul", "Kadıköy", [["D4221"]], 1, "73.10000"),
    H("2025-2", "lisans", BEL, "Memur", "İzmir", "Bornova", [["D4001"], ["D7103"]], 3, "81.88000"),
    H("2025-2", "lisans", GEL, "Memur", "Trabzon", "Ortahisar", [["D4001"]], 2, "83.40000"),
    // Ortaöğretim
    H("2025-2", "ortaogretim", SAG, "Memur", "Batman", "Merkez", [["D2001"]], 2, "80.50000"),
    H("2025-2", "ortaogretim", ADL, "Mübaşir", "Mardin", "Artuklu", [["D2001"]], 2, "78.12000", "E"),
    H("2025-1", "ortaogretim", GEL, "Memur", "Gaziantep", "Şehitkamil", [["D2105", "D2107"]], 1, "77.04000"),
    H("2025-2", "ortaogretim", BEL, "Şoför", "Batman", "Merkez", [["D2001"], ["D7103"]], 1, "75.60000")
  ];

  const iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

  window.KPSS_VERI = { demo: true, donemler, gecmisDonemler, duzeyler, programlar, kodlar, kadrolar, gecmis, iller };
})();
