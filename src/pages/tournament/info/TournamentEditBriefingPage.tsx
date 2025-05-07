import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import briefingService from "../../../services/briefingService.ts";
import { Briefing } from "../../../types/Briefing.ts";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export const TournamentEditBriefingPage = () => {
    const { briefingId } = useParams<{ briefingId: string }>();
    const navigate = useNavigate();
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const response = await briefingService.getBriefingById(briefingId!);
                setBriefing(response);
            } catch (error) {
                console.error("Error fetching briefing:", error);
            }
        };
        fetchBriefing().then();
    }, [briefingId]);

    const handleSave = async () => {
        if (!briefing) return;
        setSaving(true);
        try {
            await briefingService.updateBriefing(briefingId!, { body: briefing.body });
            navigate("/turneringer/info/briefing");
        } catch (error) {
            console.error("Error updating briefing:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        const userConfirmed = confirm("Er du sikker på, at du vil annullere ændringerne?");
        if (userConfirmed) {
            navigate("/turneringer/info/briefing");
        }
    }

    return (
        <>
            <Helmet>
                <title>Rediger briefing</title>
            </Helmet>

            <HomeBar />
            <Animation>
                <div className="my-5 p-4 lg:p-10">
                    {briefing && (
                        <>
                            <ReactQuill
                                value={briefing.body}
                                onChange={(content) => setBriefing(prev => prev ? { ...prev, body: content } : null)}
                                theme="snow"
                                className="bg-white text-black rounded-lg"
                            />
                            <div className="flex justify-between">
                            <button
                                onClick={handleCancel}
                                className="mt-4 bg-red-500 text-white rounded px-4 py-2"
                            >
                                Annuller
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="mt-4 bg-green-500 text-white rounded px-4 py-2"
                            >
                                {saving ? "Gemmer..." : "Gem ændringer"}
                            </button>
                            </div>
                        </>
                    )}
                </div>
            </Animation>
        </>
    );
};

export default TournamentEditBriefingPage;
