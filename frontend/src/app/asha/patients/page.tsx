import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AshaPatientsList() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <h1 className="text-2xl font-bold uppercase tracking-wider text-[#526158] mb-6">Patients</h1>

      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#526158]">🔍</span>
        <input 
          type="text" 
          placeholder="Search by name or patient ID" 
          className="w-full bg-white border border-[#dfe7e2] rounded-2xl p-4 pl-12"
        />
      </div>

      <div className="space-y-4">
        <Link href="/asha/patients/1" className="block bg-white border border-[#dfe7e2] p-5 rounded-2xl active:scale-[0.99]">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg">Meena</h3>
            <span className="text-[#526158]">{">"}</span>
          </div>
          <p className="text-sm text-[#526158] mb-3">SS-A1001</p>
          
          <div className="mb-4">
            <StatusBadge status="follow-up" />
          </div>
          
          <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Last activity:</p>
          <p className="text-sm">Anaemia screening</p>
        </Link>

        <Link href="/asha/patients/2" className="block bg-white border border-[#dfe7e2] p-5 rounded-2xl active:scale-[0.99]">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg">Rani</h3>
            <span className="text-[#526158]">{">"}</span>
          </div>
          <p className="text-sm text-[#526158] mb-3">SS-A1002</p>
          
          <div className="mb-4">
            <span className="inline-flex rounded-full px-3 py-1 text-sm font-semibold bg-[#eef8f1] text-[#176b4d]">No current flags</span>
          </div>
        </Link>
      </div>
    </main>
  );
}
