import { User } from "../../types/user.ts";

export const ProfileHeader = ({ profile }: { profile: User | null }) => {
    if (!profile) return null;

    const isAdmin = profile.role === "admin";

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <img
                    src={"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={profile.fullName}
                    className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {profile.fullName}
                    </h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-sm font-medium">
                            Niveau {profile.skillLevel}
                        </span>
                        {isAdmin && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                                Admin
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
