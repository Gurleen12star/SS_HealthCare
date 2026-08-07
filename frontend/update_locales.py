import os
import re

locales = {
    "en": {"welcome": "Welcome to SwasthyaScan SS", "featuresTitle": "Our Features", "getStarted": "Get Started", "login": "Login / Sign Up"},
    "hi": {"welcome": "SwasthyaScan SS में आपका स्वागत है", "featuresTitle": "हमारी विशेषताएँ", "getStarted": "शुरू करें", "login": "लॉगिन / साइन अप"},
    "pa": {"welcome": "SwasthyaScan SS ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ", "featuresTitle": "ਸਾਡੀਆਂ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ", "getStarted": "ਸ਼ੁਰੂ ਕਰੋ", "login": "ਲਾਗਇਨ / ਸਾਈਨ ਅੱਪ"},
    "bn": {"welcome": "SwasthyaScan SS-এ স্বাগতম", "featuresTitle": "আমাদের বৈশিষ্ট্য", "getStarted": "শুরু করুন", "login": "লগইন / সাইন আপ"},
    "te": {"welcome": "SwasthyaScan SS కు స్వాగతం", "featuresTitle": "మా లక్షణాలు", "getStarted": "ప్రారంభించండి", "login": "లాగిన్ / సైన్ అప్"},
    "mr": {"welcome": "SwasthyaScan SS मध्ये आपले स्वागत आहे", "featuresTitle": "आमची वैशिष्ट्ये", "getStarted": "सुरुवात करा", "login": "लॉगिन / साइन अप"},
    "ta": {"welcome": "SwasthyaScan SS க்கு வரவேற்கிறோம்", "featuresTitle": "எங்கள் அம்சங்கள்", "getStarted": "தொடங்குங்கள்", "login": "உள்நுழைய / பதிவு செய்ய"},
    "ur": {"welcome": "SwasthyaScan SS میں خوش آمدید", "featuresTitle": "ہماری خصوصیات", "getStarted": "شروع کریں", "login": "لاگ ان / سائن اپ"},
    "gu": {"welcome": "SwasthyaScan SS માં તમારું સ્વાગત છે", "featuresTitle": "અમારી વિશેષતાઓ", "getStarted": "શરૂ કરો", "login": "લૉગિન / સાઇન અપ"},
    "kn": {"welcome": "SwasthyaScan SS ಗೆ ಸುಸ್ವಾಗತ", "featuresTitle": "ನಮ್ಮ ವೈಶಿಷ್ಟ್ಯಗಳು", "getStarted": "ಪ್ರಾರಂಭಿಸಿ", "login": "ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್"},
    "ml": {"welcome": "SwasthyaScan SS-ലേക്ക് സ്വാഗതം", "featuresTitle": "ഞങ്ങളുടെ സവിശേഷതകൾ", "getStarted": "തുടങ്ങുക", "login": "ലോഗിൻ / സൈൻ അപ്പ്"},
    "or": {"welcome": "SwasthyaScan SS କୁ ସ୍ୱାଗତ", "featuresTitle": "ଆମର ବୈଶିଷ୍ଟ୍ୟଗୁଡିକ", "getStarted": "ଆରମ୍ଭ କରନ୍ତୁ", "login": "ଲଗଇନ୍ / ସାଇନ୍ ଅପ୍"}
}

directory = "/Users/gurleenkaurbedi/Desktop/Cardiofy/frontend/src/locales"

for lang, trans in locales.items():
    filepath = os.path.join(directory, f"{lang}.ts")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if landing is already in the file to avoid duplicates
        if "landing:" not in content:
            landing_str = f"""  landing: {{
    welcome: "{trans['welcome']}",
    featuresTitle: "{trans['featuresTitle']}",
    getStarted: "{trans['getStarted']}",
    login: "{trans['login']}",
  }},
"""
            # Insert after common block
            content = re.sub(r'(common: \{[^}]+\},)', r'\1\n' + landing_str, content)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
        print(f"Updated {lang}.ts")
    else:
        print(f"File {lang}.ts not found")
