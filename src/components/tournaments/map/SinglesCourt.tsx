interface OutOfCourtProps {
    x: number
    y: number
    width?: number
    height?: number
    label?: string
}

export const SinglesCourt = ({x, y, width = 90, height = 30, label,}: OutOfCourtProps) => {
    const centerX = x + width / 2
    const topY = y + 1
    const bottomY = y + height - 1

    const leftX = x + 10
    const rightX = x + width - 10
    const midY = y + height / 2

    return (
        <>
            {/* Bane-område */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="gray"
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
                        y={y + height - 23}
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
                        y={y + height - 12}
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
        </>
    )
}


export default SinglesCourt;