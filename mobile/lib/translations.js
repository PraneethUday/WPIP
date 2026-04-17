// ─── GigGuard translations ───────────────────────────────────────────────────
// Supported: en · hi · te · ta · ml

export const LANGUAGES = [
  { code: "en", label: "English",  native: "English"   },
  { code: "hi", label: "Hindi",    native: "हिंदी"      },
  { code: "te", label: "Telugu",   native: "తెలుగు"     },
  { code: "ta", label: "Tamil",    native: "தமிழ்"      },
  { code: "ml", label: "Malayalam",native: "മലയാളം"    },
];

const translations = {
  en: {
    // ── Navigation
    nav_home:      "Home",
    nav_claims:    "Claims",
    nav_payments:  "Payments",
    nav_profile:   "Profile",

    // ── Profile screen
    profile:               "Profile",
    income_protected:      "Income Protected",
    verification_pending:  "Verification Pending",

    // sections
    section_personal:   "Personal Information",
    section_platforms:  "Connected Platforms",
    section_coverage:   "Coverage Settings",
    section_appearance: "Appearance",
    section_language:   "Language",

    // personal rows
    row_name:        "Full Name",
    row_phone:       "Phone",
    row_email:       "Email",
    row_city:        "City",
    row_area:        "Area / Zone",
    row_delivery_id: "Delivery Partner ID",

    // coverage rows
    row_plan:         "Current Plan",
    row_autopay:      "AutoPay",
    row_verification: "Verification",
    row_upi:          "UPI ID",

    // autopay values
    autopay_on:  "Enabled (5% discount)",
    autopay_off: "Disabled",

    // appearance
    dark_mode:       "Dark Mode",
    light_mode:      "Light Mode",
    theme_dark_sub:  "Prussian Blue theme",
    theme_light_sub: "Ivory theme",
    switch_to_dark:  "Switch to Dark Theme",
    switch_to_light: "Switch to Light Theme",

    // language
    language:        "Language",
    select_language: "Select Language",

    // actions
    refresh_profile: "Refresh Profile",
    sign_out:        "Sign Out",

    // status
    verified: "Verified ✓",
    pending:  "Pending",

    // platforms
    no_platforms: "No platforms linked yet.",
    delivery_id_label: "Delivery ID",

    // payments
    upcoming_premium:  "Upcoming Premium",
    per_week:          "per week",
    paid_today:        "✓ Paid today",
    pay_premium:       "Pay Premium →",
    payment_history:   "Payment History",
    this_weeks_due:    "This week's premium due",
    pay_now:           "Pay Now →",
    no_payments:       "No payments yet.",

    // claims
    claims_history:    "Claims History",
    total_received:    "TOTAL RECEIVED",
    claims_badge:      "CLAIMS",
    settled:           "Settled",
    review:            "Review",
    rejected:          "Rejected",
    all:               "All",
    auto_claim_note:   "Claims trigger automatically — no manual filing required",
    no_claims:         "No claims yet. Claims appear automatically when a disruption is detected.",

    // home greeting
    greeting_morning:   "Good morning",
    greeting_afternoon: "Good afternoon",
    greeting_evening:   "Good evening",
    coverage_on:        "Your coverage is active this week",
    coverage_off:       "Coverage is not active this week",
  },

  hi: {
    nav_home:      "होम",
    nav_claims:    "दावे",
    nav_payments:  "भुगतान",
    nav_profile:   "प्रोफ़ाइल",

    profile:               "प्रोफ़ाइल",
    income_protected:      "आय संरक्षित",
    verification_pending:  "सत्यापन लंबित",

    section_personal:   "व्यक्तिगत जानकारी",
    section_platforms:  "जुड़े प्लेटफ़ॉर्म",
    section_coverage:   "कवरेज सेटिंग",
    section_appearance: "दिखावट",
    section_language:   "भाषा",

    row_name:        "पूरा नाम",
    row_phone:       "फ़ोन",
    row_email:       "ईमेल",
    row_city:        "शहर",
    row_area:        "क्षेत्र / ज़ोन",
    row_delivery_id: "डिलीवरी पार्टनर आईडी",

    row_plan:         "वर्तमान योजना",
    row_autopay:      "ऑटोपे",
    row_verification: "सत्यापन",
    row_upi:          "UPI आईडी",

    autopay_on:  "सक्षम (5% छूट)",
    autopay_off: "अक्षम",

    dark_mode:       "डार्क मोड",
    light_mode:      "लाइट मोड",
    theme_dark_sub:  "प्रूशियन ब्लू थीम",
    theme_light_sub: "आइवरी थीम",
    switch_to_dark:  "डार्क थीम में जाएं",
    switch_to_light: "लाइट थीम में जाएं",

    language:        "भाषा",
    select_language: "भाषा चुनें",

    refresh_profile: "प्रोफ़ाइल रिफ्रेश करें",
    sign_out:        "साइन आउट",

    verified: "सत्यापित ✓",
    pending:  "लंबित",

    no_platforms:      "अभी तक कोई प्लेटफ़ॉर्म नहीं जुड़ा।",
    delivery_id_label: "डिलीवरी आईडी",

    upcoming_premium: "आगामी प्रीमियम",
    per_week:         "प्रति सप्ताह",
    paid_today:       "✓ आज भुगतान हो गया",
    pay_premium:      "प्रीमियम भुगतान करें →",
    payment_history:  "भुगतान इतिहास",
    this_weeks_due:   "इस सप्ताह का प्रीमियम देय",
    pay_now:          "अभी भुगतान करें →",
    no_payments:      "अभी तक कोई भुगतान नहीं।",

    claims_history:  "दावा इतिहास",
    total_received:  "कुल प्राप्त",
    claims_badge:    "दावे",
    settled:         "निपटाया गया",
    review:          "समीक्षा",
    rejected:        "अस्वीकृत",
    all:             "सभी",
    auto_claim_note: "दावे स्वचालित रूप से होते हैं — मैन्युअल फ़ाइलिंग की जरूरत नहीं",
    no_claims:       "अभी तक कोई दावा नहीं। घटना होने पर स्वचालित रूप से दिखेगा।",

    greeting_morning:   "शुभ प्रभात",
    greeting_afternoon: "शुभ अपराह्न",
    greeting_evening:   "शुभ संध्या",
    coverage_on:        "इस सप्ताह आपका कवरेज सक्रिय है",
    coverage_off:       "इस सप्ताह कवरेज सक्रिय नहीं है",
  },

  te: {
    nav_home:      "హోమ్",
    nav_claims:    "క్లెయిమ్‌లు",
    nav_payments:  "చెల్లింపులు",
    nav_profile:   "ప్రొఫైల్",

    profile:               "ప్రొఫైల్",
    income_protected:      "ఆదాయం రక్షించబడింది",
    verification_pending:  "ధృవీకరణ పెండింగ్‌లో ఉంది",

    section_personal:   "వ్యక్తిగత సమాచారం",
    section_platforms:  "అనుసంధానించిన ప్లాట్‌ఫారమ్‌లు",
    section_coverage:   "కవరేజ్ సెట్టింగ్‌లు",
    section_appearance: "రూపు",
    section_language:   "భాష",

    row_name:        "పూర్తి పేరు",
    row_phone:       "ఫోన్",
    row_email:       "ఇమెయిల్",
    row_city:        "నగరం",
    row_area:        "ప్రాంతం / జోన్",
    row_delivery_id: "డెలివరీ పార్టనర్ ఐడి",

    row_plan:         "ప్రస్తుత ప్లాన్",
    row_autopay:      "ఆటోపే",
    row_verification: "ధృవీకరణ",
    row_upi:          "UPI ఐడి",

    autopay_on:  "ప్రారంభించబడింది (5% తగ్గింపు)",
    autopay_off: "నిలిపివేయబడింది",

    dark_mode:       "డార్క్ మోడ్",
    light_mode:      "లైట్ మోడ్",
    theme_dark_sub:  "ప్రష్యన్ బ్లూ థీమ్",
    theme_light_sub: "ఐవరీ థీమ్",
    switch_to_dark:  "డార్క్ థీమ్‌కి మారండి",
    switch_to_light: "లైట్ థీమ్‌కి మారండి",

    language:        "భాష",
    select_language: "భాషను ఎంచుకోండి",

    refresh_profile: "ప్రొఫైల్ రీఫ్రెష్ చేయి",
    sign_out:        "సైన్ అవుట్",

    verified: "ధృవీకరించబడింది ✓",
    pending:  "పెండింగ్",

    no_platforms:      "ఇంకా ఏ ప్లాట్‌ఫారమ్ అనుసంధానించబడలేదు.",
    delivery_id_label: "డెలివరీ ఐడి",

    upcoming_premium: "రాబోయే ప్రీమియం",
    per_week:         "వారానికి",
    paid_today:       "✓ ఈరోజు చెల్లించారు",
    pay_premium:      "ప్రీమియం చెల్లించు →",
    payment_history:  "చెల్లింపుల చరిత్ర",
    this_weeks_due:   "ఈ వారపు ప్రీమియం",
    pay_now:          "ఇప్పుడు చెల్లించు →",
    no_payments:      "ఇంకా చెల్లింపులు లేవు.",

    claims_history:  "క్లెయిమ్ చరిత్ర",
    total_received:  "మొత్తం స్వీకరించారు",
    claims_badge:    "క్లెయిమ్‌లు",
    settled:         "పరిష్కరించబడింది",
    review:          "సమీక్ష",
    rejected:        "తిరస్కరించబడింది",
    all:             "అన్నీ",
    auto_claim_note: "క్లెయిమ్‌లు స్వయంచాలకంగా ప్రారంభమవుతాయి",
    no_claims:       "ఇంకా క్లెయిమ్‌లు లేవు. సంఘటన జరిగినప్పుడు స్వయంచాలకంగా కనిపిస్తాయి.",

    greeting_morning:   "శుభోదయం",
    greeting_afternoon: "శుభ మధ్యాహ్నం",
    greeting_evening:   "శుభ సాయంత్రం",
    coverage_on:        "ఈ వారం మీ కవరేజ్ సక్రియంగా ఉంది",
    coverage_off:       "ఈ వారం కవరేజ్ సక్రియంగా లేదు",
  },

  ta: {
    nav_home:      "முகப்பு",
    nav_claims:    "கோரல்கள்",
    nav_payments:  "கொடுப்பனவுகள்",
    nav_profile:   "சுயவிவரம்",

    profile:               "சுயவிவரம்",
    income_protected:      "வருமானம் பாதுகாக்கப்பட்டது",
    verification_pending:  "சரிபார்ப்பு நிலுவையில் உள்ளது",

    section_personal:   "தனிப்பட்ட தகவல்",
    section_platforms:  "இணைக்கப்பட்ட தளங்கள்",
    section_coverage:   "கவரேஜ் அமைப்புகள்",
    section_appearance: "தோற்றம்",
    section_language:   "மொழி",

    row_name:        "முழு பெயர்",
    row_phone:       "தொலைபேசி",
    row_email:       "மின்னஞ்சல்",
    row_city:        "நகரம்",
    row_area:        "பகுதி / மண்டலம்",
    row_delivery_id: "டெலிவரி பார்ட்னர் ஐடி",

    row_plan:         "தற்போதைய திட்டம்",
    row_autopay:      "ஆட்டோபே",
    row_verification: "சரிபார்ப்பு",
    row_upi:          "UPI ஐடி",

    autopay_on:  "இயக்கப்பட்டது (5% தள்ளுபடி)",
    autopay_off: "முடக்கப்பட்டது",

    dark_mode:       "இருண்ட பயன்முறை",
    light_mode:      "ஒளி பயன்முறை",
    theme_dark_sub:  "ப்ரஷ்யன் ப்ளூ தீம்",
    theme_light_sub: "ஐவரி தீம்",
    switch_to_dark:  "இருண்ட தீமுக்கு மாற்று",
    switch_to_light: "ஒளி தீமுக்கு மாற்று",

    language:        "மொழி",
    select_language: "மொழியை தேர்ந்தெடு",

    refresh_profile: "சுயவிவரம் புதுப்பி",
    sign_out:        "வெளியேறு",

    verified: "சரிபார்க்கப்பட்டது ✓",
    pending:  "நிலுவையில்",

    no_platforms:      "இன்னும் தளங்கள் இணைக்கப்படவில்லை.",
    delivery_id_label: "டெலிவரி ஐடி",

    upcoming_premium: "வரவிருக்கும் பிரீமியம்",
    per_week:         "வாரத்திற்கு",
    paid_today:       "✓ இன்று செலுத்தப்பட்டது",
    pay_premium:      "பிரீமியம் செலுத்து →",
    payment_history:  "கொடுப்பனவு வரலாறு",
    this_weeks_due:   "இந்த வாரத்திற்கான பிரீமியம்",
    pay_now:          "இப்போது செலுத்து →",
    no_payments:      "இன்னும் கொடுப்பனவுகள் இல்லை.",

    claims_history:  "கோரல் வரலாறு",
    total_received:  "மொத்தம் பெறப்பட்டது",
    claims_badge:    "கோரல்கள்",
    settled:         "தீர்க்கப்பட்டது",
    review:          "மதிப்பாய்வு",
    rejected:        "நிராகரிக்கப்பட்டது",
    all:             "அனைத்தும்",
    auto_claim_note: "கோரல்கள் தானாகவே செயல்படுகின்றன",
    no_claims:       "இன்னும் கோரல்கள் இல்லை. சம்பவம் நடந்தால் தானாகவே தோன்றும்.",

    greeting_morning:   "காலை வணக்கம்",
    greeting_afternoon: "மதிய வணக்கம்",
    greeting_evening:   "மாலை வணக்கம்",
    coverage_on:        "இந்த வாரம் உங்கள் கவரேஜ் செயலில் உள்ளது",
    coverage_off:       "இந்த வாரம் கவரேஜ் செயலில் இல்லை",
  },

  ml: {
    nav_home:      "ഹോം",
    nav_claims:    "ക്ലെയിമുകൾ",
    nav_payments:  "പേയ്‌മെന്റുകൾ",
    nav_profile:   "പ്രൊഫൈൽ",

    profile:               "പ്രൊഫൈൽ",
    income_protected:      "വരുമാനം സംരക്ഷിക്കപ്പെട്ടു",
    verification_pending:  "സ്ഥിരീകരണം തീർച്ചയാക്കിയിട്ടില്ല",

    section_personal:   "വ്യക്തിഗത വിവരങ്ങൾ",
    section_platforms:  "ബന്ധിപ്പിച്ച പ്ലാറ്റ്‌ഫോമുകൾ",
    section_coverage:   "കവറേജ് ക്രമീകരണങ്ങൾ",
    section_appearance: "രൂപഭാവം",
    section_language:   "ഭാഷ",

    row_name:        "പൂർണ്ണ പേര്",
    row_phone:       "ഫോൺ",
    row_email:       "ഇമെയിൽ",
    row_city:        "നഗരം",
    row_area:        "പ്രദേശം / സോൺ",
    row_delivery_id: "ഡെലിവറി പാർട്‌നർ ഐഡി",

    row_plan:         "നിലവിലെ പ്ലാൻ",
    row_autopay:      "ഓട്ടോ പേ",
    row_verification: "സ്ഥിരീകരണം",
    row_upi:          "UPI ഐഡി",

    autopay_on:  "പ്രവർത്തനക്ഷമം (5% കിഴിവ്)",
    autopay_off: "പ്രവർത്തനരഹിതം",

    dark_mode:       "ഡാർക്ക് മോഡ്",
    light_mode:      "ലൈറ്റ് മോഡ്",
    theme_dark_sub:  "പ്രഷ്യൻ ബ്ലൂ തീം",
    theme_light_sub: "ഐവറി തീം",
    switch_to_dark:  "ഡാർക്ക് തീമിലേക്ക് മാറുക",
    switch_to_light: "ലൈറ്റ് തീമിലേക്ക് മാറുക",

    language:        "ഭാഷ",
    select_language: "ഭാഷ തിരഞ്ഞെടുക്കുക",

    refresh_profile: "പ്രൊഫൈൽ പുതുക്കുക",
    sign_out:        "സൈൻ ഔട്ട്",

    verified: "സ്ഥിരീകരിച്ചു ✓",
    pending:  "തീർച്ചയാക്കിയിട്ടില്ല",

    no_platforms:      "ഇതുവരെ പ്ലാറ്റ്‌ഫോം ബന്ധിപ്പിച്ചിട്ടില്ല.",
    delivery_id_label: "ഡെലിവറി ഐഡി",

    upcoming_premium: "വരുന്ന പ്രീമിയം",
    per_week:         "ആഴ്ചയ്ക്ക്",
    paid_today:       "✓ ഇന്ന് അടച്ചു",
    pay_premium:      "പ്രീമിയം അടയ്ക്കുക →",
    payment_history:  "പേയ്‌മെന്റ് ചരിത്രം",
    this_weeks_due:   "ഈ ആഴ്ചത്തെ പ്രീമിയം",
    pay_now:          "ഇപ്പോൾ അടയ്ക്കുക →",
    no_payments:      "ഇതുവരെ പേയ്‌മെന്റുകൾ ഇല്ല.",

    claims_history:  "ക്ലെയിം ചരിത്രം",
    total_received:  "ആകെ ലഭിച്ചത്",
    claims_badge:    "ക്ലെയിമുകൾ",
    settled:         "തീർപ്പാക്കി",
    review:          "അവലോകനം",
    rejected:        "നിരസിച്ചു",
    all:             "എല്ലാം",
    auto_claim_note: "ക്ലെയിമുകൾ സ്വയം പ്രവർത്തിക്കുന്നു",
    no_claims:       "ഇതുവരെ ക്ലെയിമുകൾ ഇല്ല. സംഭവം ഉണ്ടാകുമ്പോൾ സ്വയം കാണിക്കും.",

    greeting_morning:   "ശുഭ പ്രഭാതം",
    greeting_afternoon: "ശുഭ ഉച്ചതിരിഞ്ഞ്",
    greeting_evening:   "ശുഭ സന്ധ്യ",
    coverage_on:        "ഈ ആഴ്ച നിങ്ങളുടെ കവറേജ് സജീവമാണ്",
    coverage_off:       "ഈ ആഴ്ച കവറേജ് സജീവമല്ല",
  },
};

export default translations;
