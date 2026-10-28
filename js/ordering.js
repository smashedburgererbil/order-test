'use strict';

/* ====================================================================
 * Ordering through the Smashed Burger order system (instead of WhatsApp)
 * Loaded after the menu's own script. It:
 *  - sends the cart to the order database (prices are checked there)
 *  - shows a live order tracker with steps + countdown
 *  - asks for phone notifications so the customer is alerted even with the page closed
 *  - rings + vibrates when the order is ready
 *  - hides items the staff marked as sold out
 *  - falls back to WhatsApp if the system can't be reached
 * ==================================================================== */

(function () {
  const CFG = window.APP_CONFIG;
  const ACTIVE_KEY = 'smashed-burger.activeOrder.v1';
  const TABLE_KEY = 'smashed-burger.tableQr.v1';

  // 006: each table's QR code carries a secret token (menu.html?table=5&k=…). Keep it for this visit.
  const tableQr = (() => {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('table') && q.get('k')) {
        const v = { table: q.get('table').replace(/\D/g, ''), token: q.get('k') };
        sessionStorage.setItem(TABLE_KEY, JSON.stringify(v));
        return v;
      }
      return JSON.parse(sessionStorage.getItem(TABLE_KEY) || 'null');
    } catch { return null; }
  })();
  if (tableQr && !state.table) { state.table = tableQr.table; state.orderType = 'dine-in'; }
  const POLL_MS = 4000;

  /* ── Texts (added to the menu's own dictionary so they follow the chosen language) ── */
  const TXT = {
    en: {
      sendOrder: 'Send order',
      orderNote: 'Your order goes straight to the kitchen. We\'ll let you know when it\'s ready.',
      trkPendingT: 'Order sent!', trkPendingS: 'Waiting for the restaurant to accept your order…',
      trkAcceptedT: 'Your order is being prepared', trkAcceptedS: 'Ready in about {m} min',
      trkReadyT: 'Your order is ready!', trkReadyS: 'Please come to the counter to pick it up.',
      trkCollectedT: 'Enjoy your meal!', trkCollectedS: 'Thanks for ordering at Smashed Burger.',
      trkRejectedT: 'Sorry, we couldn\'t accept your order', trkRejectedS: 'Please ask the cashier.',
      trkCancelledT: 'Order cancelled', trkCancelledS: '',
      stepSent: 'Sent', stepAccepted: 'Preparing', stepReady: 'Ready',
      orderNo: 'Order', left: 'left', almost: 'Almost ready…',
      notifyBtn: 'Turn on alerts', notifySub: 'Get an alert on your phone when it\'s accepted and ready — even if you close this page.',
      notifyOn: 'Alerts are on — we\'ll notify you', notifyBlocked: 'Alerts are blocked in your browser settings. Keep this page open — we\'ll beep when it\'s ready.',
      iosHint: 'On iPhone: tap Share → Add to Home Screen and order from there to get alerts. Or keep this page open — we\'ll beep when it\'s ready.',
      keepOpen: 'Keep this page open — your phone will beep when it\'s ready.',
      backToMenu: 'Back to menu', viewOrder: 'Your order', coming: 'I\'m coming!', newOrder: 'Start a new order',
      sendFailed: 'Couldn\'t send your order. Check your internet and try again.', sendWhatsApp: 'Send on WhatsApp instead',
      soldOutErr: 'Sorry — something in your cart just sold out. Please check your cart.',
      sending: 'Sending…', tableLabel: 'Table', takeawayLabel: 'Takeaway',
      errTableQr: 'To order at your table, please scan the QR code on the table.', errRateLimit: 'Too many orders from this table right now — please ask the cashier.',
      iosGuideT: 'Get an alert when it\'s ready', iosGuideS: 'On iPhone it takes 3 quick steps:',
      iosStep1: 'Tap {share} Share at the bottom of the screen', iosStep2: 'Choose {add} Add to Home Screen, then Add',
      iosStep3: 'Open Smashed Burger from your Home Screen and tap Turn on alerts',
      iosGuideF: 'Your order opens there automatically. Until then, keep this page open — we\'ll beep when it\'s ready.',
    },
    ar: {
      sendOrder: 'إرسال الطلب',
      orderNote: 'يصل طلبك مباشرة إلى المطبخ، وسنخبرك عندما يصبح جاهزاً.',
      trkPendingT: 'تم إرسال الطلب!', trkPendingS: 'بانتظار قبول المطعم لطلبك…',
      trkAcceptedT: 'طلبك قيد التحضير', trkAcceptedS: 'سيكون جاهزاً خلال حوالي {m} دقيقة',
      trkReadyT: 'طلبك جاهز!', trkReadyS: 'تفضّل إلى الكاشير لاستلامه.',
      trkCollectedT: 'بالعافية!', trkCollectedS: 'شكراً لطلبك من سماشد برجر.',
      trkRejectedT: 'عذراً، لم نتمكن من قبول طلبك', trkRejectedS: 'يرجى مراجعة الكاشير.',
      trkCancelledT: 'تم إلغاء الطلب', trkCancelledS: '',
      stepSent: 'أُرسل', stepAccepted: 'قيد التحضير', stepReady: 'جاهز',
      orderNo: 'طلب', left: 'متبقٍ', almost: 'على وشك الجاهزية…',
      notifyBtn: 'تفعيل التنبيهات', notifySub: 'احصل على تنبيه على هاتفك عند قبول الطلب وعندما يصبح جاهزاً — حتى لو أغلقت الصفحة.',
      notifyOn: 'التنبيهات مفعّلة — سنُعلمك', notifyBlocked: 'التنبيهات محظورة في إعدادات المتصفح. أبقِ هذه الصفحة مفتوحة — سنصدر صوتاً عندما يجهز.',
      iosHint: 'على الآيفون: اضغط مشاركة ← إضافة إلى الشاشة الرئيسية واطلب من هناك لتصلك التنبيهات. أو أبقِ هذه الصفحة مفتوحة — سنصدر صوتاً عندما يجهز.',
      keepOpen: 'أبقِ هذه الصفحة مفتوحة — سيصدر هاتفك صوتاً عندما يجهز.',
      backToMenu: 'العودة إلى القائمة', viewOrder: 'طلبك', coming: 'أنا قادم!', newOrder: 'بدء طلب جديد',
      sendFailed: 'تعذّر إرسال طلبك. تحقق من الإنترنت وحاول مرة أخرى.', sendWhatsApp: 'الإرسال عبر واتساب بدلاً من ذلك',
      soldOutErr: 'عذراً — نفد أحد الأصناف في سلتك للتو. يرجى مراجعة السلة.',
      sending: 'جارٍ الإرسال…', tableLabel: 'طاولة', takeawayLabel: 'سفري',
      errTableQr: 'للطلب من طاولتك، يرجى مسح رمز QR الموجود على الطاولة.', errRateLimit: 'طلبات كثيرة من هذه الطاولة الآن — يرجى مراجعة الكاشير.',
      iosGuideT: 'احصل على تنبيه عندما يجهز طلبك', iosGuideS: 'على الآيفون ٣ خطوات سريعة فقط:',
      iosStep1: 'اضغط {share} مشاركة أسفل الشاشة', iosStep2: 'اختر {add} إضافة إلى الشاشة الرئيسية ثم إضافة',
      iosStep3: 'افتح Smashed Burger من الشاشة الرئيسية واضغط «تفعيل التنبيهات»',
      iosGuideF: 'سيُفتح طلبك هناك تلقائياً. حتى ذلك الحين أبقِ هذه الصفحة مفتوحة — سنصدر صوتاً عندما يجهز.',
    },
    ku: {
      sendOrder: 'ناردنی داواکاری',
      orderNote: 'داواکارییەکەت ڕاستەوخۆ دەچێت بۆ چێشتخانە، کاتێک ئامادە بوو ئاگادارت دەکەینەوە.',
      trkPendingT: 'داواکاری نێردرا!', trkPendingS: 'چاوەڕێی وەرگرتنی داواکارییەکەت لەلایەن چێشتخانەوە…',
      trkAcceptedT: 'داواکارییەکەت ئامادە دەکرێت', trkAcceptedS: 'نزیکەی {m} خولەکی تر ئامادە دەبێت',
      trkReadyT: 'داواکارییەکەت ئامادەیە!', trkReadyS: 'تکایە وەرە بۆ لای کاشێر بۆ وەرگرتنی.',
      trkCollectedT: 'نۆشی گیانت بێت!', trkCollectedS: 'سوپاس بۆ داواکردن لە سماشد بەرگەر.',
      trkRejectedT: 'ببورە، نەمانتوانی داواکارییەکەت وەربگرین', trkRejectedS: 'تکایە پرسیار لە کاشێر بکە.',
      trkCancelledT: 'داواکاری هەڵوەشێنرایەوە', trkCancelledS: '',
      stepSent: 'نێردرا', stepAccepted: 'ئامادەکردن', stepReady: 'ئامادەیە',
      orderNo: 'داواکاری', left: 'ماوە', almost: 'خەریکە ئامادە دەبێت…',
      notifyBtn: 'هەڵکردنی ئاگادارکردنەوە', notifySub: 'کاتێک داواکارییەکەت وەرگیرا و ئامادە بوو ئاگادارکردنەوەت بۆ دێت — تەنانەت ئەگەر پەڕەکەش دابخەیت.',
      notifyOn: 'ئاگادارکردنەوە هەڵکراوە — ئاگادارت دەکەینەوە', notifyBlocked: 'ئاگادارکردنەوە لە ڕێکخستنەکانی وێبگەڕەکەت ڕاگیراوە. ئەم پەڕەیە بە کراوەیی بهێڵەوە — کاتێک ئامادە بوو دەنگ دەدات.',
      iosHint: 'لە ئایفۆن: Share دابگرە ← Add to Home Screen و لەوێوە داوا بکە بۆ ئەوەی ئاگادارکردنەوەت بۆ بێت. یان ئەم پەڕەیە بە کراوەیی بهێڵەوە — کاتێک ئامادە بوو دەنگ دەدات.',
      keepOpen: 'ئەم پەڕەیە بە کراوەیی بهێڵەوە — کاتێک ئامادە بوو مۆبایلەکەت دەنگ دەدات.',
      backToMenu: 'گەڕانەوە بۆ مینیو', viewOrder: 'داواکارییەکەت', coming: 'دێم!', newOrder: 'داواکارییەکی نوێ',
      sendFailed: 'نەتوانرا داواکارییەکەت بنێردرێت. ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەرەوە.', sendWhatsApp: 'لەبری ئەوە بە واتساپ بینێرە',
      soldOutErr: 'ببورە — شتێک لە سەبەتەکەت ئێستا نەما. تکایە سەبەتەکەت بپشکنە.',
      sending: 'دەنێردرێت…', tableLabel: 'مێز', takeawayLabel: 'بۆ بردنەوە',
      errTableQr: 'بۆ داواکردن لە مێزەکەت، تکایە کۆدی QRـی سەر مێزەکە سکان بکە.', errRateLimit: 'ئێستا داواکاری زۆر لەم مێزەوە هاتووە — تکایە پرسیار لە کاشێر بکە.',
      iosGuideT: 'کاتێک ئامادە بوو ئاگادارت دەکەینەوە', iosGuideS: 'لە ئایفۆن تەنها ٣ هەنگاوی خێرایە:',
      iosStep1: 'لە خوارەوەی شاشەکە {share} Share دابگرە', iosStep2: '{add} Add to Home Screen هەڵبژێرە، پاشان Add',
      iosStep3: 'Smashed Burger لە شاشەی سەرەکی بکەرەوە و «هەڵکردنی ئاگادارکردنەوە» دابگرە',
      iosGuideF: 'داواکارییەکەت خۆکارانە لەوێ دەکرێتەوە. تا ئەو کاتە ئەم پەڕەیە بە کراوەیی بهێڵەوە — کاتێک ئامادە بوو دەنگ دەدات.',
    },
  };
  for (const lang of Object.keys(TXT)) Object.assign(I18N[lang], TXT[lang]);
  const FB_TXT = {
    en: { fbTitle: 'How was your visit?', fbSub: 'Optional · only the owner reads this', fb_food: 'Food', fb_service: 'Service', fb_speed: 'Speed',
      fb_value: 'Prices / value', fb_cleanliness: 'Cleanliness', fb_overall: 'Overall', fbComment: 'Anything you want to tell us? (optional)',
      fbSend: 'Send feedback', fbNeedOverall: 'Please rate “Overall”', fbThanks: 'Thank you! Your feedback helps us get better.', fbErr: 'Could not send — please try again' },
    ar: { fbTitle: 'كيف كانت زيارتك؟', fbSub: 'اختياري · يقرأه المالك فقط', fb_food: 'الطعام', fb_service: 'الخدمة', fb_speed: 'السرعة',
      fb_value: 'الأسعار / القيمة', fb_cleanliness: 'النظافة', fb_overall: 'التقييم العام', fbComment: 'هل تريد إخبارنا بشيء؟ (اختياري)',
      fbSend: 'إرسال التقييم', fbNeedOverall: 'يرجى اختيار «التقييم العام»', fbThanks: 'شكراً لك! رأيك يساعدنا على التحسن.', fbErr: 'تعذر الإرسال — حاول مرة أخرى' },
    ku: { fbTitle: 'سەردانەکەت چۆن بوو؟', fbSub: 'ئارەزوومەندانە · تەنها خاوەن دەیخوێنێتەوە', fb_food: 'خواردن', fb_service: 'خزمەتگوزاری', fb_speed: 'خێرایی',
      fb_value: 'نرخ / بەها', fb_cleanliness: 'پاکوخاوێنی', fb_overall: 'بەگشتی', fbComment: 'شتێکت هەیە پێمان بڵێیت؟ (ئارەزوومەندانە)',
      fbSend: 'ناردنی هەڵسەنگاندن', fbNeedOverall: 'تکایە «بەگشتی» هەڵبسەنگێنە', fbThanks: 'سوپاس! ڕاکەت یارمەتیمان دەدات باشتر بین.', fbErr: 'نەنێردرا — تکایە دووبارە هەوڵ بدەرەوە' },
  };
  for (const lang of Object.keys(FB_TXT)) Object.assign(I18N[lang], FB_TXT[lang]);
  // 016: place in the queue + stamp card
  const LY_TXT = {
    en: { qAhead: '{n} orders ahead of you', qAhead1: '1 order ahead of you', qNext: 'You’re next!',
      lyCartTitle: 'Stamp card', lyCartSub: 'No phone number or name needed — your card is kept on this phone. {g} stamps = {r}',
      lyCartCard: 'Card {c} · {n} of {g} stamps', lyHave: 'Have a card code?', lyCodePh: 'K7Q-3MX',
      lyBadCode: 'A card code has 6 letters and numbers, like K7Q-3MX', lyUnknown: 'That card code wasn’t found — check it on your other phone',
      lyAddTitle: 'Collect a stamp for this order', lyStart: 'Start my stamp card', lyUseCard: 'Add to my card {c}', lyAddBtn: 'Add',
      lyKeep: 'Saved on this phone. On another phone, type the code {c} in the cart.',
      lyStamps: '{n} of {g} stamps', lyLeft: '{n} more for {r}', lyFull: 'Your card is full! Your next order gets {r}.',
      lyReward: 'This order includes your reward: {r}. Tell the cashier when you pay.', lyRewardUsed: 'Reward used — enjoy! Your new card has started.',
      lyEarned: '+1 stamp for this order!', lyPending: 'You get the stamp when you pick up your order.' },
    ar: { qAhead: '{n} طلبات قبلك', qAhead1: 'طلب واحد قبلك', qNext: 'أنت التالي!',
      lyCartTitle: 'بطاقة الأختام', lyCartSub: 'بدون رقم هاتف أو اسم — بطاقتك محفوظة على هذا الهاتف. {g} أختام = {r}',
      lyCartCard: 'البطاقة {c} · {n} من {g} أختام', lyHave: 'لديك رمز بطاقة؟', lyCodePh: 'K7Q-3MX',
      lyBadCode: 'رمز البطاقة 6 أحرف وأرقام، مثل K7Q-3MX', lyUnknown: 'لم يتم العثور على رمز البطاقة — تحقق منه على هاتفك الآخر',
      lyAddTitle: 'احصل على ختم لهذا الطلب', lyStart: 'ابدأ بطاقة الأختام', lyUseCard: 'أضف إلى بطاقتي {c}', lyAddBtn: 'إضافة',
      lyKeep: 'محفوظة على هذا الهاتف. على هاتف آخر اكتب الرمز {c} في السلة.',
      lyStamps: '{n} من {g} أختام', lyLeft: 'باقي {n} للحصول على {r}', lyFull: 'بطاقتك ممتلئة! طلبك القادم يحصل على {r}.',
      lyReward: 'هذا الطلب يشمل مكافأتك: {r}. أخبر الكاشير عند الدفع.', lyRewardUsed: 'تم استخدام المكافأة — بالعافية! بدأت بطاقتك الجديدة.',
      lyEarned: '+١ ختم لهذا الطلب!', lyPending: 'تحصل على الختم عند استلام طلبك.' },
    ku: { qAhead: '{n} داواکاری لە پێش تۆیە', qAhead1: 'یەک داواکاری لە پێش تۆیە', qNext: 'نۆرەی تۆیە!',
      lyCartTitle: 'کارتی خاڵ', lyCartSub: 'پێویست بە ژمارەی مۆبایل یان ناو ناکات — کارتەکەت لەم مۆبایلەدا هەڵدەگیرێت. {g} خاڵ = {r}',
      lyCartCard: 'کارت {c} · {n} لە {g} خاڵ', lyHave: 'کۆدی کارتت هەیە؟', lyCodePh: 'K7Q-3MX',
      lyBadCode: 'کۆدی کارت ٦ پیت و ژمارەیە، وەک K7Q-3MX', lyUnknown: 'ئەو کۆدی کارتە نەدۆزرایەوە — لە مۆبایلەکەی ترت بیپشکنە',
      lyAddTitle: 'بۆ ئەم داواکارییە خاڵێک وەربگرە', lyStart: 'کارتی خاڵەکەم دەست پێبکە', lyUseCard: 'زیادکردن بۆ کارتەکەم {c}', lyAddBtn: 'زیادکردن',
      lyKeep: 'لەم مۆبایلەدا هەڵگیراوە. لە مۆبایلێکی تر، کۆدی {c} لە سەبەتەکەدا بنووسە.',
      lyStamps: '{n} لە {g} خاڵ', lyLeft: '{n} ی تر ماوە بۆ {r}', lyFull: 'کارتەکەت پڕە! داواکاری داهاتووت {r} وەردەگرێت.',
      lyReward: 'ئەم داواکارییە خەڵاتەکەتی تێدایە: {r}. لە کاتی پارەدان بە کاشێر بڵێ.', lyRewardUsed: 'خەڵاتەکە وەرگیرا — نۆشی گیان! کارتی نوێت دەستی پێکرد.',
      lyEarned: '+١ خاڵ بۆ ئەم داواکارییە!', lyPending: 'کاتێک داواکارییەکەت وەردەگریت خاڵەکە وەردەگریت.' },
  };
  for (const lang of Object.keys(LY_TXT)) Object.assign(I18N[lang], LY_TXT[lang]);

  const L = (k) => t(k);
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  /* ── Small helpers ── */
  function rpc(name, args) {
    return fetch(CFG.supabaseUrl + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    }).then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) { const err = new Error((body && body.message) || 'request failed'); err.status = r.status; throw err; }
      return body;
    });
  }
  function getActive() { try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { return null; } }
  function setActive(v) { try { v ? localStorage.setItem(ACTIVE_KEY, JSON.stringify(v)) : localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ } }

  /* ── Sound (unlocked by the customer's tap on "Send order") ── */
  let ctx = null;
  function unlockAudio() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch { /* no audio */ }
  }
  function note(f, at, dur, vol) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    const s = ctx.currentTime + at;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(vol, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g).connect(ctx.destination);
    o.start(s); o.stop(s + dur + 0.05);
  }
  function soundAccepted() { note(880, 0, 0.25, 0.2); note(1319, 0.12, 0.35, 0.18); }
  // Cheerful "your food is ready" melody
  function soundReady() { [[784, 0], [988, 0.15], [1175, 0.3], [1568, 0.45], [1175, 0.7], [1568, 0.85]].forEach(([f, s]) => note(f, s, 0.4, 0.3)); }
  let readyLoop = null;
  function startReadyAlarm() {
    stopReadyAlarm();
    soundReady();
    try { navigator.vibrate && navigator.vibrate([500, 200, 500, 200, 900]); } catch { /* ignore */ }
    readyLoop = setInterval(() => {
      soundReady();
      try { navigator.vibrate && navigator.vibrate([500, 200, 500]); } catch { /* ignore */ }
    }, 3500);
  }
  function stopReadyAlarm() { if (readyLoop) { clearInterval(readyLoop); readyLoop = null; } try { navigator.vibrate && navigator.vibrate(0); } catch { /* ignore */ } }

  /* ── Push notifications ── */
  let swReg = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'order-update') poll(true); });
  }
  function b64ToUint8(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  async function subscribePush() {
    if (!pushSupported || Notification.permission !== 'granted') return null;
    try {
      const reg = swReg || await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await fetch(CFG.supabaseUrl + '/functions/v1/push-key').then((r) => r.json());
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
      }
      return sub.toJSON();
    } catch { return null; }
  }
  async function askForAlerts() {
    if (!pushSupported) return;
    try { await Notification.requestPermission(); } catch { /* ignore */ }
    const a = getActive();
    const sub = await subscribePush();
    if (sub && a) { try { await rpc('set_order_push', { p_id: a.id, p_token: a.token, p_push: sub }); } catch { /* ignore */ } }
    renderTracker();
  }

  /* ── Sold-out items from the staff screen: shown greyed with a sticker, can't be ordered ── */
  function loadAvailability() {
    fetch(CFG.supabaseUrl + '/rest/v1/menu_items?select=id,available', { headers: { apikey: CFG.supabaseKey } })
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => {
        let changed = false;
        for (const r of rows) {
          const m = MENU.find((x) => x.id === r.id);
          if (m && m.available !== r.available) { m.available = r.available; changed = true; }
        }
        if (changed) { renderGrid(); renderCart(); renderFloatingBar(); refreshIcons(); }
      })
      .catch(() => {});
  }
  window.refreshAvailability = loadAvailability;   // used by the live feed in offers.js
  loadAvailability();
  setInterval(() => { if (document.visibilityState === 'visible') loadAvailability(); }, 10000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadAvailability(); });

  /* ── Opening hours, special days and last-order time (set by the owner) ── */
  function loadSchedule() { rpc('get_store_hours', {}).then(applySchedule).catch(() => { /* keep the built-in hours */ }); loadLoyalty(); }

  /* ── Stamp card (016): no phone number or name — a card code like K7Q-3MX kept on this phone; 1 stamp per picked-up order ── */
  const LY_CODE_KEY = 'smashed-burger.loyaltyCode.v1';   // this phone's card
  const LY_LAST_KEY = 'smashed-burger.loyaltyLast.v1';   // its stamps last time, to show in the cart
  const LY_OFF_KEY = 'smashed-burger.loyaltyOff.v1';     // '1' = the customer doesn't want a stamp card
  let LOY = null;   // { goal, reward, min_total } while the owner has it switched on
  let lyDraft = '';
  const store = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* ignore */ } };
  const stored = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  // What people type ("k7q-3mx", Arabic digits) → K7Q3MX, or null if it can't be a card code
  function cleanCode(v) {
    const c = toLatinDigits(String(v || '')).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/.test(c) ? c : null;
  }
  const showCode = (c) => String(c || '').slice(0, 3) + '‑' + String(c || '').slice(3);   // a hyphen that never breaks the code over two lines
  const rewardText = (r) => { r = r || (LOY && LOY.reward); return (r && (r[state.locale] || r.en)) || ''; };
  const fillIn = (k, o) => Object.keys(o).reduce((s, x) => s.replace('{' + x + '}', o[x]), L(k));
  function loadLoyalty() {
    rpc('get_loyalty_config', {}).then((c) => {
      const before = JSON.stringify(LOY);
      LOY = c || null;
      if (JSON.stringify(LOY) !== before) { renderCart(); if (!root.classList.contains('hidden')) renderTracker(); }
    }).catch(() => { /* not set up yet: no stamp card */ });
  }
  function saveLast(card) { if (card && card.goal) store(LY_LAST_KEY, JSON.stringify({ n: card.stamps, g: card.goal })); }
  // Put an order on a card: code = a typed code, this phone's card, or null for a brand-new card
  async function linkLoyalty(a, code) {
    const card = await rpc('set_order_loyalty', { p_id: a.id, p_token: a.token, p_code: code || null });
    if (card && card.code) store(LY_CODE_KEY, card.code);
    saveLast(card);
    return card;
  }
  // After sending: a typed code that doesn't exist → say so; this phone's card gone → start a new one
  async function linkAfterSend(a, typed) {
    try { await linkLoyalty(a, typed || stored(LY_CODE_KEY)); }
    catch (e) {
      if (!/unknown card/.test(e.message)) return;
      if (typed) { showToast(L('lyUnknown')); return; }
      store(LY_CODE_KEY, '');
      try { await linkLoyalty(a, null); } catch { /* the order is in; the card can be added on the order page */ }
    }
  }

  // The stamp card row in the cart, under the table number: a tick box, this phone's card, "Have a card code?"
  let lyHaveOpen = false;
  const baseRenderCart = window.renderCart;
  window.renderCart = function () {
    const r = baseRenderCart.apply(this, arguments);
    const footer = $('drawerFooter');
    if (LOY && footer && state.cart.length && !footer.querySelector('#lyCart')) {
      const table = footer.querySelector('#tableInput');
      const anchor = table ? table.closest('label') : footer.querySelector('[role="group"]');
      const on = stored(LY_OFF_KEY) !== '1';
      const code = stored(LY_CODE_KEY);
      let last = null;
      try { last = JSON.parse(stored(LY_LAST_KEY) || 'null'); } catch { /* ignore */ }
      const sub = code && last && last.g ? fillIn('lyCartCard', { c: showCode(code), n: last.n, g: last.g }) : fillIn('lyCartSub', { g: LOY.goal, r: rewardText() });
      if (anchor) anchor.insertAdjacentHTML('afterend',
        '<div id="lyCart" class="mt-3 rounded-xl bg-surfaceAlt px-3 py-2 ring-1 ring-edge/5">' +
          '<label class="flex items-center gap-3"><span class="text-base leading-none" aria-hidden="true">⭐</span><span class="text-sm font-semibold">' + esc(L('lyCartTitle')) + '</span>' +
            '<input id="lyOnBox" type="checkbox" ' + (on ? 'checked' : '') + ' class="ms-auto h-5 w-5 accent-[#C4453A]" /></label>' +
          (on ? '<p class="mt-1 text-[11px] text-muted" dir="auto">' + esc(sub) + '</p>' +
            (lyHaveOpen
              ? '<input id="lyCodeInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" dir="ltr" placeholder="' + esc(L('lyCodePh')) + '" ' +
                  'class="tnum mt-2 w-full rounded-lg border-0 bg-surface px-3 py-2 text-center text-sm font-bold uppercase tracking-wider text-ink ring-1 ring-edge/10 placeholder:font-normal placeholder:text-muted focus:ring-2 focus:ring-brand/60" />'
              : '<button type="button" data-ly-have class="mt-1 text-[11px] font-bold text-brand">' + esc(L('lyHave')) + '</button>') : '') +
        '</div>');
    }
    return r;
  };
  $('drawerFooter').addEventListener('change', (e) => {
    if (e.target.id !== 'lyOnBox') return;
    store(LY_OFF_KEY, e.target.checked ? '' : '1');
    renderCart();
  });
  $('drawerFooter').addEventListener('click', (e) => {
    if (!e.target.closest('[data-ly-have]')) return;
    lyHaveOpen = true;
    renderCart();
    const box = $('lyCodeInput');
    if (box) box.focus();
  });

  loadSchedule();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadSchedule(); });
  setInterval(() => { if (document.visibilityState === 'visible') loadSchedule(); }, 10 * 60000);

  /* ── Sending the order ── */
  const whatsappFallback = window.sendOrderOnWhatsApp;
  let sending = false;

  window.sendOrderOnWhatsApp = async function sendOrderToSystem() {
    if (sending || state.cart.length === 0) return;
    if (!state.isOpen) { showToast(closedMsg()); return; }
    if (cartHasSoldOut()) { showToast(t('removeSoldOut')); renderCart(); return; }
    if (state.orderType === 'dine-in' && !state.table) {
      showToast(t('tableRequired'));
      const input = $('tableInput');
      if (input) input.focus();
      return;
    }
    // Stamp card: on unless the customer unticked it. A typed code that can't be a card code is stopped here.
    const lyOn = !!LOY && stored(LY_OFF_KEY) !== '1';
    const lyBox = lyOn && $('lyCodeInput');
    const lyRaw = lyBox ? lyBox.value.trim() : '';
    const lyTyped = lyRaw ? cleanCode(lyRaw) : null;
    if (lyRaw && !lyTyped) { showToast(L('lyBadCode')); lyBox.focus(); return; }
    // These need the customer's tap, so they happen before anything is awaited
    unlockAudio();
    const permAsk = pushSupported && Notification.permission === 'default' ? Notification.requestPermission().catch(() => 'default') : Promise.resolve();

    sending = true;
    const btn = $('checkoutBtn');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = L('sending'); }
    try {
      await permAsk;
      const push = await subscribePush();
      const items = state.cart.map((l) => ({ item_id: l.itemId, qty: l.qty, selections: l.selections }));
      const args = {
        // The table from the scanned QR code wins over anything typed, so the token always matches
        p_items: items, p_order_type: state.orderType,
        p_table: (state.orderType === 'dine-in' && tableQr ? tableQr.table : state.table) || '',
        p_lang: state.locale, p_push: push,
      };
      // Only sent when the customer scanned a table QR card (keeps older database versions working too)
      if (state.orderType === 'dine-in' && tableQr) args.p_table_token = tableQr.token;
      const res = await rpc('place_order', args);
      track('order/' + state.orderType);
      setActive({ id: res.id, token: res.token, code: res.code, at: Date.now() });
      // The order is in; the stamp card is a bonus, so a failure here never stops it
      if (lyOn) { await linkAfterSend(res, lyTyped); lyHaveOpen = false; }
      lastStatus = null;
      current = null;
      state.cart = [];
      persist();
      renderCart();
      closeDrawer();
      renderFloatingBar();
      openTracker();
      poll(true);
    } catch (e) {
      if (/sold out/i.test(e.message)) { showToast(L('soldOutErr')); loadAvailability(); }
      else if (/table token/i.test(e.message)) showToast(L('errTableQr'));
      else if (/rate limit/i.test(e.message)) showToast(L('errRateLimit'));
      else if (/store closed/i.test(e.message)) { state.isOpen = false; showToast(closedMsg()); loadSchedule(); }
      else showFailure();
    } finally {
      sending = false;
      const b = $('checkoutBtn');
      if (b && state.isOpen) { b.disabled = false; const s = b.querySelector('span'); if (s) s.textContent = t('sendOrder'); }
      else if (b) renderCart();
    }
  };

  function showFailure() {
    const footer = $('drawerFooter');
    if (!footer || footer.querySelector('#waFallback')) { showToast(L('sendFailed')); return; }
    const box = document.createElement('div');
    box.className = 'mt-3 rounded-xl bg-brand/10 p-3 text-xs font-semibold text-brand';
    box.innerHTML = esc(L('sendFailed')) +
      '<button type="button" id="waFallback" class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-bold text-ink ring-1 ring-edge/10">' +
      '<i data-lucide="message-circle" class="h-4 w-4"></i>' + esc(L('sendWhatsApp')) + '</button>';
    footer.appendChild(box);
    refreshIcons();
    box.querySelector('#waFallback').addEventListener('click', () => whatsappFallback());
  }

  /* ── Tracker UI ── */
  const root = document.createElement('div');
  root.id = 'orderTracker';
  root.className = 'fixed inset-0 z-[70] hidden';
  root.innerHTML =
    '<div class="trk-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm"></div>' +
    '<div class="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">' +
      '<div id="trkPanel" class="trk-panel relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface ring-1 ring-edge/10 sm:max-w-md sm:rounded-3xl"></div>' +
    '</div>';
  document.body.appendChild(root);

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.id = 'orderChip';
  chip.className = 'trk-chip fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[35] mx-auto hidden max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-start text-base shadow-card';
  document.body.appendChild(chip);
  chip.addEventListener('click', openTracker);

  let current = null;
  let lastStatus = null;

  function openTracker() {
    if (!getActive()) return;
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderTracker();
  }
  function closeTracker() {
    root.classList.add('hidden');
    document.body.style.overflow = '';
    renderChip();
  }
  root.addEventListener('click', (e) => {
    if (e.target.classList.contains('trk-backdrop') || e.target.closest('[data-trk-close]')) {
      if (current && current.status === 'ready') stopReadyAlarm();
      closeTracker();
      return;
    }
    if (e.target.closest('[data-trk-alerts]')) { askForAlerts(); return; }
    if (e.target.closest('[data-trk-coming]')) { stopReadyAlarm(); renderTracker(); return; }
    if (e.target.closest('[data-trk-new]')) { stopReadyAlarm(); setActive(null); current = null; closeTracker(); renderChip(); return; }
  });

  function statusTexts(o) {
    const s = o.status;
    const map = {
      pending: ['trkPendingT', 'trkPendingS'], accepted: ['trkAcceptedT', 'trkAcceptedS'], ready: ['trkReadyT', 'trkReadyS'],
      collected: ['trkCollectedT', 'trkCollectedS'], rejected: ['trkRejectedT', 'trkRejectedS'], cancelled: ['trkCancelledT', 'trkCancelledS'],
    }[s] || ['trkPendingT', 'trkPendingS'];
    let sub = L(map[1]);
    if (s === 'accepted') sub = sub.replace('{m}', String(Math.max(1, Math.round(msLeft(o) / 60000))));
    if (s === 'rejected' && o.reject_reason) sub = o.reject_reason;
    return [L(map[0]), sub];
  }
  function msLeft(o) {
    if (!o.ready_at) return 0;
    const skew = o._skew || 0;
    return Date.parse(o.ready_at) - (Date.now() + skew);
  }
  function fmtLeft(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // iPhone only allows alerts from a Home Screen web app, which has its own storage.
  // So the page address carries the order while this guide is shown: the Home Screen icon then opens straight to it.
  function iosGuide(a) {
    try { history.replaceState(null, '', location.pathname + '?order=' + encodeURIComponent(a.id) + '&t=' + encodeURIComponent(a.token)); } catch { /* ignore */ }
    const ico = (name) => '<span class="mx-0.5 inline-grid h-6 w-6 place-items-center rounded-md bg-surface align-middle text-[#0A84FF] ring-1 ring-edge/10"><i data-lucide="' + name + '" class="h-3.5 w-3.5"></i></span>';
    const step = (n, html) => '<li class="ios-step flex items-center gap-3" style="animation-delay:' + (n * 120) + 'ms">' +
      '<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">' + n + '</span>' +
      '<span class="text-sm leading-snug">' + html + '</span></li>';
    return '<div class="rounded-2xl bg-brand/5 p-4 ring-1 ring-brand/25">' +
      '<p class="flex items-center gap-2 text-sm font-bold"><i data-lucide="bell-ring" class="h-4 w-4 text-brand"></i>' + esc(L('iosGuideT')) + '</p>' +
      '<p class="mt-0.5 text-[11px] text-muted">' + esc(L('iosGuideS')) + '</p>' +
      '<ol class="mt-3 space-y-2.5">' +
        step(1, esc(L('iosStep1')).replace('{share}', ico('share'))) +
        step(2, esc(L('iosStep2')).replace('{add}', ico('square-plus'))) +
        step(3, '<img src="image/apple-touch-icon.png" alt="" class="me-1 inline h-6 w-6 rounded-md align-middle ring-1 ring-edge/10" />' + esc(L('iosStep3'))) +
      '</ol>' +
      '<p class="mt-3 text-[11px] text-muted">' + esc(L('iosGuideF')) + '</p>' +
    '</div>';
  }

  const ICONS = { pending: 'send', accepted: 'flame', ready: 'bell-ring', collected: 'party-popper', rejected: 'circle-x', cancelled: 'circle-x' };

  function renderTracker() {
    const a = getActive();
    const panel = $('trkPanel');
    if (!a || !panel) return;
    const o = current || { status: 'pending', code: a.code, order_type: state.orderType };
    const [title, sub] = statusTexts(o);
    const step = { pending: 0, accepted: 1, ready: 2, collected: 3 }[o.status];
    const failed = o.status === 'rejected' || o.status === 'cancelled';
    const done = o.status === 'collected' || failed;

    const steps = ['stepSent', 'stepAccepted', 'stepReady'].map((k, i) => {
      const on = !failed && step >= i;
      const now = !failed && step === i;
      return '<div class="flex flex-1 flex-col items-center gap-1.5">' +
        '<span class="trk-dot relative grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold transition ' +
          (on ? 'bg-brand text-white shadow-glow' : 'bg-surfaceAlt text-muted') + (now ? ' trk-now' : '') + '">' +
          (on && !now ? '<i data-lucide="check" class="h-4 w-4"></i>' : (i + 1)) + '</span>' +
        '<span class="text-[11px] font-bold ' + (on ? 'text-ink' : 'text-muted') + '">' + esc(L(k)) + '</span>' +
      '</div>';
    }).join('<span class="trk-line mt-[18px] h-1 flex-1 rounded-full ' + (step >= 1 && !failed ? 'bg-brand' : 'bg-surfaceAlt') + '"></span>');

    const left = o.status === 'accepted' ? msLeft(o) : 0;
    const countdown = o.status === 'accepted'
      ? '<div class="mt-5 text-center"><p class="tnum font-display text-6xl leading-none" data-trk-left>' + (left > 0 ? fmtLeft(left) : '—') + '</p>' +
        '<p class="mt-1 text-xs font-bold uppercase tracking-wide text-muted" data-trk-left-label>' + esc(left > 0 ? L('left') : L('almost')) + '</p></div>'
      : '';

    let alerts = '';
    if (!done) {
      if (pushSupported && Notification.permission === 'granted') {
        alerts = '<p class="flex items-center justify-center gap-1.5 text-xs font-semibold" style="color:#16a34a"><i data-lucide="bell-ring" class="h-3.5 w-3.5"></i>' + esc(L('notifyOn')) + '</p>';
      } else if (isIOS && !isStandalone) {
        alerts = iosGuide(a);
      } else if (pushSupported && Notification.permission === 'default') {
        alerts = '<button type="button" data-trk-alerts class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt p-3 text-start ring-1 ring-edge/5 transition hover:ring-brand/40">' +
          '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><i data-lucide="bell-plus" class="h-5 w-5"></i></span>' +
          '<span class="min-w-0"><span class="block text-sm font-bold">' + esc(L('notifyBtn')) + '</span><span class="block text-[11px] text-muted">' + esc(L('notifySub')) + '</span></span></button>';
      } else {
        alerts = '<p class="rounded-xl bg-surfaceAlt px-3 py-2.5 text-xs text-muted">' + esc(pushSupported ? L('notifyBlocked') : L('keepOpen')) + '</p>';
      }
    }

    const items = (o.items || []).map((l) => {
      const m = MENU.find((x) => x.id === l.item_id);
      return '<li class="flex justify-between gap-3 text-sm"><span><span class="tnum font-bold text-brand">' + l.qty + '×</span> ' + esc(m ? tx(m.name) : l.name_en) + '</span>' +
        '<span class="tnum text-muted">' + esc(formatPrice(l.line_total)) + '</span></li>';
    }).join('');

    const feedback = feedbackCard(o, a);
    const queue = queueHtml(o);
    const stamps = loyaltyHtml(o);
    const where = o.order_type === 'takeaway' ? L('takeawayLabel') : L('tableLabel') + ' ' + (o.table_no || state.table || '');
    const hero = o.status === 'ready' ? ' trk-ready' : '';

    panel.innerHTML =
      '<div class="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand via-brandDark to-brandDeeper px-6 pb-6 pt-5 text-center text-white' + hero + '">' +
        '<div class="pointer-events-none absolute -top-16 -end-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>' +
        '<button type="button" data-trk-close class="absolute top-3 end-3 grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white transition hover:bg-black/40" aria-label="' + esc(L('backToMenu')) + '"><i data-lucide="x" class="h-4 w-4"></i></button>' +
        '<p class="text-[11px] font-bold uppercase tracking-[.3em] text-white/75">' + esc(L('orderNo')) + '</p>' +
        '<p class="tnum font-display text-6xl leading-none">#' + esc(o.code || a.code) + '</p>' +
        '<p class="mt-3 text-xs font-semibold text-white/80">' + esc(where) + '</p>' +
        '<div class="trk-icon relative mx-auto mt-4 grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 sm:h-20 sm:w-20">' +
          (o.status === 'pending' || o.status === 'ready' ? '<span class="trk-pulse"></span>' : '') +
          '<i data-lucide="' + (ICONS[o.status] || 'send') + '" class="h-9 w-9"></i>' +
        '</div>' +
        '<h3 class="trk-title mt-4 font-display text-2xl leading-tight">' + esc(title) + '</h3>' +
        (sub ? '<p class="mt-1 text-sm text-white/85">' + esc(sub) + '</p>' : '') +
      '</div>' +
      '<div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">' +
        (failed ? '' : '<div class="flex items-start">' + steps + '</div>') +
        queue +
        countdown +
        (alerts ? '<div class="mt-5">' + alerts + '</div>' : '') +
        stamps +
        (items ? '<ul class="mt-5 space-y-1.5 rounded-2xl bg-surfaceAlt p-4">' + items +
          '<li class="mt-2 flex justify-between border-t border-edge/10 pt-2 text-sm font-bold"><span>' + esc(t('total')) + '</span><span class="tnum text-brand">' + esc(formatPrice(o.total || 0)) + '</span></li></ul>' : '') +
        feedback +
      '</div>' +
      '<footer class="shrink-0 border-t border-edge/5 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">' +
        (o.status === 'ready' && readyLoop
          ? '<button type="button" data-trk-coming class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-[.98]">' + esc(L('coming')) + '</button>'
          : done
            ? '<button type="button" data-trk-new class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-[.98]">' + esc(L('newOrder')) + '</button>'
            : '<button type="button" data-trk-close class="w-full rounded-xl bg-surfaceAlt px-4 py-3.5 text-sm font-bold ring-1 ring-edge/5 transition active:scale-[.98]">' + esc(L('backToMenu')) + '</button>') +
        (isIOS && !isStandalone && !done ? '<div class="ios-arrow mt-2 flex justify-center text-brand" aria-hidden="true"><i data-lucide="arrow-down" class="h-6 w-6"></i></div>' : '') +
      '</footer>';
    refreshIcons();
    renderChip();
  }

  /* ── 016: "2 orders ahead of you" while it's new or cooking ── */
  function queueHtml(o) {
    if (!['pending', 'accepted'].includes(o.status) || typeof o.ahead !== 'number') return '';
    const txt = o.ahead === 0 ? L('qNext') : o.ahead === 1 ? L('qAhead1') : L('qAhead').replace('{n}', o.ahead);
    return '<p class="mt-4 flex items-center justify-center gap-2 text-sm font-bold">' +
      (o.ahead ? '<span class="tnum grid h-7 min-w-[1.75rem] place-items-center rounded-full bg-brand/10 px-2 text-xs font-extrabold text-brand">' + o.ahead + '</span>'
               : '<span aria-hidden="true">🎉</span>') + esc(txt) + '</p>';
  }

  /* ── 016: the stamp card on the order page (or a way to put this order on a card while it's still new / cooking) ── */
  function loyaltyHtml(o) {
    const c = o.loyalty;
    if (!c) {
      if (!LOY || !['pending', 'accepted'].includes(o.status)) return '';
      const mine = stored(LY_CODE_KEY);
      return '<div class="mt-5 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5">' +
        '<p class="flex items-center gap-2 text-sm font-bold"><span aria-hidden="true">⭐</span>' + esc(L('lyAddTitle')) + '</p>' +
        '<p class="mt-0.5 text-[11px] text-muted">' + esc(fillIn('lyCartSub', { g: LOY.goal, r: rewardText() })) + '</p>' +
        '<button type="button" data-ly-add class="mt-2 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">' +
          esc(mine ? fillIn('lyUseCard', { c: showCode(mine) }) : L('lyStart')) + '</button>' +
        '<div class="mt-2 flex gap-2"><input data-ly-input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" dir="ltr" placeholder="' + esc(L('lyHave')) + '" value="' + esc(lyDraft) + '" ' +
          'class="tnum min-w-0 flex-1 rounded-xl border-0 bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wider ring-1 ring-edge/10 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:ring-2 focus:ring-brand/60" />' +
          '<button type="button" data-ly-add data-ly-typed class="shrink-0 rounded-xl bg-surface px-4 text-sm font-bold ring-1 ring-edge/10 transition active:scale-[.98] disabled:opacity-60">' + esc(L('lyAddBtn')) + '</button></div>' +
      '</div>';
    }
    saveLast(c);
    const goal = c.goal || 10;
    const n = Math.min(c.stamps, goal);
    const reward = rewardText(c.reward);
    let line, tone = '';
    if (c.reward_now) { line = c.done ? L('lyRewardUsed') : fillIn('lyReward', { r: reward }); tone = 'reward'; }
    else if (c.done) line = (o.total >= ((LOY && LOY.min_total) || 0) ? L('lyEarned') + ' ' : '') + (c.stamps >= goal ? fillIn('lyFull', { r: reward }) : fillIn('lyLeft', { n: goal - c.stamps, r: reward }));
    else if (c.stamps >= goal) line = fillIn('lyFull', { r: reward });
    else line = L('lyPending') + ' ' + fillIn('lyLeft', { n: goal - c.stamps, r: reward });
    const dots = goal <= 12
      ? '<div class="mt-3 flex flex-wrap justify-center gap-1.5" aria-hidden="true">' + Array.from({ length: goal }, (_, i) =>
          '<span class="grid h-7 w-7 place-items-center rounded-full text-xs font-bold ' + (i < n ? 'bg-brand text-white' : 'bg-surface text-muted ring-1 ring-edge/10') + '">' + (i < n ? '★' : '') + '</span>').join('') + '</div>'
      : '';
    return '<div class="mt-5 rounded-2xl p-4 text-center ring-1 ' + (tone ? 'ring-amber-400/60' : 'bg-surfaceAlt ring-edge/5') + '"' + (tone ? ' style="background:rgba(251,191,36,.14)"' : '') + '>' +
      '<p class="text-[11px] font-bold uppercase tracking-wide text-muted">' + (tone ? '🎁 ' : '⭐ ') + esc(L('lyCartTitle')) +
        ' <span class="tnum ms-1 rounded-md bg-surface px-1.5 py-0.5 tracking-wider text-ink ring-1 ring-edge/10" dir="ltr">' + esc(showCode(c.code)) + '</span></p>' +
      '<p class="mt-1 font-display text-2xl">' + esc(fillIn('lyStamps', { n: c.stamps, g: goal })) + '</p>' +
      dots +
      '<p class="mt-2 text-sm font-semibold">' + esc(line) + '</p>' +
      '<p class="mt-2 text-[11px] text-muted">' + esc(fillIn('lyKeep', { c: showCode(c.code) })) + '</p>' +
    '</div>';
  }
  root.addEventListener('input', (e) => { if (e.target.matches('[data-ly-input]')) lyDraft = e.target.value; });
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ly-add]');
    const a = getActive();
    if (!b || !a) return;
    let code = null;
    if (b.hasAttribute('data-ly-typed')) {
      const box = root.querySelector('[data-ly-input]');
      code = cleanCode(box && box.value);
      if (!code) { showToast(L('lyBadCode')); if (box) box.focus(); return; }
    }
    b.disabled = true;
    try {
      if (code) await linkLoyalty(a, code); else await linkAfterSend(a, null);
      store(LY_OFF_KEY, '');
      lyDraft = '';
      await poll(true);
      renderTracker();
    } catch (err) { showToast(/unknown card/.test(err.message) ? L('lyUnknown') : L('fbErr')); b.disabled = false; }
  });

  /* ── Feedback once the order is ready / picked up (optional, only the owner reads it) ── */
  const FB_KEYS = ['food', 'service', 'speed', 'value', 'cleanliness', 'overall'];
  const fb = { id: null, state: 'unknown', r: {}, comment: '', busy: false };   // state: unknown | open | sent | off
  const STAR = '<svg viewBox="0 0 24 24" class="h-7 w-7" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"/></svg>';
  const STAR_ON = 'text-amber-400', STAR_OFF = 'text-edge/20';

  function feedbackCard(o, a) {
    if (!['ready', 'collected'].includes(o.status)) return '';
    if (fb.id !== a.id) { Object.assign(fb, { id: a.id, state: 'unknown', r: {}, comment: '', busy: false }); checkFeedback(a); }
    if (fb.state === 'unknown' || fb.state === 'off') return '';
    if (fb.state === 'sent') {
      return '<div class="mt-5 flex items-center gap-3 rounded-2xl bg-surfaceAlt p-4 ring-1 ring-edge/5">' +
        '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="heart" class="h-5 w-5"></i></span>' +
        '<p class="text-sm font-semibold">' + esc(L('fbThanks')) + '</p></div>';
    }
    const row = (k) =>
      '<div class="flex items-center justify-between gap-2 py-1' + (k === 'overall' ? ' mt-1 border-t border-edge/10 pt-2' : '') + '">' +
        '<span class="text-sm ' + (k === 'overall' ? 'font-bold' : 'font-semibold') + '">' + esc(L('fb_' + k)) + '</span>' +
        '<span class="flex" role="radiogroup" aria-label="' + esc(L('fb_' + k)) + '">' + [1, 2, 3, 4, 5].map((v) =>
          '<button type="button" data-fb-k="' + k + '" data-fb-v="' + v + '" role="radio" aria-checked="' + (fb.r[k] === v) + '" aria-label="' + v + ' / 5" ' +
            'class="grid h-9 w-8 place-items-center transition active:scale-90 ' + ((fb.r[k] || 0) >= v ? STAR_ON : STAR_OFF) + '">' + STAR + '</button>').join('') +
        '</span></div>';
    return '<div class="mt-5 rounded-2xl bg-surfaceAlt p-4 ring-1 ring-edge/5">' +
      '<p class="font-display text-lg leading-tight">' + esc(L('fbTitle')) + '</p>' +
      '<p class="mt-0.5 text-[11px] text-muted">' + esc(L('fbSub')) + '</p>' +
      '<div class="mt-2">' + FB_KEYS.map(row).join('') + '</div>' +
      '<textarea id="fbComment" maxlength="500" rows="2" placeholder="' + esc(L('fbComment')) + '" class="mt-3 w-full resize-none rounded-xl border-0 bg-surface px-3 py-2.5 text-sm ring-1 ring-edge/10 placeholder:text-muted focus:ring-2 focus:ring-brand/60">' + esc(fb.comment) + '</textarea>' +
      '<button type="button" data-fb-send ' + (fb.busy ? 'disabled' : '') + ' class="mt-2 w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">' + esc(L(fb.busy ? 'sending' : 'fbSend')) + '</button>' +
    '</div>';
  }
  function checkFeedback(a) {
    rpc('feedback_sent', { p_id: a.id, p_token: a.token })
      .then((sent) => { fb.state = sent ? 'sent' : 'open'; })
      .catch(() => { fb.state = 'off'; })            // feedback not set up in the database yet → no card
      .finally(() => { if (fb.id === a.id && !root.classList.contains('hidden')) renderTracker(); });
  }
  async function sendFeedback() {
    const a = getActive();
    if (!a || fb.busy) return;
    if (!fb.r.overall) { showToast(L('fbNeedOverall')); return; }
    fb.busy = true;
    const btn = root.querySelector('[data-fb-send]');
    if (btn) { btn.disabled = true; btn.textContent = L('sending'); }
    try {
      await rpc('submit_feedback', { p_id: a.id, p_token: a.token, p_ratings: fb.r, p_comment: fb.comment.trim() || null });
      fb.state = 'sent';
      // Low rating → phone alert to the owner (the 15-minute job sends it too if this call doesn't get through)
      fetch(CFG.supabaseUrl + '/functions/v1/feedback-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
    } catch (e) {
      if (/already sent/i.test(e.message)) fb.state = 'sent'; else showToast(L('fbErr'));
    } finally {
      fb.busy = false;
      renderTracker();
    }
  }
  root.addEventListener('click', (e) => {
    const star = e.target.closest('[data-fb-k]');
    if (star) {
      const v = +star.dataset.fbV;
      fb.r[star.dataset.fbK] = v;
      // Update just these stars, so the card doesn't jump while the customer is rating
      star.parentElement.querySelectorAll('[data-fb-v]').forEach((x) => {
        const on = +x.dataset.fbV <= v;
        x.classList.toggle(STAR_ON, on);
        x.classList.toggle(STAR_OFF, !on);
        x.setAttribute('aria-checked', String(+x.dataset.fbV === v));
      });
      return;
    }
    if (e.target.closest('[data-fb-send]')) sendFeedback();
  });
  root.addEventListener('input', (e) => { if (e.target.id === 'fbComment') fb.comment = e.target.value; });

  function renderChip() {
    const a = getActive();
    const open = !root.classList.contains('hidden');
    if (!a || open || state.introVisible) {
      chip.classList.add('hidden');
      chip.classList.remove('flex');
      const bar = $('floatingBar');
      if (bar && !a) bar.style.bottom = '';
      return;
    }
    const o = current || { status: 'pending', code: a.code };
    const [title] = statusTexts(o);
    const extra = o.status === 'accepted' && msLeft(o) > 0 ? ' · <span class="tnum" data-chip-left>' + fmtLeft(msLeft(o)) + '</span>' : '';
    chip.innerHTML =
      '<span class="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white">' +
        (o.status === 'ready' ? '<span class="trk-pulse"></span>' : '') + '<i data-lucide="' + (ICONS[o.status] || 'send') + '" class="h-4 w-4"></i></span>' +
      '<span class="min-w-0 flex-1 text-surface"><span class="block text-[11px] font-bold uppercase tracking-wide opacity-70">' + esc(L('viewOrder')) + ' #' + esc(o.code) + '</span>' +
        '<span class="block truncate text-sm font-bold">' + esc(title) + extra + '</span></span>' +
      '<i data-lucide="chevron-up" class="h-4 w-4 text-surface opacity-70"></i>';
    chip.classList.remove('hidden');
    chip.classList.add('flex');
    // The cart bar sits in the same spot; lift it above the order chip
    const bar = $('floatingBar');
    if (bar) bar.style.bottom = '76px';
    refreshIcons();
  }

  /* ── Live status: poll while the page is open ── */
  async function poll(force) {
    const a = getActive();
    if (!a) return;
    if (!force && document.visibilityState !== 'visible') return;
    let o;
    try { o = await rpc('get_order_status', { p_id: a.id, p_token: a.token }); } catch { return; }
    if (!o) { setActive(null); current = null; renderChip(); return; }
    o._skew = Date.parse(o.now) - Date.now();
    const changed = !current || current.status !== o.status || current.ready_at !== o.ready_at ||
      current.ahead !== o.ahead || JSON.stringify(current.loyalty) !== JSON.stringify(o.loyalty);
    const prev = lastStatus;
    const prevReadyAt = current && current.ready_at;
    current = o;
    lastStatus = o.status;
    if (changed) {
      if (prev && prev !== o.status) {
        if (o.status === 'accepted') soundAccepted();
        if (o.status === 'ready') { startReadyAlarm(); openTracker(); }
        if (o.status === 'rejected') try { navigator.vibrate && navigator.vibrate(300); } catch { /* ignore */ }
      } else if (!prev && o.status === 'ready' && Date.now() - Date.parse(o.updated_at) < 10 * 60000) {
        startReadyAlarm();
      }
      if (prev === 'accepted' && o.status === 'accepted' && prevReadyAt !== o.ready_at) soundAccepted();
      if (!root.classList.contains('hidden')) renderTracker(); else renderChip();
    }
    // Finished orders stop showing after an hour
    if (['collected', 'rejected', 'cancelled'].includes(o.status) && Date.now() - Date.parse(o.updated_at) > 3600000) {
      setActive(null); current = null; renderChip();
    }
  }
  setInterval(() => poll(false), POLL_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') poll(true); });

  // Countdown ticks every second
  setInterval(() => {
    if (!current || current.status !== 'accepted') return;
    const left = msLeft(current);
    const el = document.querySelector('[data-trk-left]');
    if (el) el.textContent = left > 0 ? fmtLeft(left) : '—';
    const lb = document.querySelector('[data-trk-left-label]');
    if (lb) lb.textContent = left > 0 ? L('left') : L('almost');
    const c = document.querySelector('[data-chip-left]');
    if (c) c.textContent = fmtLeft(left);
  }, 1000);

  /* ── Opened from a notification (menu.html?order=…&t=…) or returning later ── */
  const fromLink = () => { try {
    const q = new URLSearchParams(location.search);
    if (q.get('order') && q.get('t')) {
      setActive({ id: q.get('order'), token: q.get('t'), code: '', at: Date.now() });
      history.replaceState(null, '', location.pathname + (q.get('table') ? '?table=' + q.get('table') : ''));
      hideIntro();
      openTracker();
    }
  } catch { /* ignore */ } };
  // After the menu's own start-up, which shows the intro screen
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(fromLink, 0));
  else setTimeout(fromLink, 0);
  if (getActive()) poll(true);

  // Re-render the tracker when the language changes
  const _applyLocale = window.applyLocale;
  window.applyLocale = function () { _applyLocale(); if (!root.classList.contains('hidden')) renderTracker(); else renderChip(); };
  // Show the order chip once the customer enters the menu
  $('enterMenuBtn').addEventListener('click', () => setTimeout(renderChip, 50));
  $('homeBtn').addEventListener('click', () => chip.classList.add('hidden'));

  // The send button text
  applyLocale();
})();
