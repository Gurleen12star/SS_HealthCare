"use client";

import Link from "next/link";
import { MapPin, Stethoscope, Building2, Phone } from "lucide-react";

export default function NearbyCarePage() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col pb-28">
      {/* Header */}
      <div className="bg-[#17211b] p-6 pb-12 rounded-b-[2.5rem] shadow-md relative">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/patient" className="text-white">←</Link>
          <h1 className="text-sm font-bold text-[#a6b6ac] tracking-wide uppercase">Location Services</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Nearby Care</h2>
        <p className="text-[#a6b6ac] font-semibold">
          Find top-rated hospitals, clinics, and doctors near your current location.
        </p>
      </div>

      <div className="p-6 -mt-8 space-y-4">
        
        <a 
          href="https://www.google.com/maps/search/hospitals+near+me" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-[#dfe7e2] shadow-lg hover:shadow-xl transition-shadow active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-[#eef8f1] rounded-2xl flex items-center justify-center text-[#176b4d]">
            <Building2 size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#17211b] text-lg">Find Hospitals</h3>
            <p className="text-sm text-[#526158] font-semibold mt-0.5">Emergency & general care</p>
          </div>
          <MapPin className="text-[#a6b6ac]" />
        </a>

        <a 
          href="https://www.google.com/maps/search/doctors+near+me" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-[#dfe7e2] shadow-lg hover:shadow-xl transition-shadow active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-[#eef8f1] rounded-2xl flex items-center justify-center text-[#176b4d]">
            <Stethoscope size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#17211b] text-lg">Find Doctors</h3>
            <p className="text-sm text-[#526158] font-semibold mt-0.5">Specialists & local clinics</p>
          </div>
          <MapPin className="text-[#a6b6ac]" />
        </a>

        <a 
          href="https://www.google.com/maps/search/pharmacies+near+me" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-[#dfe7e2] shadow-lg hover:shadow-xl transition-shadow active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-[#eef8f1] rounded-2xl flex items-center justify-center text-[#176b4d]">
            <Phone size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#17211b] text-lg">Find Pharmacies</h3>
            <p className="text-sm text-[#526158] font-semibold mt-0.5">24/7 medical stores</p>
          </div>
          <MapPin className="text-[#a6b6ac]" />
        </a>
        
      </div>
      
      <div className="px-6 mt-4">
        <div className="bg-[#176b4d] rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
           <h3 className="font-bold text-xl relative z-10">Emergency?</h3>
           <p className="text-emerald-100 text-sm mt-2 mb-4 relative z-10">Call the national ambulance service immediately.</p>
           <a href="tel:108" className="inline-block bg-white text-[#176b4d] font-bold text-lg px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors relative z-10 shadow-md">
             Dial 108
           </a>
        </div>
      </div>

    </main>
  );
}
