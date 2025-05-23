import { Helmet } from "react-helmet-async";
import Animation from "../../components/misc/Animation";
import { useEffect, useState } from "react";
import { TournamentResponse, Match } from "../../types/RankedInMatchData";

export const TournamentDrawsPage = () => {
    const [draws, setDraws] = useState<TournamentResponse[]>([]);

    useEffect(() => {
        const fetchDraws = async () => {
            try {
                const res = await fetch(
                    "https://api.rankedin.com/v1/tournament/GetDrawsForStageAndStrengthAsync?tournamentClassId=116814&drawStrength=0&drawStage=0&isReadonly=true&language=en"
                );
                const data: TournamentResponse[] = await res.json();
                setDraws(data);
            } catch (err) {
                console.error("Fejl ved hentning af bracket:", err);
            }
        };

        fetchDraws().then();
    }, []);

    const splitName = (fullName: string) => {
        const parts = fullName.trim().split(" ");
        const lastName = parts.pop() || "";
        const firstInitial = parts.join(" ").charAt(0);
        return { firstName: `${firstInitial}.`, lastName };
    };

    const renderMatchCell = (match: Match | null) => {
        if (!match) return <div className="h-20" />;

        return (
            <div
                key={match.MatchId}
                className="bg-white rounded w-full shadow border border-cyan-500 mb-2 text-xxs"
            >
                {[match.ChallengerParticipant, match.ChallengedParticipant].map(
                    (team) => {
                        const p1 = splitName(team.FirstPlayer.Name);
                        const p2 = splitName(team.SecondPlayer.Name);
                        const teamId = team.EventParticipantId;
                        const winnerId = match.WinnerParticipantId;
                        const isWinner = teamId === winnerId;

                        const score = match.MatchViewModel.Score;
                        const challengerId = match.ChallengerParticipant.EventParticipantId;
                        const challengedId = match.ChallengedParticipant.EventParticipantId;
                        const isFirstParticipantChallenger = score.IsFirstParticipantWinner
                            ? winnerId === challengerId
                            : winnerId !== challengerId;

                        const isFirstParticipant = teamId === (isFirstParticipantChallenger ? challengerId : challengedId);
                        const scoreText = isFirstParticipant
                            ? score.FirstParticipantScore?.toString()
                            : score.SecondParticipantScore?.toString();


                        const scoreColor = isWinner ? "text-green-600" : "text-red-600";

                        return (
                            <div
                                key={teamId}
                                className="flex justify-between items-center mb-1 p-1 rounded bg-gray-100 text-black"
                            >
                                <div className="w-20">
                                    <h1>{p1.firstName} {p1.lastName}</h1>
                                    <h1>{p2.firstName} {p2.lastName}</h1>
                                </div>
                                <div className={`font-bold text-sm ${scoreColor}`}>
                                    {scoreText}
                                </div>
                            </div>
                        );
                    }
                )}
            </div>
        );
    };

    return (
        <>
            <Helmet>
                <title>Lodtrækninger</title>
            </Helmet>

            <Animation>

                {draws.map((draw, i) => {
                    const elim = draw.Elimination;
                    if (!elim?.DrawCells || elim.Height === undefined || elim.Width === undefined) return null;

                    const height = elim.Height;
                    const width = elim.Width;

                    const grid: (Match | null)[][] = Array.from(
                        { length: height },
                        () => Array.from({ length: width }, () => null)
                    );

                    elim.DrawCells.forEach((match) => {
                        const round = match.Round - 1;
                        const rowIndex = grid.findIndex((row) => !row[round]);
                        if (rowIndex !== -1) {
                            grid[rowIndex][round] = match;
                        }
                    });

                    return (
                        <div key={i} className="mb-12">
                            <h2 className="text-xs font-semibold my-2">
                                Placering: {elim.PlacesStartPos} - {elim.PlacesEndPos}
                            </h2>
                            <div className="flex overflow-x-auto gap-4">
                                {Array.from({ length: elim.Width }).map((_, colIndex) => (
                                    <div key={colIndex} className="flex flex-col min-w-[110px]">
                                        <h3 className="text-center font-bold mb-2 text-xxs">
                                            Runde {colIndex + 1}
                                        </h3>
                                        {grid.map((row, rowIndex) => {
                                            const match = row[colIndex];
                                            if (!match) return <div className="h-20" key={rowIndex} />;


                                            const marginTop =
                                                rowIndex === 0
                                                    ? colIndex === 0
                                                        ? 0 : Math.pow(2, colIndex + 1) * 23 : 30;

                                            return (
                                                <div key={match.MatchId} style={{ marginTop: `${marginTop}px` }}>
                                                    {renderMatchCell(match)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                            </div>
                        </div>
                    );
                })}
            </Animation>
        </>
    );
};

export default TournamentDrawsPage;
