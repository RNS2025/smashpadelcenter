import {UserProfile} from "../../../types/UserProfile.ts";
import {UserCircleIcon} from "@heroicons/react/24/outline";

export const PlayerInfoDialog = ({user}: {
    user?: UserProfile;
}) => {


    return (
        <>
            <div className="overflow-hidden rounded-lg shadow-2xl bg-white p-4 text-black">
                <div className="flex flex-col items-center">
                    <UserCircleIcon className="h-32"/>
                    <h1 className="italic mb-4">@{user?.username}</h1>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <h1 className="font-semibold">Navn:</h1>
                        <h1>{user?.fullName || "Hans Hansen"}</h1>

                        <h1 className="font-semibold">Foretrukne side:</h1>
                        <h1>{user?.position}</h1>

                        <h1 className="font-semibold">Niveau:</h1>
                        <h1>{user?.skillLevel.toFixed(1)}</h1>


                        <h1 className="font-semibold">Antal kampe:</h1>
                        <h1>{user?.stats.matches}</h1>

                        <h1 className="font-semibold">Sejre:</h1>
                        <h1>{user?.stats.wins}</h1>

                        <h1 className="font-semibold">Nederlag:</h1>
                        <h1>{user?.stats.losses}</h1>
                    </div>
                </div>
            </div>

        </>
    );
};

export default PlayerInfoDialog;