import {Helmet} from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import {safeFormatDate} from "../../../utils/dateUtils.ts";
import {useEffect, useState} from "react";
import {PadelMatch} from "../../../types/PadelMatch.ts";
import {useNavigate, useParams} from "react-router-dom";
import communityApi from "../../../services/makkerborsService.ts";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";
import { useUser } from "../../../context/UserContext.tsx";

export const MatchResultPage = () => {
    const navigate = useNavigate();
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useUser();
    const [match, setMatch] = useState<PadelMatch | null>(null);
    const [player1, setPlayer1] = useState("");
    const [player2, setPlayer2] = useState("");
    const [player3, setPlayer3] = useState("");
    const [player4, setPlayer4] = useState("");
    const [team1, setTeam1] = useState<string[]>([]);
    const [team2, setTeam2] = useState<string[]>([]);
    const [setsWonTeam1, setSetsWonTeam1] = useState(0);
    const [setsWonTeam2, setSetsWonTeam2] = useState(0);
    const [detailedScore, setDetailedScore] = useState(false);
    const totalSets = setsWonTeam1 + setsWonTeam2;
    const [setScores, setSetScores] = useState<{ team1: number; team2: number }[]>([]);

    useEffect(() => {
        if (!matchId) return;


        const fetchMatch = async () => {
            try {
                const response = await communityApi.getMatchById(matchId);
                setMatch(response);
            } catch (error) {
                console.error("Error fetching match data:", error);
            }
        }
        fetchMatch().then()
    }, [matchId]);

    useEffect(() => {
        setTeam1([player1, player2].filter(Boolean));
        setTeam2([player3, player4].filter(Boolean));
    }, [player1, player2, player3, player4]);


    if (!match || !matchId || !user) {
        return (
            <>
                <div className="w-full flex justify-center items-center">
                    <LoadingSpinner />
                </div>
            </>
        )
    }

    const totalLength = safeFormatDate(match.matchDateTime, "EEEE | dd. MMMM | HH:mm").length + safeFormatDate(match.endTime, "HH:mm").length;

    const allPlayers = [...match.participants, ...match.reservedSpots.map((r) => r.name)];
    const getAvailablePlayers = (exclude: string[]) => {
        return allPlayers.filter((player) => !exclude.includes(player));
    };

    const handleScoreChange = (index: number, team: 'team1' | 'team2', value: number) => {
        setSetScores(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [team]: value };
            return updated;
        });
    };

    const generateScoreObject = (): NonNullable<PadelMatch["score"]> => {
        const score: NonNullable<PadelMatch["score"]> = {};
        const keys = ["firstSet", "secondSet", "thirdSet", "fourthSet", "fifthSet"] as const;

        setScores.forEach((set, index) => {
            const key = keys[index];
            score[key] = {
                score: `${set.team1}-${set.team2}`,
            };
        });

        return score;
    };



    const handleSubmitResult = async () => {
        if (!matchId) return;

        const matchResult: PadelMatch = {
            ...match,
            team1Sets: setsWonTeam1,
            team2Sets: setsWonTeam2,
            winningTeam: setsWonTeam1 > setsWonTeam2 ? team1 : team2,
            losingTeam: setsWonTeam1 < setsWonTeam2 ? team1 : team2,
            score: detailedScore ? generateScoreObject() : undefined,
            playersConfirmedResult: [...(match.playersConfirmedResult || []), user?.username],
        };


        try {
            const userConfirmed = confirm("Er du sikker på, at du vil indsende dette resultat?");
            if (userConfirmed) {
                await communityApi.submitMatchResult(matchId, matchResult);
                navigate(`/makkerbørs/minekampe`);
            }
        } catch (error) {
            console.error("Error updating match:", error);
            alert("Der opstod en fejl ved indsendelse af resultatet.");
        }
    };



    return (
        <>
            <Helmet>
                <title>Indtast resultat</title>
            </Helmet>

            <HomeBar />
            <Animation>

                <div className="flex flex-col gap-4 mx-4 my-10 text-sm">


                    <h1 className={`border-b pb-2 text-center font-semibold ${totalLength > 31 ? "text-lg" : totalLength > 37 ? "text-md" : "text-xl"}`}>
                        {safeFormatDate(match.matchDateTime, "EEEE | dd. MMMM | HH:mm").toUpperCase()} - {safeFormatDate(match.endTime, "HH:mm")}
                    </h1>

                    <div className="flex justify-end">
                    <button onClick={() => {
                        setPlayer1("");
                        setPlayer2("");
                        setPlayer3("");
                        setPlayer4("");
                    }} type="button" className="bg-red-500 rounded-lg px-4 py-2">
                        Ryd spillerfelter
                    </button>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                    <label className="text-xl">Hold 1</label>

                    <div className="grid grid-cols-2 border p-4 rounded-md border-blue-500 gap-6">
                        <select
                            value={player1}
                            onChange={(e) => setPlayer1(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                        >
                            <option value="" disabled>Vælg spiller 1</option>
                            {getAvailablePlayers([player2, player3, player4]).map((player) => (
                                <option key={player} value={player}>{player}</option>
                            ))}
                        </select>


                        <select
                            value={player2}
                            onChange={(e) => setPlayer2(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                        >
                            <option value="" disabled>Vælg spiller 2</option>
                            {getAvailablePlayers([player1, player3, player4]).map((player) => (
                                <option key={player} value={player}>{player}</option>
                            ))}
                        </select>
                    </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <label className="text-xl">Hold 2</label>

                    <div className="grid grid-cols-2 border p-4 rounded-md border-red-500 gap-6">
                        <select
                            value={player3}
                            onChange={(e) => setPlayer3(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                        >
                            <option value="" disabled>Vælg spiller 3</option>
                            {getAvailablePlayers([player1, player2, player4]).map((player) => (
                                <option key={player} value={player}>{player}</option>
                            ))}
                        </select>

                        <select
                            value={player4}
                            onChange={(e) => setPlayer4(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                        >
                            <option value="" disabled>Vælg spiller 4</option>
                            {getAvailablePlayers([player1, player2, player3]).map((player) => (
                                <option key={player} value={player}>{player}</option>
                            ))}
                        </select>
                    </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-lg font-semibold">Antal sæt:</h1>

                            <div className="flex gap-2 items-center">
                            <input type="checkbox" className="size-4 rounded" id="detaljeretscore" disabled={totalSets === 0} checked={detailedScore} onChange={(e) => setDetailedScore(e.target.checked)} />
                            <label htmlFor="detaljeretscore">Detaljeret score</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-10">


                            <div className="flex flex-col items-center gap-1">
                                <label>Hold 1</label>
                                <select
                                    value={setsWonTeam1}
                                    onChange={(e) => setSetsWonTeam1(Number(e.target.value))}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black">
                                    {[0,1,2,3,4,5].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>


                            <div className="flex flex-col items-center gap-1">
                                <label>Hold 2</label>
                                <select
                                    value={setsWonTeam2}
                                    onChange={(e) => setSetsWonTeam2(Number(e.target.value))}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                                >
                                    {[0,1,2,3,4,5].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {detailedScore && totalSets > 0 && (
                        <div className="flex flex-col justify-between gap-4 mt-5">
                            <div className="flex justify-around items-center">
                            <label>Hold 1</label>
                            <label>Hold 2</label>
                            </div>
                            {[...Array(totalSets)].map((_, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2">
                                    <select
                                        value={setScores[index]?.team1 ?? 0}
                                        onChange={(e) => handleScoreChange(index, "team1", Number(e.target.value))}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                                    >
                                        {[0,1,2,3,4,5,6,7].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={setScores[index]?.team2 ?? 0}
                                        onChange={(e) => handleScoreChange(index, "team2", Number(e.target.value))}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-black"
                                    >
                                        {[0,1,2,3,4,5,6,7].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>

                                </div>
                            ))}
                        </div>
                    )}


                    {totalSets > 0 && (
                    <button type="button" onClick={handleSubmitResult} className="bg-cyan-500 p-2 px-4 rounded-lg mt-4">
                        Indsend resultat
                    </button>
                    )}
                </div>


            </Animation>

        </>
    );
};

export default MatchResultPage;