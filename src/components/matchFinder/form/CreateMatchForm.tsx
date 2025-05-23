import DatePicker, { registerLocale } from "react-datepicker";
import { setHours, setMinutes } from "date-fns";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { da } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import communityApi from "../../../services/makkerborsService";
import { PadelMatch } from "../../../types/PadelMatch";
import { useUser } from "../../../context/UserContext";
import {
  filterPassedTime,
  getNextHalfHour,
  handleHiddenTimes,
} from "../../../utils/dateUtils";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";

registerLocale("da", da);

export const CreateMatchForm = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  const [selectedDate, setSelectedDate] = useState(getNextHalfHour);
  const [selectedReserved, setSelectedReserved] = useState<number>(0);
  const [courtBooked, setCourtBooked] = useState<boolean>(false);
  const [selectedPlayingTime, setSelectedPlayingTime] = useState<number>(90);
  const [levelRange, setLevelRange] = useState<[number, number]>([
    (user?.skillLevel && user?.skillLevel - 0.2) || 2.0,
    (user?.skillLevel || 2.0) + 0.2,
  ]);
  const [selectedMatchType, setSelectedMatchType] = useState<string>("Herre");
  const [location, setLocation] = useState<string>("SMASH Padelcenter Horsens");
  const [description, setDescription] = useState<string>("");
  const [doorCode, setDoorCode] = useState<string>("");
  const [selectedCourtName, setSelectedCourtName] = useState<string>("");
  const [deadline, setDeadline] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reservedPlayers, setReservedPlayers] = useState(
    [] as { name: string; level: number }[]
  );

  useEffect(() => {
    setReservedPlayers((prev) => {
      const updated = [...prev];
      while (updated.length < selectedReserved) {
        updated.push({ name: "", level: (levelRange[0] + levelRange[1]) / 2 });
      }
      return updated.slice(0, selectedReserved);
    });
  }, [levelRange, selectedReserved]);

  const handleCreateMatch = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const matchData: Omit<PadelMatch, "id"> = {
        username: user!.username,
        description: description,
        level: `${levelRange[0].toFixed(1)} - ${levelRange[1].toFixed(1)}`,
        participants: [],
        joinRequests: [],
        invitedPlayers: [],
        reservedSpots: reservedPlayers.map((p) => ({
          name: p.name,
          level: p.level.toFixed(1),
        })),
        totalSpots: 4,
        createdAt: new Date().toISOString(),
        matchDateTime: selectedDate.toISOString(),
        startTime: selectedDate.toISOString(),
        endTime: new Date(
          selectedDate.getTime() + selectedPlayingTime * 60 * 1000
        ).toISOString(),
        courtBooked,
        location,
        doorCode: location === "SMASH Padelcenter Stensballe" ? doorCode : "",
        courtName: courtBooked ? selectedCourtName : "",
        matchType: selectedMatchType,
        score: {},
        deadline:
          deadline != 0
            ? new Date(
                selectedDate.getTime() - deadline * 60 * 60 * 1000
              ).toISOString()
            : undefined,
        playersConfirmedResult: [],
      };

      await communityApi.createMatch(matchData);
      navigate("/makkerbørs/minekampe");
    } catch (error) {
      console.error("Error creating match:", error);
      setIsSubmitting(false);
      alert("Fejl ved oprettelse af kamp");
    } finally {
      setIsSubmitting(false);
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

  const availableSpotsArray = [0, 1, 2, 3];
  const courtBookedArray = [
    { label: "Nej", value: false },
    { label: "Ja", value: true },
  ];
  const playingTimeArray = [60, 90, 120];
  const matchTypeArray = ["Herre", "Dame", "Mix", "Blandet"];
  const courtNamesHorsens = ["Bane 1 - Middelfart Sparekasse", "Bane 2 - danbolig", "Bane 3 - FysioDanmark Horsens", "Bane 4 - Rise's Digitalisering",
    "Bane 7 - Siux", "Bane 8 (CC) - Maxus", "Bane 9 (CC) - Flammen", "Bane 10 - Bøje Maskintransport", "Bane 11 - Grafisk Forum", "Bane 12 - Sydbank", "Bane 13 - Lyngsø VVS", "Bane 15 - VELFAC", "Bane 16"]
  const courtNamesStensballe = ["Bane 1 - Coachers", "Bane 2 - Borregaard Invest", "Bane 3 - Advokatgruppen", "Bane 4", "Bane 5"];

  if (loading) {
    return (
      <>
        <div className="w-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <div className="w-full bg-slate-800/30 rounded-xl p-4 text-gray-300">
      <form className="space-y-10" onSubmit={handleCreateMatch}>
        <div className="lg:grid grid-cols-3 gap-4 max-lg:flex max-lg:flex-col">
          <div>
            <label className="font-semibold" htmlFor="center">
              Vælg center
            </label>
            <select
              className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"
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
            <label className="font-semibold" htmlFor="tidspunkt">
              Dato og tidspunkt
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date!)}
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
            />
          </div>

          <div>
            <label className="font-semibold" htmlFor="deadline">
              Deadline
            </label>
            <select
              className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"
              id="center"
              value={deadline}
              onChange={(e) => setDeadline(parseInt(e.target.value))}
            >
              <option value={0}>Ingen deadline</option>
              <option value={1}>1 time før</option>
              <option value={2}>2 timer før</option>
              <option value={3}>3 timer før</option>
            </select>
          </div>

          <div>
            <label className="font-semibold" htmlFor="spilletid">
              Spilletid
            </label>
            <div className="flex h-12">
              <div className="flex items-center w-full rounded-lg gap-6 pr-1">
                {playingTimeArray.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setSelectedPlayingTime(option)}
                    className={`p-2 w-full rounded-xl transition duration-300 ${
                      selectedPlayingTime === option
                        ? "bg-cyan-500/80 text-white "
                        : "border-slate-800/80 bg-slate-800/80"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold" htmlFor="reserverede">
              Bane er booket
            </label>
            <div className="flex h-12">
              <div className="flex items-center w-full rounded-lg gap-6 pr-1">
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

          {courtBooked && (
          <div>
            <label className="font-semibold" htmlFor="courtName">
              Vælg bane
            </label>
            <select
                className="w-full rounded-lg border-slate-800/80 bg-slate-800/80 h-12 pr-1 text-sm"
                id="courtName"
                value={selectedCourtName}
                onChange={(e) => setSelectedCourtName(e.target.value)}
            >
                {location === "SMASH Padelcenter Horsens" &&
                    courtNamesHorsens.map((court) => (
                    <option key={court} value={court}>
                        {court}
                    </option>
                    ))}
                {location === "SMASH Padelcenter Stensballe" &&
                    courtNamesStensballe.map((court) => (
                    <option key={court} value={court}>
                        {court}
                    </option>
                    ))}
            </select>
          </div>
          )}

          {location === "SMASH Padelcenter Stensballe" && courtBooked && (
          <div>
            <label className="font-semibold" htmlFor="bemærkninger">
              Kode til døren
            </label>
            <div className="pr-1">
              <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="w-full rounded-lg h-12 border-slate-800/80 bg-slate-800/80 resize-none"
                  value={doorCode}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setDoorCode(onlyDigits);
                  }}
              />
            </div>
          </div>
          )}

          <div className="flex flex-col gap-4">
            <label className="font-semibold" htmlFor="niveauinterval">
              Niveauinterval
            </label>

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
          </div>

          <div>
            <label className="font-semibold" htmlFor="kamptype">
              Kamptype
            </label>
            <div className="flex h-12">
              <div className="flex justify-between w-full items-center rounded-lg gap-6 pr-1">
                {matchTypeArray.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setSelectedMatchType(option)}
                    className={`max-lg:w-full lg:w-20 p-2 text-sm rounded-xl transition duration-300 ${
                      selectedMatchType === option
                        ? "bg-cyan-500/80 text-white "
                        : "border-slate-800/80 bg-slate-800/80"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold" htmlFor="reserverede">
              Reserverede pladser
            </label>
            <div className="flex h-12">
              <div className="flex items-center w-full rounded-lg gap-6 pr-1">
                {availableSpotsArray.map((spot) => (
                  <button
                    type="button"
                    key={spot}
                    onClick={() => setSelectedReserved(spot)}
                    className={`p-2 w-full rounded-xl transition duration-300 ${
                      selectedReserved === spot
                        ? "bg-cyan-500/80 text-white "
                        : "border-slate-800/80 bg-slate-800/80"
                    }`}
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            {[...Array(selectedReserved)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Spillernavn"
                  className="rounded-lg w-full border-slate-800/80 bg-slate-800/80 text-sm"
                  value={reservedPlayers[i]?.name ?? ""}
                  onChange={(e) => {
                    const newPlayers = [...reservedPlayers];
                    if (!newPlayers[i])
                      newPlayers[i] = {
                        name: "",
                        level: (levelRange[0] + levelRange[1]) / 2,
                      };
                    newPlayers[i].name = e.target.value;
                    setReservedPlayers(newPlayers);
                  }}
                  required
                />

                <div className="flex items-center gap-1 w-full">
                  <ChevronDownIcon
                    onClick={() => {
                      const updated = [...reservedPlayers];
                      updated[i].level = Math.max(
                        levelRange[0],
                        parseFloat((updated[i].level - 0.1).toFixed(1))
                      );
                      setReservedPlayers(updated);
                    }}
                    className="size-10 text-gray-300 cursor-pointer"
                  />

                  <input
                    className="text-center rounded-lg w-full border-slate-800/80 bg-slate-800/80 disabled:text-gray-200 disabled:border-slate-800/80"
                    type="number"
                    step="0.1"
                    min={levelRange[0]}
                    max={levelRange[1]}
                    value={
                      reservedPlayers[i]?.level.toFixed(1) ??
                      ((levelRange[0] + levelRange[1]) / 2).toFixed(1)
                    }
                    onChange={(e) => {
                      const updated = [...reservedPlayers];
                      updated[i].level = parseFloat(e.target.value);
                      setReservedPlayers(updated);
                    }}
                    disabled
                  />

                  <ChevronUpIcon
                    onClick={() => {
                      const updated = [...reservedPlayers];
                      updated[i].level = Math.min(
                        levelRange[1],
                        parseFloat((updated[i].level + 0.1).toFixed(1))
                      );
                      setReservedPlayers(updated);
                    }}
                    className="size-10 text-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="font-semibold" htmlFor="bemærkninger">
              Bemærkninger
            </label>
            <div className="pr-1">
              <textarea
                className="w-full rounded-lg h-12 border-slate-800/80 bg-slate-800/80 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
        >
          {isSubmitting ? "Opretter..." : "Opret kamp"}
        </button>
      </form>
    </div>
  );
};

export default CreateMatchForm;
