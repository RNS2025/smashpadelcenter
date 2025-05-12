import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../../context/UserContext.tsx";
import { FormEvent, useEffect, useState } from "react";
import userProfileService from "../../../../services/userProfileService.ts";
import BackArrow from "../../../misc/BackArrow.tsx";
import { DaoGroupUser } from "../../../../types/daoGroupAllUsers.ts";

export const EditGroupTab = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading: userLoading } = useUser();
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<DaoGroupUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = allUsers.filter(
      (u) =>
          u.username !== user?.username &&
          (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !selectedUsers.some((member: DaoGroupUser) => member.id === u.id)
  );


  const handleSelectUser = (user: DaoGroupUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
  };

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await userProfileService.getAllUsers();
        const filteredUsers = (response || []).filter(
            (u) => u.username !== user?.username
        );
        setAllUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Der opstod en fejl under indlæsning af brugere.");
      }
    };

    fetchAllUsers().then();
  }, [user]);

  useEffect(() => {
    if (!user || !groupId || allUsers.length === 0) return;

    const userGroups = user.groups || [];
    const group = userGroups.find((g) => g.id === groupId);

    if (group) {
      setGroupName(group.name);
      const groupMembers = group.members || [];
      const members = allUsers.filter((u) => groupMembers.includes(u.username));
      setSelectedUsers(members);
    } else {
      setError("Gruppen blev ikke fundet.");
    }
  }, [user, groupId, allUsers]);


  const handleEditGroup = async (event: FormEvent) => {
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

      const updatedGroups = (user.groups || []).map((group) =>
        group.id === groupId
          ? { ...group, name: groupName, members: groupMembers }
          : group
      );

      await userProfileService.updateUserProfile(user.username, {
        groups: updatedGroups,
      });
      navigate(`/profil/${user.username}/grupper`);
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Kunne ikke oprette gruppe.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!user?.username || !groupId) {
      setError("Ugyldig handling – mangler bruger eller gruppe.");
      return;
    }

    try {
      const updatedGroups = (user.groups || []).filter(
        (group) => group.id !== groupId
      );

      const userConfirmed = confirm(
        "Er du sikker på at du vil slette gruppen?"
      );
      if (userConfirmed) {
        await userProfileService.updateUserProfile(user.username, {
          groups: updatedGroups,
        });
        navigate(`/profil/${user.username}/grupper`);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("Kunne ikke slette gruppe.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Rediger gruppe</title>
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

        <form className="space-y-10" onSubmit={handleEditGroup}>
          <div className="lg:grid grid-cols-3 gap-4 max-lg:flex max-lg:flex-col">
            <div>
              <label className="font-semibold" htmlFor="gruppenavn">
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
              <label className="font-semibold" htmlFor="tilføjmedlemmer">
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
            </div>

            {selectedUsers.length > 0 && (
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

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
            >
              Gem gruppe
            </button>

            <button
              type="button"
              onClick={handleDeleteGroup}
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-red-500"
            >
              Slet gruppe
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditGroupTab;
