import {Helmet} from "react-helmet-async";
import CreateMatchForm from "../../../components/matchFinder/form/CreateMatchForm.tsx";
import Animation from "../../../components/misc/Animation.tsx";

export const CreateMatchPage = () => {


    return (
        <>
            <Helmet>
                <title>Opret kamp</title>
            </Helmet>

            <Animation>

            <div className="mx-20">
                <CreateMatchForm />
            </div>

            </Animation>
        </>
    );
};

export default CreateMatchPage;