'use strict';

/* ====================================================================
 * Smashed Burger — staff screen (admins + cashiers)
 * Live orders → accept with prep time → adjust → ready alarm → picked up
 * ==================================================================== */

const CFG = window.APP_CONFIG;
const MENU_DATA = window.MENU_DATA || { items: {}, options: {} };
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-staff-auth' },
});

const PREP_PRESETS = [5, 10, 15, 20, 30, 45];
const DEFAULT_PREP = 15;
const ALARM_EVERY_MS = 6000;
const PREFS_KEY = 'smashed-burger.staff.v1';

/* ── i18n ── */
const I18N = {
  en: {
    dir: 'ltr', short: 'EN', native: 'English',
    loginTitle: 'Staff sign in', loginSub: 'For admins and cashiers only.', email: 'Email', password: 'Password', signIn: 'Sign in',
    badLogin: 'Wrong email or password.', notStaff: 'This account is not a staff account.', sessionEnded: 'You were signed out (login expired or ended by the owner). Please sign in again.', signOutAll: 'Sign out all devices', signOutAllConfirm: 'Sign this account out on every device now?', signedOutAll: 'Signed out on all devices',
    shiftTitle: 'Ready for orders?', shiftSub: 'Tap to start your shift. This turns on the new-order sound and keeps the screen awake.',
    startShift: 'Start shift', signedInAs: 'Signed in as',
    live: 'Live', connecting: 'Connecting…', offline: 'Connection lost — reconnecting… New orders may be delayed.',
    tabNew: 'New', tabPreparing: 'Preparing', tabReady: 'Ready', tabDone: 'Done',
    colNewEmpty: 'No new orders', colPrepEmpty: 'Nothing cooking', colReadyEmpty: 'Nothing waiting for pickup', doneEmpty: 'No finished orders yet today',
    doneToday: 'Done today',
    table: 'Table', takeaway: 'Takeaway', items: 'items', total: 'Total',
    prepTime: 'Ready in', min: 'min', accept: 'Accept', reject: 'Reject',
    markReady: 'Ready — call customer', ringAgain: 'Ring again', pickedUp: 'Picked up',
    late: 'late', left: 'left', readyFor: 'Waiting', ago: 'ago', justNow: 'just now',
    statusCollected: 'Picked up', statusRejected: 'Rejected', statusCancelled: 'Cancelled',
    rejectTitle: 'Reject order', rejectSub: 'The customer will see this reason.', rejectConfirm: 'Reject order', otherReason: 'Other reason…',
    reasonSoldOut: 'An item is sold out', reasonBusy: 'We are too busy right now', reasonClosing: 'The kitchen is closing', reasonAsk: 'Please come to the cashier',
    customTime: 'Other', notifySent: 'Customer notified ✓', notifyNone: 'No phone alerts for this customer — tell them in person',
    notifyFail: 'Could not reach the customer\'s phone — tell them in person',
    accepted: 'Order accepted', markedReady: 'Customer called', collected: 'Marked as picked up', rejected: 'Order rejected', timeChanged: 'Time updated',
    actionFailed: 'That didn\'t work — please try again',
    menu: 'Menu', today: 'Today', soldOut: 'Sold out items', staffAccounts: 'Staff accounts', changePassword: 'Change password', signOut: 'Sign out',
    statOrders: 'Orders', statRevenue: 'Sales', statAvgPrep: 'Avg. prep', statTop: 'Most ordered',
    soldOutSub: 'Switch off anything you have run out of. Customers can\'t order it until you switch it back on.',
    available: 'Available', soldOutLabel: 'Sold out',
    staffSub: 'Add cashiers and admins. Cashiers can handle orders; admins can also manage staff, stock and see sales.',
    addStaff: 'Add staff member', name: 'Name', role: 'Role', roleCashier: 'Cashier', roleAdmin: 'Admin', add: 'Add', remove: 'Remove',
    removeConfirm: 'Remove this account? They will no longer be able to sign in.', you: 'you', lastSeen: 'Last sign-in', never: 'never',
    newPassword: 'New password', save: 'Save', pwShort: 'Password needs at least 8 characters', pwSaved: 'Password changed', resetPw: 'Reset password',
    staffAdded: 'Staff member added', staffRemoved: 'Staff member removed',
    print: 'Print ticket', close: 'Close', cancel: 'Cancel', soundOn: 'Sound on', soundOff: 'Sound off',
    newOrderNotif: 'New order', adminOnly: 'Admins only',
    monthlySales: 'Monthly sales', monthTotal: 'Month total', perDay: 'Average per day', bestDay: 'Best day', ordersShort: 'orders', noSales: 'No sales', dayDetails: 'Day details', allDays: 'Every day this month',
    signOutConfirm: 'Sign out of this device? You will need the password to sign in again.', reconnecting: 'Connecting to the order system…',
    testBadge: 'TEST', markTest: 'Test order', unmarkTest: 'Count it', testHint: 'Test orders are left out of sales and reports',
    markedTest: 'Marked as a test order — left out of sales', unmarkedTest: 'Counted in sales again',
    soldOutSince: 'since {t}', soldOutBy: 'by {n}', allBackOn: 'Switch all back on', allBackOnConfirm: 'Switch every sold-out item back on?',
    autoReset: 'Back on every morning', autoResetSub: 'At 9:00 every sold-out item is switched back on by itself', autoResetOwner: 'Only the owner can change this', saved: 'Saved',
    hr: 'h', yesterday: 'Yesterday', staleNote: 'Waiting for over 2 hours, so it no longer rings. Is the customer still here?', clearOrder: 'Clear order',
    clearConfirm: 'Clear this old order? The customer is told it timed out.', reasonExpired: 'Sorry, this order timed out. Please order again or ask the cashier.',
    loyaltyReward: 'Loyalty reward', loyaltyTakeOff: 'take it off the bill', stampCard: 'Stamp card', rewardUsed: 'Reward used', stampEarned: '+1 stamp',
  },
  ku: {
    dir: 'rtl', short: 'ک', native: 'کوردی',
    loginTitle: 'چوونەژوورەوەی کارمەندان', loginSub: 'تەنها بۆ بەڕێوەبەران و کاشێرەکان.', email: 'ئیمەیڵ', password: 'وشەی نهێنی', signIn: 'چوونەژوورەوە',
    badLogin: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.', notStaff: 'ئەم هەژمارە هەژماری کارمەند نییە.', sessionEnded: 'چوویتە دەرەوە (کاتی چوونەژوورەوە تەواو بوو یان خاوەن کۆتایی پێهێنا). تکایە دووبارە بچۆ ژوورەوە.', signOutAll: 'دەرچوون لە هەموو ئامێرەکان', signOutAllConfirm: 'ئێستا ئەم هەژمارە لە هەموو ئامێرەکان دەربکرێت؟', signedOutAll: 'لە هەموو ئامێرەکان دەرکرا',
    shiftTitle: 'ئامادەی بۆ داواکارییەکان؟', shiftSub: 'دابگرە بۆ دەستپێکردنی شیفتەکەت. دەنگی داواکاری نوێ کار دەکات و شاشەکە ناکوژێتەوە.',
    startShift: 'دەستپێکردنی شیفت', signedInAs: 'چوویتە ژوورەوە وەک',
    live: 'ڕاستەوخۆ', connecting: 'پەیوەندی دەکرێت…', offline: 'پەیوەندی پچڕا — هەوڵی دووبارە دەدرێتەوە… لەوانەیە داواکارییە نوێیەکان دوا بکەون.',
    tabNew: 'نوێ', tabPreparing: 'ئامادەکردن', tabReady: 'ئامادەیە', tabDone: 'تەواو',
    colNewEmpty: 'هیچ داواکارییەکی نوێ نییە', colPrepEmpty: 'هیچ شتێک ئامادە ناکرێت', colReadyEmpty: 'هیچ داواکارییەک چاوەڕێی وەرگرتن نییە', doneEmpty: 'هێشتا هیچ داواکارییەک تەواو نەبووە',
    doneToday: 'تەواوبووەکانی ئەمڕۆ',
    table: 'مێز', takeaway: 'بۆ بردنەوە', items: 'دانە', total: 'کۆی گشتی',
    prepTime: 'ئامادە دەبێت لە', min: 'خولەک', accept: 'وەرگرتن', reject: 'ڕەتکردنەوە',
    markReady: 'ئامادەیە — بانگی کڕیار بکە', ringAgain: 'دووبارە بانگکردن', pickedUp: 'وەرگیرا',
    late: 'دواکەوتوو', left: 'ماوە', readyFor: 'چاوەڕێ', ago: 'لەمەوبەر', justNow: 'ئێستا',
    statusCollected: 'وەرگیرا', statusRejected: 'ڕەتکرایەوە', statusCancelled: 'هەڵوەشێنرایەوە',
    rejectTitle: 'ڕەتکردنەوەی داواکاری', rejectSub: 'کڕیار ئەم هۆکارە دەبینێت.', rejectConfirm: 'ڕەتکردنەوە', otherReason: 'هۆکاری تر…',
    reasonSoldOut: 'خواردنێک نەماوە', reasonBusy: 'ئێستا زۆر قەرەباڵغین', reasonClosing: 'چێشتخانە دادەخرێت', reasonAsk: 'تکایە وەرە بۆ لای کاشێر',
    customTime: 'تر', notifySent: 'کڕیار ئاگادار کرایەوە ✓', notifyNone: 'ئاگادارکردنەوە بۆ ئەم کڕیارە نییە — ڕاستەوخۆ پێی بڵێ',
    notifyFail: 'نەگەیشتە مۆبایلی کڕیار — ڕاستەوخۆ پێی بڵێ',
    accepted: 'داواکاری وەرگیرا', markedReady: 'بانگی کڕیار کرا', collected: 'وەک وەرگیراو تۆمار کرا', rejected: 'داواکاری ڕەتکرایەوە', timeChanged: 'کات نوێ کرایەوە',
    actionFailed: 'سەرکەوتوو نەبوو — تکایە دووبارە هەوڵ بدەرەوە',
    menu: 'لیست', today: 'ئەمڕۆ', soldOut: 'خواردنە نەماوەکان', staffAccounts: 'هەژماری کارمەندان', changePassword: 'گۆڕینی وشەی نهێنی', signOut: 'چوونەدەرەوە',
    statOrders: 'داواکاری', statRevenue: 'فرۆشتن', statAvgPrep: 'تێکڕای ئامادەکردن', statTop: 'زۆرترین داواکراو',
    soldOutSub: 'ئەوەی نەماوە بیکوژێنەوە. کڕیاران ناتوانن داوای بکەن تا دووبارە هەڵیدەکەیتەوە.',
    available: 'هەیە', soldOutLabel: 'نەماوە',
    staffSub: 'کاشێر و بەڕێوەبەر زیاد بکە. کاشێر داواکاری بەڕێوە دەبات؛ بەڕێوەبەر کارمەندان و کاڵا و فرۆشتنیش دەبینێت.',
    addStaff: 'زیادکردنی کارمەند', name: 'ناو', role: 'ڕۆڵ', roleCashier: 'کاشێر', roleAdmin: 'بەڕێوەبەر', add: 'زیادکردن', remove: 'لابردن',
    removeConfirm: 'ئەم هەژمارە لاببرێت؟ ئیتر ناتوانێت بچێتە ژوورەوە.', you: 'خۆت', lastSeen: 'دوایین چوونەژوورەوە', never: 'هەرگیز',
    newPassword: 'وشەی نهێنی نوێ', save: 'پاشەکەوت', pwShort: 'وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت', pwSaved: 'وشەی نهێنی گۆڕدرا', resetPw: 'گۆڕینی وشەی نهێنی',
    staffAdded: 'کارمەند زیاد کرا', staffRemoved: 'کارمەند لابرا',
    print: 'چاپکردنی پسوڵە', close: 'داخستن', cancel: 'پاشگەزبوونەوە', soundOn: 'دەنگ هەڵکراوە', soundOff: 'دەنگ کوژاوەتەوە',
    newOrderNotif: 'داواکاری نوێ', adminOnly: 'تەنها بەڕێوەبەر',
    monthlySales: 'فرۆشتنی مانگانە', monthTotal: 'کۆی مانگ', perDay: 'تێکڕای ڕۆژانە', bestDay: 'باشترین ڕۆژ', ordersShort: 'داواکاری', noSales: 'فرۆشتن نییە', dayDetails: 'وردەکاری ڕۆژ', allDays: 'هەموو ڕۆژەکانی ئەم مانگە',
    signOutConfirm: 'لەم ئامێرە بچیتە دەرەوە؟ بۆ چوونەژوورەوەی دووبارە پێویستت بە وشەی نهێنی دەبێت.', reconnecting: 'پەیوەندی بە سیستەمی داواکاری دەکرێت…',
    testBadge: 'تاقیکاری', markTest: 'داواکاری تاقیکاری', unmarkTest: 'بیژمێرە', testHint: 'داواکارییە تاقیکارییەکان لە فرۆشتن و ڕاپۆرتەکان ناژمێردرێن',
    markedTest: 'وەک داواکاری تاقیکاری دانرا — لە فرۆشتن ناژمێردرێت', unmarkedTest: 'دووبارە لە فرۆشتن دەژمێردرێت',
    soldOutSince: 'لە {t}ەوە', soldOutBy: 'لەلایەن {n}', allBackOn: 'هەمووی هەڵبکەرەوە', allBackOnConfirm: 'هەموو خواردنە نەماوەکان دووبارە هەڵبکرێنەوە؟',
    autoReset: 'هەموو بەیانییەک دووبارە هەڵدەکرێنەوە', autoResetSub: 'لە کاتژمێر ٩:٠٠ هەموو خواردنە نەماوەکان خۆیان هەڵدەکرێنەوە', autoResetOwner: 'تەنها خاوەن دەتوانێت ئەمە بگۆڕێت', saved: 'پاشەکەوت کرا',
    hr: 'کاتژمێر', yesterday: 'دوێنێ', staleNote: 'زیاتر لە ٢ کاتژمێرە چاوەڕێیە، بۆیە ئیتر زەنگ لێنادات. کڕیارەکە هێشتا لێرەیە؟', clearOrder: 'سڕینەوەی داواکاری',
    clearConfirm: 'ئەم داواکارییە کۆنە بسڕدرێتەوە؟ بە کڕیار دەوترێت کاتەکەی بەسەرچوو.', reasonExpired: 'ببورە، کاتی ئەم داواکارییە بەسەرچوو. تکایە دووبارە داوا بکە یان پرسیار لە کاشێر بکە.',
    loyaltyReward: 'خەڵاتی کارتی خاڵ', loyaltyTakeOff: 'لە پسوڵەکە لای ببە', stampCard: 'کارتی خاڵ', rewardUsed: 'خەڵات وەرگیرا', stampEarned: '+١ خاڵ',
  },
  ar: {
    dir: 'rtl', short: 'ع', native: 'العربية',
    loginTitle: 'دخول الموظفين', loginSub: 'للمدراء والكاشير فقط.', email: 'البريد الإلكتروني', password: 'كلمة المرور', signIn: 'تسجيل الدخول',
    badLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', notStaff: 'هذا الحساب ليس حساب موظف.', sessionEnded: 'تم تسجيل خروجك (انتهت الجلسة أو أنهاها المالك). يرجى تسجيل الدخول مرة أخرى.', signOutAll: 'تسجيل الخروج من كل الأجهزة', signOutAllConfirm: 'تسجيل خروج هذا الحساب من كل الأجهزة الآن؟', signedOutAll: 'تم تسجيل الخروج من كل الأجهزة',
    shiftTitle: 'جاهز لاستقبال الطلبات؟', shiftSub: 'اضغط لبدء نوبتك. سيعمل صوت الطلبات الجديدة وتبقى الشاشة مضاءة.',
    startShift: 'بدء النوبة', signedInAs: 'مسجّل الدخول باسم',
    live: 'مباشر', connecting: 'جارٍ الاتصال…', offline: 'انقطع الاتصال — جارٍ إعادة المحاولة… قد تتأخر الطلبات الجديدة.',
    tabNew: 'جديد', tabPreparing: 'قيد التحضير', tabReady: 'جاهز', tabDone: 'منتهي',
    colNewEmpty: 'لا توجد طلبات جديدة', colPrepEmpty: 'لا شيء قيد التحضير', colReadyEmpty: 'لا توجد طلبات بانتظار الاستلام', doneEmpty: 'لا توجد طلبات منتهية اليوم بعد',
    doneToday: 'المنتهية اليوم',
    table: 'طاولة', takeaway: 'سفري', items: 'عناصر', total: 'الإجمالي',
    prepTime: 'جاهز خلال', min: 'د', accept: 'قبول', reject: 'رفض',
    markReady: 'جاهز — نادِ الزبون', ringAgain: 'تنبيه مرة أخرى', pickedUp: 'تم الاستلام',
    late: 'متأخر', left: 'متبقٍ', readyFor: 'بالانتظار', ago: 'مضت', justNow: 'الآن',
    statusCollected: 'تم الاستلام', statusRejected: 'مرفوض', statusCancelled: 'ملغى',
    rejectTitle: 'رفض الطلب', rejectSub: 'سيرى الزبون هذا السبب.', rejectConfirm: 'رفض الطلب', otherReason: 'سبب آخر…',
    reasonSoldOut: 'أحد الأصناف نفد', reasonBusy: 'نحن مشغولون جداً الآن', reasonClosing: 'المطبخ على وشك الإغلاق', reasonAsk: 'يرجى مراجعة الكاشير',
    customTime: 'آخر', notifySent: 'تم إشعار الزبون ✓', notifyNone: 'لا توجد إشعارات لهذا الزبون — أخبره مباشرة',
    notifyFail: 'تعذّر الوصول إلى هاتف الزبون — أخبره مباشرة',
    accepted: 'تم قبول الطلب', markedReady: 'تم مناداة الزبون', collected: 'تم تسجيل الاستلام', rejected: 'تم رفض الطلب', timeChanged: 'تم تحديث الوقت',
    actionFailed: 'لم ينجح ذلك — يرجى المحاولة مرة أخرى',
    menu: 'القائمة', today: 'اليوم', soldOut: 'الأصناف النافدة', staffAccounts: 'حسابات الموظفين', changePassword: 'تغيير كلمة المرور', signOut: 'تسجيل الخروج',
    statOrders: 'الطلبات', statRevenue: 'المبيعات', statAvgPrep: 'متوسط التحضير', statTop: 'الأكثر طلباً',
    soldOutSub: 'أوقف أي صنف نفد. لن يتمكن الزبائن من طلبه حتى تعيد تشغيله.',
    available: 'متوفر', soldOutLabel: 'نفد',
    staffSub: 'أضف كاشير ومدراء. الكاشير يدير الطلبات؛ المدير يدير الموظفين والمخزون ويرى المبيعات أيضاً.',
    addStaff: 'إضافة موظف', name: 'الاسم', role: 'الدور', roleCashier: 'كاشير', roleAdmin: 'مدير', add: 'إضافة', remove: 'حذف',
    removeConfirm: 'حذف هذا الحساب؟ لن يتمكن من تسجيل الدخول بعد ذلك.', you: 'أنت', lastSeen: 'آخر دخول', never: 'أبداً',
    newPassword: 'كلمة مرور جديدة', save: 'حفظ', pwShort: 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل', pwSaved: 'تم تغيير كلمة المرور', resetPw: 'إعادة تعيين كلمة المرور',
    staffAdded: 'تمت إضافة الموظف', staffRemoved: 'تم حذف الموظف',
    print: 'طباعة التذكرة', close: 'إغلاق', cancel: 'إلغاء', soundOn: 'الصوت مفعّل', soundOff: 'الصوت متوقف',
    newOrderNotif: 'طلب جديد', adminOnly: 'للمدراء فقط',
    monthlySales: 'المبيعات الشهرية', monthTotal: 'إجمالي الشهر', perDay: 'المتوسط اليومي', bestDay: 'أفضل يوم', ordersShort: 'طلبات', noSales: 'لا مبيعات', dayDetails: 'تفاصيل اليوم', allDays: 'كل أيام هذا الشهر',
    signOutConfirm: 'تسجيل الخروج من هذا الجهاز؟ ستحتاج كلمة المرور للدخول مرة أخرى.', reconnecting: 'جارٍ الاتصال بنظام الطلبات…',
    testBadge: 'تجريبي', markTest: 'طلب تجريبي', unmarkTest: 'احسبه', testHint: 'الطلبات التجريبية لا تُحسب في المبيعات والتقارير',
    markedTest: 'تم تعليمه كطلب تجريبي — لا يُحسب في المبيعات', unmarkedTest: 'يُحسب في المبيعات مرة أخرى',
    soldOutSince: 'منذ {t}', soldOutBy: 'بواسطة {n}', allBackOn: 'تشغيل الكل من جديد', allBackOnConfirm: 'إعادة كل الأصناف النافدة إلى متوفر؟',
    autoReset: 'إعادة التشغيل كل صباح', autoResetSub: 'في الساعة 9:00 تعود كل الأصناف النافدة متوفرة تلقائياً', autoResetOwner: 'المالك فقط يستطيع تغيير هذا', saved: 'تم الحفظ',
    hr: 'س', yesterday: 'أمس', staleNote: 'ينتظر منذ أكثر من ساعتين، لذلك توقف التنبيه. هل ما زال الزبون هنا؟', clearOrder: 'إزالة الطلب',
    clearConfirm: 'إزالة هذا الطلب القديم؟ سيتم إبلاغ الزبون بانتهاء مهلته.', reasonExpired: 'عذراً، انتهت مهلة هذا الطلب. يرجى الطلب مرة أخرى أو مراجعة الكاشير.',
    loyaltyReward: 'مكافأة بطاقة الأختام', loyaltyTakeOff: 'اخصمها من الفاتورة', stampCard: 'بطاقة الأختام', rewardUsed: 'تم استخدام المكافأة', stampEarned: '+١ ختم',
  },
};

// Reject reasons are sent to the customer in THEIR language, whatever language the cashier uses
const REJECT_REASONS = ['reasonSoldOut', 'reasonBusy', 'reasonClosing', 'reasonAsk'];

/* ── State ── */
const state = {
  lang: 'en',
  theme: 'light',
  soundOn: true,
  session: null,
  me: null,               // { role, name }
  orders: new Map(),      // id -> order
  draftMinutes: {},       // order id -> minutes chosen before accepting
  tab: 'pending',
  online: false,
  shiftStarted: false,
  avail: {},              // item id -> available
  soldInfo: {},           // item id -> { at, by } while sold out (database update 010)
  loyalty: null,          // { goal, reward, min_total } while the stamp card is on (016)
  busy: new Set(),        // order ids with an action in flight
};

const $ = (id) => document.getElementById(id);
const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k;
const tIn = (lang, k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) {
  try { return new Intl.NumberFormat('en-IQ', { maximumFractionDigits: 0 }).format(n) + ' IQD'; }
  catch { return n + ' IQD'; }
}
function refreshIcons() { try { window.lucide && window.lucide.createIcons(); } catch { /* ignore */ } }

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    if (I18N[p.lang]) state.lang = p.lang;
    if (p.theme === 'dark' || p.theme === 'light') state.theme = p.theme;
    if (typeof p.soundOn === 'boolean') state.soundOn = p.soundOn;
  } catch { /* private mode */ }
}
function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ lang: state.lang, theme: state.theme, soundOn: state.soundOn })); } catch { /* ignore */ }
}

let _toastTimer = null;
function toast(msg, ms = 2400) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('opacity-0', 'translate-y-3');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('opacity-0', 'translate-y-3'), ms);
}

/* ====================================================================
 * Theme + language
 * ==================================================================== */

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  $('themeColorMeta').setAttribute('content', state.theme === 'dark' ? '#18181B' : '#F5F2EC');
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.innerHTML = '<i data-lucide="' + (state.theme === 'dark' ? 'sun' : 'moon') + '" class="h-5 w-5"></i>';
  });
  refreshIcons();
}

function applyLang() {
  const cfg = I18N[state.lang];
  document.documentElement.setAttribute('lang', state.lang === 'ku' ? 'ckb' : state.lang);
  document.documentElement.setAttribute('dir', cfg.dir);
  document.documentElement.setAttribute('data-locale', state.lang);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  renderLangSwitchers();
  renderSoundBtn();
  setOnline(state.online);
  if (state.me) { renderAll(); }
  refreshIcons();
}

function renderLangSwitchers() {
  document.querySelectorAll('[data-lang-switcher]').forEach((box) => {
    box.innerHTML =
      '<button type="button" class="lang-trigger flex h-10 items-center gap-1 rounded-xl bg-surface px-2.5 text-xs font-bold ring-1 ring-edge/5 transition hover:ring-brand/40" aria-haspopup="listbox" aria-expanded="false">' +
        '<i data-lucide="globe" class="h-4 w-4 text-brand"></i>' + esc(I18N[state.lang].short) +
      '</button>' +
      '<div class="lang-menu absolute end-0 top-full z-50 mt-2 hidden w-44 flex-col gap-0.5 rounded-2xl bg-surface p-1.5 shadow-2xl ring-1 ring-edge/10">' +
        Object.keys(I18N).map((code) =>
          '<button type="button" data-lang="' + code + '" class="flex items-center gap-3 rounded-xl px-2.5 py-2 text-start text-sm font-semibold transition ' +
            (code === state.lang ? 'bg-brand/10 text-brand' : 'hover:bg-edge/5') + '">' +
            '<span class="grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold ' + (code === state.lang ? 'bg-brand text-white' : 'bg-surfaceAlt') + '">' + esc(I18N[code].short) + '</span>' +
            '<span dir="' + I18N[code].dir + '">' + esc(I18N[code].native) + '</span>' +
          '</button>').join('') +
      '</div>';
  });
  refreshIcons();
}

document.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-lang]');
  if (pick) {
    state.lang = pick.getAttribute('data-lang');
    savePrefs();
    applyLang();
    return;
  }
  const trig = e.target.closest('.lang-trigger');
  document.querySelectorAll('.lang-menu').forEach((m) => {
    const mine = trig && m.parentElement === trig.parentElement;
    const open = mine && m.classList.contains('hidden');
    m.classList.toggle('hidden', !open);
    m.classList.toggle('flex', open);
  });
  if (e.target.closest('[data-theme-toggle]')) {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    savePrefs();
    applyTheme();
  }
});

/* ====================================================================
 * Sound (generated, no files) + screen wake lock
 * ==================================================================== */

let audioCtx = null;
function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* no audio */ }
}
function tone(freq, start, dur, vol = 0.22, type = 'sine') {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = audioCtx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
// Bright three-note chime for a new order
function chimeNewOrder() {
  if (!state.soundOn || !audioCtx) return;
  [[784, 0], [988, 0.14], [1319, 0.28], [1319, 0.62]].forEach(([f, s]) => tone(f, s, 0.45, 0.25, 'triangle'));
}
// Soft confirmation after an action
function chimeConfirm() {
  if (!state.soundOn || !audioCtx) return;
  tone(1046, 0, 0.18, 0.12);
  tone(1568, 0.09, 0.25, 0.1);
}

let wakeLock = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch { /* not supported / denied */ }
}
document.addEventListener('visibilitychange', () => { if (state.shiftStarted && document.visibilityState === 'visible') keepAwake(); });

// Keeps ringing every few seconds while there are new orders nobody has accepted yet
let alarmTimer = null;
// A new order nobody answered for 2 hours: the customer has most likely gone, so it stops ringing
const STALE_MS = 2 * 3600 * 1000;
const isStale = (o) => o.status === 'pending' && Date.now() - Date.parse(o.created_at) > STALE_MS;

function updateAlarm() {
  const fresh = [...state.orders.values()].filter((o) => o.status === 'pending' && !isStale(o));
  const pending = fresh.length > 0;
  if (pending && state.shiftStarted && state.soundOn) {
    if (!alarmTimer) {
      chimeNewOrder();
      alarmTimer = setInterval(chimeNewOrder, ALARM_EVERY_MS);
    }
  } else if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
  // Tab title flashes the count so it's visible even in another tab
  const n = fresh.length;
  document.title = (n ? '(' + n + ') ' : '') + 'Smashed Burger — Staff';
}

function renderSoundBtn() {
  const b = $('soundBtn');
  if (!b) return;
  b.innerHTML = '<i data-lucide="' + (state.soundOn ? 'bell-ring' : 'bell-off') + '" class="h-5 w-5 ' + (state.soundOn ? 'text-brand' : 'text-muted') + '"></i>';
  b.setAttribute('aria-label', state.soundOn ? t('soundOn') : t('soundOff'));
  b.setAttribute('title', state.soundOn ? t('soundOn') : t('soundOff'));
  refreshIcons();
}
$('soundBtn').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  savePrefs();
  ensureAudio();
  renderSoundBtn();
  updateAlarm();
  toast(state.soundOn ? t('soundOn') : t('soundOff'));
  if (state.soundOn) chimeConfirm();
});

/* ====================================================================
 * Auth
 * ==================================================================== */

function show(view) {
  ['loginView', 'shiftView', 'appView'].forEach((v) => $(v).classList.toggle('hidden-view', v !== view && !(view === 'shiftView' && v === 'appView')));
}

$('togglePw').addEventListener('click', () => {
  const i = $('loginPassword');
  i.type = i.type === 'password' ? 'text' : 'password';
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('loginBtn');
  const err = $('loginError');
  err.classList.add('hidden');
  btn.disabled = true;
  ensureAudio(); // the sign-in tap also unlocks sound
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginPassword').value,
  });
  btn.disabled = false;
  if (error) {
    err.textContent = t('badLogin');
    err.classList.remove('hidden');
    return;
  }
  state.session = data.session;
  await afterLogin();
});

async function afterLogin() {
  const { data: row, error } = await sb.from('staff').select('role,name').eq('user_id', state.session.user.id).maybeSingle();
  if (error) {
    // Offline or the server is busy: keep the device signed in and try again shortly
    show('loginView');
    $('loginError').textContent = t('reconnecting');
    $('loginError').classList.remove('hidden');
    $('loginForm').classList.add('pointer-events-none', 'opacity-60');
    setTimeout(() => { $('loginForm').classList.remove('pointer-events-none', 'opacity-60'); $('loginError').classList.add('hidden'); afterLogin(); }, 5000);
    return;
  }
  // 007: the login itself must still be valid (not expired, not ended with "Sign out all devices")
  const alive = row ? await sb.rpc('is_staff') : { data: false };
  if (row && !alive.error && alive.data === false) { endSession(); return; }
  if (!row) {
    await sb.auth.signOut({ scope: 'local' });
    show('loginView');
    $('loginError').textContent = t('notStaff');
    $('loginError').classList.remove('hidden');
    return;
  }
  state.me = row;
  $('shiftWho').textContent = t('signedInAs') + ' ' + (row.name || state.session.user.email) + ' · ' + (row.role === 'admin' ? t('roleAdmin') : t('roleCashier'));
  show('shiftView');
  await Promise.all([loadOrders(), loadAvailability(), loadLoyalty()]);
  subscribeLive();
  renderAll();
}

// 016: stamp-card settings (the reward text shown on order cards). Null while it's off or not set up.
async function loadLoyalty() {
  const { data, error } = await sb.rpc('get_loyalty_config');
  state.loyalty = !error && data ? data : null;
}

$('startShiftBtn').addEventListener('click', () => {
  ensureAudio();
  chimeConfirm();
  state.shiftStarted = true;
  keepAwake();
  show('appView');
  updateAlarm();
  if ('Notification' in window && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch { /* ignore */ }
  }
});

sb.auth.onAuthStateChange((event, session) => {
  if (session) state.session = session;
  if (event === 'SIGNED_OUT') {
    state.me = null;
    state.orders.clear();
    show('loginView');
  }
});

/* ====================================================================
 * Data
 * ==================================================================== */

const ORDER_COLS = 'id,code,created_at,updated_at,status,order_type,table_no,lang,items,total,prep_minutes,accepted_at,ready_at,ready_marked_at,collected_at,reject_reason';

function todayStartISO() {
  // Midnight in Erbil (UTC+3, no daylight saving)
  const now = new Date();
  const erbil = new Date(now.getTime() + 3 * 3600 * 1000);
  const y = erbil.getUTCFullYear(), m = erbil.getUTCMonth(), d = erbil.getUTCDate();
  return new Date(Date.UTC(y, m, d) - 3 * 3600 * 1000).toISOString();
}

// Server clock vs this device's clock, so countdowns are right even if the iPad's clock is off
let clockOffset = 0;

// Columns added by later database updates are asked for only once the database has them
// (42703 = no such column → ask again without them)
const noColumn = (error) => error && error.code === '42703';
// 012: is_test · 016: loyalty_code, loyalty_reward — each is dropped from the query if the database doesn't have it
let extraCols = ['is_test', 'loyalty_code', 'loyalty_reward'];
const hasCol = (c) => extraCols.includes(c);
async function withExtraCols(run, base) {
  for (;;) {
    const res = await run(base + extraCols.map((c) => ',' + c).join(''));
    const m = noColumn(res.error) && /column \w+\.(\w+) does not exist/.exec(res.error.message || '');
    if (!m || !hasCol(m[1])) return res;
    extraCols = extraCols.filter((c) => c !== m[1]);
  }
}

async function loadOrders() {
  const { data, error } = await withExtraCols((cols) => sb.from('orders').select(cols)
    .or('created_at.gte.' + todayStartISO() + ',status.in.(pending,accepted,ready)')
    .order('created_at', { ascending: true }), ORDER_COLS);
  if (error) { setOnline(false); return; }
  const fresh = new Map();
  for (const o of data) fresh.set(o.id, o);
  state.orders = fresh;
  renderAll();
}

let hasSoldOutCols = true;   // 010: who switched an item off, and when
async function loadAvailability() {
  let { data, error } = await sb.from('menu_items').select('id,available' + (hasSoldOutCols ? ',sold_out_at,sold_out_by_name' : ''));
  if (noColumn(error) && hasSoldOutCols) { hasSoldOutCols = false; ({ data } = await sb.from('menu_items').select('id,available')); }
  if (data) for (const r of data) { state.avail[r.id] = r.available; state.soldInfo[r.id] = r.sold_out_at ? { at: r.sold_out_at, by: r.sold_out_by_name } : null; }
}

let channel = null;
async function subscribeLive() {
  // Fully close the old connection before opening a new one (re-using the same name too early can fail)
  if (channel) { const old = channel; channel = null; try { await sb.removeChannel(old); } catch { /* ignore */ } }
  setOnline(false, true);
  channel = sb.channel('staff-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      const row = payload.new;
      if (!row || !row.id) return;
      delete row.push_sub;
      delete row.customer_token;
      const isNew = payload.eventType === 'INSERT';
      state.orders.set(row.id, row);
      if (isNew) onNewOrder(row);
      renderAll();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { setOnline(true); loadOrders(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setOnline(false);
    });
}

function onNewOrder(o) {
  const bell = $('soundBtn');
  bell.classList.remove('bell-wiggle');
  void bell.offsetWidth;
  bell.classList.add('bell-wiggle');
  // A system notification too, in case this tab is in the background
  try {
    if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(t('newOrderNotif') + ' #' + o.code, { body: placeLabel(o) + ' · ' + money(o.total), icon: 'image/favicon-192.png', tag: 'order-' + o.id });
    }
  } catch { /* ignore */ }
}

function setOnline(on, connecting) {
  state.online = on;
  const pill = $('livePill');
  if (!pill) return;
  pill.classList.toggle('text-[rgb(var(--c-ok))]', on);
  pill.style.color = on ? 'rgb(var(--c-ok))' : connecting ? 'rgb(var(--c-warn))' : 'rgb(var(--c-accent))';
  $('liveLabel').textContent = on ? t('live') : t('connecting');
  $('offlineBar').classList.toggle('hidden', on || connecting || !state.me);
}
window.addEventListener('online', () => { if (state.me) subscribeLive(); });
// iPads pause the live connection when the screen sleeps or Safari is in the background.
// Reconnect as soon as the page is visible again, and keep retrying while it's down.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.me) { loadOrders(); if (!state.online) subscribeLive(); }
});
setInterval(() => { if (state.me && !state.online && navigator.onLine !== false) subscribeLive(); }, 15000);
window.addEventListener('offline', () => setOnline(false));
// 007: check every minute that this login wasn't ended by the owner or expired
function endSession() {
  state.me = null;
  sb.auth.signOut({ scope: 'local' }).finally(() => {
    show('loginView');
    $('loginError').textContent = t('sessionEnded');
    $('loginError').classList.remove('hidden');
  });
}
setInterval(async () => {
  if (!state.me || navigator.onLine === false) return;
  const { data, error } = await sb.rpc('is_staff');
  if (!error && data === false) endSession();
}, 60000);
// Safety net: refresh the list every 30 s in case a live update was missed
setInterval(() => { if (state.me && document.visibilityState === 'visible') loadOrders(); }, 30000);

/* ====================================================================
 * Actions (go through the staff-action function, which also notifies the customer)
 * ==================================================================== */

async function act(id, action, extra = {}) {
  if (state.busy.has(id)) return;
  state.busy.add(id);
  renderAll();
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(CFG.supabaseUrl + '/functions/v1/staff-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ order_id: id, action, ...extra }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || 'failed');
    const prev = state.orders.get(id) || {};
    state.orders.set(id, { ...prev, ...out.order });
    chimeConfirm();
    const label = { accept: t('accepted'), adjust: t('timeChanged'), ready: t('markedReady'), ring: t('markedReady'), collected: t('collected'), reject: t('rejected') }[action];
    const notify = ['accept', 'adjust', 'ready', 'ring', 'reject'].includes(action)
      ? (out.push === 'sent' ? ' · ' + t('notifySent') : (action === 'ready' || action === 'ring') ? ' · ' + (out.push === 'failed' ? t('notifyFail') : t('notifyNone')) : '')
      : '';
    toast(label + notify, notify ? 3600 : 2200);
  } catch (e) {
    toast(t('actionFailed'));
    console.error(e);
  } finally {
    state.busy.delete(id);
    renderAll();
  }
}

/* ====================================================================
 * Rendering
 * ==================================================================== */

const COLUMNS = [
  { status: 'pending',  key: 'tabNew',       icon: 'bell',         empty: 'colNewEmpty' },
  { status: 'accepted', key: 'tabPreparing', icon: 'flame',        empty: 'colPrepEmpty' },
  { status: 'ready',    key: 'tabReady',     icon: 'package-check', empty: 'colReadyEmpty' },
];

function placeLabel(o) {
  return o.order_type === 'takeaway' ? t('takeaway') : t('table') + ' ' + (o.table_no || '?');
}

function itemName(line) {
  const m = MENU_DATA.items[line.item_id];
  return (m && (m.name[state.lang] || m.name.en)) || line.name_en;
}
function optionName(opt) {
  const l = MENU_DATA.options[opt.group_id + '/' + opt.option_id];
  return (l && (l[state.lang] || l.en)) || opt.label_en;
}

// "5 min ago", "1 h 20 min ago", "5 h ago", then "Yesterday 18:05" / "26/10 18:05".
// plain = just the length of time ("Waiting 25 min"), with whole days for very old ones.
function timeAgo(iso, plain) {
  const m = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return t('justNow');
  let s;
  if (m < 60) s = m + ' ' + t('min');
  else if (m < 180) s = Math.floor(m / 60) + ' ' + t('hr') + (m % 60 ? ' ' + (m % 60) + ' ' + t('min') : '');
  else if (m < 1440 || plain) s = Math.floor(m / 60) + ' ' + t('hr');
  else {
    const erbil = (ms) => new Date(ms + ERBIL_MS).toISOString();
    const day = erbil(Date.parse(iso)).slice(0, 10), clock = erbil(Date.parse(iso)).slice(11, 16);
    if (day === erbil(Date.now() - 864e5).slice(0, 10)) return t('yesterday') + ' ' + clock;
    return day.slice(8, 10) + '/' + day.slice(5, 7) + ' ' + clock;
  }
  return plain ? s : s + ' ' + t('ago');
}
const minutesAgo = (iso) => timeAgo(iso);

function itemsHtml(o, compact) {
  return '<ul class="' + (compact ? 'space-y-0.5' : 'space-y-2') + '">' + (o.items || []).map((line) => {
    const m = MENU_DATA.items[line.item_id];
    const thumb = m && !compact
      ? '<span class="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surfaceAlt"><img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" loading="lazy" onerror="this.remove()" /></span>'
      : '';
    const opts = (line.options || []).map(optionName);
    return '<li class="flex items-start gap-2.5">' + thumb +
      '<div class="min-w-0 flex-1">' +
        '<p class="text-sm font-semibold leading-snug"><span class="tnum me-1 inline-grid min-w-[1.6rem] place-items-center rounded-md bg-brand/10 px-1 text-xs font-extrabold text-brand">' + line.qty + '×</span>' + esc(itemName(line)) + '</p>' +
        (opts.length ? '<p class="mt-0.5 text-xs text-muted">' + opts.map(esc).join(' · ') + '</p>' : '') +
      '</div></li>';
  }).join('') + '</ul>';
}

function cardHead(o) {
  const typeChip = o.order_type === 'takeaway'
    ? '<span class="inline-flex items-center gap-1 rounded-full bg-surfaceAlt px-2.5 py-1 text-xs font-bold"><i data-lucide="shopping-bag" class="h-3.5 w-3.5"></i>' + esc(t('takeaway')) + '</span>'
    : '<span class="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white"><i data-lucide="armchair" class="h-3.5 w-3.5"></i>' + esc(t('table')) + ' ' + esc(o.table_no || '?') + '</span>';
  return '<div class="flex items-start gap-3">' +
    '<div class="min-w-0">' +
      '<p class="font-display text-3xl leading-none tnum">#' + o.code + '</p>' +
      '<p class="mt-1 text-xs text-muted" data-ago="' + esc(o.created_at) + '">' + esc(minutesAgo(o.created_at)) + '</p>' +
    '</div>' +
    '<div class="ms-auto flex flex-col items-end gap-1.5">' + typeChip +
      '<button type="button" data-print="' + o.id + '" class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('print')) + '" title="' + esc(t('print')) + '"><i data-lucide="printer" class="h-4 w-4"></i></button>' +
    '</div>' +
  '</div>';
}

function totalRow(o) {
  return '<div class="mt-3 flex items-center justify-between border-t border-edge/5 pt-3 text-sm">' +
    '<span class="text-muted">' + esc(t('total')) + '</span><span class="tnum font-extrabold text-brand">' + esc(money(o.total)) + '</span></div>';
}

function pendingActions(o) {
  const chosen = state.draftMinutes[o.id] || DEFAULT_PREP;
  const busy = state.busy.has(o.id);
  return '<div class="mt-4">' +
    '<p class="mb-2 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('prepTime')) + '</p>' +
    '<div class="grid grid-cols-6 gap-1.5">' + PREP_PRESETS.map((m) =>
      '<button type="button" data-prep="' + o.id + '" data-min="' + m + '" class="tnum rounded-lg py-2 text-sm font-bold ring-1 transition active:scale-95 ' +
        (m === chosen ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surfaceAlt ring-edge/5 hover:ring-brand/40') + '">' + m + '</button>').join('') +
    '</div>' +
    '<div class="mt-2 flex items-center justify-center gap-2">' +
      '<button type="button" data-prep-step="' + o.id + '" data-step="-1" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition active:scale-90"><i data-lucide="minus" class="h-4 w-4"></i></button>' +
      '<span class="tnum min-w-[5.5rem] text-center text-lg font-extrabold">' + chosen + ' ' + esc(t('min')) + '</span>' +
      '<button type="button" data-prep-step="' + o.id + '" data-step="1" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition active:scale-90"><i data-lucide="plus" class="h-4 w-4"></i></button>' +
    '</div>' +
    '<div class="mt-3 grid grid-cols-[1fr_2fr] gap-2">' +
      '<button type="button" data-reject="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="rounded-xl bg-surfaceAlt px-3 py-3 text-sm font-bold text-muted ring-1 ring-edge/5 transition hover:text-brand active:scale-[.98] disabled:opacity-50">' + esc(t('reject')) + '</button>' +
      '<button type="button" data-accept="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-3 py-3 text-sm font-bold text-white shadow-glow transition hover:from-brandDark hover:to-brandDeeper active:scale-[.98] disabled:opacity-60">' +
        (busy ? '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>' : '<i data-lucide="check" class="h-4 w-4"></i>') + esc(t('accept')) + ' · ' + chosen + ' ' + esc(t('min')) +
      '</button>' +
    '</div>' +
  '</div>';
}

const RING_R = 26, RING_C = 2 * Math.PI * RING_R;
function countdownParts(o) {
  const now = Date.now() + clockOffset;
  const end = Date.parse(o.ready_at);
  const start = Date.parse(o.accepted_at || o.created_at);
  const left = end - now;
  const total = Math.max(60000, end - start);
  const frac = Math.min(1, Math.max(0, 1 - left / total));
  const abs = Math.abs(left);
  const mm = Math.floor(abs / 60000), ss = Math.floor((abs % 60000) / 1000);
  return { late: left < 0, text: (left < 0 ? '+' : '') + mm + ':' + String(ss).padStart(2, '0'), frac };
}

function preparingActions(o) {
  const cd = countdownParts(o);
  const busy = state.busy.has(o.id);
  return '<div class="mt-4 rounded-2xl p-3 ' + (cd.late ? 'is-late' : 'bg-surfaceAlt') + '" data-cd-box="' + o.id + '">' +
    '<div class="flex items-center gap-3">' +
      '<svg class="cd-ring h-16 w-16 shrink-0 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">' +
        '<circle cx="30" cy="30" r="' + RING_R + '" fill="none" stroke="rgb(var(--c-edge) / .08)" stroke-width="6" />' +
        '<circle data-cd-ring="' + o.id + '" cx="30" cy="30" r="' + RING_R + '" fill="none" stroke-linecap="round" stroke-width="6" ' +
          'stroke="' + (cd.late ? 'rgb(var(--c-accent))' : 'rgb(var(--c-ok))') + '" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + (RING_C * (1 - cd.frac)).toFixed(1) + '" />' +
      '</svg>' +
      '<div class="min-w-0 flex-1">' +
        '<p class="tnum font-display text-3xl leading-none ' + (cd.late ? 'text-brand' : '') + '" data-cd-text="' + o.id + '">' + cd.text + '</p>' +
        '<p class="mt-1 text-xs font-semibold text-muted" data-cd-label="' + o.id + '">' + esc(cd.late ? t('late') : t('left')) + '</p>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-1.5">' +
        [-5, -1, 1, 5].map((d) =>
          '<button type="button" data-adjust="' + o.id + '" data-min="' + d + '" ' + (busy ? 'disabled' : '') + ' class="tnum rounded-lg bg-surface px-2.5 py-1.5 text-xs font-extrabold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-90 disabled:opacity-50">' +
            (d > 0 ? '+' : '−') + Math.abs(d) + '</button>').join('') +
      '</div>' +
    '</div>' +
  '</div>' +
  '<button type="button" data-ready="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-3 py-3.5 text-sm font-bold text-white shadow-glow transition hover:from-brandDark hover:to-brandDeeper active:scale-[.98] disabled:opacity-60">' +
    (busy ? '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>' : '<i data-lucide="bell-ring" class="h-4 w-4"></i>') + esc(t('markReady')) +
  '</button>' +
  '<button type="button" data-reject="' + o.id + '" class="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-muted transition hover:text-brand">' + esc(t('reject')) + '</button>';
}

function readyActions(o) {
  const busy = state.busy.has(o.id);
  return '<div class="mt-4 flex items-center gap-2 rounded-2xl bg-[rgb(var(--c-ok)/.12)] px-3 py-2.5 text-sm font-semibold" style="color:rgb(var(--c-ok))">' +
      '<i data-lucide="clock" class="h-4 w-4"></i><span>' + esc(t('readyFor')) + ' <span class="tnum" data-ago-plain="' + esc(o.ready_marked_at || o.updated_at) + '">' + esc(timeAgo(o.ready_marked_at || o.updated_at, true)) + '</span></span>' +
    '</div>' +
    '<div class="mt-3 grid grid-cols-2 gap-2">' +
      '<button type="button" data-ring="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-3 text-sm font-bold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.98] disabled:opacity-50"><i data-lucide="bell" class="h-4 w-4 text-brand"></i>' + esc(t('ringAgain')) + '</button>' +
      '<button type="button" data-collected="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60" style="background:rgb(var(--c-ok))"><i data-lucide="check-check" class="h-4 w-4"></i>' + esc(t('pickedUp')) + '</button>' +
    '</div>';
}

// 016: the order is on a stamp card (a code like K7Q-3MX, no personal data); a full card → reward the cashier takes off the bill
const cardCode = (c) => String(c || '').slice(0, 3) + '-' + String(c || '').slice(3);
function loyaltyHtml(o) {
  if (!o.loyalty_code) return '';
  const end = cardCode(o.loyalty_code);
  if (o.loyalty_reward) {
    const r = state.loyalty && state.loyalty.reward;
    return '<div class="mt-3 flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-sm ring-1" style="background:rgb(var(--c-warn)/.14);border-color:transparent;--tw-ring-color:rgb(var(--c-warn)/.4)">' +
      '<span class="text-lg leading-none" aria-hidden="true">🎁</span><span class="min-w-0"><span class="block font-extrabold" style="color:rgb(var(--c-warn))">' + esc(t('loyaltyReward')) + '</span>' +
      '<span class="block text-xs font-semibold">' + esc((r && (r[state.lang] || r.en)) || '') + ' — ' + esc(t('loyaltyTakeOff')) + ' <span class="tnum text-muted" dir="ltr">' + esc(end) + '</span></span></span></div>';
  }
  return '<p class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surfaceAlt px-2.5 py-1 text-[11px] font-bold text-muted"><span aria-hidden="true">⭐</span>' + esc(t('stampCard')) + ' <span class="tnum" dir="ltr">' + esc(end) + '</span></p>';
}

function staleBox(o) {
  return '<div class="mt-4 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/10">' +
    '<p class="flex items-start gap-2 text-xs font-semibold text-muted"><i data-lucide="bell-off" class="mt-0.5 h-4 w-4 shrink-0"></i>' + esc(t('staleNote')) + '</p>' +
    '<button type="button" data-clear="' + o.id + '" ' + (state.busy.has(o.id) ? 'disabled' : '') + ' class="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm font-bold text-brand ring-1 ring-brand/30 transition hover:bg-brand/5 active:scale-[.98] disabled:opacity-50">' +
      '<i data-lucide="archive-x" class="h-4 w-4"></i>' + esc(t('clearOrder')) + '</button>' +
  '</div>';
}

function renderCard(o) {
  const stale = isStale(o);
  const body = o.status === 'pending' ? (stale ? staleBox(o) : '') + pendingActions(o) : o.status === 'accepted' ? preparingActions(o) : readyActions(o);
  return '<article data-order="' + o.id + '" class="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-edge/5 ' + (o.status === 'pending' && !stale ? 'is-pending' : '') + '">' +
    cardHead(o) +
    '<div class="mt-4">' + itemsHtml(o) + '</div>' +
    loyaltyHtml(o) +
    totalRow(o) + body +
  '</article>';
}

// Keep each card's DOM node between updates, so animations only play when a card first appears
const cardNodes = new Map();
const cardVersion = new Map();

function renderBoard() {
  const board = $('board');
  const narrow = window.matchMedia('(max-width: 1023px)').matches;
  if (!board.dataset.built) {
    board.innerHTML = COLUMNS.map((c) =>
      '<section data-col="' + c.status + '" class="min-w-0">' +
        '<div class="mb-3 hidden items-center gap-2 lg:flex">' +
          '<span class="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand"><i data-lucide="' + c.icon + '" class="h-4 w-4"></i></span>' +
          '<h2 class="font-display text-lg" data-col-title="' + c.status + '"></h2>' +
          '<span class="tnum rounded-full bg-surfaceAlt px-2 py-0.5 text-[11px] font-bold text-muted" data-col-count="' + c.status + '">0</span>' +
        '</div>' +
        '<div class="space-y-3" data-col-list="' + c.status + '"></div>' +
        '<div class="hidden rounded-3xl border-2 border-dashed border-edge/10 px-4 py-10 text-center text-sm text-muted" data-col-empty="' + c.status + '"></div>' +
      '</section>').join('');
    board.dataset.built = '1';
  }

  const all = [...state.orders.values()];
  for (const c of COLUMNS) {
    const list = board.querySelector('[data-col-list="' + c.status + '"]');
    const items = all.filter((o) => o.status === c.status)
      .sort((a, b) => c.status === 'accepted' ? Date.parse(a.ready_at) - Date.parse(b.ready_at) : Date.parse(a.created_at) - Date.parse(b.created_at));
    board.querySelector('[data-col-title="' + c.status + '"]').textContent = t(c.key);
    board.querySelector('[data-col-count="' + c.status + '"]').textContent = items.length;
    const empty = board.querySelector('[data-col-empty="' + c.status + '"]');
    empty.textContent = t(c.empty);
    empty.classList.toggle('hidden', items.length > 0);
    board.querySelector('[data-col="' + c.status + '"]').classList.toggle('hidden', narrow && state.tab !== c.status);

    const wanted = new Set(items.map((o) => o.id));
    // Remove cards that left this column
    [...list.children].forEach((node) => { if (!wanted.has(node.dataset.order)) node.remove(); });
    items.forEach((o, idx) => {
      const ver = [o.status, o.updated_at, state.draftMinutes[o.id], state.busy.has(o.id), state.lang, isStale(o), o.loyalty_code, o.loyalty_reward,
        o.loyalty_reward && state.loyalty ? JSON.stringify(state.loyalty.reward) : ''].join('|');
      let node = cardNodes.get(o.id);
      const fresh = !node || node.parentElement !== list;
      if (!node || cardVersion.get(o.id) !== ver) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderCard(o);
        const next = tmp.firstElementChild;
        if (node && node.parentElement) node.replaceWith(next);
        node = next;
        cardNodes.set(o.id, node);
        cardVersion.set(o.id, ver);
      }
      if (fresh) node.classList.add('card-in');
      if (list.children[idx] !== node) list.insertBefore(node, list.children[idx] || null);
    });
  }
  // Forget nodes of orders that are gone from the board
  for (const id of [...cardNodes.keys()]) {
    const o = state.orders.get(id);
    if (!o || !['pending', 'accepted', 'ready'].includes(o.status)) { cardNodes.delete(id); cardVersion.delete(id); }
  }
}

let lastCounts = {};
function renderTabs() {
  const all = [...state.orders.values()];
  const counts = {
    pending: all.filter((o) => o.status === 'pending').length,
    accepted: all.filter((o) => o.status === 'accepted').length,
    ready: all.filter((o) => o.status === 'ready').length,
    done: all.filter((o) => ['collected', 'rejected', 'cancelled'].includes(o.status)).length,
  };
  const tabs = [...COLUMNS.map((c) => ({ id: c.status, key: c.key, icon: c.icon })), { id: 'done', key: 'tabDone', icon: 'archive' }];
  $('tabs').innerHTML = tabs.map((tb) => {
    const on = state.tab === tb.id;
    const n = counts[tb.id];
    const hop = lastCounts[tb.id] !== undefined && n > lastCounts[tb.id] ? ' badge-hop' : '';
    return '<button type="button" data-tab="' + tb.id + '" role="tab" aria-selected="' + on + '" class="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ' +
      (on ? 'bg-brand text-white shadow-glow' : 'bg-surface text-muted ring-1 ring-edge/5 hover:text-ink') + '">' +
      '<i data-lucide="' + tb.icon + '" class="h-4 w-4"></i>' + esc(t(tb.key)) +
      '<span class="tnum grid min-w-[1.4rem] place-items-center rounded-full px-1.5 text-[11px]' + hop + ' ' +
        (on ? 'bg-white/25' : tb.id === 'pending' && n ? 'bg-brand text-white' : 'bg-surfaceAlt') + '">' + n + '</span>' +
    '</button>';
  }).join('');
  lastCounts = counts;
  const narrow = window.matchMedia('(max-width: 1023px)').matches;
  $('doneSection').classList.toggle('hidden', narrow && state.tab !== 'done');
  $('board').classList.toggle('hidden', narrow && state.tab === 'done');
}

function renderDone() {
  const done = [...state.orders.values()]
    .filter((o) => ['collected', 'rejected', 'cancelled'].includes(o.status))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  $('doneCount').textContent = done.length;
  const admin = state.me && state.me.role === 'admin';
  $('doneList').innerHTML = done.length ? done.map((o) => {
    const st = o.status === 'collected'
      ? '<span class="rounded-full px-2 py-0.5 text-[11px] font-bold" style="background:rgb(var(--c-ok)/.14);color:rgb(var(--c-ok))">' + esc(t('statusCollected')) + '</span>'
      : '<span class="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">' + esc(t(o.status === 'rejected' ? 'statusRejected' : 'statusCancelled')) + '</span>';
    const time = new Date(o.updated_at).toLocaleTimeString(state.lang === 'en' ? 'en-GB' : state.lang === 'ar' ? 'ar-IQ' : 'ckb-IQ', { hour: '2-digit', minute: '2-digit' });
    // 012: the owner marks test orders, so they stay out of sales and reports
    const testBadge = o.is_test ? '<span class="rounded-full bg-edge/10 px-2 py-0.5 text-[11px] font-bold text-muted" title="' + esc(t('testHint')) + '">' + esc(t('testBadge')) + '</span>' : '';
    const testBtn = admin && hasCol('is_test') && o.status === 'collected'
      ? '<button type="button" data-test="' + o.id + '" title="' + esc(t('testHint')) + '" class="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-muted ring-1 ring-edge/10 transition hover:text-ink">' +
          '<i data-lucide="' + (o.is_test ? 'undo-2' : 'flask-conical') + '" class="h-3.5 w-3.5"></i>' + esc(t(o.is_test ? 'unmarkTest' : 'markTest')) + '</button>'
      : '';
    // 016: what the stamp card got from this order
    const loyal = o.loyalty_code && o.status === 'collected' && (o.loyalty_reward || o.total >= ((state.loyalty && state.loyalty.min_total) || 0))
      ? '<span class="rounded-full bg-surfaceAlt px-2 py-0.5 text-[11px] font-bold text-muted">' + (o.loyalty_reward ? '🎁 ' + esc(t('rewardUsed')) : '⭐ ' + esc(t('stampEarned'))) + '</span>'
      : '';
    return '<div class="rounded-2xl bg-surface p-3 ring-1 ring-edge/5' + (o.is_test ? ' opacity-60' : '') + '">' +
      '<div class="flex flex-wrap items-center gap-2"><span class="font-display text-xl tnum">#' + o.code + '</span>' + st + testBadge + loyal +
        '<span class="ms-auto text-xs text-muted tnum">' + esc(time) + '</span></div>' +
      '<p class="mt-1 text-xs text-muted">' + esc(placeLabel(o)) + ' · ' + esc(money(o.total)) + '</p>' +
      '<div class="mt-2 text-muted">' + itemsHtml(o, true) + '</div>' +
      (o.reject_reason ? '<p class="mt-2 text-xs italic text-brand">“' + esc(o.reject_reason) + '”</p>' : '') +
      testBtn +
    '</div>';
  }).join('') : '<p class="col-span-full rounded-2xl border-2 border-dashed border-edge/10 py-8 text-center text-sm text-muted">' + esc(t('doneEmpty')) + '</p>';
}

function todayStats() {
  const start = Date.parse(todayStartISO());
  const today = [...state.orders.values()].filter((o) => Date.parse(o.created_at) >= start && !['rejected', 'cancelled'].includes(o.status) && !o.is_test);
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const preps = today.filter((o) => o.accepted_at && o.ready_marked_at).map((o) => (Date.parse(o.ready_marked_at) - Date.parse(o.accepted_at)) / 60000);
  const avg = preps.length ? Math.round(preps.reduce((a, b) => a + b, 0) / preps.length) : null;
  const counts = {};
  today.forEach((o) => (o.items || []).forEach((l) => { counts[l.item_id] = (counts[l.item_id] || 0) + l.qty; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { orders: today.length, revenue, avg, top };
}

function renderStatChips() {
  const box = $('statChips');
  if (!state.me || state.me.role !== 'admin') { box.innerHTML = ''; return; }
  const s = todayStats();
  const chip = (icon, label, val) => '<span class="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs ring-1 ring-edge/5">' +
    '<i data-lucide="' + icon + '" class="h-3.5 w-3.5 text-brand"></i><span class="text-muted">' + esc(label) + '</span><span class="tnum font-extrabold">' + esc(val) + '</span></span>';
  box.innerHTML = chip('receipt', t('statOrders'), s.orders) + chip('banknote', t('statRevenue'), money(s.revenue));
}

function renderAll() {
  if (!state.me) return;
  renderTabs();
  renderBoard();
  renderDone();
  renderStatChips();
  updateAlarm();
  refreshIcons();
}
window.addEventListener('resize', () => { if (state.me) renderAll(); });

// Countdowns, "x min ago" and late warnings tick every second without re-drawing cards
setInterval(() => {
  if (!state.me) return;
  for (const o of state.orders.values()) {
    if (o.status !== 'accepted') continue;
    const cd = countdownParts(o);
    const txt = document.querySelector('[data-cd-text="' + o.id + '"]');
    if (!txt) continue;
    txt.textContent = cd.text;
    txt.classList.toggle('text-brand', cd.late);
    const lbl = document.querySelector('[data-cd-label="' + o.id + '"]');
    if (lbl) lbl.textContent = cd.late ? t('late') : t('left');
    const ring = document.querySelector('[data-cd-ring="' + o.id + '"]');
    if (ring) {
      ring.setAttribute('stroke-dashoffset', (RING_C * (1 - cd.frac)).toFixed(1));
      ring.setAttribute('stroke', cd.late ? 'rgb(var(--c-accent))' : 'rgb(var(--c-ok))');
    }
    const box = document.querySelector('[data-cd-box="' + o.id + '"]');
    if (box) { box.classList.toggle('is-late', cd.late); box.classList.toggle('bg-surfaceAlt', !cd.late); }
  }
  document.querySelectorAll('[data-ago]').forEach((el) => { el.textContent = minutesAgo(el.getAttribute('data-ago')); });
  document.querySelectorAll('[data-ago-plain]').forEach((el) => { el.textContent = timeAgo(el.getAttribute('data-ago-plain'), true); });
}, 1000);

/* ====================================================================
 * Board clicks
 * ==================================================================== */

document.addEventListener('click', (e) => {
  const el = (sel) => e.target.closest(sel);
  let b;
  if ((b = el('[data-tab]'))) { state.tab = b.getAttribute('data-tab'); renderAll(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if ((b = el('[data-prep]'))) { state.draftMinutes[b.getAttribute('data-prep')] = +b.getAttribute('data-min'); renderAll(); return; }
  if ((b = el('[data-prep-step]'))) {
    const id = b.getAttribute('data-prep-step');
    const cur = state.draftMinutes[id] || DEFAULT_PREP;
    state.draftMinutes[id] = Math.min(240, Math.max(1, cur + (+b.getAttribute('data-step'))));
    renderAll();
    return;
  }
  if ((b = el('[data-accept]'))) { const id = b.getAttribute('data-accept'); act(id, 'accept', { minutes: state.draftMinutes[id] || DEFAULT_PREP }); return; }
  if ((b = el('[data-adjust]'))) { act(b.getAttribute('data-adjust'), 'adjust', { minutes: +b.getAttribute('data-min') }); return; }
  if ((b = el('[data-ready]'))) { act(b.getAttribute('data-ready'), 'ready'); return; }
  if ((b = el('[data-ring]'))) { act(b.getAttribute('data-ring'), 'ring'); return; }
  if ((b = el('[data-collected]'))) { act(b.getAttribute('data-collected'), 'collected'); return; }
  if ((b = el('[data-reject]'))) { openReject(b.getAttribute('data-reject')); return; }
  if ((b = el('[data-print]'))) { printTicket(b.getAttribute('data-print')); return; }
  if ((b = el('[data-test]'))) { toggleTest(b.getAttribute('data-test')); return; }
  if ((b = el('[data-clear]'))) {
    const o = state.orders.get(b.getAttribute('data-clear'));
    if (o && confirm(t('clearConfirm'))) act(o.id, 'reject', { reason: tIn(o.lang, 'reasonExpired') });
    return;
  }
});

async function toggleTest(id) {
  const o = state.orders.get(id);
  if (!o || state.busy.has(id)) return;
  const next = !o.is_test;
  state.busy.add(id);
  const { error } = await sb.rpc('admin_set_order_test', { p_id: id, p_test: next });
  state.busy.delete(id);
  if (error) { toast(t('actionFailed')); return; }
  o.is_test = next;
  salesView.cache = {};   // monthly sales leave it out (or count it again)
  renderAll();
  toast(t(next ? 'markedTest' : 'unmarkedTest'));
}

/* ====================================================================
 * Sheets: reject, menu, today, sold out, staff, password
 * ==================================================================== */

function openSheet(html, wide) {
  $('sheetPanel').classList.remove('sm:max-w-5xl');
  $('sheetPanel').classList.toggle('sm:max-w-2xl', !!wide);
  $('sheetPanel').classList.toggle('sm:max-w-lg', !wide);
  const wasOpen = !$('sheetRoot').classList.contains('hidden');
  $('sheetPanel').innerHTML = html;
  $('sheetRoot').classList.remove('hidden');
  const p = $('sheetPanel');
  if (!wasOpen) {
    // Only animate when the panel first opens, not when its content changes
    p.classList.remove('sheet-panel');
    void p.offsetWidth;
    p.classList.add('sheet-panel');
  }
  refreshIcons();
}
function closeSheet() { $('sheetRoot').classList.add('hidden'); }
$('sheetBackdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

function sheetHeader(title, sub) {
  return '<header class="flex items-start gap-3 border-b border-edge/5 px-5 py-4">' +
    '<div class="min-w-0 flex-1"><h3 class="font-display text-xl">' + esc(title) + '</h3>' +
      (sub ? '<p class="mt-0.5 text-xs text-muted">' + esc(sub) + '</p>' : '') + '</div>' +
    '<button type="button" data-close-sheet class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('close')) + '"><i data-lucide="x" class="h-5 w-5"></i></button>' +
  '</header>';
}
$('sheetPanel').addEventListener('click', (e) => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });

function openReject(id) {
  const o = state.orders.get(id);
  if (!o) return;
  openSheet(sheetHeader(t('rejectTitle') + ' #' + o.code, t('rejectSub')) +
    '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
      REJECT_REASONS.map((k) =>
        '<button type="button" data-reason="' + k + '" class="flex w-full items-center gap-3 rounded-xl bg-surfaceAlt px-4 py-3 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.99]">' +
          '<i data-lucide="message-square" class="h-4 w-4 text-brand"></i>' + esc(t(k)) + '</button>').join('') +
      '<input id="rejectOther" type="text" maxlength="120" placeholder="' + esc(t('otherReason')) + '" class="w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
      '<button type="button" id="rejectOtherBtn" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('rejectConfirm')) + '</button>' +
    '</div>');
  $('sheetPanel').onclick = (e) => {
    const r = e.target.closest('[data-reason]');
    if (r) { closeSheet(); act(id, 'reject', { reason: tIn(o.lang, r.getAttribute('data-reason')) }); return; }
    if (e.target.closest('#rejectOtherBtn')) {
      const txt = $('rejectOther').value.trim();
      closeSheet();
      act(id, 'reject', { reason: txt || tIn(o.lang, 'reasonAsk') });
    }
  };
}

$('menuBtn').addEventListener('click', openMenuSheet);
function openMenuSheet() {
  $('sheetPanel').onclick = null;
  const admin = state.me && state.me.role === 'admin';
  const row = (id, icon, key, lock) =>
    '<button type="button" data-open="' + id + '" ' + (lock ? 'disabled' : '') + ' class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt px-4 py-3.5 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.99] disabled:opacity-50">' +
      '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="' + icon + '" class="h-4 w-4"></i></span>' +
      '<span class="flex-1">' + esc(t(key)) + '</span>' +
      (lock ? '<span class="text-[10px] font-bold uppercase text-muted">' + esc(t('adminOnly')) + '</span>' : '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>') +
    '</button>';
  openSheet(sheetHeader(t('menu'), (state.me.name || state.session.user.email) + ' · ' + (admin ? t('roleAdmin') : t('roleCashier'))) +
    '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
      row('today', 'bar-chart-3', 'today', !admin) +
      row('sales', 'calendar-days', 'monthlySales', !admin) +
      row('soldout', 'package-x', 'soldOut', false) +   // cashiers too (needs database update 010)
      row('staff', 'users', 'staffAccounts', !admin) +
      row('password', 'key-round', 'changePassword', false) +
      '<button type="button" data-open="signout" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-start text-sm font-semibold text-brand transition hover:bg-brand/5">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10"><i data-lucide="log-out" class="h-4 w-4 rtl-flip"></i></span>' + esc(t('signOut')) + '</button>' +
    '</div>');
  $('sheetPanel').onclick = (e) => {
    const b = e.target.closest('[data-open]');
    if (!b || b.disabled) return;
    const w = b.getAttribute('data-open');
    if (w === 'today') openToday();
    else if (w === 'sales') openSales();
    else if (w === 'soldout') openSoldOut();
    else if (w === 'staff') openStaff();
    else if (w === 'password') openPassword();
    // Only this device: a plain signOut() ends the login on EVERY device of that account (the counter iPad too)
    else if (w === 'signout') { if (confirm(t('signOutConfirm'))) { closeSheet(); sb.auth.signOut({ scope: 'local' }); } }
  };
}

function openToday() {
  $('sheetPanel').onclick = null;
  const s = todayStats();
  const tile = (icon, label, val) => '<div class="rounded-2xl bg-surfaceAlt p-4 ring-1 ring-edge/5"><i data-lucide="' + icon + '" class="h-4 w-4 text-brand"></i>' +
    '<p class="mt-2 text-xs text-muted">' + esc(label) + '</p><p class="tnum mt-0.5 font-display text-2xl">' + esc(val) + '</p></div>';
  const max = s.top.length ? s.top[0][1] : 1;
  openSheet(sheetHeader(t('today')) +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="grid grid-cols-3 gap-2">' +
        tile('receipt', t('statOrders'), s.orders) +
        tile('banknote', t('statRevenue'), money(s.revenue)) +
        tile('timer', t('statAvgPrep'), s.avg == null ? '—' : s.avg + ' ' + t('min')) +
      '</div>' +
      '<h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('statTop')) + '</h4>' +
      '<div class="mt-2 space-y-2">' + (s.top.length ? s.top.map(([id, n]) => {
        const m = MENU_DATA.items[id];
        return '<div class="flex items-center gap-3"><span class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surfaceAlt">' + (m ? '<img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" />' : '') + '</span>' +
          '<div class="min-w-0 flex-1"><div class="flex justify-between text-sm"><span class="truncate font-semibold">' + esc(m ? (m.name[state.lang] || m.name.en) : id) + '</span><span class="tnum font-bold">' + n + '</span></div>' +
          '<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surfaceAlt"><div class="h-full rounded-full bg-gradient-to-r from-brand to-brandDark" style="width:' + Math.round((n / max) * 100) + '%"></div></div></div></div>';
      }).join('') : '<p class="text-sm text-muted">—</p>') + '</div>' +
    '</div>');
}

let soldOutSettings = null;   // { auto_reset } once database update 010 is in

// Through the database function (records who did it and when). Before database update 010 only the owner's direct update exists.
async function setAvailable(id, on) {
  let { error } = await sb.rpc('staff_set_sold_out', { p_item: id, p_sold_out: !on });
  if (error && /PGRST202|staff_set_sold_out/.test((error.code || '') + (error.message || ''))) {
    const res = await sb.from('menu_items').update({ available: on }).eq('id', id).select('id');
    error = res.error || (res.data && res.data.length ? null : { message: 'not allowed' });   // blocked silently → show it failed
  }
  return error;
}

function openSoldOut(refresh = true) {
  const cats = ['burgers', 'sides', 'sauces', 'drinks'];
  const items = Object.entries(MENU_DATA.items);
  const admin = state.me && state.me.role === 'admin';
  const off = items.filter(([id]) => state.avail[id] === false).map(([id]) => id);
  const timeOf = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' });
  const status = (id, on) => {
    if (on) return t('available');
    const i = state.soldInfo[id];
    return t('soldOutLabel') + (i ? ' · ' + t('soldOutSince').replace('{t}', timeOf(i.at)) + (i.by ? ' · ' + t('soldOutBy').replace('{n}', i.by) : '') : '');
  };
  // Morning reset (010): everyone sees it, only the owner can switch it
  const auto = soldOutSettings
    ? '<button type="button" data-auto-reset role="switch" aria-checked="' + !!soldOutSettings.auto_reset + '" ' + (admin ? '' : 'disabled') + ' class="mb-3 flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 ring-edge/10 transition enabled:hover:ring-brand/40">' +
        '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="sunrise" class="h-5 w-5"></i></span>' +
        '<span class="min-w-0 flex-1"><span class="block text-sm font-bold">' + esc(t('autoReset')) + '</span>' +
          '<span class="block text-[11px] text-muted">' + esc(t('autoResetSub') + (admin ? '' : ' · ' + t('autoResetOwner'))) + '</span></span>' +
        '<span class="switch ' + (soldOutSettings.auto_reset ? 'is-on' : '') + (admin ? '' : ' opacity-60') + '" aria-hidden="true"></span>' +
      '</button>'
    : '';
  const allOn = off.length
    ? '<button type="button" data-all-on class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-4 py-2.5 text-sm font-bold ring-1 ring-edge/10 transition hover:ring-brand/40 active:scale-[.99]">' +
        '<i data-lucide="rotate-ccw" class="h-4 w-4 text-brand"></i>' + esc(t('allBackOn')) + '<span class="tnum rounded-full bg-brand px-2 py-0.5 text-[11px] text-white">' + off.length + '</span></button>'
    : '';
  const keepScroll = $('sheetPanel').querySelector('[data-so-list]');
  const top = keepScroll ? keepScroll.scrollTop : 0;
  openSheet(sheetHeader(t('soldOut'), t('soldOutSub')) +
    '<div data-so-list class="overflow-y-auto px-5 py-4">' + auto + allOn + cats.map((c) => {
      const list = items.filter(([, m]) => m.category === c);
      return '<div class="mb-4 space-y-2">' + list.map(([id, m]) => {
        const on = state.avail[id] !== false;
        return '<button type="button" data-avail="' + id + '" role="switch" aria-checked="' + on + '" class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt p-2 pe-3 text-start ring-1 ring-edge/5 transition active:scale-[.99]">' +
          '<span class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface ' + (on ? '' : 'grayscale opacity-50') + '"><img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" /></span>' +
          '<span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold ' + (on ? '' : 'text-muted line-through') + '">' + esc(m.name[state.lang] || m.name.en) + '</span>' +
            '<span class="block truncate text-[11px] font-bold ' + (on ? '' : 'text-brand') + '" style="' + (on ? 'color:rgb(var(--c-ok))' : '') + '">' + esc(status(id, on)) + '</span></span>' +
          '<span class="switch ' + (on ? 'is-on' : '') + '" aria-hidden="true"></span>' +
        '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>');
  if (top) $('sheetPanel').querySelector('[data-so-list]').scrollTop = top;
  // Another device may have changed something since this one loaded: refresh once, then redraw
  if (refresh) {
    Promise.all([loadAvailability(), sb.rpc('staff_sold_out_settings')]).then(([, s]) => {
      if (!s.error && s.data) soldOutSettings = s.data;
      if ($('sheetPanel').querySelector('[data-so-list]') && !$('sheetRoot').classList.contains('hidden')) openSoldOut(false);
    }).catch(() => {});
  }
  $('sheetPanel').onclick = async (e) => {
    if (e.target.closest('[data-auto-reset]')) {
      if (!admin || !soldOutSettings) return;
      const next = !soldOutSettings.auto_reset;
      const { error } = await sb.rpc('admin_set_auto_reset_sold_out', { p_on: next });
      if (error) { toast(t('actionFailed')); return; }
      soldOutSettings.auto_reset = next;
      openSoldOut(false);
      toast(t('saved'));
      return;
    }
    if (e.target.closest('[data-all-on]')) {
      if (!confirm(t('allBackOnConfirm'))) return;
      off.forEach((id) => { state.avail[id] = true; state.soldInfo[id] = null; });
      openSoldOut(false);
      const failed = [];
      for (const id of off) if (await setAvailable(id, true)) failed.push(id);
      if (failed.length) { failed.forEach((id) => { state.avail[id] = false; }); openSoldOut(); toast(t('actionFailed')); }
      return;
    }
    const b = e.target.closest('[data-avail]');
    if (!b) return;
    const id = b.getAttribute('data-avail');
    const next = state.avail[id] === false;
    state.avail[id] = next;
    state.soldInfo[id] = next ? null : { at: new Date().toISOString(), by: state.me && state.me.name };
    openSoldOut(false);
    if (await setAvailable(id, next)) { state.avail[id] = !next; openSoldOut(); toast(t('actionFailed')); }
  };
}

async function staffCall(body) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(CFG.supabaseUrl + '/functions/v1/manage-staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + session.access_token },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'failed');
  return out;
}

async function openStaff() {
  openSheet(sheetHeader(t('staffAccounts'), t('staffSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>');
  let list = [];
  try { list = (await staffCall({ action: 'list' })).staff || []; } catch { toast(t('actionFailed')); }
  const input = 'w-full rounded-xl border-0 bg-surfaceAlt px-3 py-2.5 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60';
  openSheet(sheetHeader(t('staffAccounts'), t('staffSub')) +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="space-y-2">' + list.map((s) =>
        '<div class="flex items-center gap-3 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5">' +
          '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">' + esc((s.name || s.email || '?').slice(0, 1).toUpperCase()) + '</span>' +
          '<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">' + esc(s.name || s.email) + (s.is_me ? ' <span class="text-xs text-muted">(' + esc(t('you')) + ')</span>' : '') + '</p>' +
            '<p class="truncate text-xs text-muted" dir="ltr">' + esc(s.email) + '</p>' +
            '<p class="text-[11px] text-muted">' + esc(s.role === 'admin' ? t('roleAdmin') : t('roleCashier')) + ' · ' + esc(t('lastSeen')) + ': ' + esc(s.last_sign_in_at ? new Date(s.last_sign_in_at).toLocaleDateString() : t('never')) + '</p></div>' +
          (s.is_me ? '' :
            '<div class="flex flex-col gap-1">' +
              '<button type="button" data-reset="' + s.user_id + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-muted transition hover:bg-edge/5 hover:text-ink">' + esc(t('resetPw')) + '</button>' +
              '<button type="button" data-signout="' + s.user_id + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-muted transition hover:bg-edge/5 hover:text-ink">' + esc(t('signOutAll')) + '</button>' +
              '<button type="button" data-remove="' + s.user_id + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition hover:bg-brand/10">' + esc(t('remove')) + '</button>' +
            '</div>') +
        '</div>').join('') + '</div>' +
      '<form id="addStaffForm" class="mt-5 space-y-2 rounded-2xl p-4 ring-1 ring-edge/10">' +
        '<h4 class="text-sm font-bold">' + esc(t('addStaff')) + '</h4>' +
        '<input name="name" placeholder="' + esc(t('name')) + '" maxlength="60" class="' + input + '" />' +
        '<input name="email" type="email" required placeholder="' + esc(t('email')) + '" dir="ltr" class="' + input + '" />' +
        '<input name="password" type="text" required minlength="8" placeholder="' + esc(t('password')) + ' (8+)" dir="ltr" class="' + input + '" />' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<label class="flex items-center gap-2 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm"><input type="radio" name="role" value="cashier" checked class="accent-[#C4453A]" />' + esc(t('roleCashier')) + '</label>' +
          '<label class="flex items-center gap-2 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm"><input type="radio" name="role" value="admin" class="accent-[#C4453A]" />' + esc(t('roleAdmin')) + '</label>' +
        '</div>' +
        '<button type="submit" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('add')) + '</button>' +
      '</form>' +
    '</div>');
  $('addStaffForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (String(f.get('password')).length < 8) { toast(t('pwShort')); return; }
    try {
      await staffCall({ action: 'add', name: f.get('name'), email: f.get('email'), password: f.get('password'), role: f.get('role') });
      toast(t('staffAdded'));
      openStaff();
    } catch (err) { toast(err.message || t('actionFailed'), 3500); }
  };
  $('sheetPanel').onclick = async (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (!confirm(t('removeConfirm'))) return;
      try { await staffCall({ action: 'remove', user_id: rm.getAttribute('data-remove') }); toast(t('staffRemoved')); openStaff(); }
      catch (err) { toast(err.message || t('actionFailed'), 3500); }
      return;
    }
    const so = e.target.closest('[data-signout]');
    if (so) {
      if (!confirm(t('signOutAllConfirm'))) return;
      const { error } = await sb.rpc('admin_sign_out_user', { p_user: so.getAttribute('data-signout') });
      toast(error ? t('actionFailed') : t('signedOutAll'));
      return;
    }
    const rs = e.target.closest('[data-reset]');
    if (rs) {
      const pw = prompt(t('newPassword') + ' (8+)');
      if (!pw) return;
      if (pw.length < 8) { toast(t('pwShort')); return; }
      try { await staffCall({ action: 'reset-password', user_id: rs.getAttribute('data-reset'), password: pw }); toast(t('pwSaved')); }
      catch (err) { toast(err.message || t('actionFailed'), 3500); }
    }
  };
}

function openPassword() {
  $('sheetPanel').onclick = null;
  openSheet(sheetHeader(t('changePassword')) +
    '<form id="pwForm" class="space-y-3 px-5 py-4">' +
      '<input id="pwNew" type="password" minlength="8" required autocomplete="new-password" placeholder="' + esc(t('newPassword')) + ' (8+)" dir="ltr" class="w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
      '<button type="submit" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('save')) + '</button>' +
    '</form>');
  $('pwForm').onsubmit = async (e) => {
    e.preventDefault();
    const pw = $('pwNew').value;
    if (pw.length < 8) { toast(t('pwShort')); return; }
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) { toast(error.message, 3500); return; }
    closeSheet();
    toast(t('pwSaved'));
  };
}

/* ====================================================================
 * Monthly sales calendar (admins): every day's sales and number of orders
 * ==================================================================== */

const ERBIL_MS = 3 * 3600 * 1000; // Erbil is UTC+3 all year
const salesView = { year: 0, month: 0, day: null, cache: {} };

function erbilParts(d) {
  const e = new Date(d.getTime() + ERBIL_MS);
  return { y: e.getUTCFullYear(), m: e.getUTCMonth(), d: e.getUTCDate() };
}
function shortMoney(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(n);
}
function locale() { return state.lang === 'en' ? 'en-GB' : state.lang === 'ar' ? 'ar-IQ' : 'ckb-IQ'; }

async function loadMonth(y, m) {
  const key = y + '-' + m;
  const isCurrent = (() => { const p = erbilParts(new Date()); return p.y === y && p.m === m; })();
  if (salesView.cache[key] && !isCurrent) return salesView.cache[key];
  const from = new Date(Date.UTC(y, m, 1) - ERBIL_MS).toISOString();
  const to = new Date(Date.UTC(y, m + 1, 1) - ERBIL_MS).toISOString();
  const rows = [];
  // Page through in case of a very busy month
  const pageOf = (page) => sb.from('orders').select('created_at,total,items,status' + (hasCol('is_test') ? ',is_test' : ''))
    .gte('created_at', from).lt('created_at', to)
    .not('status', 'in', '(rejected,cancelled)')
    .order('created_at').range(page * 1000, page * 1000 + 999);
  for (let page = 0; page < 20; page++) {
    let { data, error } = await pageOf(page);
    if (noColumn(error) && hasCol('is_test')) { extraCols = extraCols.filter((c) => c !== 'is_test'); ({ data, error } = await pageOf(page)); }
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const days = {};
  for (const o of rows) {
    if (o.is_test) continue;   // marked as a test order by the owner
    const d = erbilParts(new Date(o.created_at)).d;
    const day = days[d] || (days[d] = { orders: 0, revenue: 0, items: {} });
    day.orders += 1;
    day.revenue += o.total;
    (o.items || []).forEach((l) => { day.items[l.item_id] = (day.items[l.item_id] || 0) + l.qty; });
  }
  salesView.cache[key] = days;
  return days;
}

async function openSales(y, m) {
  if (y === undefined) { const p = erbilParts(new Date()); y = p.y; m = p.m; salesView.day = p.d; }
  salesView.year = y; salesView.month = m;
  $('sheetPanel').onclick = null;
  const title = new Date(Date.UTC(y, m, 15)).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const nav = (dir, icon) => '<button type="button" data-month="' + dir + '" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-90"><i data-lucide="' + icon + '" class="h-4 w-4 rtl-flip"></i></button>';
  const head = '<header class="flex items-center gap-2 border-b border-edge/5 px-5 py-4">' +
    '<div class="min-w-0 flex-1"><p class="text-[11px] font-bold uppercase tracking-wide text-muted">' + esc(t('monthlySales')) + '</p><h3 class="font-display text-xl">' + esc(title) + '</h3></div>' +
    nav(-1, 'chevron-left') + nav(1, 'chevron-right') +
    '<button type="button" data-close-sheet class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('close')) + '"><i data-lucide="x" class="h-5 w-5"></i></button>' +
  '</header>';
  openSheet(head + '<div class="grid place-items-center py-16"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);

  let days;
  try { days = await loadMonth(y, m); } catch { toast(t('actionFailed')); closeSheet(); return; }
  if (salesView.year !== y || salesView.month !== m) return; // user already moved to another month

  const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const today = erbilParts(new Date());
  const isThisMonth = today.y === y && today.m === m;
  const vals = Object.values(days);
  const monthRevenue = vals.reduce((s, d) => s + d.revenue, 0);
  const monthOrders = vals.reduce((s, d) => s + d.orders, 0);
  const countedDays = isThisMonth ? today.d : daysIn;
  const best = Object.entries(days).sort((a, b) => b[1].revenue - a[1].revenue)[0];
  const max = Math.max(1, ...vals.map((d) => d.revenue));

  // Week starts on Saturday, as in Iraq
  const firstDow = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const lead = (firstDow + 1) % 7;
  const dowNames = [0, 1, 2, 3, 4, 5, 6].map((i) => new Date(Date.UTC(2024, 0, 6 + i)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }));

  const tile = (label, val, sub) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] text-muted">' + esc(label) + '</p>' +
    '<p class="tnum mt-0.5 font-display text-lg leading-tight sm:text-xl">' + esc(val) + '</p>' + (sub ? '<p class="text-[11px] text-muted tnum">' + esc(sub) + '</p>' : '') + '</div>';

  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<div></div>';
  for (let d = 1; d <= daysIn; d++) {
    const v = days[d];
    const future = isThisMonth && d > today.d;
    const isToday = isThisMonth && d === today.d;
    const sel = salesView.day === d;
    const heat = v ? Math.max(0.12, v.revenue / max) : 0;
    cells += '<button type="button" data-day="' + d + '" ' + (future ? 'disabled' : '') + ' class="sales-cell relative flex aspect-square flex-col rounded-xl p-1.5 text-start ring-1 transition active:scale-95 disabled:opacity-35 sm:p-2 ' +
      (sel ? 'ring-2 ring-brand' : 'ring-edge/5 hover:ring-brand/40') + '" style="background:' + (v ? 'rgba(196,69,58,' + (heat * 0.55).toFixed(2) + ')' : 'rgb(var(--c-surface-alt))') + ';animation-delay:' + (d * 12) + 'ms">' +
      '<span class="tnum text-[11px] font-bold ' + (isToday ? 'grid h-5 w-5 place-items-center rounded-full bg-brand text-white' : heat > 0.6 ? 'text-white' : 'text-muted') + '">' + d + '</span>' +
      (v ? '<span class="tnum mt-auto truncate text-[11px] font-extrabold leading-tight sm:text-xs ' + (heat > 0.6 ? 'text-white' : 'text-ink') + '">' + shortMoney(v.revenue) + '</span>' +
           '<span class="tnum truncate text-[10px] leading-tight ' + (heat > 0.6 ? 'text-white/85' : 'text-muted') + '">' + v.orders + '<span class="hidden sm:inline"> ' + esc(t('ordersShort')) + '</span></span>' : '') +
    '</button>';
  }

  const dayDetail = (() => {
    const d = salesView.day;
    if (!d || d > daysIn) return '';
    const v = days[d];
    const label = new Date(Date.UTC(y, m, d)).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const top = v ? Object.entries(v.items).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
    return '<div class="sales-detail mt-4 rounded-2xl p-4 ring-1 ring-edge/10">' +
      '<div class="flex items-baseline justify-between gap-3"><h4 class="font-display text-lg">' + esc(label) + '</h4>' +
        '<span class="tnum font-extrabold text-brand">' + esc(v ? money(v.revenue) : t('noSales')) + '</span></div>' +
      (v ? '<p class="mt-0.5 text-xs text-muted tnum">' + v.orders + ' ' + esc(t('ordersShort')) + ' · ' + esc(money(Math.round(v.revenue / v.orders))) + ' / ' + esc(t('ordersShort').replace(/s$/, '')) + '</p>' +
        '<div class="mt-3 space-y-1.5">' + top.map(([id, n]) => {
          const it = MENU_DATA.items[id];
          return '<div class="flex items-center gap-2 text-sm"><span class="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-surfaceAlt">' + (it ? '<img src="' + esc(it.thumb) + '" alt="" class="h-full w-full object-cover" />' : '') + '</span>' +
            '<span class="min-w-0 flex-1 truncate">' + esc(it ? (it.name[state.lang] || it.name.en) : id) + '</span><span class="tnum font-bold">' + n + '</span></div>';
        }).join('') + '</div>' : '') +
    '</div>';
  })();

  const list = Object.keys(days).map(Number).sort((a, b) => b - a).map((d) => {
    const v = days[d];
    const label = new Date(Date.UTC(y, m, d)).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    return '<button type="button" data-day="' + d + '" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition hover:bg-edge/5">' +
      '<span class="w-28 shrink-0 font-semibold">' + esc(label) + '</span>' +
      '<span class="h-2 flex-1 overflow-hidden rounded-full bg-surfaceAlt"><span class="block h-full rounded-full bg-gradient-to-r from-brand to-brandDark" style="width:' + Math.round((v.revenue / max) * 100) + '%"></span></span>' +
      '<span class="tnum w-14 shrink-0 text-end text-xs text-muted">' + v.orders + '</span>' +
      '<span class="tnum w-28 shrink-0 text-end font-bold">' + esc(money(v.revenue)) + '</span>' +
    '</button>';
  }).join('');

  openSheet(head +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">' +
        tile(t('monthTotal'), money(monthRevenue)) +
        tile(t('statOrders'), String(monthOrders)) +
        tile(t('perDay'), money(Math.round(monthRevenue / Math.max(1, countedDays)))) +
        tile(t('bestDay'), best ? money(best[1].revenue) : '—', best ? new Date(Date.UTC(y, m, +best[0])).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '') +
      '</div>' +
      '<div class="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">' +
        dowNames.map((n) => '<div class="pb-1 text-center text-[10px] font-bold uppercase text-muted">' + esc(n) + '</div>').join('') + cells +
      '</div>' +
      dayDetail +
      (list ? '<h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('allDays')) + '</h4><div class="mt-1 -mx-3">' + list + '</div>' : '') +
    '</div>', true);

  $('sheetPanel').onclick = (e) => {
    const nb = e.target.closest('[data-month]');
    if (nb) {
      let nm = m + (+nb.getAttribute('data-month')), ny = y;
      if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
      salesView.day = null;
      openSales(ny, nm);
      return;
    }
    const db = e.target.closest('[data-day]');
    if (db && !db.disabled) { salesView.day = +db.getAttribute('data-day'); openSales(y, m); }
  };
}

/* ====================================================================
 * Kitchen ticket (80 mm receipt printers, or any printer)
 * ==================================================================== */

function printTicket(id) {
  const o = state.orders.get(id);
  if (!o) return;
  const time = new Date(o.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  const reward = o.loyalty_reward && state.loyalty && state.loyalty.reward && state.loyalty.reward.en;
  // The dark-on-white logo, in pure black for receipt printers (the name is printed under it in case the image is missing)
  $('printArea').innerHTML =
    '<div style="text-align:center"><img src="image/lightsidelogo.webp" alt="" style="display:block;margin:0 auto;width:52mm;max-width:100%;filter:grayscale(1) contrast(1.8)" /></div>' +
    '<div style="text-align:center;font-weight:800;font-size:11px;letter-spacing:.2em">SMASHED BURGER</div>' +
    '<div style="text-align:center;font-size:34px;font-weight:900;margin:6px 0">#' + o.code + '</div>' +
    '<div style="text-align:center;font-size:15px;font-weight:700">' + esc(o.order_type === 'takeaway' ? 'TAKEAWAY' : 'TABLE ' + (o.table_no || '?')) + '</div>' +
    '<div style="text-align:center;font-size:11px;margin-bottom:8px">' + esc(time) + '</div>' +
    '<hr style="border:0;border-top:1px dashed #000" />' +
    (o.items || []).map((l) =>
      '<div style="margin:6px 0"><div style="font-size:14px;font-weight:800">' + l.qty + '× ' + esc(l.name_en) + '</div>' +
      (l.options || []).map((op) => '<div style="font-size:12px;padding-left:14px">• ' + esc(op.label_en) + '</div>').join('') + '</div>').join('') +
    '<hr style="border:0;border-top:1px dashed #000" />' +
    '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:14px"><span>TOTAL</span><span>' + esc(money(o.total)) + '</span></div>' +
    (o.loyalty_reward ? '<div style="margin-top:6px;border:2px solid #000;padding:4px;text-align:center;font-weight:800;font-size:13px">LOYALTY REWARD' + (reward ? ': ' + esc(reward) : '') + '<br />take it off the bill</div>' : '');
  // Print once the logo has loaded (it's cached after the first ticket), or after 1.5 s at the latest
  const img = $('printArea').querySelector('img');
  let done = false;
  const go = () => { if (done) return; done = true; window.print(); };
  if (img.complete) go();
  else { img.onload = go; img.onerror = () => { img.remove(); go(); }; setTimeout(go, 1500); }
}

/* ====================================================================
 * Boot
 * ==================================================================== */

(async function boot() {
  loadPrefs();
  applyTheme();
  applyLang();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    state.session = session;
    await afterLogin();
  } else {
    show('loginView');
  }
  refreshIcons();
})();
