import { PadelMatch } from "../../../types/PadelMatch.ts";
import {safeFormatDate} from "../../../utils/dateUtils.ts";

export const ConfirmMatchResultDialog = ({match, onConfirm, onDecline, onClose}: {
    match: PadelMatch | null;
    onConfirm: () => void;
    onDecline: () => void;
    onClose: () => void;
}) => {

    return (
        <>
            <div className="overflow-hidden w-11/12 rounded-lg shadow-2xl bg-white p-4 text-black">
                <div className="flex flex-col items-center">
                    <div className="flex flex-col gap-8 mt-5 p-4 w-full">

                        {match && (
                            <>
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <h1 className="text-xl">Bekræft resultat af kamp</h1>
                                    <h1 className="italic">{safeFormatDate(match.matchDateTime, "dd. MMM HH:mm")} - {safeFormatDate(match.endTime, "HH:mm")}</h1>

                                    <div className="grid grid-cols-2 w-full gap-4">
                                        <div
                                            className="grid grid-rows-2 justify-items-center gap-4 w-full border border-blue-500 rounded-xl">
                                            {match.winningTeam?.map((player => (
                                                <div key={player} className="flex flex-col">
                                                    <h1>{player}</h1>
                                                </div>
                                            )))}
                                        </div>
                                        <div
                                            className="grid grid-rows-2 justify-items-center gap-4 w-full border border-red-500 rounded-xl">
                                            {match.losingTeam?.map((player => (
                                                <div key={player} className="flex flex-col">
                                                    <h1>{player}</h1>
                                                </div>
                                            )))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h1 className="italic">{match.username} har rapporteret følgende:</h1>
                                    <div>
                                        {(match.team1Sets && match.team2Sets) && match.team1Sets !== match.team2Sets ? (
                                            match.team1Sets > match.team2Sets ? (
                                                <>
                                                    <h1> <strong>{match.winningTeam?.[0]}</strong> og <strong>{match.winningTeam?.[1]}</strong> vinder sammenlagt <strong>{match.team1Sets} - {match.team2Sets}</strong> med cifferne:
                                                    </h1>
                                                </>
                                            ) : (
                                                <h1>
                                                    {match.winningTeam?.[0]} og {match.winningTeam?.[1]} vinder sammenlagt {match.team2Sets}-{match.team1Sets}
                                                </h1>
                                            )
                                        ) : (
                                            <h1>Kampen endte uafgjort med cifferne:</h1>
                                        )}
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        {Object.values(match.score || {})
                                            .filter((set) => set?.score)
                                            .map((set, index) => {
                                                const [team1Score, team2Score] = set.score.split("-").map(Number);

                                                const isTeam1Winner = (match.team1Sets ?? 0) > (match.team2Sets ?? 0);
                                                const isSetWonByWinner = isTeam1Winner
                                                    ? team1Score > team2Score
                                                    : team2Score > team1Score;


                                                const colorClass = isSetWonByWinner
                                                    ? "bg-gradient-to-br from-blue-400 to-blue-800"
                                                    : "bg-gradient-to-br from-red-500 to-red-900";

                                                return (
                                                    <span
                                                        key={index}
                                                        className={`rounded-xl ${colorClass} p-2 text-white w-full text-center`}
                                                    >
                                                        {set.score}
                                                    </span>
                                                );
                                            })}
                                    </div>



                                    <h1 className="font-semibold">Bekræfter du dette resultat?</h1>

                                    <div className="flex justify-between">
                                        <button
                                            onClick={onDecline}
                                            className="bg-gradient-to-br from-red-400 to-red-800 text-white px-4 py-2 rounded-lg"
                                        >
                                            Afvis
                                        </button>
                                        <button
                                            onClick={onConfirm}
                                            className="bg-gradient-to-br from-green-400 to-green-800 text-white px-4 py-2 rounded-lg"
                                        >
                                            Bekræft
                                        </button>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="bg-gradient-to-br from-gray-400 to-gray-800 text-white px-4 py-2 rounded-lg mt-4"
                                    >
                                        Luk
                                    </button>
                                </div>
                            </>
                        )}



                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmMatchResultDialog;
