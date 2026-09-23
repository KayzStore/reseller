/*
  ===========================================================
   KAYZ.ID - FILE HARGA SUNTIK SOSMED
  ===========================================================
  Ini file KHUSUS buat ubah harga & kontak. Tinggal edit angka
  atau link di bawah, simpan, terus upload ulang file ini ke
  hosting kamu (Vercel/dsb). SEMUA pengunjung website langsung
  lihat harga baru begitu file ini di-update - beda sama cara
  lama (localStorage) yang cuma kesimpen di 1 HP doang.

  JANGAN hapus tanda kurung {, }, koma (,), atau titik dua (:).
  Yang boleh diubah cuma ANGKA dan LINK di sebelah kanan titik dua.
  ===========================================================
*/

const KAYZ_PRICES = {

  // ---------------- INSTAGRAM (IG) ----------------
  ig_like_rate: 50,        // harga per 1 like (Rp)
  ig_like_min: 10,         // minimal beli like

  ig_views_rate: 2,        // harga per 1 views (Rp)
  ig_views_min: 100,       // minimal beli views

  ig_followers_rate: 70,   // harga per 1 followers (Rp)
  ig_followers_min: 20,    // minimal beli followers


  // ---------------- TIKTOK (TT) ----------------
  tt_like_rate: 50,
  tt_like_min: 10,

  tt_views_rate: 2,
  tt_views_min: 100,

  tt_followers_rate: 70,
  tt_followers_min: 10,


  // ---------------- WHATSAPP (WA) ----------------
  wa_pengikut_rate: 50,
  wa_pengikut_min: 10,

  wa_reaction_rate: 100,
  wa_reaction_min: 10,

  wa_vote_rate: 150,
  wa_vote_min: 10,


  // ---------------- KONTAK & KOMUNITAS ----------------
  wa_number: '6285142017734',                                          // nomor buat kirim pesanan
  wa_channel: 'https://whatsapp.com/channel/0029Vb7Em7NJf05UUeH4sx1y',  // link saluran WA
  wa_group: 'https://chat.whatsapp.com/I9DUXOoc1FvH24FId8faBN'          // link group WA

};
