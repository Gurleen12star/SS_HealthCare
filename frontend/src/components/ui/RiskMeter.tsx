import React from 'react';

interface RiskMeterProps {
  probability: number; // 0.0 to 1.0
  threshold: number;   // e.g. 0.31
  type?: "anemia" | "jaundice" | "heart_rate";
}

export default function RiskMeter({ probability, threshold, type = "anemia" }: RiskMeterProps) {
  const width = 300;
  const height = 150;
  const strokeWidth = 30;
  const radius = width / 2 - strokeWidth;
  const cx = width / 2;
  const cy = height;

  const getCoordinatesForPercent = (percent: number) => {
    // percent is 0 to 1. 0 is left, 1 is right.
    const angleInDegrees = 180 - (percent * 180);
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    const x = cx + radius * Math.cos(angleInRadians);
    const y = cy - radius * Math.sin(angleInRadians);
    return { x, y };
  };

  const createArc = (startPercent: number, endPercent: number, color: string) => {
    const start = getCoordinatesForPercent(startPercent);
    const end = getCoordinatesForPercent(endPercent);
    // largeArcFlag is 0 since all segments are < 180 degrees
    const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
    return (
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />
    );
  };

  // Needle angle
  const needleAngle = -90 + (probability * 180); // 0 prob = -90deg, 0.5 = 0deg, 1.0 = 90deg

  return (
    <div className="flex flex-col items-center my-6">
      <svg width={width} height={height + 10} viewBox={`0 0 ${width} ${height + 10}`}>
        {/* Background arcs */}
        {type === "anemia" ? (
          <>
            {createArc(0, threshold, "#10b981")}          {/* Green: Low */}
            {createArc(threshold, 0.7, "#f59e0b")}        {/* Yellow: Elevated */}
            {createArc(0.7, 1.0, "#ef4444")}              {/* Red: Critical */}
          </>
        ) : type === "jaundice" ? (
          <>
            {createArc(0, threshold, "#f97316")}          {/* Orange: No */}
            {createArc(threshold, 1.0, "#a855f7")}        {/* Purple: Yes Present */}
          </>
        ) : (
          <>
            {createArc(0, 0.25, "#3b82f6")}               {/* Blue: Low */}
            {createArc(0.25, 0.75, "#10b981")}            {/* Green: Normal */}
            {createArc(0.75, 1.0, "#ef4444")}             {/* Red: High */}
          </>
        )}

        {/* Needle */}
        <g transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}>
          <polygon points="-5,-10 0,-120 5,-10" fill="#374151" />
          <circle cx="0" cy="-10" r="12" fill="#374151" />
          <circle cx="0" cy="-10" r="4" fill="#ffffff" />
        </g>
      </svg>
      <div className="flex justify-between w-full max-w-[300px] mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
        {type === "anemia" ? (
          <>
            <span>Low</span>
            <span>Elevated</span>
            <span>Critical</span>
          </>
        ) : type === "jaundice" ? (
          <>
            <span className="text-orange-500">No</span>
            <span className="text-purple-500">Yes Present</span>
          </>
        ) : (
          <>
            <span className="text-blue-500 ml-4">Low</span>
            <span className="text-emerald-500">Normal</span>
            <span className="text-red-500 mr-2">High</span>
          </>
        )}
      </div>
    </div>
  );
}
