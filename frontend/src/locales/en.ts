const en = {
  common: {
    listen: "Listen",
    continue: "Continue",
    back: "Back",
    home: "Home",
    profile: "Profile",
  },
  landing: {
    welcome: "Welcome to SS Health",
    subtitle: "AI-Powered Healthcare Access",
    featuresTitle: "Our Features",
    getStarted: "Get Started",
    login: "Login / Sign Up",
    slogan: "Bringing Healthcare to Every Home",
  },
  howItWorks: {
    title: "How It Works",
    step1Title: "1. Choose Screening",
    step1Desc: "Select the health issue you want to check (Anemia, Jaundice, etc).",
    step2Title: "2. Let AI Analyze",
    step2Desc: "Use your phone's camera to capture required images securely.",
    step3Title: "3. Get Instant Results",
    step3Desc: "Receive instant, offline-first analysis in your native language.",
  },


  home: {
    greeting: "Namaste",
    question: "How can we help today?",

    screening: "Health Screening",
    screeningDescription:
      "Check selected health concerns",

    report: "Report Guru",
    reportDescription:
      "Upload and understand a medical report",

    medicine: "Understand Medicine",
    medicineDescription:
      "Upload and understand a prescription",

    passport: "My Health",
    passportDescription:
      "See your health history",
  },
  features: {
    screeningTitle: "Health Screening",
    screeningDesc: "Select a screening to begin.",
    reportTitle: "Report Guru",
    reportDesc: "Upload a medical report and we'll help explain its contents in simple language.",
    medicineTitle: "Understand Medicine",
    medicineDesc: "Take a photo of your prescription to understand your medications.",
    passportTitle: "My Health Passport",
    passportDesc: "Your consolidated medical history.",
    anemiaDesc: "This screening uses a photograph of your lower inner eyelid (conjunctiva).",
    anemiaInstruction: "This screening uses a photograph of your lower inner eyelid. Gently pull down your lower eyelid and make sure the area is well lit. Press start check when you are ready."
  },
  actions: {
    takePhoto: "Take a Photo",
    uploadPdfImage: "Upload PDF / Image",
    uploadPrescription: "Upload Prescription",
    startHealthCheck: "START A HEALTH CHECK",
    whatToCheck: "What would you like to check?",
    verifyMedicine: "Always verify medicine names and instructions with the original prescription or a healthcare professional.",
  },
  screenings: {
    anaemia: "Anaemia",
    anaemiaDesc: "Eye + Hand check",
    jaundice: "Jaundice",
    jaundiceDesc: "Eye + Face + Hand check",
    heartRate: "Heart Rate",
    heartRateDesc: "Measure with phone",
    others: "Other Symptoms",
    othersDesc: "Speak or write your symptoms for AI doctor analysis",
  },


  results: {
    high: "High Risk",
    low: "Low Risk",
    normal: "Normal",
    bradycardia: "Bradycardia (Slow)",
    tachycardia: "Tachycardia (Fast)",
    unableToAssess: "Unable to Assess",
    processing: "Processing... Please wait",
  },

  aiDoctor: {
    greeting: "Namaste! I am your AI Health Assistant. Please describe your symptoms. You can type or use the microphone to speak in your regional language.",
    error: "I'm sorry, I'm having trouble connecting right now. Please try again.",
    placeholder: "Type or speak symptoms...",
  },

  ui: {
    eye: "EYE",
    hand: "HAND",
    face: "FACE",
    captureLive: "CAPTURE LIVE",
    uploadImage: "UPLOAD IMAGE",
    retake: "RETAKE",
    saveToPassport: "SAVE TO HEALTH PASSPORT",
    findHealthWorker: "FIND HEALTH WORKER",
    aiScreeningResult: "AI SCREENING RESULT",
    pipelineAnalysis: "Pipeline Analysis",
    original: "Original",
    roiDetected: "ROI Detected",
    imageQuality: "Image Quality",
    yes: "Yes",
    estimatedHb: "Estimated Hb",
    estimatedBilirubin: "Estimated Bilirubin",
    anemiaRisk: "Anemia Risk",
    jaundiceRisk: "Jaundice Risk",
    confidence: "Confidence",
    medicalDisclaimer: "Confirmation requires a standard hemoglobin test.",
    jaundiceDisclaimer: "Confirmation requires a standard bilirubin test.",
    heartRateCheck: "Heart Rate Check",
    startCheck: "START CHECK",
    coverLens: "Cover Lens & Flash",
    measuring: "Measuring...",
    holdFinger: "Hold your finger still over the camera. We are capturing your pulse.",
    placeFinger: "Place your index finger firmly over the rear camera lens and flashlight.",
    flashlightOn: "FLASHLIGHT ON",
    flashlightOff: "FLASHLIGHT OFF",
    forceStart: "FORCE START RECORDING",
    cancel: "CANCEL",
    processingSignal: "Processing Signal...",
    extractingPulse: "Extracting pulse wave using FFT",
    calculatedBpm: "Calculated BPM",
    heartRateRange: "Heart Rate Range",
    unableToAssess: "Unable to assess",
    unreliableScreening: "We couldn't get a reliable screening from the photos.",
    tryAgain: "TRY AGAIN",
    error: "Error",
    noSpeechSupport: "Your browser does not support speech recognition. Please type your symptoms."
  },
  auth: {
    loginTitle: "Welcome back",
    signupTitle: "Create your profile",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    namePlaceholder: "Your name",
    agePlaceholder: "Age (Optional)",
    sexPlaceholder: "Sex (Optional)",
    bloodGroupPlaceholder: "Blood Group (Optional)",
    male: "Male",
    female: "Female",
    other: "Other",
    signingIn: "Signing in...",
    signIn: "Sign in",
    creating: "Creating...",
    createAccount: "Create account",
    dontHaveAccount: "Don't have an account? Sign up",
    alreadyHaveAccount: "Already have an account? Sign in",
    backToLanding: "← Back to Landing",
    loginFailed: "Login failed.",
    profileLoadFailed: "Your health profile could not be loaded.",
    signupFailed: "Account creation could not be completed.",
    checkEmail: "Please check your email to confirm your account before logging in.",
  }
};

export default en;
