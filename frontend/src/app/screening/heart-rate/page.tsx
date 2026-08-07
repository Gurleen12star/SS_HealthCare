"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppButton from "@/components/ui/AppButton";
import RiskMeter from "@/components/ui/RiskMeter";

type Mode = "intro" | "camera" | "processing" | "result" | "error";

import { useLanguage } from "@/context/LanguageContext";
import VoiceReader from "@/components/ui/VoiceReader";

export default function HeartRateScreening() {
  const [mode, setMode] = useState<Mode>("intro");
  const [bpm, setBpm] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [forceRecord, setForceRecord] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  const isRecordingRef = useRef<boolean>(false);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const ppgData = useRef<{ time: number; red: number }[]>([]);
  const startTime = useRef<number>(0);
  const TARGET_DURATION_MS = 10000; // 10 seconds of data

  const supabase = createClient();
  const router = useRouter();
  const { dictionary: t } = useLanguage();

  const startCamera = async () => {
    try {
      setMode("camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Try to turn on the flashlight (torch)
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      try {
        const capabilities = await imageCapture.getPhotoCapabilities();
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: true } as any]
          });
          setIsTorchOn(true);
        }
      } catch (err) {
        console.warn("Torch not supported or could not be enabled", err);
      }

      // Start processing frames
      ppgData.current = [];
      startTime.current = 0;
      setIsRecording(false);
      isRecordingRef.current = false;
      setForceRecord(false);
      setProgress(0);
      if (progressRef.current) progressRef.current.style.width = '0%';
      processFrame();
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to access camera. Please allow camera permissions.");
      setMode("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract image data
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      // Calculate average Red value (and overall brightness)
      let rSum = 0;
      let bSum = 0;
      const pixelCount = canvas.width * canvas.height;

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        bSum += data[i + 2];
      }

      const rAvg = rSum / pixelCount;
      const bAvg = bSum / pixelCount;

      // Finger detection: Must be significantly redder than blue to ignore ambient warm light.
      const isFingerCovering = rAvg > 80 && rAvg > bAvg * 1.5; 

      // Allow forcing the recording via state
      // @ts-ignore (we know it's fine)
      const shouldRecord = isFingerCovering || window.__forceRecordHR;

      if (shouldRecord) {
        if (!isRecordingRef.current) {
          setIsRecording(true);
          isRecordingRef.current = true;
          startTime.current = performance.now();
        }

        const now = performance.now();
        const elapsed = now - startTime.current;
        
        ppgData.current.push({ time: now, red: rAvg });
        
        const newProgress = Math.min((elapsed / TARGET_DURATION_MS) * 100, 100);
        if (progressRef.current) {
          progressRef.current.style.width = `${newProgress}%`;
        }

        if (elapsed >= TARGET_DURATION_MS) {
          // Finished recording
          stopCamera();
          submitData();
          return; // Stop loop
        }
      } else {
        // Finger removed, reset recording ONLY if not manually forced
        if (isRecordingRef.current && !window.__forceRecordHR) {
          setIsRecording(false);
          isRecordingRef.current = false;
          ppgData.current = [];
          setProgress(0);
          if (progressRef.current) progressRef.current.style.width = '0%';
        }
      }
    }

    requestRef.current = requestAnimationFrame(processFrame);
  };
  
  const handleForceRecord = () => {
    (window as any).__forceRecordHR = true;
    setForceRecord(true);
  };
  
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn } as any]
      });
      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.warn("Could not toggle torch", err);
      // Fallback: sometimes you can't toggle it after initialization easily on some browsers
    }
  };

  const submitData = async () => {
    setMode("processing");
    try {
      const res = await fetch("/api/predict_heart_rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: ppgData.current }),
      });

      if (!res.ok) throw new Error("Failed to process heart rate data.");
      
      const data = await res.json();
      setBpm(data.bpm);
      if (data.waveform) setWaveform(data.waveform);
      setMode("result");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to analyze heart rate data.");
      setMode("error");
    }
  };

  const getBpmStats = (bpmVal: number) => {
    let prob = 0;
    let text = "";
    let color = "";
    if (bpmVal < 60) {
      prob = ((bpmVal - 40) / 20) * 0.25;
      text = (t as any).results?.bradycardia || "Low (Bradycardia)";
      color = "text-blue-500";
    } else if (bpmVal <= 100) {
      prob = 0.25 + ((bpmVal - 60) / 40) * 0.50;
      text = (t as any).results?.normal || "Normal Resting";
      color = "text-emerald-500";
    } else {
      prob = 0.75 + ((bpmVal - 100) / 80) * 0.25;
      text = (t as any).results?.tachycardia || "High (Tachycardia)";
      color = "text-red-500";
    }
    return { prob: Math.max(0, Math.min(1, prob)), text, color };
  };

  const stats = bpm ? getBpmStats(bpm) : null;

  const saveToPassport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from("screenings").insert({
        patient_id: user.id,
        screening_type: "heart_rate",
        result_label: `${Math.round(bpm || 0)} BPM`,
        risk_level: "low",
        model_version: "sppg_v1_demo"
      });
      
      router.push("/passport");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const introText = "Measure your heart rate using your phone's camera and flash.";

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col items-center justify-center relative">
      <canvas ref={canvasRef} className="hidden" />

      {mode === "intro" && (
        <div className="p-6 w-full text-center">
          <div className="mb-10 text-left">
            <Link href="/screening" className="text-xl font-bold text-gray-500">← {(t as any).common?.back || "Back"}</Link>
          </div>
          <span className="text-6xl mb-6 block">❤️</span>
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-black text-gray-800">{t.screenings.heartRate}</h1>
            <VoiceReader autoPlay text={introText} />
          </div>
          <p className="text-gray-600 mb-12 text-lg">
            {introText}
          </p>
          <AppButton onClick={startCamera}>{(t as any).ui?.startCheck || "START CHECK"}</AppButton>
        </div>
      )}

      {mode === "camera" && (
        <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative text-white">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="z-10 flex flex-col items-center justify-center p-8 text-center bg-black/40 rounded-3xl m-6 backdrop-blur-md border border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              {isRecording ? ((t as any).ui?.measuring || "Measuring...") : ((t as any).ui?.coverLens || "Cover Lens & Flash")}
            </h2>
            <p className="text-gray-300 mb-8 max-w-[250px]">
              {isRecording 
                ? ((t as any).ui?.holdFinger || "Hold your finger still over the camera. We are capturing your pulse.")
                : ((t as any).ui?.placeFinger || "Place your index finger firmly over the rear camera lens and flashlight.")}
            </p>
            
            <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden mb-8">
              <div 
                ref={progressRef}
                className="bg-red-500 h-full transition-none"
                style={{ width: `0%` }}
              />
            </div>
            
            {!forceRecord && !isRecording && (
              <div className="w-full flex flex-col gap-3 mb-4">
                <button 
                  onClick={toggleTorch}
                  className={`w-full py-3 rounded-full font-bold ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'} border border-white/30 backdrop-blur-sm transition-all`}
                >
                  {isTorchOn ? `🔦 ${(t as any).ui?.flashlightOn || "FLASHLIGHT ON"}` : `🔦 ${(t as any).ui?.flashlightOff || "FLASHLIGHT OFF"}`}
                </button>
                <button 
                  onClick={handleForceRecord}
                  className="w-full py-3 rounded-full font-bold text-white bg-red-600 shadow-lg"
                >
                  {(t as any).ui?.forceStart || "FORCE START RECORDING"}
                </button>
              </div>
            )}
            
            <button 
              onClick={() => { 
                (window as any).__forceRecordHR = false;
                stopCamera(); 
                setMode("intro"); 
              }}
              className="text-gray-400 font-bold"
            >
              {(t as any).ui?.cancel || "CANCEL"}
            </button>
          </div>
        </div>
      )}

      {mode === "processing" && (
        <div className="flex flex-col items-center justify-center h-screen w-full">
          <div className="animate-pulse flex flex-col items-center">
            <VoiceReader autoPlay text={(t as any).results?.processing || "Processing, please wait"} />
            <span className="text-6xl mb-6 mt-4">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-800">{(t as any).ui?.processingSignal || "Processing Signal..."}</h2>
            <p className="text-gray-500 mt-2">{(t as any).ui?.extractingPulse || "Extracting pulse wave using FFT"}</p>
          </div>
        </div>
      )}

      {mode === "result" && (
        <div className="p-6 w-full flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col items-center justify-center pt-10 w-full max-w-sm mx-auto">
            <div className="text-center mb-4 flex items-center justify-center gap-2">
              <h1 className="text-xl font-extrabold tracking-widest text-emerald-600 mb-1">{(t as any).ui?.aiScreeningResult || "AI SCREENING RESULT"}</h1>
              <VoiceReader autoPlay text={stats?.text || ""} />
            </div>
            
            <RiskMeter probability={stats?.prob || 0} threshold={0.5} type="heart_rate" />
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 mt-4 w-full">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2 mb-2">
                <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.calculatedBpm || "Calculated BPM"}</span>
                <span className="text-2xl font-black text-gray-800">{bpm ? Math.round(bpm) : "--"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">{(t as any).ui?.heartRateRange || "Heart Rate Range"}</span>
                <span className={`text-sm font-bold ${stats?.color}`}>{stats?.text}</span>
              </div>
            </div>
            
            {waveform.length > 0 && (
              <div className="w-full h-24 mb-10 bg-white rounded-2xl shadow-sm border border-red-50 p-4 flex items-center justify-center overflow-hidden relative">
                <svg viewBox={`0 0 ${waveform.length} 100`} preserveAspectRatio="none" className="w-full h-full stroke-red-500 stroke-[2] fill-transparent">
                  <polyline
                    points={waveform.map((val, i) => {
                      // Normalize the waveform to fit the SVG box (0 to 100)
                      const max = Math.max(...waveform);
                      const min = Math.min(...waveform);
                      const normalized = (val - min) / ((max - min) || 1);
                      // Invert Y axis for standard visualization
                      return `${i},${100 - (normalized * 100)}`;
                    }).join(" ")}
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="w-full pb-10 space-y-4 max-w-sm mx-auto">
            <AppButton onClick={saveToPassport}>
              {(t as any).ui?.saveToPassport || "SAVE TO HEALTH PASSPORT"}
            </AppButton>
            <button 
              onClick={() => setMode("intro")}
              className="w-full py-4 rounded-full font-bold text-gray-500 bg-white border border-gray-200"
            >
              {(t as any).ui?.retake || "RETAKE"}
            </button>
          </div>
        </div>
      )}

      {mode === "error" && (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">{(t as any).ui?.error || "Error"}</h2>
          <p className="text-gray-600 mb-8">{errorMsg}</p>
          <AppButton onClick={() => setMode("intro")}>{(t as any).ui?.tryAgain || "TRY AGAIN"}</AppButton>
        </div>
      )}
    </main>
  );
}
