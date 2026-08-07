import PatientBottomNav from "@/components/layout/PatientBottomNav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PatientBottomNav />
    </>
  );
}
