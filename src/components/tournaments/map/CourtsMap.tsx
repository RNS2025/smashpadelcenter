import OutOfCourt from "./OutOfCourt.tsx";
import RegularCourt from "./RegularCourt.tsx";
import SinglesCourt from "./SinglesCourt.tsx";
import { useState } from "react";

interface CourtsMapProps {
  onSelect: (courtId: string | null) => void;
}

export const CourtsMap = ({ onSelect }: CourtsMapProps) => {
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  const courts = [
    { id: "single3", type: "singles", x: 255, y: 205, label: "Single" },
    { id: "bane12", type: "regular", x: 30, y: 20, label: "Bane 12", sponsor: "Sydbank" },
    { id: "bane11", type: "regular", x: 30, y: 80, label: "Bane 11", sponsor: "Grafisk Forum" },
    { id: "bane10", type: "regular", x: 30, y: 140, label: "Bane 10", sponsor: "Bøje Maskintransport" },
    { id: "bane9", type: "outof", x: 30, y: 215, label: "Bane 9", sponsor: "Flammen" },
    { id: "bane8", type: "outof", x: 30, y: 295, label: "Bane 8", sponsor: "Maxus" },
    { id: "bane13", type: "regular", x: 255, y: 245, label: "Bane 13", sponsor: "Lyngsø VVS" },
    { id: "bane4", type: "regular", x: 155, y: 190, label: "Bane 4", sponsor: "Rise´s Digitalrådgivning" },
    { id: "bane3", type: "regular", x: 155, y: 250, label: "Bane 3", sponsor: "Fysio Danmark" },
    { id: "bane2", type: "regular", x: 155, y: 310, label: "Bane 2", sponsor: "Danbolig Horsens" },
    { id: "bane16", type: "regular", x: 255, y: 20, label: "Bane 16"},
    { id: "bane7", type: "regular", x: 155, y: 20, label: "Bane 7", sponsor: "Siux" },
    { id: "single1", type: "singles", x: 155, y: 90, label: "Single" },
    { id: "single2", type: "singles", x: 155, y: 140, label: "Single" },
    { id: "bane15", type: "regular", x: 255, y: 90, label: "Bane 15", sponsor: "Velfac" },
    { id: "bane1", type: "rotated", x: 400, y: -47, label: "Bane 1", sponsor: "Middelfart Sparekasse" },
  ];

  const handleCourtSelect = (courtId: string | null, label: string, sponsor?: string) => {
    const newSelectedCourtId = selectedCourtId === courtId ? null : courtId;
    setSelectedCourtId(newSelectedCourtId);

    if (newSelectedCourtId) {
      const fullLabel = sponsor ? `${label} - ${sponsor}` : label;
      onSelect(fullLabel);
    } else {
      onSelect(null);
    }
  };


  return (
    <div>
      <svg
        viewBox="0 0 360 510"
        className="h-[calc(100vh-100px)] max-lg:h-[calc(100vh-180px)] max-sm:h-[calc(100vh-250px)] max-sm:mt-4 w-full"
      >
        {/* Hal 2 */}
        <rect
          x="20"
          y="0"
          width="130"
          height="410"
          fill="none"
          stroke="white"
          strokeWidth="3"
        />
        <rect
          x="20"
          y="370"
          width="130"
          height="40"
          fill="gray"
          stroke="white"
          strokeWidth="2"
        />
        <rect
          x="100"
          y="410"
          width="50"
          height="40"
          fill="blue"
          stroke="white"
          strokeWidth="2"
        />
        <text
          x="125"
          y="430"
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          className="select-none"
        >
          Indgang
        </text>
        <text
          x="85"
          y="390"
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          className="select-none"
        >
          Lounge
        </text>

        {/* Hal 1 */}
        <rect
          x="150"
          y="0"
          width="100"
          height="500"
          fill="none"
          stroke="white"
          strokeWidth="3"
        />

        {/* Hal 3 */}
        <rect
          x="250"
          y="0"
          width="100"
          height="300"
          fill="none"
          stroke="white"
          strokeWidth="3"
        />

        {/* Lounge */}
        <rect
          x="150"
          y="390"
          width="40"
          height="110"
          fill="gray"
          stroke="white"
          strokeWidth="2"
        />
        <g transform="rotate(270, 100, 100)">
          <text
            x="-250"
            y="170"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            className="select-none"
          >
            Lounge
          </text>
        </g>

        {courts.map((court) => {
          const { id: key, ...otherProps } = court;
          const isSelected = selectedCourtId === key;
          const commonProps = {
            ...otherProps,
            isSelected,
            onSelect: () => handleCourtSelect(key, court.label, court.sponsor),
          };

          if (court.type === "regular")
            return <RegularCourt id={""} key={key} {...commonProps} />;
          if (court.type === "outof")
            return <OutOfCourt id={""} key={key} {...commonProps} />;
          if (court.type === "singles")
            return <SinglesCourt key={key} {...commonProps} />;
          if (court.type === "rotated") {
            return (
              <g transform="rotate(90, 100, 100)" key={key}>
                <RegularCourt id={""} {...commonProps} />
              </g>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};

export default CourtsMap;
