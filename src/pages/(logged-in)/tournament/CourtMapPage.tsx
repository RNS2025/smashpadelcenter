import {Helmet} from "react-helmet-async";
import CourtsMap from "../../../components/tournaments/map/CourtsMap.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import {useState} from "react";
import HomeBar from "../../../components/misc/HomeBar.tsx";


export const CourtMapPage = () => {

    const [selectedCourtLabel, setSelectedCourtLabel] = useState<string | null>(null);
    // TODO
    return (
        <>
            <Helmet>
                <title>Baneoversigt</title>
            </Helmet>

            <Animation>
                <HomeBar/>
                <div className="mt-5 flex max-lg:flex-col sm:space-y-10 space-y-0 lg:justify-between lg:px-20 max-lg:px-5">
                    <div className="bg-white text-black rounded-xl lg:w-1/2 h-fit p-4">
                        <p className="sm:text-3xl font-semibold text-center">{selectedCourtLabel ?? "Vælg en bane"}</p>

                        {selectedCourtLabel && (
                            <>
                                <div className="rounded-lg p-2">
                                <p className="font-semibold max-sm:text-sm">DPF25 Herrer (FTM)</p>
                                <div className="flex flex-col border border-black rounded-xl items-center mt-1 gap-2">
                                    <p className="font-semibold max-sm:text-sm">17:00</p>
                                    <div className="flex max-sm:flex-col max-sm:items-center gap-2 font-semibold max-sm:text-sm">
                                        <p>H. Hansen / J. Hansen</p>
                                        <p>vs</p>
                                        <p>J. Jensen / H. Jensen</p>
                                    </div>
                                </div>
                                </div>
                            </>
                        )}
                    </div>
                <CourtsMap onSelect={(label) => setSelectedCourtLabel(label)}/>
                </div>
            </Animation>
        </>
    );
};

export default CourtMapPage;
