import { Outlet } from "react-router-dom";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import ProfileHeader from "../../../components/profile/ProfileHeader.tsx";
import ProfileTabMenu from "../../../components/profile/ProfileTabMenu.tsx";
import {useProfileContext} from "../../../context/ProfileContext.tsx";
import {useEffect, useState} from "react";
import RankedInPlayerSearchResult from "../../../types/RankedInProfile.ts";
import rankedInService from "../../../services/rankedIn.ts";
import * as console from "node:console";
import {useUser} from "../../../context/UserContext.tsx";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";

const ProfilePage = () => {
  const { profile, loading } = useProfileContext();
  const { user } = useUser();
  const [rankedInProfile, setRankedInProfile] = useState<RankedInPlayerSearchResult>({} as RankedInPlayerSearchResult);



    useEffect(() => {
        if (!profile?.fullName) {
            setRankedInProfile({} as RankedInPlayerSearchResult);
            return;
        }
        const fetchRankedInProfile = async () => {
            try {
                const response = await rankedInService.searchPlayer(profile.fullName);
                if (response.length > 0) {
                    setRankedInProfile(response[0]);
                } else {
                    console.warn("No RankedIn profile found for", profile.fullName);
                }
            } catch (error) {
                console.error("Error fetching RankedIn profile:", error);
            }
        };
        fetchRankedInProfile().then();
    }, [profile?.fullName]);

    if (loading) {
        return (
            <>
                <HomeBar />%
                <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
                    <LoadingSpinner />
                </div>
            </>
        )
    }


  return (
      <>
      <HomeBar backPage={"/hjem"}/>
    <Animation>


      <div className="mx-auto p-6 max-w-4xl">
        {/* Profile Header */}
          <ProfileHeader profile={profile} rankedInProfile={rankedInProfile} />

        {/* Tab Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <div className="mb-2">
          <ProfileTabMenu profile={profile} user={user} />
          </div>

            <div className="mt-6">
                <Outlet/>
            </div>


        </div>
      </div>
    </Animation>
      </>
  );
};

export default ProfilePage;
