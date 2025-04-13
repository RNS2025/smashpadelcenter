import {Helmet} from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import {BoltIcon, MapPinIcon, UserCircleIcon, UserGroupIcon} from "@heroicons/react/24/outline";
import { useUser } from "../../../context/UserContext.tsx";

export const ViewMatchPage = () => {
    const {username} = useUser();


    return (
        <>
            <Helmet>
                <title>Kampdetaljer</title>
            </Helmet>

            <Animation>
                <HomeBar />

                <div className="mx-4 my-10 space-y-4 text-sm">
                    <h1 className="text-xl justify-self-center font-semibold">LØRDAG | 19. APRIL | 19:00 - 21:00</h1>

                    <div className="border rounded flex items-center px-1">
                        <div>
                            <UserCircleIcon className="h-20"/>
                        </div>
                        <div className="w-full pr-1 truncate">
                            <h1>{username}</h1>
                            <h1 className="text-gray-500">Kampejer</h1>
                        </div>
                        <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                            3.2</div>
                    </div>

                    <div className="border rounded flex items-center px-1">
                        <div>
                            <UserCircleIcon className="h-20"/>
                        </div>
                        <div className="w-full pr-1 truncate">
                            <h1>{username}</h1>
                        </div>
                        <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                            3.2</div>
                    </div>

                    <div className="border rounded flex items-center px-1">
                        <div>
                            <UserCircleIcon className="h-20"/>
                        </div>
                        <div className="w-full pr-1 truncate">
                            <h1>{username}</h1>
                        </div>
                        <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                            3.2</div>
                    </div>

                    {/*Eksempel på ledig plads*/}
                    <div className="border border-gray-500 rounded flex items-center px-1">
                        <div>
                            <UserCircleIcon className="h-20 text-gray-500"/>
                        </div>
                        <div className="w-full pr-1 truncate">
                            <h1 className="text-xl text-gray-500">Ledig plads</h1>
                        </div>
                        <div className="bg-gray-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                            ?
                        </div>
                    </div>

                    <div className="grid grid-cols-3 text-center text-black gap-3">

                        <div className="bg-white rounded h-16 flex justify-center items-center gap-1">
                            <BoltIcon className="h-6 text-yellow-500"/>
                            <h1>2.5 - 3.5</h1>
                        </div>

                        <div className="bg-white rounded flex justify-center items-center gap-1">
                            <MapPinIcon className="h-6 text-red-500"/>
                            <h1>Horsens</h1>
                        </div>

                        <div className="bg-white rounded h-16 flex justify-center items-center gap-1">
                            <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
                            <h1>Herre</h1>
                        </div>
                    </div>


                    <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
                        <h1 className="font-semibold">Bemærkninger</h1>
                        <p>
                            Bane bookes når vi er fuldtallige.
                            Er også åben for at spille i Stensballe hvis der ikke er baner.
                        </p>
                    </div>

                </div>
            </Animation>

        </>
    );
};

export default ViewMatchPage;