import {UserCircleIcon} from "@heroicons/react/24/outline";

export const MatchTextInfo = ({level, takenSpots, availableSpots, matchHost}: {
    level: string;
    takenSpots: number;
    availableSpots: number;
    matchHost: string;
}) => {


    return (
        <>
                <div className="flex justify-between">
                    <p>Niveau {level}</p>

                    <div className="flex">
                    {[...Array(takenSpots)].map((_, i) => (
                        <UserCircleIcon
                            key={`participant-${i}`}
                            className="h-5 text-cyan-500"
                        />
                    ))}

                    {[...Array(availableSpots)].map((_, i) => (
                        <UserCircleIcon
                            key={`empty-${i}`}
                            className="h-5 text-gray-500"
                        />
                    ))}
                    </div>
                </div>
            <p className="text-gray-500">Oprettet af {matchHost}</p>

        </>
    );
};

export default MatchTextInfo;