interface RegularCourtProps {
    x: number
    y: number
    width?: number
    height?: number
    label?: string
    id: string
    isSelected: boolean
    onSelect: () => void
}

export const RegularCourt = ({x, y, width = 90, height = 50, label, isSelected, onSelect}: RegularCourtProps) => {

    const centerX = x + width / 2
    const topY = y + 1
    const bottomY = y + height - 1

    const leftX = x + 10
    const rightX = x + width - 10
    const midY = y + height / 2

    return (
        <>
            {/* Bane-område */}
            <g
                onClick={onSelect}
                className={`cursor-pointer transition-transform duration-300 transform origin-center ${
                    isSelected ? "scale-150" : "scale-100"
                }`}
                style={{ transformBox: "fill-box" }}
            >

            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#3b82f6"
                stroke="black"
                strokeWidth={1}
            />

            {/* Net*/}
            <line
                x1={centerX}
                y1={topY}
                x2={centerX}
                y2={bottomY}
                stroke="white"
                strokeWidth={1}
                strokeDasharray={2}
            />


            {/* Midterlinje */}
            <line
                x1={leftX}
                y1={midY}
                x2={rightX}
                y2={midY}
                stroke="white"
                strokeWidth={1}
            />

            {/* Baglinje venstre */}
            <line
                x1={leftX}
                y1={topY}
                x2={leftX}
                y2={bottomY}
                stroke="white"
                strokeWidth={1}
            />

            {/* Baglinje højre */}
            <line
                x1={rightX}
                y1={topY}
                x2={rightX}
                y2={bottomY}
                stroke="white"
                strokeWidth={1}
            />

            {/* Label (valgfri) */}
            {label && (
                <>
                    {/* Baggrunds-kasse */}
                    <rect
                        x={centerX - 25}
                        y={y + height - 34}
                        width={50}
                        height={16}
                        fill="black"
                        stroke="white"
                        strokeWidth={0.5}
                        rx={2} // optional rounded corners
                    />

                    {/* Tekst ovenpå */}
                    <text
                        x={centerX}
                        y={y + height - 23}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        className="select-none"
                    >
                        {label}
                    </text>
                </>
            )}
            </g>
        </>
    )
}


export default RegularCourt;