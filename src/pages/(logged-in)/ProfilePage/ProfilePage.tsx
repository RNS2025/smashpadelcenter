import { Outlet } from "react-router-dom";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import ProfileHeader from "../../../components/profile/ProfileHeader.tsx";
import ProfileTabMenu from "../../../components/profile/ProfileTabMenu.tsx";
import {useProfileContext} from "../../../context/ProfileContext.tsx";

const ProfilePage = () => {
  const { profile } = useProfileContext();


  return (
    <Animation>
      <HomeBar backPage={"/hjem"}/>


      <div className="mx-auto p-6 max-w-4xl">
        {/* Profile Header */}
          <ProfileHeader profile={profile} />

        {/* Tab Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <div className="mb-2">
          <ProfileTabMenu />
          </div>

            <div className="mt-6">
                <Outlet/>
            </div>


        </div>
      </div>
    </Animation>
  );
};

export default ProfilePage;
