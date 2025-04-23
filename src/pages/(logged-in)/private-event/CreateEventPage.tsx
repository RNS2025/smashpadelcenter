import {Helmet} from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import CreateEventForm from "../../../components/private-event/form/CreateEventForm.tsx";

export const CreateEventPage = () => {
    return (
        <>
            <Helmet>
                <title>Opret arrangement</title>
            </Helmet>

            <Animation>
                <HomeBar />
                <div className="mx-10 max-sm:mx-2 my-10 max-sm:my-2">
                    <CreateEventForm />
                </div>
            </Animation>
        </>
    );
};

export default CreateEventPage;