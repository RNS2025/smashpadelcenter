import {Helmet} from "react-helmet-async";
import CourtsMap from "../../../components/tournaments/map/CourtsMap.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import {useState} from "react";
import BackArrow from "../../../components/misc/BackArrow.tsx";


export const CourtMapPage = () => {

    const [selectedCourtLabel, setSelectedCourtLabel] = useState<string | null>(null);
    // TODO
    return (
        <>
            <Helmet>
                <title>Baneoversigt</title>
            </Helmet>

            <Animation>
                <BackArrow/>
                <div className="flex justify-between px-20">
                    <div className="bg-white text-black rounded-xl w-1/2 h-fit p-4">
                        <p className="text-3xl font-bold text-center">{selectedCourtLabel ?? "Vælg en bane"}</p>

                        {selectedCourtLabel && (
                            <>
                                <div className="border-2 border-black rounded-lg p-2">
                                <p className="text-lg font-bold">DPF25 Herrer (FTM)</p>
                                <div className="flex items-center mt-4 gap-4 text-lg">
                                    <p className="font-semibold">Kl. 17:00</p>
                                    <div className="flex gap-2 font-semibold">
                                        <p>Hans Hansen & Hans Hansen</p>
                                        <p>vs</p>
                                        <p>Jens Jensen & Jens Jensen</p>
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
