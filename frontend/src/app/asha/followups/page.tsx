import Link from "next/link";
import AppButton from "@/components/ui/AppButton";

export default function AshaFollowups() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <h1 className="text-2xl font-bold uppercase tracking-wider text-[#526158] mb-6">Follow-ups</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full bg-[#17211b] text-white text-sm font-bold whitespace-nowrap">All</button>
        <button className="px-4 py-2 rounded-full bg-white border border-[#dfe7e2] text-[#17211b] text-sm font-bold whitespace-nowrap">Priority</button>
        <button className="px-4 py-2 rounded-full bg-white border border-[#dfe7e2] text-[#17211b] text-sm font-bold whitespace-nowrap">Due</button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold tracking-wider text-[#a11d1d] uppercase mb-3 flex items-center gap-2">
            🔴 Priority
          </h2>
          <div className="bg-white border border-[#dfe7e2] p-5 rounded-2xl">
            <h3 className="font-bold text-lg mb-3">Patient A104</h3>
            
            <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Reason:</p>
            <p className="text-sm mb-3">Follow-up requires review</p>
            
            <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Due:</p>
            <p className="text-sm font-bold text-[#a11d1d] mb-5">Today</p>
            
            <Link href="/asha/patients/1">
              <AppButton variant="secondary" className="py-2 min-h-10 text-sm">VIEW PATIENT</AppButton>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold tracking-wider text-[#765600] uppercase mb-3 flex items-center gap-2">
            🟡 Follow-up
          </h2>
          <div className="bg-white border border-[#dfe7e2] p-5 rounded-2xl">
            <h3 className="font-bold text-lg mb-3">Patient A122</h3>
            
            <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Reason:</p>
            <p className="text-sm mb-3">Report review</p>
            
            <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Due:</p>
            <p className="text-sm font-bold text-[#765600] mb-5">Tomorrow</p>
            
            <Link href="/asha/patients/2">
              <AppButton variant="secondary" className="py-2 min-h-10 text-sm">VIEW PATIENT</AppButton>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
