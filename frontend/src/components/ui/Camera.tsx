"use client";

import { useRef, useState, useEffect } from "react";
import AppButton from "./AppButton";

interface CameraProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export default function Camera({ onCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setFallbackMode(true);
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setFallbackMode(true);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
        onCapture(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onCapture(file);
    }
  };

  if (fallbackMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Camera Unavailable</h2>
        <p className="text-gray-600 mb-8">
          Your browser requires a secure connection (HTTPS) for direct camera access.
          You can still take a photo using your phone's native camera.
        </p>
        
        <label className="bg-[#17211b] text-white px-8 py-4 rounded-xl font-bold text-lg cursor-pointer flex items-center justify-center w-full max-w-sm mb-4">
          Open Native Camera
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFallbackCapture} 
            className="hidden" 
          />
        </label>
        
        <button 
          onClick={onCancel}
          className="text-[#526158] font-bold py-4 w-full max-w-sm border-2 border-[#dfe7e2] rounded-xl"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay box for conjunctiva alignment */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-64 h-32 border-4 border-dashed border-white/50 rounded-lg"></div>
      </div>
      
      {/* Flash Effect */}
      {flash && <div className="absolute inset-0 bg-white z-20 opacity-75"></div>}
      
      <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-between items-center z-30">
        <button 
          onClick={onCancel}
          className="text-white bg-gray-800/80 px-6 py-3 rounded-full font-semibold"
        >
          Cancel
        </button>
        
        <button 
          onClick={takePhoto}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 active:bg-gray-200"
        ></button>
        
        <div className="w-[88px]"></div> {/* Spacer for symmetry */}
      </div>
    </div>
  );
}
