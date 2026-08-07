import AshaBottomNav from "@/components/layout/AshaBottomNav";

export default function AshaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AshaBottomNav />
    </>
  );
}
