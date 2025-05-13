import { User } from "../../types/user.ts";
import {EnvelopeIcon, PhoneIcon} from "@heroicons/react/24/outline";
import rankedinLogo from "../../assets/rankedin_logo.png";
import RankedInPlayerSearchResult from "../../types/RankedInProfile.ts";
import {useNavigate} from "react-router-dom";
import {useUser} from "../../context/UserContext.tsx";

export const ProfileHeader = ({ profile, rankedInProfile }: { profile: User | null; rankedInProfile?: RankedInPlayerSearchResult; }) => {
    const { user } = useUser();
    const navigate = useNavigate();
    if (!profile) return null;

    const isAdmin = profile.username === "admin";

    return (
        <div className="bg-slate-800/30 shadow-lg rounded-lg p-5 mb-6 border border-cyan-500">
            <div className="flex flex-col items-center gap-2">

                <div className="w-full grid grid-cols-3 items-center justify-items-center">
                    <div></div>
                <img
                    src={"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={profile.fullName}
                    className="size-20 rounded-full object-cover"
                />

                <div className="flex flex-col gap-2">
                        <span className="bg-cyan-200 text-cyan-800 px-2 py-1 rounded font-semibold text-sm text-center">
                            Niveau {profile.skillLevel.toFixed(1)}
                        </span>
                    {isAdmin && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold text-sm text-center">
                                Admin
                            </span>
                    )}
                </div>
                </div>


                <div>


                    <div className="flex flex-col gap-2 items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-300">
                        {profile.fullName}
                    </h1>
                    <p className="text-gray-400">@{profile.username}</p>
                        {profile.username === user?.username && (
                        <button onClick={() => navigate(`/profil/${profile?.username}/rediger`)} type="button" className="w-full bg-slate-700 py-2 px-4 text-cyan-500 rounded p-1.5 text-xs">
                            Rediger profil
                        </button>
                        )}
                    </div>


                    {profile.email && profile.username === user?.username && (
                    <div className="flex gap-2 text-sm">
                        <EnvelopeIcon className="h-6 text-gray-300" />
                        <p className="text-gray-300">{profile.email}</p>
                    </div>
                    )}

                    {rankedInProfile && rankedInProfile.points > 0 && rankedInProfile.participantName === profile.fullName && (
                    <div className="flex gap-2 text-sm">
                        <img src={rankedinLogo} alt={rankedinLogo} className="h-6 w-6 rounded-lg" />
                        <div>
                        <a target={"_blank"} href={`https://rankedin.com${rankedInProfile.participantUrl}`} className="text-blue-400">{rankedInProfile.participantName}</a>
                        <h1 className="text-blue-400">(#{rankedInProfile.standing}) {rankedInProfile.points} point</h1>
                        </div>
                    </div>
                    )}

                    {profile.phoneNumber && profile.username === user?.username && (
                    <div className="flex gap-2 text-sm">
                        <PhoneIcon className="h-5 text-gray-300" />
                        <p className="text-gray-300">{profile.phoneNumber}</p>
                    </div>
                    )}


                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
