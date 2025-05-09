import {NavLink, useLocation} from "react-router-dom";
import {User} from "../../types/user.ts";

export const ProfileTabMenu = ({profile, user}: {
    profile: User | null;
    user: User | null;
}) => {
    const location = useLocation();

    if (!profile) return null;

    return (
        <div>
            <nav className="flex gap-3 w-full overflow-x-auto pb-2" aria-label="Tabs">
                <NavLink
                    to={`/profil/${profile.username}/overblik`}
                    className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("overblik")
                        ? "bg-cyan-100 text-cyan-600"
                        : "text-gray-500"}`}
                >
                    Overblik
                </NavLink>

                {profile.username === user?.username && (
                    <>
                        <NavLink
                        to={`/profil/${profile.username}/grupper`}
                        className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("grupper")
                            ? "bg-cyan-100 text-cyan-600"
                            : "text-gray-500"}`}
                    >
                        Grupper
                    </NavLink>

                        <NavLink
                            to={`/profil/${profile.username}/kamphistorik`}
                            className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("kamphistorik")
                                ? "bg-cyan-100 text-cyan-600"
                                : "text-gray-500"}`}
                        >
                            Kamphistorik
                        </NavLink>

                        <NavLink
                        to={`/profil/${profile.username}/rediger`}
                        className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("rediger")
                            ? "bg-cyan-100 text-cyan-600"
                            : "text-gray-500"}`}
                    >
                        Rediger
                    </NavLink>
                    </>
            )}
            </nav>
        </div>
    );
};

export default ProfileTabMenu;