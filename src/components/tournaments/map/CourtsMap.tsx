import OutOfCourt from "./OutOfCourt.tsx";
import RegularCourt from "./RegularCourt.tsx";
import SinglesCourt from "./SinglesCourt.tsx";
import {useState} from "react";


export const CourtsMap = () => {

    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

    const courts = [
        { id: "single3", type: "singles", x: 255, y: 255, label: "Single" },
        { id: "bane12", type: "regular", x: 30, y: 70, label: "Bane 12" },
        { id: "bane11", type: "regular", x: 30, y: 130, label: "Bane 11" },
        { id: "bane10", type: "regular", x: 30, y: 190, label: "Bane 10" },
        { id: "bane9", type: "outof", x: 30, y: 265, label: "Bane 9" },
        { id: "bane8", type: "outof", x: 30, y: 345, label: "Bane 8" },
        { id: "bane13", type: "regular", x: 255, y: 295, label: "Bane 13" },
        { id: "bane4", type: "regular", x: 155, y: 240, label: "Bane 4" },
        { id: "bane3", type: "regular", x: 155, y: 300, label: "Bane 3" },
        { id: "bane2", type: "regular", x: 155, y: 360, label: "Bane 2" },
        { id: "bane16", type: "regular", x: 255, y: 70, label: "Bane 16" },
        { id: "bane7", type: "regular", x: 155, y: 70, label: "Bane 7" },
        { id: "single1", type: "singles", x: 155, y: 140, label: "Single" },
        { id: "single2", type: "singles", x: 155, y: 190, label: "Single" },
        { id: "bane15", type: "regular", x: 255, y: 140, label: "Bane 15" },
        { id: "bane1", type: "rotated", x: 450, y: -47, label: "Bane 1" },
    ];

    return (
        <div className="mx-auto">
        <svg viewBox="0 0 360 580" className="lg:w-auto lg:h-screen">

            <text
                x="190"
                y="20"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
            >
                Prøv at tryk på en bane :D
            </text>

            {/* Hal 2 */}
            <rect x="20" y="50" width="130" height="410" fill="none" stroke="white" strokeWidth="3" />
            <rect x="20" y="420" width="130" height="40" fill="gray" stroke="white" strokeWidth="3" />
            <rect x="100" y="460" width="50" height="40" fill="blue" stroke="white" strokeWidth="3" />
            <text
                x="125"
                y="480"
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
                y="440"
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
            <rect x="150" y="50" width="100" height="500" fill="none" stroke="white" strokeWidth="3" />

            {/* Hal 3 */}
            <rect x="250" y="50" width="100" height="300" fill="none" stroke="white" strokeWidth="3" />

            {/* Lounge */}
            <rect x="150" y="440" width="40" height="110" fill="gray" stroke="white" strokeWidth="3" />
            <g transform="rotate(270, 100, 100)">
                <text
                    x="-300"
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
                const isSelected = selectedCourtId === court.id;
                const commonProps = {
                    key: court.id,
                    id: court.id,
                    x: court.x,
                    y: court.y,
                    label: court.label,
                    isSelected,
                    onSelect: () =>
                        setSelectedCourtId((prev) => (prev === court.id ? null : court.id)),
                };

                if (court.type === "regular") return <RegularCourt {...commonProps} />;
                if (court.type === "outof") return <OutOfCourt {...commonProps} />;
                if (court.type === "singles") return <SinglesCourt {...commonProps} />;
                if (court.type === "rotated") {
                    return (
                        <g transform="rotate(90, 100, 100)" key={court.id}>
                            <RegularCourt {...commonProps} />
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