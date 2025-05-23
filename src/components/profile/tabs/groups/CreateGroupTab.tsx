import { Helmet } from "react-helmet-async";
import BackArrow from "../../../misc/BackArrow";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../../context/UserContext";
import { FormEvent, useEffect, useState } from "react";
import userProfileService from "../../../../services/userProfileService";
import { mockUsers } from "../../../../utils/mock/mockUsers";
import { DaoGroupUser } from "../../../../types/daoGroupAllUsers";

export const CreateGroupTab = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<DaoGroupUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers =
    allUsers?.filter(
      (u) =>
        (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !selectedUsers.some((member: DaoGroupUser) => member.id === u.id)
    ) || [];

  const handleSelectUser = (user: DaoGroupUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
  };

  const useMockData = false;

  useEffect(() => {
    const fetchUsers = async () => {
      setAllUsers([]); // Reset allUsers
      setSelectedUsers([]); // Reset selectedUsers
      setGroupName(""); // Reset groupName
      setSearchQuery(""); // Reset searchQuery
      setError(null); // Reset error

      if (!user?.username) {
        setError("Du skal være logget ind for at hente brugere.");

        return;
      }

      if (useMockData) {
        const filteredMockUsers = mockUsers.filter(
          (u) => u.username !== user.username
        );
        setAllUsers(filteredMockUsers);
      } else {
        try {
          const response = await userProfileService.getAllUsers();
          const filteredResponse = (response || []).filter(
            (u) => u.username !== user.username
          );
          setAllUsers(filteredResponse);
        } catch (error) {
          console.error("Error fetching users:", error);
          setError("Der opstod en fejl under indlæsning af brugere.");
        }
      }
    };
    fetchUsers().then();
  }, [useMockData, user?.username]);

  const handleCreateGroup = async (event: FormEvent) => {
    event.preventDefault();

    if (userLoading) {
      setError("Vent venligst, indlæser brugerdata...");
      return;
    }

    if (!user?.username) {
      setError("Du skal være logget ind for at oprette en gruppe.");
      return;
    }
    try {
      const groupMembers = selectedUsers.map((member) => member.username);

      const newGroup = {
        id: Date.now().toString(),
        name: groupName,
        members: groupMembers,
      };
      await userProfileService.updateUserProfile(user.username, {
        groups: [...(user.groups || []), newGroup],
      });
      await refreshUser(true);
      navigate(`/profil/${user.username}/grupper`);
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Kunne ikke oprette gruppe.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Opret gruppe</title>
      </Helmet>

      <BackArrow />

      <div className="w-full bg-slate-800/80 rounded-xl p-4 text-gray-300">
        {error && (
          <div className="mb-4 text-red-500">
            {error}
            {error.includes("logget ind") && (
              <button
                onClick={() => navigate("/")}
                className="ml-2 bg-cyan-500 text-white rounded px-2 py-1"
              >
                Log ind
              </button>
            )}
          </div>
        )}

        <form className="space-y-10" onSubmit={handleCreateGroup}>
          <div className="lg:grid grid-cols-3 gap-4 max-lg:flex max-lg:flex-col">
            <div>
              <label
                className="font-semibold text-gray-300"
                htmlFor="gruppenavn"
              >
                Gruppenavn
              </label>
              <div className="pr-1">
                <input
                  type="text"
                  className="w-full rounded-lg h-12 border-slate-800/80 bg-slate-800/80 resize-none text-gray-300"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="font-semibold text-gray-300"
                htmlFor="tilføjmedlemmer"
              >
                Tilføj medlemmer
              </label>
              <div className="relative pr-1">
                <input
                  type="text"
                  className="w-full rounded-lg h-12 border-slate-800/80 bg-slate-800/80 resize-none text-gray-300"
                  placeholder="Søg efter spillere..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <div className="absolute z-10 border-slate-800/80 bg-slate-800 w-3/4 border rounded mt-1 max-h-40 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleSelectUser(member)}
                          className="px-4 py-2 cursor-pointer"
                        >
                          <h1 className="truncate text-gray-300">
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
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h2 className="font-semibold mb-2 text-gray-300">
                  Valgte medlemmer:
                </h2>
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
                        {member.fullName
                          ? `${member.fullName} (${member.username})`
                          : member.username}
                      </h1>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
          >
            Opret gruppe
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateGroupTab;
