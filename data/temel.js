/* KPSS Tercih Robotu – temel yapılandırma (veri içermez). Dönem verileri data/kpss-*.js dosyalarından gelir. */
window.KPSS_VERI = {
  demo: false, donemler: [], gecmisDonemler: [], gecmis: [], programlar: [], kodlar: {}, kadrolar: [],
  duzeyler: {
    lisans:      { ad: "Lisans",      puanTuru: "P3",  birim: "bölüm",   alanEtiketi: "Mezuniyet bölümün",  ornek: "İşletme",               yok: "Bölümüm listede yok" },
    onlisans:    { ad: "Ön lisans",   puanTuru: "P93", birim: "program", alanEtiketi: "Mezuniyet programın", ornek: "Yaşlı Bakımı",          yok: "Programım listede yok" },
    ortaogretim: { ad: "Ortaöğretim", puanTuru: "P94", birim: "alan",    alanEtiketi: "Mezuniyet alanın",    ornek: "Bilişim Teknolojileri", yok: "Alanım listede yok" }
  },
  iller: ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"],
  // Paylaşım bağlantısı ve sosyal hesap (instagram: kullanıcı adı, @ olmadan; boşsa takip kutusu gösterilmez)
  site: { url: "https://claude.ai/artifact/RwdECXM5QmFepZWRDcgzE5", instagram: "memurbulteni" }
};
