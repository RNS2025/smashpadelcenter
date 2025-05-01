import { useParams } from "react-router-dom";
import { ProfileProvider } from "./ProfileContext.tsx";
import ProfilePage from "../pages/(logged-in)/ProfilePage/ProfilePage.tsx";

const ProfilePageWrapper = () => {
    const { username } = useParams();

    if (!username) return <div>Bruger ikke fundet.</div>;

    return (
        <ProfileProvider username={username}>
            <ProfilePage />
        </ProfileProvider>
    );
};

export default ProfilePageWrapper;
