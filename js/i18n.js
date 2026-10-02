/* English / Marathi copy. Original English markup remains the no-script fallback. */
(() => {
  "use strict";

  const preferenceKey = "ym-devnikar-language-v1";
  const marathiStatic = {
    "skip": "मुख्य मजकुराकडे जा",
    "location": "उदगीर, महाराष्ट्र",
    "announcement": "रोजच्या आनंदासाठी. खास क्षणांच्या साजासाठी.",
    "findUs": "आमचं दुकान शोधा",
    "brandCaption": "शैलीचं ठिकाण",
    "nav.collections": "संग्रह",
    "nav.women": "महिलांसाठी",
    "nav.men": "पुरुषांसाठी",
    "nav.occasion": "सण व लग्न",
    "nav.story": "आमच्याविषयी",
    "nav.visit": "दुकानाला भेट द्या",
    "hero.eyebrow": "परंपरेच्या मुळांपासून. तुमच्या नव्या अंदाजासाठी.",
    "hero.title": "परंपरेला<br> एक<br> <em>नवा साज.</em>",
    "hero.description": "सुंदर कापड. विचारपूर्वक निवडलेल्या शैली. प्रत्येक सणासाठी—आणि रोजच्या दिवसासाठीही.",
    "hero.explore": "संग्रह पाहा",
    "hero.visit": "दुकानाला भेट द्या",
    "hero.reviews": "१९ मते",
    "hero.ratingCaption": "उदगीरच्या ग्राहकांकडून मिळालेली आपुलकी",
    "hero.photoEyebrow": "उत्सवाचा खास संग्रह",
    "hero.photoCaption": "आठवणी होणाऱ्या प्रत्येक क्षणासाठी.",
    "hero.index": "०१ / नवा अंदाज",
    "hero.mood": "सहज सुंदर. अगदी तुमच्यासारखं.",
    "values.quality": "स्पर्शातून जाणवणारी गुणवत्ता",
    "values.occasion": "प्रत्येक प्रसंगासाठी एक शैली",
    "values.personal": "नेहमीच आपुलकीची सेवा",
    "values.delivery": "दुकानात खरेदी व डिलिव्हरी",
    "collections.eyebrow": "तुमची शैली, तुमची गोष्ट",
    "collections.title": "तुमच्या प्रत्येक <em>अंदाजासाठी.</em>",
    "collections.explore": "सर्व शैली पाहा",
    "collection.women.label": "प्रत्येक घडीत नजाकत",
    "collection.women.title": "साड्या व महिलांचे कपडे",
    "collection.men.label": "क्लासिक आणि आधुनिक",
    "collection.men.title": "पुरुषांचा संग्रह",
    "collection.occasion.label": "उत्सवासाठी खास",
    "collection.occasion.title": "लग्न व सणांचे कपडे",
    "styles.eyebrow": "नव्या शैलीची प्रेरणा",
    "styles.title": "तुमची पुढची <em>आवड शोधा.</em>",
    "styles.description": "मनाला भावणारे लुक.<br> आवडते लुक जतन करा, मग दुकानात तुमचा खास साज निवडा.",
    "filters.all": "सर्व शैली",
    "filters.women": "महिलांसाठी",
    "filters.men": "पुरुषांसाठी",
    "filters.occasion": "सण व लग्न",
    "styles.clearSearch": "शोध पुसा",
    "styles.note": "हे शैलीचं प्रेरणाफलक आहे, उपलब्ध मालाची यादी नाही. छायाचित्रे AI-निर्मित आहेत; सध्याचे कपडे, कापड व किंमती दुकानात पाहा.",
    "story.note": "छान कापड.<br><em>छान अनुभव.</em>",
    "story.noteCaption": "देवनीकरची खासियत",
    "story.eyebrow": "फक्त कपड्यांचं दुकान नव्हे",
    "story.title": "छान कपडे.<br><em>त्याहून छान आपुलकी.</em>",
    "story.paragraphOne": "घरातलं लग्न. जवळ आलेला सण. किंवा नवा आवडता पोशाख सापडल्याचा आनंद. य. म. देवनीकरमध्ये आम्हाला वाटतं—कपडे निवडण्याचा अनुभवही तितकाच छान असावा.",
    "story.paragraphTwo": "सुंदर साडीपासून सहजसुंदर रोजच्या कपड्यांपर्यंत, निवांतपणे आमचा संग्रह पाहा. तुमच्या आवडीची शैली शोधायला आमची टीम आपुलकीने मदत करेल.",
    "story.promise0": "निवडक संग्रह",
    "story.promise1": "मदतीचा हात",
    "story.promise2": "मनापासून स्वागत",
    "story.visit": "उदगीरमध्ये आम्हाला भेटा",
    "story.signature": "तुमची शैली. आमचा आनंद.",
    "reviews.eyebrow": "ग्राहकांच्या मनातलं",
    "reviews.title": "आपुलकीचे शब्द. <em>खरे अनुभव.</em>",
    "reviews.summary": "१९ Google मतांवर आधारित",
    "reviews.google": "Google वरील मत",
    "reviews.note": "ग्राहकांच्या मूळ इंग्रजी मतांतील निवडक उतारे.",
    "reviews.maps": "Google वर पाहा",
    "visit.eyebrow": "चला, तुमची खास शैली शोधूया",
    "visit.title": "तुमच्या पुढच्या आवडीच्या<br><em>आणखी जवळ.</em>",
    "visit.intro": "कापडाचा स्पर्श अनुभवा. नवी शैली आजमावून पाहा.<br> आमच्या उदगीरच्या दुकानात तुमचं मनापासून स्वागत.",
    "visit.name": "य. म. देवनीकर",
    "visit.address": "हनुमान रोड, जिजाऊ नगर, खडकाळी<br> उदगीर, महाराष्ट्र 413517",
    "visit.closing": "नोंदवलेली बंद होण्याची वेळ: रात्री १०:३०",
    "visit.hours": "आजच्या वेळांसाठी Google Maps पाहा.<br> सुट्ट्यांच्या दिवशी वेळ बदलू शकते.",
    "visit.directions": "मार्गदर्शन मिळवा",
    "visit.shopping": "दुकानात खरेदी",
    "visit.delivery": "डिलिव्हरी उपलब्ध",
    "map.open": "Google Maps वर उघडा",
    "map.code": "94W7+3R · उदगीर, महाराष्ट्र",
    "map.note": "प्रातिनिधिक नकाशा · अचूक मार्गासाठी टॅप करा",
    "faq.eyebrow": "काही उपयुक्त माहिती",
    "faq.title": "भेट देण्यापूर्वी<br><em>हे जाणून घ्या.</em>",
    "faq.intro": "थोडं कमी विचारात पडणं.<br> थोडी जास्त नव्या कपड्यांची प्रेरणा.",
    "faq.question0": "हे लुक ऑनलाइन खरेदी करता येतील का?",
    "faq.answer0": "ही वेबसाइट आमच्या दुकानातील शैलीची मार्गदर्शिका आहे, ऑनलाइन खरेदीची सुविधा नाही. ही छायाचित्रे शैलीची प्रेरणा आहेत, उपलब्ध मालाची खात्री नाही. आवडते लुक तुमच्या भेट-यादीत जतन करा आणि सध्याचे कपडे, मापे, कापड व किंमती दुकानात आमच्या टीमसोबत पाहा.",
    "faq.question1": "डिलिव्हरीची सुविधा आहे का?",
    "faq.answer1": "डिलिव्हरी ही दुकानाच्या सेवांमध्ये नोंदवलेली आहे. ऑर्डर देण्यापूर्वी उपलब्ध भाग, शुल्क आणि कालावधीबद्दल दुकानात विचारणा करा. या वेबसाइटवर ऑनलाइन डिलिव्हरी बुकिंग उपलब्ध नाही.",
    "faq.question2": "य. म. देवनीकरमध्ये काय मिळेल?",
    "faq.answer2": "आमचे ग्राहक साड्या, पारंपरिक कपडे, लग्न व सणांचे कपडे आणि रोजच्या शैलींचा उल्लेख करतात. सध्याचा संग्रह पाहायला या आणि तुमच्या प्रसंगासाठी योग्य पोशाख निवडा.",
    "faq.question3": "दुकान कुठे आहे आणि किती वाजता बंद होतं?",
    "faq.answer3": "आमचं दुकान हनुमान रोड, जिजाऊ नगर, खडकाळी, उदगीर, महाराष्ट्र 413517 येथे आहे. दिलेल्या नोंदीनुसार बंद होण्याची वेळ रात्री १०:३० आहे; मात्र रोजच्या व सुट्टीच्या वेळा बदलू शकतात. येण्यापूर्वी <a href=\"https://www.google.com/maps/search/?api=1&amp;query=Y.M.DEVNIKAR%20Hanuman%20Road%20Udgir\" target=\"_blank\" rel=\"noopener noreferrer\">Google Maps वरील नोंद तपासा</a>.",
    "footer.tagline": "परंपरेच्या मुळांपासून.<br> नेहमी सुंदर. नेहमी तुमच्यासारखं.",
    "footer.discover": "शोधा",
    "footer.collections": "आमचा संग्रह",
    "footer.women": "महिलांचे कपडे",
    "footer.men": "पुरुषांचे कपडे",
    "footer.occasion": "लग्न व सण",
    "footer.about": "आमच्याविषयी थोडंसं",
    "footer.story": "देवनीकरची खासियत",
    "footer.reviews": "ग्राहकांचे अनुभव",
    "footer.faq": "उपयुक्त माहिती",
    "footer.saved": "तुमचे आवडते लुक",
    "footer.hello": "आम्हाला भेटा",
    "footer.address": "हनुमान रोड, जिजाऊ नगर, खडकाळी<br> उदगीर, महाराष्ट्र 413517",
    "footer.directions": "दुकानाचा पत्ता पाहा",
    "footer.copyright": " य. म. देवनीकर. सर्व हक्क राखीव.",
    "footer.signoff": "निवड विचारपूर्वक. शैली मनापासून.",
    "footer.top": "वर जा ↑",
    "search.eyebrow": "चला, काहीतरी मनाला भावणारं शोधूया",
    "search.title": "तुमची <em>शैली शोधा.</em>",
    "search.label": "शैलीच्या प्रेरणांमध्ये शोधा",
    "search.note": "शैलीची प्रेरणा. सध्याची उपलब्धता व किंमती दुकानात तपासा.",
    "quick.inspiration": "शैलीची प्रेरणा",
    "quick.storeTitle": "हा लुक आवडला? तुमच्यासाठी असाच साज शोधूया.",
    "quick.storeNote": "उपलब्ध शैली, रंग, मापे व किंमती पाहण्यासाठी दुकानात या. हे प्रातिनिधिक छायाचित्र आहे, उपलब्ध मालाची नोंद नाही.",
    "quick.visit": "दुकानाच्या भेटीचं नियोजन करा",
    "saved.eyebrow": "पुढची खरेदीची भेट, अगदी सोपी",
    "saved.title": "तुमचे <em>आवडते लुक.</em>",
    "saved.intro": "आवडते लुक एकाच ठिकाणी जतन करा. तुमची यादी आमच्या टीमला दाखवा, आम्ही अशाच शैली शोधायला मदत करू.",
    "saved.inspiration": "खरेदी नाही. फक्त प्रेरणा.",
    "saved.visit": "दुकानाच्या भेटीचं नियोजन करा",
    "toast.view": "यादी पाहा",
    "a11y.home": "य. म. देवनीकर — मुख्यपृष्ठ",
    "a11y.navigation": "मुख्य नेव्हिगेशन",
    "a11y.search": "शैली शोधा",
    "a11y.menu": "मेनू उघडा",
    "a11y.rating": "Google वर ५ पैकी ४.० गुण, १९ मतांवर आधारित. ग्राहकांची मते वाचा.",
    "a11y.seal": "विचारपूर्वक निवडलेली, सदाबहार शैली",
    "a11y.experience": "देवनीकरचा अनुभव",
    "a11y.filters": "शैली निवडा",
    "a11y.google": "य. म. देवनीकर Google Maps वर पाहा. १९ मतांमधून ४.० गुण.",
    "a11y.fiveStars": "५ पैकी ५ गुण",
    "a11y.mapLink": "Google Maps वर दुकानाचं अचूक स्थान नवीन टॅबमध्ये उघडा",
    "a11y.map": "उदगीर परिसराचा प्रातिनिधिक नकाशा; अचूक स्थानासाठी Google Maps उघडा",
    "a11y.closeSearch": "शोध बंद करा",
    "a11y.closeQuick": "लुकची माहिती बंद करा",
    "a11y.closeSaved": "जतन केलेले लुक बंद करा",
    "a11y.submitSearch": "जुळणाऱ्या शैली दाखवा",
    "search.placeholder": "“साडी”, “कुर्ता” किंवा “सण” शोधा…",
    "a11y.closeShared": "शेअर केलेली यादी बंद करून सर्व शैली पाहा",
    "image.hero": "प्रातिनिधिक उत्सवी लुक: अंगणात टेराकोटा रंगाची साडी आणि आयव्हरी कुर्ता",
    "image.women": "नाजूक सोनेरी काठाची हिरवी साडी",
    "image.men": "भरतकामाचा बेज कुर्ता आणि आयव्हरी पायजमा",
    "image.occasion": "उत्सवाच्या प्रेरणेसाठी वाइन रंगाचा भरतकामाचा लेहेंगा",
    "image.story": "हिरव्या साडीच्या नाजूक घड्या व काठ—सदाबहार शैलीचं प्रातिनिधिक छायाचित्र",
    "page.title": "य. म. देवनीकर — परंपरेला नवा साज | उदगीर",
    "page.description": "उदगीरच्या य. म. देवनीकरमध्ये साड्या, लग्न व सणांचे कपडे आणि रोजच्या शैली पाहा. हनुमान रोड, जिजाऊ नगर येथे भेट द्या. १९ Google मतांवर आधारित ४.० गुण.",
    "page.ogTitle": "य. म. देवनीकर — परंपरेला नवा साज",
    "page.ogDescription": "प्रत्येक सणासाठी. रोजच्या आनंदासाठी. य. म. देवनीकर, उदगीरमध्ये तुमची पुढची आवड शोधा.",
    "a11y.language": "वेबसाइटची भाषा"
};
  const messages = {
    en: {
      "look.explore": "Explore {name}",
      "look.quick": "Take a closer look",
      "look.save": "Save {name} to your visit list",
      "look.remove": "Remove {name} from your visit list",
      "look.store": "Discover in store",
      "look.inspiration": "Style inspiration · Explore in store",
      "looks.one": "{count} look to explore",
      "looks.other": "{count} looks to explore",
      "found.one": "{count} look found",
      "found.other": "{count} looks found",
      "saved.one": "{count} look saved",
      "saved.other": "{count} looks saved",
      "bag.one": "View your visit list, {count} saved look",
      "bag.other": "View your visit list, {count} saved looks",
      "search.matching": "Styles matching “{query}”",
      "search.explore": "Explore the edit",
      "search.empty": "No looks found. Try “saree”, “kurta” or “festive”.",
      "search.store": "Our full collection is waiting for you in store.",
      "empty.title": "No looks found, just yet.",
      "empty.description": "Try “saree”, “kurta”, or explore all styles.",
      "empty.browse": "Explore all styles",
      "quick.save": "Save to my visit list",
      "quick.saved": "Saved — remove from list",
      "toast.added": "Added to your visit list",
      "toast.removed": "Look removed from your list",
      "toast.session": "Saved for this session",
      "saved.emptyTitle": "A little space for your favourites.",
      "saved.emptyDescription": "Tap the heart on a look you love. Your style edit will be waiting here for your next store visit.",
      "saved.browse": "Explore the edit",
      "saved.note": "Saved in this browser. Actual stock and prices are confirmed in store.",
      "saved.sessionNote": "Saved for this session only. Actual stock and prices are confirmed in store.",
      "menu.open": "Open menu",
      "menu.close": "Close menu",
      "copy.label": "Copy your visit list",
      "copy.success": "Copied! Your visit list is ready.",
      "copy.downloaded": "Visit list downloaded instead",
      "share.label": "Share this style edit",
      "share.title": "My Y. M. Devnikar style edit",
      "share.pending": "Preparing your style edit…",
      "share.success": "Your style edit was shared.",
      "share.copied": "Share link copied. Send it to someone you’d love to shop with.",
      "share.downloaded": "Your share link is included in the downloaded visit list.",
      "shared.title": "A shared style edit",
      "shared.description.one": "{count} look was shared with you. Preview it here—nothing is saved automatically.",
      "shared.description.other": "{count} looks were shared with you. Preview them here—nothing is saved automatically.",
      "shared.save": "Save these looks",
      "shared.saved": "Saved to your list",
      "shared.added": "Shared looks added to your visit list",
      "list.title": "My Y. M. Devnikar visit list",
      "list.note": "These are style inspirations, not reserved products. Ask the team about current stock, sizes, fabrics and prices.",
      "list.address": "Y. M. Devnikar\nHanuman Rd, Jijau Nagar, Khadkali\nUdgir, Maharashtra 413517",
      "list.link": "View this style edit"
    },
    mr: {
      "look.explore": "{name} पाहा",
      "look.quick": "जवळून पाहा",
      "look.save": "{name} भेट-यादीत जतन करा",
      "look.remove": "{name} भेट-यादीतून काढा",
      "look.store": "दुकानात पाहा",
      "look.inspiration": "शैलीची प्रेरणा · दुकानात पाहा",
      "looks.one": "{count} शैली पाहा",
      "looks.other": "{count} शैली पाहा",
      "found.one": "{count} लुक सापडला",
      "found.other": "{count} लुक सापडले",
      "saved.one": "{count} लुक जतन केला",
      "saved.other": "{count} लुक जतन केले",
      "bag.one": "तुमची भेट-यादी पाहा, {count} लुक जतन केला आहे",
      "bag.other": "तुमची भेट-यादी पाहा, {count} लुक जतन केले आहेत",
      "search.matching": "“{query}” या शोधाशी जुळणाऱ्या शैली",
      "search.explore": "संग्रह पाहा",
      "search.empty": "लुक सापडले नाहीत. “साडी”, “कुर्ता” किंवा “सण” शोधा.",
      "search.store": "आमचा पूर्ण संग्रह दुकानात तुमची वाट पाहतोय.",
      "empty.title": "अजून जुळणारा लुक सापडला नाही.",
      "empty.description": "“साडी”, “कुर्ता” शोधा किंवा सर्व शैली पाहा.",
      "empty.browse": "सर्व शैली पाहा",
      "quick.save": "माझ्या भेट-यादीत जतन करा",
      "quick.saved": "जतन केले — यादीतून काढा",
      "toast.added": "तुमच्या भेट-यादीत जतन केले",
      "toast.removed": "लुक यादीतून काढला",
      "toast.session": "या सत्रापुरतं जतन केले",
      "saved.emptyTitle": "तुमच्या आवडत्या लुकसाठी जागा.",
      "saved.emptyDescription": "आवडलेल्या लुकवरच्या हृदयावर टॅप करा. पुढच्या खरेदीच्या भेटीसाठी तुमची यादी इथे तयार असेल.",
      "saved.browse": "संग्रह पाहा",
      "saved.note": "या ब्राउझरमध्ये जतन केले आहेत. सध्याचा माल व किंमती दुकानात तपासा.",
      "saved.sessionNote": "फक्त या सत्रापुरतं जतन केले आहे. सध्याचा माल व किंमती दुकानात तपासा.",
      "menu.open": "मेनू उघडा",
      "menu.close": "मेनू बंद करा",
      "copy.label": "तुमची भेट-यादी कॉपी करा",
      "copy.success": "कॉपी केलं! तुमची भेट-यादी तयार आहे.",
      "copy.downloaded": "त्याऐवजी भेट-यादी डाउनलोड केली",
      "share.label": "हे आवडते लुक शेअर करा",
      "share.title": "माझे य. म. देवनीकर आवडते लुक",
      "share.pending": "तुमची यादी तयार करत आहोत…",
      "share.success": "तुमचे आवडते लुक शेअर झाले.",
      "share.copied": "शेअर लिंक कॉपी केली. सोबत खरेदीला जायला आवडेल अशा व्यक्तीला पाठवा.",
      "share.downloaded": "शेअर लिंक डाउनलोड केलेल्या भेट-यादीत आहे.",
      "shared.title": "शेअर केलेले आवडते लुक",
      "shared.description.one": "तुमच्यासोबत {count} लुक शेअर झाला आहे. आधी पाहा—आपोआप काहीही जतन होणार नाही.",
      "shared.description.other": "तुमच्यासोबत {count} लुक शेअर झाले आहेत. आधी पाहा—आपोआप काहीही जतन होणार नाही.",
      "shared.save": "हे लुक जतन करा",
      "shared.saved": "तुमच्या यादीत जतन केले",
      "shared.added": "शेअर केलेले लुक तुमच्या यादीत जतन केले",
      "list.title": "माझी य. म. देवनीकर भेट-यादी",
      "list.note": "हे शैलीची प्रेरणा देणारे लुक आहेत, राखून ठेवलेले कपडे नाहीत. सध्याचा माल, मापे, कापड व किंमती दुकानात विचारा.",
      "list.address": "य. म. देवनीकर\nहनुमान रोड, जिजाऊ नगर, खडकाळी\nउदगीर, महाराष्ट्र 413517",
      "list.link": "हे आवडते लुक पाहा"
    }
  };

  const marathiLooks = {
    "sage-saree": {
      name: "सौम्य हिरवी साडी",
      category: "साडी संग्रह",
      colour: "सेज हिरवा",
      alt: "सोनेरी काठाची हिरवी साडी—शैलीची प्रातिनिधिक प्रेरणा",
      tags: ["साडीची प्रेरणा", "लग्नातील पाहुण्यांसाठी", "सदाबहार नजाकत"],
      keywords: "साडी साड्या महिला महिलांसाठी स्त्री लग्न सण उत्सव पारंपरिक हिरवा",
      description: "उत्सवाच्या साजाचा एक सौम्य अंदाज. शांत हिरवा रंग, सोनेरी काठ आणि सहजसुंदर घड्या—तुमच्या पुढच्या खास प्रसंगासाठी शैलीची छान प्रेरणा."
    },
    "ivory-kurta": {
      name: "उत्सवाचा कुर्ता",
      category: "पुरुषांचा संग्रह",
      colour: "बेज",
      alt: "भरतकामाचा बेज कुर्ता आणि आयव्हरी पायजमा—शैलीची प्रातिनिधिक प्रेरणा",
      tags: ["कुर्त्याची प्रेरणा", "सणासाठी खास", "नाजूक भरतकाम"],
      keywords: "कुर्ता कुर्ते पुरुष पुरुषांसाठी लग्न सण उत्सव पारंपरिक आयव्हरी बेज",
      description: "साध्या रंगात उठावदार अंदाज. कुर्त्याची ही प्रेरणा पारंपरिक साज आणि आधुनिक, सहजसुंदर शैलीला एकत्र आणते—सण, कौटुंबिक प्रसंग किंवा लग्नासाठी."
    },
    "wine-lehenga": {
      name: "सणांचा खास साज",
      category: "उत्सव संग्रह",
      colour: "वाइन",
      alt: "वाइन रंगाचा भरतकामाचा लेहेंगा—उत्सवाच्या शैलीची प्रातिनिधिक प्रेरणा",
      tags: ["लेहेंग्याची प्रेरणा", "लग्नाचे खास क्षण", "उठावदार रंग"],
      keywords: "लेहेंगा लेहंगा महिला महिलांसाठी लग्न सण उत्सव समारंभ मरून वाइन",
      description: "काही क्षणांना खास साज हवा असतो. गडद वाइन रंग आणि सोनेरी नक्षी या लुकची प्रेरणा आहेत. हा लुक सोबत आणा आणि दुकानात तुमचा स्वतःचा आवडता उत्सवी साज शोधा."
    },
    "olive-shirt": {
      name: "रोजची खास आवड",
      category: "दैनंदिन संग्रह",
      colour: "ऑलिव्ह हिरवा",
      alt: "सहजसुंदर ऑलिव्ह शर्ट आणि हलक्या रंगाची पॅन्ट—रोजच्या शैलीची प्रेरणा",
      tags: ["शर्टची प्रेरणा", "रोजची शैली", "सौम्य रंग"],
      keywords: "शर्ट पुरुष पुरुषांसाठी रोज रोजचे दैनंदिन कॅज्युअल हिरवा ऑलिव्ह",
      description: "ड्रेस कोड नसलेल्या दिवसांसाठी. मातीच्या जवळचा ऑलिव्ह रंग आणि सहजसुंदर आकार रोजच्या पोशाखाला ताजेपणा देतात. दुकानात कॅज्युअल शैली पाहा आणि तुम्हाला भावणारी निवडा."
    }
  };

  // Snapshot English once; applying a locale never takes HTML from a URL or user input.
  const bindings = [];
  const bindingModes = ["text", "html", "aria-label", "placeholder", "alt", "content"];
  for (const mode of bindingModes) {
    const attribute = mode === "text" ? "data-i18n" : `data-i18n-${mode}`;
    document.querySelectorAll(`[${attribute}]`).forEach((element) => {
      const original = mode === "text" ? element.textContent : mode === "html" ? element.innerHTML : element.getAttribute(mode);
      bindings.push({ element, mode, key: element.getAttribute(attribute), original });
    });
  }

  function initialLocale() {
    const explicit = new URLSearchParams(location.search).get("lang");
    if (explicit === "en" || explicit === "mr") return explicit;
    try { return localStorage.getItem(preferenceKey) === "mr" ? "mr" : "en"; }
    catch { return "en"; }
  }

  function applyStatic(locale) {
    const language = locale === "mr" ? "mr" : "en";
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    for (const { element, mode, key, original } of bindings) {
      const value = language === "mr" && Object.hasOwn(marathiStatic, key) ? marathiStatic[key] : original;
      if (mode === "text") element.textContent = value;
      else if (mode === "html") element.innerHTML = value;
      else element.setAttribute(mode, value);
    }
    document.querySelectorAll(".language-switch").forEach((group) => { group.hidden = false; });
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function t(key, locale, values = {}) {
    const template = messages[locale]?.[key] ?? messages.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  }

  function formatNumber(number, locale, minimumDigits = 1) {
    return new Intl.NumberFormat(locale === "mr" ? "mr-IN" : "en-IN", {
      numberingSystem: locale === "mr" ? "deva" : "latn",
      useGrouping: false,
      minimumIntegerDigits: minimumDigits
    }).format(number);
  }

  function persistLocale(locale) {
    try { localStorage.setItem(preferenceKey, locale); } catch { /* The current-page choice still works. */ }
  }

  window.DevnikarI18n = Object.freeze({
    preferenceKey,
    initialLocale,
    applyStatic,
    t,
    formatNumber,
    persistLocale,
    localizeLook: (look, locale) => locale === "mr" ? { ...look, ...marathiLooks[look.id] } : look
  });
})();
