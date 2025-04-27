import { useEffect, useState } from "react";
import { User } from "../../../types/user.ts";
import { mockUsers } from "../../../utils/mock/mockUsers.ts";
import userProfileService from "../../../services/userProfileService.ts";
import communityApi from "../../../services/makkerborsService.ts";
import { PadelMatch } from "../../../types/PadelMatch.ts";
import { DaoGroupUser } from "../../../types/daoGroupAllUsers.ts";

export const MatchInvitePlayersDialog = ({
  user,
  match,
  onInvite,
  onClose,
}: {
  user: User;
  match: PadelMatch;
  onInvite: (match: PadelMatch) => void;
  onClose: () => void;
}) => {
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<DaoGroupUser[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [, setError] = useState<string | null>(null);

  const useMockData = false;

  useEffect(() => {
    const fetchUsers = async () => {
      if (useMockData) {
        setAllUsers(mockUsers);
      } else {
        try {
          const response = await userProfileService.getAllUsers();
          setAllUsers(response.users || []);
        } catch (error) {
          console.error("Error fetching users:", error);
          setError("Der opstod en fejl under indlæsning af brugere.");
        }
      }
    };
    fetchUsers().then();
  }, [useMockData]);

  const handleInvitePlayers = async () => {
    if (!match || selectedUsers.length === 0) return;

    try {
      const invitedPlayers = selectedUsers.map((user) => user.username);

      const updatedMatch = await communityApi.invitePlayersToMatch(
        match.id,
        invitedPlayers
      );

      console.log("Updated match after inviting players:", updatedMatch);
      alert("Spillere inviteret!");
      onInvite(updatedMatch);
    } catch (error: any) {
      console.error("Error inviting players:", error);
      alert(error.response?.data?.message || "Fejl ved invitation");
      setError("Fejl ved invitation");
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedUsers.some((member: DaoGroupUser) => member.id === u.id)
  );

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
  };

  const handleGroupSelect = (groupId: string) => {
    const group = user.groups?.find((g) => g.id === groupId);
    if (!group) return;

    const groupMembers = allUsers.filter((u) =>
      group.members.includes(u.username)
    );

    setSelectedUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id));
      const newUsers = groupMembers.filter((u) => !existingIds.has(u.id));
      return [...prev, ...newUsers];
    });
  };

  return (
    <>
      <div className="overflow-hidden w-11/12 rounded-lg shadow-2xl bg-white p-4 text-black">
        <div className="flex flex-col items-center">
          <div className="flex flex-col gap-8 mt-5 p-4 w-full">
            {user && (
                            <div>
                                <label htmlFor="grupper" className="block text-sm font-medium text-gray-700">
                                    Vælg en gruppe
                                </label>

                                <select
                                    id="grupper"
                                    name="grupper"
                                    defaultValue=""
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    onChange={(e) => handleGroupSelect(e.target.value)}
                                >
                                    <option value="">Ingen gruppe</option>
                                    {user.groups?.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

            <div>
              <label
                htmlFor="spillere"
                className="block text-sm font-medium text-gray-700"
              >
                Enkelte spillere
              </label>
              <input
                type="text"
                className="w-full rounded-lg h-12"
                placeholder="Søg efter spillere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery && (
                <div className="absolute z-10 bg-white w-full border border-black rounded mt-1 max-h-40 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectUser(member)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <h1 className="truncate">
                          {member.fullName} ({member.username})
                        </h1>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-400">
                      Ingen brugere fundet
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <>
                <div className="mt-4">
                  <h2 className="font-semibold mb-2">Valgte medlemmer:</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((member) => (
                      <div
                        onClick={() =>
                          setSelectedUsers((prev) =>
                            prev.filter((u) => u.id !== member.id)
                          )
                        }
                        key={member.id}
                        className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm"
                      >
                        <h1 className="truncate">
                          {member.fullName} ({member.username})
                        </h1>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <button
                onClick={onClose}
                type="button"
                className="bg-gray-500 hover:bg-gray-600 transition duration-300 rounded-lg py-2 px-4 text-white mt-4"
              >
                Annuller
              </button>

              <button
                onClick={handleInvitePlayers}
                type="button"
                disabled={selectedUsers.length === 0}
                className={`bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white mt-4 ${
                  selectedUsers.length === 0 ? "opacity-50" : ""
                }`}
              >
                Inviter spillere
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchInvitePlayersDialog;
