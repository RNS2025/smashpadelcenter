import { Outlet } from "react-router-dom";
import Animation from "../../../components/misc/Animation";
import ProfileHeader from "../../../components/profile/ProfileHeader.tsx";
import ProfileTabMenu from "../../../components/profile/ProfileTabMenu.tsx";
import { useProfileContext } from "../../../context/ProfileContext.tsx";
import { useEffect, useState } from "react";
import RankedInPlayerSearchResult from "../../../types/RankedInProfile.ts";
import rankedInService from "../../../services/rankedIn.ts";
import * as console from "node:console";
import { useUser } from "../../../context/UserContext.tsx";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";

const ProfilePage = () => {
  const { profile, loading } = useProfileContext();
  const { user } = useUser();
  const [rankedInProfile, setRankedInProfile] =
    useState<RankedInPlayerSearchResult>({} as RankedInPlayerSearchResult);

  useEffect(() => {
    // Altid nulstil først – uanset hvad
    setRankedInProfile({} as RankedInPlayerSearchResult);

    // Hvis der ikke er noget navn, stop her
    if (!profile?.fullName || profile.fullName.trim() === "") {
      return;
    }

    const fetchRankedInProfile = async () => {
      try {
        const response = await rankedInService.searchPlayer(profile.fullName);
        if (response.length > 0) {
          const result = response[0];

          if (result.participantName === profile.fullName) {
            setRankedInProfile(result);
          }
        } else {
          console.warn("No RankedIn profile found for", profile.fullName);
        }
      } catch (err) {
        console.error("Error fetching RankedIn profile:", err);
      }
    };

    fetchRankedInProfile().then();
  }, [profile?.fullName]);



  if (loading) {
    return (
      <>
        <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Animation>
        <div className="mx-auto p-6 max-w-4xl">
          {/* Profile Header */}
          <ProfileHeader profile={profile} rankedInProfile={rankedInProfile} />

          {/* Tab Content */}
          <div className="bg-slate-800/30 shadow-lg rounded-lg p-6 border border-cyan-500">
            <div className="mb-2">
              <ProfileTabMenu profile={profile} user={user} />
            </div>

            <div className="mt-6">
              <Outlet />
            </div>
          </div>
        </div>
      </Animation>
    </>
  );
};

export default ProfilePage;
