import { User } from "../../types/user.ts";
import {EnvelopeIcon, PhoneIcon} from "@heroicons/react/24/outline";
import rankedinLogo from "../../assets/rankedin_logo.png";
import RankedInPlayerSearchResult from "../../types/RankedInProfile.ts";

export const ProfileHeader = ({ profile, rankedInProfile }: { profile: User | null; rankedInProfile?: RankedInPlayerSearchResult; }) => {
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


                    <div className="flex flex-col mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {profile.fullName}
                    </h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    </div>


                    <div className="flex gap-2">
                        <EnvelopeIcon className="h-6 text-gray-600" />
                        <p className="text-gray-600">{profile.email}</p>
                    </div>

                    {rankedInProfile && (
                    <div className="flex gap-2">
                        <img src={rankedinLogo} alt={rankedinLogo} className="h-6 w-6" />
                        <div>
                        <a target={"_blank"} href={`https://rankedin.com${rankedInProfile.participantUrl}`} className="text-blue-600">{rankedInProfile.participantName}</a>
                        <h1 className="text-blue-600">(#{rankedInProfile.standing}) {rankedInProfile.points} point</h1>
                        </div>
                    </div>
                    )}

                    {profile.phoneNumber && (
                    <div className="flex gap-2">
                        <PhoneIcon className="h-6 text-gray-600" />
                        <p className="text-gray-600">{profile.phoneNumber}</p>
                    </div>
                    )}


                    <div className="mt-2 flex items-center gap-2">
                        <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded font-medium">
                            Niveau {profile.skillLevel}
                        </span>
                        {isAdmin && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
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
