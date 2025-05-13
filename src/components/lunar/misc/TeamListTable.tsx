import {useEffect, useState} from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import { TeamInfo } from "../../../types/LunarTypes.ts";

type SortableFields = "Name" | "Division";

const TeamListTable = ({
                           teams,
                           onRowClick,
                           loading,
                       }: {
    teams: TeamInfo[];
    onRowClick?: (team: TeamInfo) => void;
    loading: boolean;
}) => {
    const storedSortField = localStorage.getItem("teamSortField") as SortableFields || "Division";
    const storedSortDirection = localStorage.getItem("teamSortDirection") as "asc" | "desc" || "asc";


    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortableFields>(storedSortField);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(storedSortDirection);

    useEffect(() => {
        localStorage.setItem("teamSortField", sortField);
        localStorage.setItem("teamSortDirection", sortDirection);
    }, [sortField, sortDirection]);

    const handleSort = (field: SortableFields) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredAndSortedTeams = [...teams]
        .filter((team) =>
            (team.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (team.division?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let valueA = "";
            let valueB = "";

            if (sortField === "Name") {
                valueA = a?.name ?? "";
                valueB = b?.name ?? "";
            } else if (sortField === "Division") {
                valueA = a?.division ?? "";
                valueB = b?.division ?? "";
            }

            try {
                return sortDirection === "asc"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } catch (err) {
                console.error("Sort error:", { valueA, valueB, sortField });
                return 0;
            }
        });

    return (
        <>
            <input
                type="text"
                placeholder="Søg efter hold..."
                className="max-sm:w-64 max-sm:text-xs w-96
                text-gray-300 px-4 py-2 border bg-slate-800/80 border-slate-800/80 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="overflow-auto max-h-[calc(100vh-240px)] rounded-lg shadow-lg my-5">
                <table className="min-w-full divide-y-2 divide-cyan-500 bg-slate-700/30 text-gray-200 text-sm rounded">
                    <thead className="text-left bg-slate-800/80 font-bold">
                    <tr>
                        <th className="px-4 py-2 cursor-pointer w-[70%]">
                            <div className="flex items-center gap-2" onClick={() => handleSort("Name")}>
                                Holdnavn
                                {sortField === "Name" &&
                                    (sortDirection === "asc" ? <ChevronUpIcon className="h-5" /> : <ChevronDownIcon className="h-5" />)}
                            </div>
                        </th>
                        <th className="px-4 py-2 cursor-pointer">
                            <div className="flex items-center gap-2" onClick={() => handleSort("Division")}>
                                Række
                                {sortField === "Division" &&
                                    (sortDirection === "asc" ? <ChevronUpIcon className="h-5" /> : <ChevronDownIcon className="h-5" />)}
                            </div>
                        </th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-cyan-500">
                    {loading ? (
                        <tr>
                            <td colSpan={3}>
                                <div className="flex justify-center items-center py-10 text-gray-500">
                                    <LoadingSpinner />
                                </div>
                            </td>
                        </tr>
                    ) : filteredAndSortedTeams.length > 0 ? (
                        filteredAndSortedTeams.map((team) => (
                            <tr
                                key={team.id}
                                onClick={() => onRowClick?.(team)}
                            >
                                <td className="sm:px-4 max-sm:px-2 py-4">{team.name}</td>
                                <td className="sm:px-4 max-sm:px-2 py-4">{team.division}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3}>
                                <div className="flex justify-center items-center py-10 text-gray-500">
                                    Ingen resultater fundet
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TeamListTable;
