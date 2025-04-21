import React from "react";
import { UserProfile } from "../../../../types/UserProfile";

interface MatchesTabProps {
  profile: UserProfile;
}

const MatchesTab: React.FC<MatchesTabProps> = ({ profile }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Kamphistorik</h2>
      <div className="overflow-hidden shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Dato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Modstander
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Resultat
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profile.pastMatches.length ? (
              profile.pastMatches.map((match) => (
                <tr
                  key={match.id}
                  className="hover:bg-gray-50 transition duration-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(match.date).toLocaleDateString("da-DK")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {match.opponent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {match.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        match.result === "win"
                          ? "bg-green-100 text-green-800"
                          : match.result === "loss"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {match.result === "win"
                        ? "SEJR"
                        : match.result === "loss"
                        ? "NEDERLAG"
                        : match.result.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-600"
                >
                  Ingen kampe fundet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTab;
