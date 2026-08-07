import os
import re

locales = {
    "en": {"screeningTitle": "Health Screening", "screeningDesc": "Select a screening to begin.", "reportTitle": "Understand My Report", "reportDesc": "Upload a medical report and we'll help explain its contents in simple language.", "medicineTitle": "Understand Medicine", "medicineDesc": "Take a photo of your prescription to understand your medications.", "passportTitle": "My Health Passport", "passportDesc": "Your consolidated medical history."},
    "hi": {"screeningTitle": "स्वास्थ्य जांच", "screeningDesc": "शुरू करने के लिए एक जांच चुनें।", "reportTitle": "मेरी रिपोर्ट समझें", "reportDesc": "मेडिकल रिपोर्ट अपलोड करें और हम इसे सरल भाषा में समझाएंगे।", "medicineTitle": "दवा समझें", "medicineDesc": "अपनी दवाओं को समझने के लिए अपने प्रिस्क्रिप्शन की फोटो लें।", "passportTitle": "मेरा स्वास्थ्य पासपोर्ट", "passportDesc": "आपका समेकित चिकित्सा इतिहास।"},
    "pa": {"screeningTitle": "ਸਿਹਤ ਜਾਂਚ", "screeningDesc": "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਇੱਕ ਜਾਂਚ ਚੁਣੋ।", "reportTitle": "ਮੇਰੀ ਰਿਪੋਰਟ ਸਮਝੋ", "reportDesc": "ਮੈਡੀਕਲ ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਅਸੀਂ ਇਸਨੂੰ ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ ਸਮਝਾਵਾਂਗੇ।", "medicineTitle": "ਦਵਾਈ ਸਮਝੋ", "medicineDesc": "ਆਪਣੀਆਂ ਦਵਾਈਆਂ ਨੂੰ ਸਮਝਣ ਲਈ ਆਪਣੇ ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਦੀ ਫੋਟੋ ਲਓ।", "passportTitle": "ਮੇਰਾ ਸਿਹਤ ਪਾਸਪੋਰਟ", "passportDesc": "ਤੁਹਾਡਾ ਏਕੀਕ੍ਰਿਤ ਮੈਡੀਕਲ ਇਤਿਹਾਸ।"},
    "bn": {"screeningTitle": "স্বাস্থ্য পরীক্ষা", "screeningDesc": "শুরু করতে একটি পরীক্ষা নির্বাচন করুন।", "reportTitle": "আমার রিপোর্ট বুঝুন", "reportDesc": "একটি মেডিকেল রিপোর্ট আপলোড করুন এবং আমরা এটি সহজ ভাষায় ব্যাখ্যা করব।", "medicineTitle": "ওষুধ বুঝুন", "medicineDesc": "আপনার ওষুধগুলি বুঝতে আপনার প্রেসক্রিপশনের একটি ছবি তুলুন।", "passportTitle": "আমার স্বাস্থ্য পাসপোর্ট", "passportDesc": "আপনার একত্রিত চিকিৎসা ইতিহাস।"},
    "te": {"screeningTitle": "ఆరోగ్య పరీక్ష", "screeningDesc": "ప్రారంభించడానికి ఒక పరీక్షను ఎంచుకోండి.", "reportTitle": "నా రిపోర్టును అర్థం చేసుకోండి", "reportDesc": "మెడికల్ రిపోర్టును అప్‌లోడ్ చేయండి మరియు మేము దానిని సరళమైన భాషలో వివరిస్తాము.", "medicineTitle": "మందును అర్థం చేసుకోండి", "medicineDesc": "మీ మందులను అర్థం చేసుకోవడానికి మీ ప్రిస్క్రిప్షన్ ఫోటో తీయండి.", "passportTitle": "నా ఆరోగ్య పాస్‌పోర్ట్", "passportDesc": "మీ ఏకీకృత వైద్య చరిత్ర."},
    "mr": {"screeningTitle": "आरोग्य तपासणी", "screeningDesc": "सुरू करण्यासाठी एक तपासणी निवडा.", "reportTitle": "माझा रिपोर्ट समजून घ्या", "reportDesc": "मेडिकल रिपोर्ट अपलोड करा आणि आम्ही तो सोप्या भाषेत समजावून सांगू.", "medicineTitle": "औषध समजून घ्या", "medicineDesc": "तुमची औषधे समजून घेण्यासाठी तुमच्या प्रिस्क्रिप्शनचा फोटो काढा.", "passportTitle": "माझा आरोग्य पासपोर्ट", "passportDesc": "तुमचा एकत्रित वैद्यकीय इतिहास."},
    "ta": {"screeningTitle": "சுகாதார பரிசோதனை", "screeningDesc": "தொடங்க ஒரு பரிசோதனையைத் தேர்ந்தெடுக்கவும்.", "reportTitle": "என் அறிக்கையை புரிந்து கொள்ளுங்கள்", "reportDesc": "மருத்துவ அறிக்கையை பதிவேற்றவும், அதை எளிமையான மொழியில் விளக்குவோம்.", "medicineTitle": "மருந்தை புரிந்து கொள்ளுங்கள்", "medicineDesc": "உங்கள் மருந்துகளை புரிந்து கொள்ள உங்கள் மருந்து சீட்டை புகைப்படம் எடுக்கவும்.", "passportTitle": "என் சுகாதார பாஸ்போர்ட்", "passportDesc": "உங்கள் ஒருங்கிணைந்த மருத்துவ வரலாறு."},
    "ur": {"screeningTitle": "صحت کی جانچ", "screeningDesc": "شروع کرنے کے لیے ایک جانچ منتخب کریں۔", "reportTitle": "میری رپورٹ سمجھیں", "reportDesc": "میڈیکل رپورٹ اپ لوڈ کریں اور ہم اسے آسان زبان میں سمجھائیں گے۔", "medicineTitle": "دوا سمجھیں", "medicineDesc": "اپنی ادویات کو سمجھنے کے لیے اپنے نسخے کی تصویر لیں۔", "passportTitle": "میرا صحت کا پاسپورٹ", "passportDesc": "آپ کی مجموعی طبی تاریخ۔"},
    "gu": {"screeningTitle": "આરોગ્ય તપાસ", "screeningDesc": "શરૂ કરવા માટે એક તપાસ પસંદ કરો.", "reportTitle": "મારો રિપોર્ટ સમજો", "reportDesc": "મેડિકલ રિપોર્ટ અપલોડ કરો અને અમે તેને સરળ ભાષામાં સમજાવીશું.", "medicineTitle": "દવા સમજો", "medicineDesc": "તમારી દવાઓ સમજવા માટે તમારા પ્રિસ્ક્રિપ્શનનો ફોટો લો.", "passportTitle": "મારો આરોગ્ય પાસપોર્ટ", "passportDesc": "તમારો એકીકૃત તબીબી ઇતિહાસ."},
    "kn": {"screeningTitle": "ಆರೋಗ್ಯ ತಪಾಸಣೆ", "screeningDesc": "ಪ್ರಾರಂಭಿಸಲು ಒಂದು ತಪಾಸಣೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.", "reportTitle": "ನನ್ನ ವರದಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ", "reportDesc": "ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನಾವು ಅದನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸುತ್ತೇವೆ.", "medicineTitle": "ಔಷಧಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ", "medicineDesc": "ನಿಮ್ಮ ಔಷಧಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.", "passportTitle": "ನನ್ನ ಆರೋಗ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್", "passportDesc": "ನಿಮ್ಮ ಏಕೀಕೃತ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ."},
    "ml": {"screeningTitle": "ആരോഗ്യ പരിശോധന", "screeningDesc": "ആരംഭിക്കാൻ ഒരു പരിശോധന തിരഞ്ഞെടുക്കുക.", "reportTitle": "എന്റെ റിപ്പോർട്ട് മനസ്സിലാക്കുക", "reportDesc": "ഒരു മെഡിക്കൽ റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക, ഞങ്ങൾ അത് ലളിതമായ ഭാഷയിൽ വിശദീകരിക്കും.", "medicineTitle": "മരുന്ന് മനസ്സിലാക്കുക", "medicineDesc": "നിങ്ങളുടെ മരുന്നുകൾ മനസ്സിലാക്കാൻ നിങ്ങളുടെ കുറിപ്പടിയുടെ ഫോട്ടോ എടുക്കുക.", "passportTitle": "എന്റെ ആരോഗ്യ പാസ്‌പോർട്ട്", "passportDesc": "നിങ്ങളുടെ സംയോജിത മെഡിക്കൽ ചരിത്രം."},
    "or": {"screeningTitle": "ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା", "screeningDesc": "ଆରମ୍ଭ କରିବାକୁ ଏକ ପରୀକ୍ଷା ବାଛନ୍ତୁ।", "reportTitle": "ମୋର ରିପୋର୍ଟ ବୁଝନ୍ତୁ", "reportDesc": "ଏକ ମେଡିକାଲ୍ ରିପୋର୍ଟ ଅପଲୋଡ୍ କରନ୍ତୁ ଏବଂ ଆମେ ଏହାକୁ ସରଳ ଭାଷାରେ ବୁଝାଇବୁ।", "medicineTitle": "ଔଷଧ ବୁଝନ୍ତୁ", "medicineDesc": "ଆପଣଙ୍କର ଔଷଧ ବୁଝିବାକୁ ଆପଣଙ୍କର ପ୍ରେସକ୍ରିପସନର ଫଟୋ ନିଅନ୍ତୁ।", "passportTitle": "ମୋର ସ୍ୱାସ୍ଥ୍ୟ ପାସପୋର୍ଟ", "passportDesc": "ଆପଣଙ୍କର ସମନ୍ୱିତ ଚିକିତ୍ସା ଇତିହାସ।"}
}

directory = "/Users/gurleenkaurbedi/Desktop/Cardiofy/frontend/src/locales"

for lang, trans in locales.items():
    filepath = os.path.join(directory, f"{lang}.ts")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        if "features:" not in content:
            features_str = f"""  features: {{
    screeningTitle: "{trans['screeningTitle']}",
    screeningDesc: "{trans['screeningDesc']}",
    reportTitle: "{trans['reportTitle']}",
    reportDesc: "{trans['reportDesc']}",
    medicineTitle: "{trans['medicineTitle']}",
    medicineDesc: "{trans['medicineDesc']}",
    passportTitle: "{trans['passportTitle']}",
    passportDesc: "{trans['passportDesc']}",
  }},
"""
            # Insert after home block
            content = re.sub(r'(home: \{[^}]+\},)', r'\1\n' + features_str, content)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
        print(f"Updated {lang}.ts")
    else:
        print(f"File {lang}.ts not found")
