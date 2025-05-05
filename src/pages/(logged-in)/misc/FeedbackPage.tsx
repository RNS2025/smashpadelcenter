import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {Feedback} from "../../../types/Feedback.ts";
import feedbackService from "../../../services/feedbackService.ts";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import {safeFormatDate} from "../../../utils/dateUtils.ts";

export const FeedbackPage = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([]);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const response = await feedbackService.getAllFeedbacks();
                const filteredResponse = response.sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB.getTime() - dateA.getTime();
                }).sort((a => a.resolved ? 1 : -1));
                setFeedback(filteredResponse);
            } catch (error) {
                console.error("Error fetching feedback:", error);
            }
        }
        fetchFeedback().then();
    }, []);

    const handleResolve = async (feedbackId: string) => {
        const userConfirmed = confirm("Er du sikker på, at du vil markere denne feedback som løst?");

        if (userConfirmed) {
            try {
                await feedbackService.resolveFeedback(feedbackId);
                setFeedback((prevFeedback) =>
                    prevFeedback.map((item) =>
                        item._id === feedbackId ? {...item, resolved: true} : item
                    )
                );
            } catch (error) {
                console.error("Error resolving feedback:", error);
            }
        }
    };


    return (
        <>
            <Helmet>
                <title>Se feedback</title>
            </Helmet>

            <HomeBar />
            <Animation>

            <div className="flex flex-col items-center justify-center my-5">
                <h1 className="text-2xl font-bold mb-4">Feedback</h1>
                <div className="w-full px-6">
                    {feedback.map((item) => (
                        <div onClick={() => handleResolve(item._id)} key={item._id} className={`flex flex-col gap-2 p-4 border rounded mb-2 ${item.resolved ? "opacity-20" : ""}`}>
                            <h2 className="font-semibold break-words max-w-full">{item.page}</h2>
                            <p>{item.body}</p>
                            <p className="text-gray-500 text-sm">Bruger: {item.username}</p>
                            <p className="text-gray-500 text-sm">{safeFormatDate(item.date, "dd/MM/yyyy HH:mm")}</p>
                        </div>
                    ))}
                </div>
            </div>
            </Animation>
        </>
    );
};

export default FeedbackPage;