"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ListenButton from "@/components/ui/ListenButton";
import AppButton from "@/components/ui/AppButton";
import Camera from "@/components/ui/Camera";
import RiskMeter from "@/components/ui/RiskMeter";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import VoiceReader from "@/components/ui/VoiceReader";

type Mode = "intro" | "camera" | "processing" | "result" | "error";

export default function JaundiceScreening() {
  const [mode, setMode] = useState<Mode>("intro");
  
  const [captures, setCaptures] = useState<Blob[]>([]);
  const [captureUrls, setCaptureUrls] = useState<string[]>([]);
  
  const [result, setResult] = useState<"HIGH" | "LOW" | "UNABLE TO ASSESS" | null | string>(null);
  const [reason, setReason] = useState<string>("");
  const [probability, setProbability] = useState<number>(0);
  const [hgb, setHgb] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [roiImages, setRoiImages] = useState<string[]>([]);
  const [qualities, setQualities] = useState<string[]>([]);
  const [scanType, setScanType] = useState<"eye" | "hand" | "face">("eye");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  const { dictionary: t } = useLanguage();
  const router = useRouter();
  
  useEffect(() => {
    // Cleanup URLs on unmount
    return () => {
      captureUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [captureUrls]);

  const handleCapture = async (blob: Blob) => {
    const newCaptures = [...captures, blob];
    setCaptures(newCaptures);
    setCaptureUrls([...captureUrls, URL.createObjectURL(blob)]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleCapture(file);
      submitToApi([file], true); // Analyze immediately
    }
  };

  const submitToApi = async (overrideCaptures?: Blob[], isUpload: boolean = false) => {
    const filesToSubmit = overrideCaptures || captures;
    if (filesToSubmit.length === 0) return;
    
    setMode("processing");
    setResult(null);
    setReason("");

    const formData = new FormData();
    filesToSubmit.forEach((blob, idx) => {
      formData.append("eye_files", blob, `eye_${idx}.jpg`);
    });
    formData.append("scan_type", scanType);
    formData.append("is_live", isUpload ? "false" : "true");

    try {
      const res = await fetch(`/api/predict_jaundice`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setResult(data.risk_level);
      if (data.reason) setReason(data.reason);
      if (data.probability !== undefined) setProbability(data.probability);
      if (data.hgb_prediction !== undefined) setHgb(data.hgb_prediction);
      if (data.threshold !== undefined) setThreshold(data.threshold);
      if (data.confidence !== undefined) setConfidence(data.confidence);
      if (data.roi_images !== undefined) setRoiImages(data.roi_images);
      if (data.qualities !== undefined) setQualities(data.qualities);
      setMode(data.risk_level === "UNABLE TO ASSESS" ? "error" : "result");
    } catch (err) {
      console.error(err);
      alert("Failed to analyze image. Ensure the Python API is running.");
      setResult("LOW");
      setMode("result");
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login first.");
        return;
      }
      
      const { error } = await supabase.from('screenings').insert({
        patient_id: user.id,
        screening_type: 'jaundice',
        result_label: result === "YES" || result === "HIGH" ? "Elevated Screening Risk" : "Lower Screening Risk",
        risk_level: result === "YES" || result === "HIGH" ? "elevated" : "low",
        confidence: probability,
        model_version: 'jaundice_v1_demo'
      });
      
      if (error) throw error;
      
      if (result === "YES" || result === "HIGH") {
        await supabase.from('followups').insert({
          patient_id: user.id,
          reason: 'Elevated Jaundice Screening Risk - Bilirubin Test Recommended',
          priority: 'urgent',
          status: 'pending'
        });
      }
      
      router.push("/passport");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save screening to health profile.");
    }
  };

  const resetState = () => {
    setMode("intro");
    setCaptures([]);
    setCaptureUrls([]);
    setResult(null);
  };

  // Safe result translation helper
  const getTranslatedResult = (res: string | null) => {
    if (res === "HIGH" || res === "YES") return (t as any).results?.high || "High Risk";
    if (res === "LOW" || res === "NO") return (t as any).results?.low || "Low Risk";
    return (t as any).results?.unableToAssess || "Unable to Assess";
  };

  if (mode === "intro") {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28 flex flex-col items-center justify-center font-sans">
        <div className="absolute top-6 left-6">
          <button onClick={() => router.push("/screening")} className="text-xl font-bold text-[#526158] hover:text-[#3d4942]">← {(t as any).common?.back || "Back"}</button>
        </div>
        
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <span className="text-4xl">👁️</span>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-black text-gray-800 text-center">{t.screenings.jaundice}</h1>
          <VoiceReader autoPlay text={t.features.anemiaInstruction} />
        </div>
        
        <p className="text-gray-600 text-center mb-6 px-4 leading-relaxed">
          {t.features.anemiaInstruction}
        </p>

        <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-xl w-full">
          <button
            onClick={() => setScanType("eye")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${scanType === "eye" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
          >
            👁️ {(t as any).ui?.eye || "EYE"}
          </button>
          <button
            onClick={() => setScanType("face")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${scanType === "face" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
          >
            👤 {(t as any).ui?.face || "FACE"}
          </button>
          <button
            onClick={() => setScanType("hand")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${scanType === "hand" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
          >
            ✋ {(t as any).ui?.hand || "HAND"}
          </button>
        </div>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => setMode("camera")}
            className="w-full py-4 rounded-xl text-lg font-bold bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 transition-colors"
          >
            📸 {(t as any).ui?.captureLive || "CAPTURE LIVE"}
          </button>
          
          <div className="relative w-full">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl text-lg font-bold bg-white text-emerald-600 border-2 border-emerald-500 shadow-sm hover:bg-emerald-50 transition-colors"
            >
              📁 {(t as any).ui?.uploadImage || "UPLOAD IMAGE"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "camera") {
    return (
      <div className="bg-black min-h-screen">
        <div className="absolute top-0 left-0 right-0 z-[60] bg-black bg-opacity-70 text-white p-4 flex flex-col items-center">
          <div className="text-lg font-bold mb-2">
            Capture {scanType === "eye" ? "palpebral conjunctiva" : scanType === "face" ? "your face" : "palm of your hand"}
          </div>
          <div className="flex w-full justify-between items-center px-2">
            <span className="text-sm font-medium">{captures.length} captured</span>
            <div className="space-x-2">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                Upload
              </button>
              {captures.length > 0 && (
                <button 
                  onClick={() => submitToApi(undefined, false)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg animate-pulse"
                >
                  Analyze Now
                </button>
              )}
            </div>
          </div>
        </div>
        <Camera onCapture={handleCapture} onCancel={resetState} />
      </div>
    );
  }

  if (mode === "processing") {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col items-center justify-center">
        <VoiceReader autoPlay text={(t as any).results?.processing || "Processing, please wait"} />
        <div className="w-16 h-16 mt-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="mt-6 text-xl font-medium text-[#526158] animate-pulse">{(t as any).results?.processing || "Processing..."}</p>
      </main>
    );
  }

  if (mode === "error") {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
        <div className="mb-6">
          <button onClick={resetState} className="text-2xl text-[#526158]">← {(t as any).common?.back || "Back"}</button>
        </div>
        <div className="text-center mt-10">
          <span className="text-6xl">⚠️</span>
          <h1 className="mt-6 text-3xl font-bold flex justify-center items-center gap-2">
            {getTranslatedResult(result)}
            <VoiceReader autoPlay text={getTranslatedResult(result)} />
          </h1>
          <p className="mt-6 text-lg text-gray-600 px-4">
            {(t as any).ui?.unreliableScreening || "We couldn't get a reliable screening from the photos."}
          </p>
          {reason && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 shadow-sm">
              {reason}
            </div>
          )}
          <div className="mt-12">
            <AppButton onClick={resetState}>{(t as any).ui?.retake || "RETAKE"}</AppButton>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "result") {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28 font-sans">
        <div className="mb-6">
          <button onClick={resetState} className="text-xl font-bold text-[#526158] hover:text-[#3d4942]">← {(t as any).common?.back || "Back"}</button>
        </div>
        
        <div className="text-center mb-6 flex items-center justify-center gap-2">
          <h1 className="text-xl font-extrabold tracking-widest text-emerald-600 mb-1">{(t as any).ui?.aiScreeningResult || "AI SCREENING RESULT"}</h1>
          <VoiceReader autoPlay text={getTranslatedResult(result)} />
        </div>
        
        <RiskMeter probability={probability} threshold={threshold} type="jaundice" />

        {/* Visual Pipeline Display */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 overflow-hidden">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{(t as any).ui?.pipelineAnalysis || "Pipeline Analysis"}</h2>
          {captureUrls.map((url, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{(t as any).ui?.original || "Original"}</div>
                  <img src={url} className="w-full h-24 object-cover rounded-lg border border-gray-200" alt="Original" />
                </div>
                <div className="text-gray-300 text-xl font-light">→</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{(t as any).ui?.roiDetected || "ROI Detected"}</div>
                  {roiImages[idx] ? (
                    <img src={`data:image/jpeg;base64,${roiImages[idx]}`} className="w-full h-24 object-cover rounded-lg border-2 border-emerald-400 shadow-inner" alt="Conjunctiva ROI" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xl">❌</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Inference Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.imageQuality || "Image Quality"}</span>
            <span className={`text-sm font-bold ${qualities[0] === 'Excellent' ? 'text-emerald-500' : 'text-amber-500'}`}>{qualities[0] || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.roiDetected || "ROI Detected"}</span>
            <span className="text-sm font-bold text-emerald-500">✓ {(t as any).ui?.yes || "Yes"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.estimatedBilirubin || "Estimated Bilirubin"}</span>
            <span className="text-sm font-bold text-gray-800">{hgb !== null ? `${hgb.toFixed(1)} mg/dL` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.jaundiceRisk || "Jaundice Risk"}</span>
            <span className={`text-sm font-bold ${result === 'YES' || result === 'HIGH' ? 'text-purple-500' : 'text-orange-500'}`}>{getTranslatedResult(result)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.confidence || "Confidence"}</span>
            <span className="text-sm font-bold text-indigo-500">{confidence !== null ? `${confidence}%` : 'N/A'}</span>
          </div>
        </div>

        {/* Small Medical Disclaimer */}
        <div className="text-center mt-2 mb-8">
          <p className="text-[10px] font-medium text-gray-400 italic">
            {(t as any).ui?.jaundiceDisclaimer || "Confirmation requires a standard bilirubin test."}
          </p>
        </div>

        <div className="space-y-4">
          {result === "HIGH" && (
            <AppButton>{(t as any).ui?.findHealthWorker || "FIND HEALTH WORKER"}</AppButton>
          )}
          <button 
            className="w-full py-4 rounded-xl text-lg font-bold border-2 border-[#526158] text-[#526158] uppercase hover:bg-[#f0f4f2] transition-colors"
            onClick={handleSave}
          >
            {(t as any).ui?.saveToPassport || "SAVE TO HEALTH PASSPORT"}
          </button>
        </div>
      </main>
    );
  }

  return null;
}
