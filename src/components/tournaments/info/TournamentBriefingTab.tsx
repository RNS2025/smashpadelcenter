import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Briefing } from "../../../types/Briefing.ts";
import briefingService from "../../../services/briefingService.ts";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext.tsx";

export const TournamentBriefingTab = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [briefings, setBriefing] = useState<Briefing[]>([]);

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const response = await briefingService.getAllBriefings();
                setBriefing(response);
            } catch (error) {
                console.error("Error fetching briefing:", error);
            }
        };
        fetchBriefing().then();
    }, []);

    return (
        <>
            <Helmet>
                <title>Briefing</title>
            </Helmet>

            <div className="p-4 sm:justify-self-center">
                {briefings.length > 0 && user?.username === "admin" && (
                    <button
                        onClick={() => navigate(`redigerbriefing/${briefings[0]._id}`)}
                        type="button"
                        className="bg-cyan-500 rounded p-2"
                    >
                        Rediger briefing
                    </button>
                )}

                {briefings.length > 0 && (
                    <div
                        key={briefings[0]._id}
                        className="my-4 prose prose-invert"
                        dangerouslySetInnerHTML={{ __html: briefings[0].body }}
                    />
                )}
            </div>
        </>
    );
};

export default TournamentBriefingTab;
