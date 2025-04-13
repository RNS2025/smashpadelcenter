import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import {TeamInfo} from "../../../types/LunarTypes.ts";

type SortableFields = "Name" | "Division";

const TeamListTable = ({ teams, onRowClick }: {
    teams: TeamInfo[];
    onRowClick?: (team: TeamInfo) => void;
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortableFields>("Name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");


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
                className="max-sm:w-64 max-sm:text-xs w-96 text-gray-900 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="overflow-auto max-h-[600px] rounded-lg border border-gray-200 shadow-lg my-5">

                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-gray-900 text-sm max-lg:text-xs">
                    <thead className="text-left bg-gray-300 font-bold">
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

                    <tbody className="divide-y divide-gray-300">
                    {filteredAndSortedTeams.length > 0 ? (
                        filteredAndSortedTeams.map((team) => (
                            <tr
                                key={team.id}
                                className="hover:bg-cyan-500 cursor-pointer transition-colors duration-500"
                                onClick={() => onRowClick?.(team)}
                            >
                                <td className="sm:px-4 max-sm:px-2 sm:py-4 max-sm:py-1">{team.name}</td>
                                <td className="sm:px-4 max-sm:px-2 sm:py-4 max-sm:py-1">{team.division}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3}>
                                <div className="flex justify-center items-center py-10 text-gray-500">
                                <LoadingSpinner/>
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
