import {PrivateEvent} from "../../../types/PrivateEvent.ts";
import {useEffect, useState} from "react";
import {User} from "../../../types/user.ts";
import userProfileService from "../../../services/userProfileService.ts";

export const EventShowParticipantsDialog = ({event, onClose,}: {
    event: PrivateEvent;
    onClose: () => void;
}) => {

    const [participants, setParticipants] = useState<User[]>([]);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const fetchedParticipants = await Promise.all(event.participants.map(async (username) => {
                    return await userProfileService.getOrCreateUserProfile(username);
                }));
                setParticipants(fetchedParticipants);
            } catch (error) {
                console.error("Error fetching participants:", error);
            }
        }
        fetchParticipants().then();
    }, [event.participants]);

    return (
        <>
            <div className="overflow-hidden w-11/12 rounded-lg shadow-2xl bg-slate-800/80 p-4 text-gray-300">
                <div className="flex flex-col items-center gap-4">
                {participants.map((participant) => (
                  <div className="w-full flex justify-between items-center border-b pb-2">
                      <h1>{participant.fullName || participant.username}</h1>
                      <h1 className="bg-slate-500 rounded-full p-1">{participant.skillLevel.toFixed(1)}</h1>
                  </div>
                ))}
                <button type="button" className="w-full bg-slate-700/80 rounded-xl p-1 text-cyan-500" onClick={onClose}>
                    Luk vindue
                </button>
                </div>
            </div>
        </>
    );
};

export default EventShowParticipantsDialog;
