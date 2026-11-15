// ===== TADY UPRAVUJ OBSAH WEBU (otevři v poznámkovém bloku / editoru) =====
window.APP_CONFIG = {
  // Kdy se hra odemkne (český čas). Formát: RRRR-MM-DDTHH:MM:SS+01:00 (v létě +02:00)
  targetDate: '2026-11-18T16:00:00+01:00',

  // Text dopisu. Nový řádek = \n, odstavec = dva \n\n
  letterText: "My dearest friend,\n\nHappy 18th Birthday! I can't believe we've made it this far. You mean the world to me.\n\nLove always.",

  // Zastávky v pořadí: název, nápověda a kód, který má oslavenkyně zadat
  stops: [
    { title: 'Brno hlavní nádraží', hint: 'Where every journey begins. The bustling heart of the city.', code: '123' },
    { title: 'Kašna Parnas', hint: 'A mythical cave in the middle of a cabbage market.', code: '123' },
    { title: 'Kašna Denisovy sady', hint: 'Beautiful views of the city from the gardens.', code: '123' },
    { title: 'Vodopády na Špilberku', hint: 'Hidden waters near the fortress walls.', code: '123' },
    { title: 'Evangelický kostel J. A. Komenského', hint: 'The iconic red church standing tall.', code: '123' },
    { title: 'Kavárna La Váza', hint: 'Time for a well-deserved coffee and the final surprise.', code: '123' }
  ]
};
