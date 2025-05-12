import {Helmet} from "react-helmet-async";
import {useNavigate, useParams} from "react-router-dom";
import {useUser} from "../../../context/UserContext.tsx";
import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {filterPassedTime, getNextHalfHour, handleHiddenTimes} from "../../../utils/dateUtils.ts";
import {addHours, addMinutes, isSameDay, setHours, setMinutes} from "date-fns";
import {PrivateEvent} from "../../../types/PrivateEvent.ts";
import communityApi from "../../../services/makkerborsService.ts";
import {ChevronDoubleDownIcon, ChevronDoubleUpIcon, ChevronDownIcon, ChevronUpIcon} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import Animation from "../../../components/misc/Animation.tsx";

export const EditEventPage = () => {

        const navigate = useNavigate();
        const { user, loading: userLoading } = useUser();
        const { eventId } = useParams<{ eventId: string }>();

        const [title, setTitle] = useState<string>("");
        const [participants, setParticipants] = useState<string[]>([]);
        const [joinRequests, setJoinRequests] = useState<string[]>([]);
        const [invitedPlayers, setInvitedPlayers] = useState<string[] | undefined>([]);
        const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
        const [description, setDescription] = useState<string | undefined>("");
        const [eventFormat, setEventFormat] = useState<string | undefined>("");
        const [totalSpots, setTotalSpots] = useState<number>(8);
        const [courtBooked, setCourtBooked] = useState<boolean>(false);
        const [price, setPrice] = useState<number | undefined>(140);
        const [levelRangeRequired, setLevelRangeRequired] = useState<boolean>(false);
        const [levelRange, setLevelRange] = useState<[number, number]>([user?.skillLevel || 2.0, (user?.skillLevel || 2.0) + 1]);
        const [location, setLocation] = useState<string>("SMASH Padelcenter Horsens");
        const [openRegistration, setOpenRegistration] = useState<boolean>(false);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [selectedStartDate, setSelectedStartDate] = useState(getNextHalfHour);
        const [selectedEndDate, setSelectedEndDate] = useState(
            addHours(getNextHalfHour(), 2)
        );
        const [endManuallyChanged, setEndManuallyChanged] = useState(false);
        const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!eventId) return;
        
        const fetchEvent = async () => {
            try {
                const event = await communityApi.getEventById(eventId);
                if (event) {
                    setParticipants(event.participants);
                    setJoinRequests(event.joinRequests);
                    setInvitedPlayers(event.invitedPlayers);
                    setCreatedAt(event.createdAt);
                    setTitle(event.title);
                    setDescription(event.description);
                    setEventFormat(event.eventFormat);
                    setTotalSpots(event.totalSpots);
                    setPrice(event.price);
                    setCourtBooked(event.courtBooked);
                    setSelectedStartDate(new Date(event.startTime));
                    setSelectedEndDate(new Date(event.endTime));
                    setLocation(event.location);
                    setLevelRangeRequired(!!event.level);
                    if (event.level) {
                        const [min, max] = event.level.split(" - ").map(Number);
                        setLevelRange([min, max]);
                    }
                    setOpenRegistration(event.openRegistration);
                }
            } catch (error: any) {
                console.error("Fejl ved hentning af arrangement:", error);
                setError(
                    error.response?.data?.message || "Fejl ved hentning af arrangement"
                );
            }
        };
        fetchEvent().then();
    }, [eventId]);

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

        const handleCreateEvent = async (event: FormEvent) => {
            event.preventDefault();

            if (isSubmitting) return;
            setIsSubmitting(true);

            if (userLoading) {
                setError("Vent venligst, indlæser brugerdata...");
                return;
            }

            if (!user?.username) {
                setError("Du skal være logget ind for at oprette et arrangement.");
                return;
            }

            if (!eventId) {
                setError("Arrangement-ID mangler.");
                return;
            }

            try {
                const eventData: Omit<PrivateEvent, "id"> = {
                    username: user.username,
                    title,
                    description,
                    eventFormat,
                    totalSpots,
                    price,
                    courtBooked,
                    eventDateTime: selectedStartDate.toISOString(),
                    startTime: selectedStartDate.toISOString(),
                    endTime: selectedEndDate.toISOString(),
                    location,
                    level: levelRangeRequired
                        ? `${levelRange[0].toFixed(1)} - ${levelRange[1].toFixed(1)}`
                        : undefined,
                    openRegistration,
                    participants: participants,
                    joinRequests: joinRequests,
                    invitedPlayers: invitedPlayers,
                    createdAt: createdAt,
                    accessUrl: "",
                };
                await communityApi.updatePrivateEvent(eventId, eventData);
                navigate(`/privat-arrangementer/${eventId}`);
            } catch (error: any) {
                console.error("Fejl ved ændring af turnering:", error);
                setError(
                    error.response?.data?.message || "Fejl ved ændring af turnering"
                );
            }
        };

        const handleMinChange = (e: ChangeEvent<HTMLInputElement>) => {
            const newMin = parseFloat(e.target.value);
            setLevelRange([newMin, levelRange[1]]);
        };

        const handleMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
            const newMax = parseFloat(e.target.value);
            setLevelRange([levelRange[0], newMax]);
        };

        const incrementMinLevel = () => {
            setLevelRange(([min, max]) => {
                const newMin = Math.min(7.0, parseFloat((min + 0.1).toFixed(1)));
                const adjustedMax = Math.max(newMin, max);
                return [newMin, adjustedMax];
            });
        };

        const decrementMinLevel = () => {
            setLevelRange(([min, max]) => {
                const newMin = Math.max(1.0, parseFloat((min - 0.1).toFixed(1)));
                return [newMin, max];
            });
        };

        const incrementMaxLevel = () => {
            setLevelRange(([min, max]) => {
                const newMax = Math.min(7.0, parseFloat((max + 0.1).toFixed(1)));
                return [min, newMax];
            });
        };

        const decrementMaxLevel = () => {
            setLevelRange(([min, max]) => {
                const newMax = Math.max(min, parseFloat((max - 0.1).toFixed(1)));
                return [min, newMax];
            });
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
            <>
            <Helmet>
                <title>Rediger arrangement</title>
            </Helmet>
            
            <HomeBar />
    <Animation>
        <div className="w-full bg-slate-800/70 rounded-xl p-4 text-gray-300">
                {error && (
                    <div className="mb-4 text-red-500">
                        {error}
                        {error.includes("logget ind") && (
                            <button
                                onClick={() => navigate("/")}
                                className="ml-2 bg-cyan-500 text-white rounded px-2 py-1"
                            >
                                Log ind
                            </button>
                        )}
                    </div>
                )}
                <form className="space-y-10" onSubmit={handleCreateEvent}>
                    <div className="lg:grid grid-cols-3 gap-4 max-lg:flex max-lg:flex-col">
                        <div>
                            <label className="font-semibold" htmlFor="titel">
                                Titel
                            </label>
                            <div className="pr-1">
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-semibold" htmlFor="beskrivelse">
                                Beskrivelse
                            </label>
                            <div className="pr-1">
              <textarea
                  className="w-full rounded-lg h-24 resize-none border-slate-800/80 bg-slate-800/80 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
              />
                            </div>
                        </div>

                        <div>
                            <label className="font-semibold" htmlFor="turneringsformat">
                                Arrangementsformat
                            </label>
                            <div className="pr-1">
                                <input
                                    type="text"
                                    placeholder={"F.eks. americano, mexicano..."}
                                    className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"
                                    value={eventFormat}
                                    onChange={(e) => setEventFormat(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-sm:grid max-sm:grid-cols-2 max-sm:gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <label className="font-semibold" htmlFor="pladser">
                                    Antal pladser
                                </label>
                                <div className="flex items-center gap-1 w-full">
                                    <ChevronDoubleDownIcon
                                        onClick={() => setTotalSpots((prev) => Math.max(4, prev - 4))}
                                        className="size-10 text-gray-300 cursor-pointer"
                                    />
                                    <ChevronDownIcon
                                        onClick={() => setTotalSpots((prev) => Math.max(4, prev - 1))}
                                        className="size-10 text-gray-300 cursor-pointer"
                                    />

                                    <input
                                        type="number"
                                        min={4}
                                        className="text-center rounded-lg w-full border-slate-800/80 bg-slate-800/80 disabled:text-gray-200 disabled:border-slate-800/80"
                                        value={totalSpots}
                                        onChange={(e) => setTotalSpots(parseInt(e.target.value))}
                                        required
                                        disabled
                                    />
                                    <ChevronUpIcon
                                        onClick={() => setTotalSpots((prev) => Math.min(prev + 1))}
                                        className="size-10 text-gray-300 cursor-pointer"
                                    />
                                    <ChevronDoubleUpIcon
                                        onClick={() => setTotalSpots((prev) => Math.min(prev + 4))}
                                        className="size-10 text-gray-300 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2 relative">
                                <label className="font-semibold" htmlFor="turneringsformat">
                                    Pris pr. deltager
                                </label>
                                <div>
                                    <input
                                        type="number"
                                        className="rounded-lg w-full border-slate-800/80 bg-slate-800/80 disabled:text-gray-200 disabled:border-slate-800/80"

                                        value={price}
                                        min={0}
                                        onChange={(e) => setPrice(parseFloat(e.target.value))}/>

                                    <span className="absolute inset-y-0 top-9 right-3 flex items-center text-gray-500 text-sm lg:hidden">kr.</span>
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
                                className="w-full h-12 rounded-lg border-slate-800/80 bg-slate-800/80 text-sm pr-1"
                                timeClassName={handleHiddenTimes}
                                required
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
                                minTime={
                                    isSameDay(selectedStartDate, selectedEndDate)
                                        ? addMinutes(selectedStartDate, 30)
                                        : setHours(setMinutes(new Date(), 0), 5)
                                }
                                maxTime={setHours(setMinutes(new Date(), 0), 23)}
                                dateFormat="dd. MMMM yyyy, HH:mm"
                                className="w-full h-12 rounded-lg border-slate-800/80 bg-slate-800/80 text-sm pr-1"
                                timeClassName={handleHiddenTimes}
                                required
                            />
                        </div>

                        <div>
                            <label className="font-semibold" htmlFor="center">
                                Vælg center
                            </label>
                            <select
                                className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"
                                id="center"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            >
                                <option value="SMASH Padelcenter Horsens">
                                    SMASH Padelcenter Horsens
                                </option>
                                <option value="SMASH Padelcenter Stensballe">
                                    SMASH Padelcenter Stensballe
                                </option>
                            </select>
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
                                                    ? "bg-cyan-500/80 text-white "
                                                    : "border-slate-800/80 bg-slate-800/80"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                                                    ? "bg-cyan-500/80 text-white "
                                                    : "border-slate-800/80 bg-slate-800/80"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {levelRangeRequired && (
                                    <div className="flex flex-col gap-2">
                                        <div className="grid grid-cols-2 items-center text-center w-full">
                                            <label className="font-semibold">Minimum</label>
                                            <label className="font-semibold">Maksimum</label>
                                        </div>

                                        <div className="flex h-12">
                                            <div className="flex justify-between items-center w-full rounded-lg gap-2 pr-1">
                                                <div className="grid grid-cols-2 items-center text-center w-full">
                                                    <div className="flex items-center gap-1 p-4 rounded-xl">
                                                        <ChevronDownIcon
                                                            onClick={decrementMinLevel}
                                                            className="size-10 text-gray-300 cursor-pointer"
                                                        />
                                                        <input
                                                            className="text-center rounded-lg w-full border-slate-800/80 bg-slate-800/80 disabled:text-gray-200 disabled:border-slate-800/80"

                                                            type="number"
                                                            step="0.1"
                                                            min="1.0"
                                                            max="7.0"
                                                            value={levelRange[0].toFixed(1)}
                                                            onChange={handleMinChange}
                                                            disabled
                                                        />
                                                        <ChevronUpIcon
                                                            onClick={incrementMinLevel}
                                                            className="size-10 text-gray-300 cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1 p-4 w-full">
                                                        <ChevronDownIcon
                                                            onClick={decrementMaxLevel}
                                                            className="size-10 text-gray-300 cursor-pointer"
                                                        />

                                                        <input
                                                            className="text-center rounded-lg w-full border-slate-800/80 bg-slate-800/80 disabled:text-gray-200 disabled:border-slate-800/80"
                                                            type="number"
                                                            step="0.1"
                                                            min={levelRange[0]}
                                                            max="7.0"
                                                            value={levelRange[1].toFixed(1)}
                                                            onChange={handleMaxChange}
                                                            disabled
                                                        />
                                                        <ChevronUpIcon
                                                            onClick={incrementMaxLevel}
                                                            className="size-10 text-gray-300 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
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
                                                    ? "bg-cyan-500/80 text-white "
                                                    : "border-slate-800/80 bg-slate-800/80"
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
                        disabled={isSubmitting}
                        className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
                    >
                        {isSubmitting ? "Gemmer ændringer..." : "Gem arrangement"}
                    </button>
                </form>
            </div>
    </Animation>
    </>
        );
    };

export default EditEventPage;