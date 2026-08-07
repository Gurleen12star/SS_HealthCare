import os
import re

deep_locales = {
    "en": {
        "takePhoto": "Take a Photo", "uploadPdfImage": "Upload PDF / Image", "uploadPrescription": "Upload Prescription", "startHealthCheck": "START A HEALTH CHECK", "whatToCheck": "What would you like to check?", "verifyMedicine": "Always verify medicine names and instructions with the original prescription or a healthcare professional.",
        "anaemia": "Anaemia", "anaemiaDesc": "Eye + fingernail check",
        "jaundice": "Jaundice", "jaundiceDesc": "Eye check",
        "heartRate": "Heart Rate", "heartRateDesc": "Measure with phone",
        "skin": "Skin Concern", "skinDesc": "Take a clear photo",
        "oral": "Oral Health", "oralDesc": "Mouth/teeth photo",
        "covid": "Respiratory Symptoms", "covidDesc": "Answer simple questions",
    },
    "hi": {
        "takePhoto": "फोटो लें", "uploadPdfImage": "PDF / इमेज अपलोड करें", "uploadPrescription": "प्रिस्क्रिप्शन अपलोड करें", "startHealthCheck": "स्वास्थ्य जांच शुरू करें", "whatToCheck": "आप क्या जाँचना चाहेंगे?", "verifyMedicine": "हमेशा मूल प्रिस्क्रिप्शन या स्वास्थ्य देखभाल पेशेवर के साथ दवा के नाम और निर्देशों की पुष्टि करें।",
        "anaemia": "एनीमिया", "anaemiaDesc": "आंख और नाखून की जांच",
        "jaundice": "पीलिया", "jaundiceDesc": "आंख की जांच",
        "heartRate": "हृदय गति", "heartRateDesc": "फोन से मापें",
        "skin": "त्वचा की समस्या", "skinDesc": "साफ फोटो लें",
        "oral": "मौखिक स्वास्थ्य", "oralDesc": "मुंह/दांतों की फोटो",
        "covid": "श्वसन लक्षण", "covidDesc": "सरल प्रश्नों के उत्तर दें",
    },
    "pa": {
        "takePhoto": "ਫੋਟੋ ਲਓ", "uploadPdfImage": "PDF / ਇਮੇਜ ਅਪਲੋਡ ਕਰੋ", "uploadPrescription": "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਅਪਲੋਡ ਕਰੋ", "startHealthCheck": "ਸਿਹਤ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ", "whatToCheck": "ਤੁਸੀਂ ਕੀ ਚੈੱਕ ਕਰਨਾ ਚਾਹੋਗੇ?", "verifyMedicine": "ਹਮੇਸ਼ਾਂ ਅਸਲ ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਜਾਂ ਸਿਹਤ ਸੰਭਾਲ ਪੇਸ਼ੇਵਰ ਨਾਲ ਦਵਾਈ ਦੇ ਨਾਮ ਅਤੇ ਨਿਰਦੇਸ਼ਾਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
        "anaemia": "ਅਨੀਮੀਆ", "anaemiaDesc": "ਅੱਖ ਅਤੇ ਨਹੁੰ ਦੀ ਜਾਂਚ",
        "jaundice": "ਪੀਲੀਆ", "jaundiceDesc": "ਅੱਖ ਦੀ ਜਾਂਚ",
        "heartRate": "ਦਿਲ ਦੀ ਧੜਕਣ", "heartRateDesc": "ਫੋਨ ਨਾਲ ਮਾਪੋ",
        "skin": "ਚਮੜੀ ਦੀ ਸਮੱਸਿਆ", "skinDesc": "ਸਾਫ ਫੋਟੋ ਲਓ",
        "oral": "ਮੌਖਿਕ ਸਿਹਤ", "oralDesc": "ਮੂੰਹ/ਦੰਦਾਂ ਦੀ ਫੋਟੋ",
        "covid": "ਸਾਹ ਦੇ ਲੱਛਣ", "covidDesc": "ਸਧਾਰਨ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ",
    },
    "bn": {
        "takePhoto": "ছবি তুলুন", "uploadPdfImage": "PDF / ছবি আপলোড করুন", "uploadPrescription": "প্রেসক্রিপশন আপলোড করুন", "startHealthCheck": "স্বাস্থ্য পরীক্ষা শুরু করুন", "whatToCheck": "আপনি কী পরীক্ষা করতে চান?", "verifyMedicine": "সর্বদা মূল প্রেসক্রিপশন বা স্বাস্থ্যসেবা পেশাদারের সাথে ওষুধের নাম এবং নির্দেশাবলী যাচাই করুন।",
        "anaemia": "রক্তাল্পতা", "anaemiaDesc": "চোখ এবং নখ পরীক্ষা",
        "jaundice": "জন্ডিস", "jaundiceDesc": "চোখ পরীক্ষা",
        "heartRate": "হৃদস্পন্দন", "heartRateDesc": "ফোন দিয়ে মাপুন",
        "skin": "ত্বকের সমস্যা", "skinDesc": "পরিষ্কার ছবি তুলুন",
        "oral": "মুখের স্বাস্থ্য", "oralDesc": "মুখ/দাঁতের ছবি",
        "covid": "শ্বাসকষ্টের লক্ষণ", "covidDesc": "সহজ প্রশ্নের উত্তর দিন",
    },
    "te": {
        "takePhoto": "ఫోటో తీయండి", "uploadPdfImage": "PDF / ఇమేజ్ అప్‌లోడ్ చేయండి", "uploadPrescription": "ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి", "startHealthCheck": "ఆరోగ్య పరీక్ష ప్రారంభించండి", "whatToCheck": "మీరు ఏమి తనిఖీ చేయాలనుకుంటున్నారు?", "verifyMedicine": "ఎల్లప్పుడూ అసలు ప్రిస్క్రిప్షన్ లేదా ఆరోగ్య నిపుణులతో మందుల పేర్లు మరియు సూచనలను ధృవీకరించండి.",
        "anaemia": "రక్తహీనత", "anaemiaDesc": "కన్ను మరియు గోరు తనిఖీ",
        "jaundice": "కామెర్లు", "jaundiceDesc": "కన్ను తనిఖీ",
        "heartRate": "గుండె కొట్టుకునే వేగం", "heartRateDesc": "ఫోన్‌తో కొలవండి",
        "skin": "చర్మ సమస్య", "skinDesc": "స్పష్టమైన ఫోటో తీయండి",
        "oral": "నోటి ఆరోగ్యం", "oralDesc": "నోరు/దంతాల ఫోటో",
        "covid": "శ్వాసకోశ లక్షణాలు", "covidDesc": "సాధారణ ప్రశ్నలకు సమాధానం ఇవ్వండి",
    },
    "mr": {
        "takePhoto": "फोटो काढा", "uploadPdfImage": "PDF / इमेज अपलोड करा", "uploadPrescription": "प्रिस्क्रिप्शन अपलोड करा", "startHealthCheck": "आरोग्य तपासणी सुरू करा", "whatToCheck": "तुम्हाला काय तपासायचे आहे?", "verifyMedicine": "नेहमी मूळ प्रिस्क्रिप्शन किंवा आरोग्यसेवा व्यावसायिकांसोबत औषधांची नावे आणि सूचना सत्यापित करा.",
        "anaemia": "अशक्तपणा", "anaemiaDesc": "डोळे आणि नखांची तपासणी",
        "jaundice": "कावीळ", "jaundiceDesc": "डोळ्यांची तपासणी",
        "heartRate": "हृदयाचे ठोके", "heartRateDesc": "फोनने मोजा",
        "skin": "त्वचेची समस्या", "skinDesc": "स्पष्ट फोटो काढा",
        "oral": "तोंडाचे आरोग्य", "oralDesc": "तोंड/दात फोटो",
        "covid": "श्वसनाची लक्षणे", "covidDesc": "सोप्या प्रश्नांची उत्तरे द्या",
    },
    "ta": {
        "takePhoto": "புகைப்படம் எடுக்கவும்", "uploadPdfImage": "PDF / படம் பதிவேற்றவும்", "uploadPrescription": "மருந்து சீட்டை பதிவேற்றவும்", "startHealthCheck": "சுகாதார பரிசோதனையைத் தொடங்கவும்", "whatToCheck": "நீங்கள் எதைச் சரிபார்க்க விரும்புகிறீர்கள்?", "verifyMedicine": "எப்போதும் அசல் மருந்து சீட்டு அல்லது சுகாதார நிபுணருடன் மருந்து பெயர்கள் மற்றும் வழிமுறைகளை சரிபார்க்கவும்.",
        "anaemia": "இரத்த சோகை", "anaemiaDesc": "கண் மற்றும் நகம் சரிபார்ப்பு",
        "jaundice": "மஞ்சள் காமாலை", "jaundiceDesc": "கண் சரிபார்ப்பு",
        "heartRate": "இதய துடிப்பு", "heartRateDesc": "போன் மூலம் அளவிடவும்",
        "skin": "தோல் பிரச்சனை", "skinDesc": "தெளிவான புகைப்படம் எடுக்கவும்",
        "oral": "வாய்வழி ஆரோக்கியம்", "oralDesc": "வாய்/பற்கள் புகைப்படம்",
        "covid": "சுவாச அறிகுறிகள்", "covidDesc": "எளிய கேள்விகளுக்கு பதிலளிக்கவும்",
    },
    "ur": {
        "takePhoto": "تصویر لیں", "uploadPdfImage": "پی ڈی ایف / تصویر اپ لوڈ کریں", "uploadPrescription": "نسخہ اپ لوڈ کریں", "startHealthCheck": "صحت کی جانچ شروع کریں", "whatToCheck": "آپ کیا چیک کرنا چاہیں گے؟", "verifyMedicine": "ہمیشہ اصل نسخے یا ہیلتھ کیئر پروفیشنل کے ساتھ ادویات کے نام اور ہدایات کی تصدیق کریں۔",
        "anaemia": "خون کی کمی", "anaemiaDesc": "آنکھ اور ناخن کی جانچ",
        "jaundice": "یرقان", "jaundiceDesc": "آنکھ کی جانچ",
        "heartRate": "دل کی دھڑکن", "heartRateDesc": "فون سے ناپیں",
        "skin": "جلد کا مسئلہ", "skinDesc": "صاف تصویر لیں",
        "oral": "منہ کی صحت", "oralDesc": "منہ/دانتوں کی تصویر",
        "covid": "سانس کی علامات", "covidDesc": "آسان سوالات کے جواب دیں",
    },
    "gu": {
        "takePhoto": "ફોટો લો", "uploadPdfImage": "PDF / ઇમેજ અપલોડ કરો", "uploadPrescription": "પ્રિસ્ક્રિપ્શન અપલોડ કરો", "startHealthCheck": "આરોગ્ય તપાસ શરૂ કરો", "whatToCheck": "તમે શું તપાસવા માંગો છો?", "verifyMedicine": "હંમેશા મૂળ પ્રિસ્ક્રિપ્શન અથવા હેલ્થકેર પ્રોફેશનલ સાથે દવાની નામ અને સૂચનાઓ ચકાસો.",
        "anaemia": "એનિમિયા", "anaemiaDesc": "આંખ અને નખની તપાસ",
        "jaundice": "કમળો", "jaundiceDesc": "આંખની તપાસ",
        "heartRate": "હૃદયના ધબકારા", "heartRateDesc": "ફોનથી માપો",
        "skin": "ત્વચાની સમસ્યા", "skinDesc": "સ્પષ્ટ ફોટો લો",
        "oral": "મૌખિક આરોગ્ય", "oralDesc": "મોં/દાંતનો ફોટો",
        "covid": "શ્વસન લક્ષણો", "covidDesc": "સરળ પ્રશ્નોના જવાબ આપો",
    },
    "kn": {
        "takePhoto": "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ", "uploadPdfImage": "PDF / ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", "uploadPrescription": "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", "startHealthCheck": "ಆರೋಗ್ಯ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ", "whatToCheck": "ನೀವು ಏನನ್ನು ಪರೀಕ್ಷಿಸಲು ಬಯಸುತ್ತೀರಿ?", "verifyMedicine": "ಮೂಲ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಯಾವಾಗಲೂ ಔಷಧಿಗಳ ಹೆಸರುಗಳು ಮತ್ತು ಸೂಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "anaemia": "ರಕ್ತಹೀನತೆ", "anaemiaDesc": "ಕಣ್ಣು ಮತ್ತು ಉಗುರು ತಪಾಸಣೆ",
        "jaundice": "ಕಾಮಾಲೆ", "jaundiceDesc": "ಕಣ್ಣಿನ ತಪಾಸಣೆ",
        "heartRate": "ಹೃದಯ ಬಡಿತ", "heartRateDesc": "ಫೋನ್ ಮೂಲಕ ಅಳೆಯಿರಿ",
        "skin": "ಚರ್ಮದ ಸಮಸ್ಯೆ", "skinDesc": "ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ",
        "oral": "ಬಾಯಿಯ ಆರೋಗ್ಯ", "oralDesc": "ಬಾಯಿ/ಹಲ್ಲುಗಳ ಫೋಟೋ",
        "covid": "ಉಸಿರಾಟದ ಲಕ್ಷಣಗಳು", "covidDesc": "ಸರಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ",
    },
    "ml": {
        "takePhoto": "ഫോട്ടോ എടുക്കുക", "uploadPdfImage": "PDF / ഇമേജ് അപ്‌ലോഡ് ചെയ്യുക", "uploadPrescription": "കുറിപ്പടി അപ്‌ലോഡ് ചെയ്യുക", "startHealthCheck": "ആരോഗ്യ പരിശോധന ആരംഭിക്കുക", "whatToCheck": "നിങ്ങൾ എന്താണ് പരിശോധിക്കാൻ ആഗ്രഹിക്കുന്നത്?", "verifyMedicine": "എല്ലായ്പ്പോഴും യഥാർത്ഥ കുറിപ്പടി അല്ലെങ്കിൽ ഹെൽത്ത് കെയർ പ്രൊഫഷണലുമായി മരുന്നുകളുടെ പേരുകളും നിർദ്ദേശങ്ങളും പരിശോധിക്കുക.",
        "anaemia": "വിളർച്ച", "anaemiaDesc": "കണ്ണും നഖവും പരിശോധിക്കുക",
        "jaundice": "മഞ്ഞപ്പിത്തം", "jaundiceDesc": "കണ്ണ് പരിശോധിക്കുക",
        "heartRate": "ഹൃദയമിടിപ്പ്", "heartRateDesc": "ഫോൺ ഉപയോഗിച്ച് അളക്കുക",
        "skin": "ചർമ്മ പ്രശ്നം", "skinDesc": "വ്യക്തമായ ഫോട്ടോ എടുക്കുക",
        "oral": "വായയുടെ ആരോഗ്യം", "oralDesc": "വായ/പല്ല് ഫോട്ടോ",
        "covid": "ശ്വസന ലക്ഷണങ്ങൾ", "covidDesc": "ലളിതമായ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക",
    },
    "or": {
        "takePhoto": "ଫଟୋ ନିଅନ୍ତୁ", "uploadPdfImage": "PDF / ଇମେଜ୍ ଅପଲୋଡ୍ କରନ୍ତୁ", "uploadPrescription": "ପ୍ରେସକ୍ରିପସନ୍ ଅପଲୋଡ୍ କରନ୍ତୁ", "startHealthCheck": "ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ", "whatToCheck": "ଆପଣ କ'ଣ ଯାଞ୍ଚ କରିବାକୁ ଚାହୁଁଛନ୍ତି?", "verifyMedicine": "ସର୍ବଦା ମୂଳ ପ୍ରେସକ୍ରିପସନ୍ କିମ୍ବା ସ୍ୱାସ୍ଥ୍ୟସେବା ବିଶେଷଜ୍ଞଙ୍କ ସହିତ ଔଷଧର ନାମ ଏବଂ ନିର୍ଦ୍ଦେଶାବଳୀ ଯାଞ୍ଚ କରନ୍ତୁ।",
        "anaemia": "ରକ୍ତହୀନତା", "anaemiaDesc": "ଆଖି ଏବଂ ନଖ ଯାଞ୍ଚ",
        "jaundice": "କାମଳ ରୋଗ", "jaundiceDesc": "ଆଖି ଯାଞ୍ଚ",
        "heartRate": "ହୃଦସ୍ପନ୍ଦନ ହାର", "heartRateDesc": "ଫୋନ୍ ସହିତ ମାପନ୍ତୁ",
        "skin": "ଚର୍ମ ସମସ୍ୟା", "skinDesc": "ସ୍ପଷ୍ଟ ଫଟୋ ନିଅନ୍ତୁ",
        "oral": "ମୌଖିକ ସ୍ୱାସ୍ଥ୍ୟ", "oralDesc": "ପାଟି/ଦାନ୍ତ ଫଟୋ",
        "covid": "ଶ୍ୱାସକ୍ରିୟା ଲକ୍ଷଣ", "covidDesc": "ସରଳ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ",
    }
}

directory = "/Users/gurleenkaurbedi/Desktop/Cardiofy/frontend/src/locales"

for lang, trans in deep_locales.items():
    filepath = os.path.join(directory, f"{lang}.ts")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        if "actions:" not in content:
            new_blocks = f"""  actions: {{
    takePhoto: "{trans['takePhoto']}",
    uploadPdfImage: "{trans['uploadPdfImage']}",
    uploadPrescription: "{trans['uploadPrescription']}",
    startHealthCheck: "{trans['startHealthCheck']}",
    whatToCheck: "{trans['whatToCheck']}",
    verifyMedicine: "{trans['verifyMedicine']}",
  }},
  screenings: {{
    anaemia: "{trans['anaemia']}",
    anaemiaDesc: "{trans['anaemiaDesc']}",
    jaundice: "{trans['jaundice']}",
    jaundiceDesc: "{trans['jaundiceDesc']}",
    heartRate: "{trans['heartRate']}",
    heartRateDesc: "{trans['heartRateDesc']}",
    skin: "{trans['skin']}",
    skinDesc: "{trans['skinDesc']}",
    oral: "{trans['oral']}",
    oralDesc: "{trans['oralDesc']}",
    covid: "{trans['covid']}",
    covidDesc: "{trans['covidDesc']}",
  }},
"""
            # Insert after features block
            content = re.sub(r'(features: \{[^}]+\},)', r'\1\n' + new_blocks, content)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
        print(f"Updated {lang}.ts")
    else:
        print(f"File {lang}.ts not found")
