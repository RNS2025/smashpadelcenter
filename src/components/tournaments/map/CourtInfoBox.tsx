interface CourtInfoBoxProps {
    x: number;
    y: number;
    label: string;
}

const CourtInfoBox = ({ x, y, label }: CourtInfoBoxProps) => {
    return (
        <div
            className="absolute bg-white text-black p-3 rounded shadow-lg w-48 z-50"
            style={{
                left: x + 100, // justér placering efter behov
                top: y,
            }}
        >
            <p className="font-bold">{label}</p>
            <p className="text-sm mt-1">Her kan du skrive info om banen.</p>
        </div>
    );
};

export default CourtInfoBox;
