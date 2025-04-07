import {Helmet} from "react-helmet-async";
import CourtsMap from "../../../components/tournaments/map/CourtsMap.tsx";
import Animation from "../../../components/misc/Animation.tsx";

export const CourtMapPage = () => {

    return (
        <>
            <Helmet>
                <title>Baneoversigt</title>
            </Helmet>

            <Animation>
                <CourtsMap/>
            </Animation>
        </>
    );
};

export default CourtMapPage;
