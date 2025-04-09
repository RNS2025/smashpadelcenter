import {Helmet} from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import {useEffect, useState} from "react";
import Tournament from "../../../types/Tournament.ts";
import rankedInService from "../../../services/rankedIn.ts";

export const TournamentsResultsPage = () => {

    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [, setLoading] = useState({
        tournaments: false,
        rows: false,
        players: false,
        checkIn: false,
    });


    useEffect(() => {
        const fetchNextTournament = async () => {
            try {
                setLoading((prev) => ({ ...prev, tournaments: true }));
                const tournament = await rankedInService.getUpcomingTournament();
                setSelectedTournament(tournament);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading((prev) => ({ ...prev, tournaments: false }));
            }
        };

        fetchNextTournament().then();
    }, []);


    return (
        <>
            <Helmet>
                <title>Resultater</title>
            </Helmet>

            <div className="w-full h-screen flex flex-col">
                <HomeBar backPage="/turneringer"/>
                    <iframe
                        src={`https://rankedin.com${selectedTournament?.joinUrl}/draws`}
                        title="RankedIn-resultater"
                        className="w-full h-full"
                        allowFullScreen
                        sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
                    />
            </div>


        </>
    );
};

export default TournamentsResultsPage;