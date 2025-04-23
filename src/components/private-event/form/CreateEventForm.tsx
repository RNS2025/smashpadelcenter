import DatePicker, { registerLocale } from "react-datepicker";
import {addHours, addMinutes, isSameDay, setHours, setMinutes} from "date-fns";
import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import { da } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import communityApi from "../../../services/makkerborsService.ts";
import { PrivateEvent } from "../../../types/PrivateEvent.ts";
import { useUser } from "../../../context/UserContext.tsx";

registerLocale("da", da);

export const CreateEventForm = () => {
    const navigate = useNavigate();
    const { username } = useUser();

    const getNextHalfHour = () => {
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);

        const minutes = now.getMinutes();

        if (minutes < 30) {
            now.setMinutes(30);
        } else {
            now.setHours(now.getHours() + 1);
            now.setMinutes(0);
        }

        return now;
    };

    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [eventFormat, setEventFormat] = useState<string>("");
    const [totalSpots, setTotalSpots] = useState<number>(4);
    const [courtBooked, setCourtBooked] = useState<boolean>(false);
    const [levelRangeRequired, setLevelRangeRequired] = useState<boolean>(false);
    const [levelRange, setLevelRange] = useState<[number, number]>([2.0, 3.0]);
    const [location, setLocation] = useState<string>("SMASH Padelcenter Horsens");
    const [openRegistration, setOpenRegistration] = useState<boolean>(false);

    const [selectedStartDate, setSelectedStartDate] = useState(getNextHalfHour);
    const [selectedEndDate, setSelectedEndDate] = useState(addHours(getNextHalfHour(), 2));
    const [endManuallyChanged, setEndManuallyChanged] = useState(false);

    useEffect(() => {
        if (!endManuallyChanged) {
            setSelectedEndDate(addHours(selectedStartDate, 2));
        }
    }, [selectedStartDate, endManuallyChanged]);

    const handleStartDateChange = (date: Date) => {
        setSelectedStartDate(date);
        setEndManuallyChanged(false);
    };

    const handleEndDateChange = (date: Date) => {
        setSelectedEndDate(date);
        setEndManuallyChanged(true);
    };



    const filterPassedTime = (time: Date) => {
        const now = new Date();
        return time.getTime() >= now.getTime();
    };


    const handleCreateEvent = async (event: FormEvent) => {
        event.preventDefault();

        try {

            const eventData: Omit<PrivateEvent, "id"> = {
                username: username || "",
                title,
                description,
                eventFormat: eventFormat,
                totalSpots,
                courtBooked,
                eventDateTime: selectedStartDate.toISOString(),
                startTime: selectedStartDate.toISOString(),
                endTime: selectedEndDate.toISOString(),
                location,
                level: levelRangeRequired ? `${levelRange[0]}-${levelRange[1]}` : undefined,
                openRegistration,
                participants: [],
                joinRequests: [],
                createdAt: new Date().toISOString(),
                accessUrl: "",
            };

            const createdEvent = await communityApi.createPrivateEvent(eventData);
            await communityApi.updatePrivateEvent(createdEvent.id, {
                accessUrl: `/privat-turnering/${username}/${createdEvent.id}`,
            });
            alert("Turnering oprettet!");
            navigate("/privat-turneringer");
        } catch (error) {
            console.error("Fejl ved oprettelse af turnering:", error);
            alert("Fejl ved oprettelse af turnering");
        }
    };

    const handleHiddenTimes = (time: Date) => {
        const hour = time.getHours();
        const minutes = time.getMinutes();
        const totalMinutes = hour * 60 + minutes;

        return totalMinutes >= 330 && totalMinutes <= 1380 ? "" : "hidden";
    };

    const handleMinChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newMin = parseFloat(e.target.value);
        setLevelRange([newMin, levelRange[1]]);
    };

    const handleMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newMax = parseFloat(e.target.value);
        setLevelRange([levelRange[0], newMax]);
    };

    const courtBookedArray = [
        { label: "Nej", value: false },
        { label: "Ja", value: true },
    ];

    const levelRangeArray = [
        { label: "Nej", value: false },
        { label: "Ja", value: true },
    ];

    const openRegistrationArray = [
        { label: "Nej", value: false },
        { label: "Ja", value: true },
    ];


    return (
        <div className="w-full bg-white rounded-xl p-4 text-gray-900">
            <form className="space-y-10" onSubmit={handleCreateEvent}>


                <div className="lg:grid grid-cols-3 gap-4 max-lg:flex max-lg:flex-col">

                    <div>
                        <label className="font-semibold" htmlFor="titel">
                            Titel
                        </label>
                        <div className="pr-1">
                            <input type="text" className="w-full rounded-lg h-12 resize-none" value={title} onChange={(e) => setTitle(e.target.value)}/>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold" htmlFor="beskrivelse">
                            Beskrivelse
                        </label>
                        <div className="pr-1">
                            <textarea className="w-full rounded-lg h-24 resize-none" value={description} onChange={(e) => setDescription(e.target.value)}/>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold" htmlFor="turneringsformat">
                            Arrangementsformat
                        </label>
                        <div className="pr-1">
                            <input type="text" placeholder={"F.eks. americano, mexicano..."} className="w-full rounded-lg h-12 resize-none" value={eventFormat} onChange={(e) => setEventFormat(e.target.value)}/>
                        </div>
                    </div>

                    <div className="max-sm:grid max-sm:grid-cols-2 max-sm:gap-4">
                        <div>
                        <label className="font-semibold" htmlFor="pladser">
                            Antal pladser
                        </label>
                        <div className="pr-1">
                            <input type="number" min={4} className="w-full rounded-lg h-12 resize-none text-center" value={totalSpots} onChange={(e) => setTotalSpots(parseInt(e.target.value))}/>
                        </div>
                        </div>

                        <div>
                            <label className="font-semibold" htmlFor="reserverede">
                                {totalSpots > 4 ? "Baner" : "Bane"} er booket
                            </label>
                            <div className="flex h-12">
                                <div className="flex items-center w-full rounded-lg gap-3 pr-1">
                                    {courtBookedArray.map(({ label, value }) => (
                                        <button
                                            type="button"
                                            key={label}
                                            onClick={() => setCourtBooked(value)}
                                            className={`p-2 w-full rounded-xl transition duration-300 ${
                                                courtBooked === value
                                                    ? "bg-cyan-500 hover:bg-cyan-600 transition duration-300 text-white"
                                                    : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="font-semibold" htmlFor="starttidspunkt">
                            Starttidspunkt
                        </label>
                        <DatePicker
                            selected={selectedStartDate}
                            onChange={(date) => handleStartDateChange(date!)}
                            showTimeSelect
                            locale="da"
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            showWeekNumbers
                            filterTime={filterPassedTime}
                            minDate={new Date()}
                            minTime={setHours(setMinutes(new Date(), 0), 5)}
                            maxTime={setHours(setMinutes(new Date(), 0), 23)}
                            dateFormat="dd. MMMM yyyy, HH:mm"
                            className="w-full h-12 rounded-lg border-gray-900 text-sm pr-1"
                            timeClassName={handleHiddenTimes}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="font-semibold" htmlFor="sluttidspunkt">
                            Sluttidspunkt
                        </label>
                        <DatePicker
                            selected={selectedEndDate}
                            onChange={(date) => handleEndDateChange(date!)}
                            showTimeSelect
                            locale="da"
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            showWeekNumbers
                            filterTime={filterPassedTime}
                            minDate={new Date()}
                            minTime={isSameDay(selectedStartDate, selectedEndDate) ? addMinutes(selectedStartDate, 30) : setHours(setMinutes(new Date(), 0), 5)}
                            maxTime={setHours(setMinutes(new Date(), 0), 23)}
                            dateFormat="dd. MMMM yyyy, HH:mm"
                            className="w-full h-12 rounded-lg border-gray-900 text-sm pr-1"
                            timeClassName={handleHiddenTimes}
                        />
                    </div>

                    <div>
                        <label className="font-semibold" htmlFor="center">
                            Vælg center
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-900 h-12 pr-1 text-sm"
                            id="center"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        >
                            <option value="SMASH Padelcenter Horsens">
                                SMASH Padelcenter Horsens
                            </option>
                            <option value="SMASH Padelcenter Stensballe">
                                SMASH Padelcenter Stensballe
                            </option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="font-semibold" htmlFor="niveauinterval">
                            Niveauinterval
                        </label>

                        <div className="flex flex-col gap-y-2">
                        <div className="flex justify-center items-center w-full rounded-lg gap-6 pr-1">
                            {levelRangeArray.map(({ label, value }) => (
                                <button
                                    type="button"
                                    key={label}
                                    onClick={() => setLevelRangeRequired(value)}
                                    className={`p-2 w-full rounded-xl transition duration-300 ${
                                        levelRangeRequired === value
                                            ? "bg-cyan-500 hover:bg-cyan-600 transition duration-300 text-white"
                                            : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {levelRangeRequired && (
                        <div className="flex h-12">
                            <div className="flex justify-between items-center w-full rounded-lg gap-2 pr-1">
                                <input
                                    className="text-center rounded-lg w-full"
                                    type="number"
                                    step="0.1"
                                    min="1.0"
                                    max="7.0"
                                    value={levelRange[0].toFixed(1)}
                                    onChange={handleMinChange}
                                />
                                -
                                <input
                                    className="text-center rounded-lg w-full"
                                    type="number"
                                    step="0.1"
                                    min={levelRange[0]}
                                    max="7.0"
                                    value={levelRange[1].toFixed(1)}
                                    onChange={handleMaxChange}
                                />
                            </div>
                        </div>
                        )}
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold" htmlFor="reserverede">
                            Åben tilmelding
                        </label>
                        <div className="flex h-12">
                            <div className="flex items-center w-full rounded-lg gap-3 pr-1">
                                {openRegistrationArray.map(({ label, value }) => (
                                    <button
                                        type="button"
                                        key={label}
                                        onClick={() => setOpenRegistration(value)}
                                        className={`p-2 w-full rounded-xl transition duration-300 ${
                                            openRegistration === value
                                                ? "bg-cyan-500 hover:bg-cyan-600 transition duration-300 text-white"
                                                : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                    Opret arrangement
                </button>
            </form>
        </div>
    );
};

export default CreateEventForm;
