import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../../context/UserContext.tsx";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../misc/LoadingSpinner.tsx";

export const GroupsTab = () => {
    const navigate = useNavigate();
    const { user, loading } = useUser();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <>
                <div className="w-full flex justify-center items-center">
                    <LoadingSpinner />
                </div>
            </>
        )
    }

    return (
        <>
            <Helmet>
                <title>Grupper</title>
            </Helmet>

            <div>
                <button
                    onClick={() => navigate("opretgruppe")}
                    className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500 text-sm"
                >
                    Ny gruppe
                </button>
            </div>

            {user?.groups?.map((group) => (
                <div key={group.id} className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 onClick={() => navigate(`${group.id}`)} className="text-lg font-semibold text-gray-300">{group.name}</h2>
                            <p className="text-sm text-gray-300">Medlemmer: {group.members.length}</p>
                        </div>

                        <div
                            className="transition-transform duration-300 transform cursor-pointer"
                            onClick={() => toggleGroup(group.id)}
                        >
                            <ChevronRightIcon
                                className={`h-6 text-gray-300 transition-transform duration-300 transform ${
                                    expandedGroups.has(group.id) ? "rotate-90" : "rotate-0"
                                }`}
                            />
                        </div>
                    </div>

                    {expandedGroups.has(group.id) && (
                        <div className="text-gray-300 space-y-1">
                            {group.members.map((member, index) => (
                                <div key={index} className="border-b py-1">
                                    {member}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
};

export default GroupsTab;
