import Link from "next/link";
import ListenButton from "@/components/ui/ListenButton";
import AppButton from "@/components/ui/AppButton";

export default function CovidScreening() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6">
        <Link href="/screening" className="text-2xl text-[#526158]">← Back</Link>
      </div>
      
      <div className="text-center mt-10">
        <span className="text-6xl">🦠</span>
        <h1 className="mt-6 text-3xl font-bold">Respiratory Symptoms</h1>
        
        <p className="mt-4 text-lg text-[#526158]">
          Answer simple questions to check your symptoms.
        </p>
        
        <div className="mt-8">
          <ListenButton text="Answer simple questions to check your symptoms. Press start check when you are ready." />
        </div>
        
        <div className="mt-12">
          <AppButton>START CHECK</AppButton>
        </div>
      </div>
    </main>
  );
}
