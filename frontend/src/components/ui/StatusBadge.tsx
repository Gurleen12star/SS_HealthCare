type Status =
  | "routine"
  | "follow-up"
  | "priority";

export default function StatusBadge({
  status,
}: {
  status: Status;
}) {
  const styles = {
    routine:
      "bg-[#eef8f1] text-[#176b4d]",

    "follow-up":
      "bg-[#fff8e6] text-[#765600]",

    priority:
      "bg-[#fff1f1] text-[#a11d1d]",
  };

  const labels = {
    routine: "Routine",
    "follow-up": "Follow-up",
    priority: "Priority",
  };

  return (
    <span
      className={`
        inline-flex rounded-full
        px-3 py-1 text-sm font-semibold
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
}
