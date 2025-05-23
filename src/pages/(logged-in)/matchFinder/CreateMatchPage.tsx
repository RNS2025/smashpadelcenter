import { Helmet } from "react-helmet-async";
import CreateMatchForm from "../../../components/matchFinder/form/CreateMatchForm.tsx";
import Animation from "../../../components/misc/Animation.tsx";

export const CreateMatchPage = () => {
  return (
    <>
      <Helmet>
        <title>Opret kamp</title>
      </Helmet>
      <Animation>
        <div className="mx-10 max-sm:mx-2 my-10 max-sm:my-2">
          <CreateMatchForm />
        </div>
      </Animation>
    </>
  );
};

export default CreateMatchPage;
