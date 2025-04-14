import DatePicker, { registerLocale } from "react-datepicker";
import { setHours, setMinutes } from "date-fns";
import { ChangeEvent, FormEvent, useState } from "react";
import { da } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
registerLocale("da", da);

export const CreateMatchForm = () => {
  const navigate = useNavigate();

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

  const [selectedDate, setSelectedDate] = useState(getNextHalfHour);
  const [selectedReserved, setSelectedReserved] = useState<number>(0);
  const [courtBooked, setCourtBooked] = useState<boolean>(false);
  const [selectedPlayingTime, setSelectedPlayingTime] = useState<number>(90);
  const [levelRange, setLevelRange] = useState<[number, number]>([2.0, 3.0]);
  const [selectedMatchType, setSelectedMatchType] = useState<string>("Herre");

  const filterPassedTime = (time: any) => {
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    return totalMinutes >= 329 && totalMinutes <= 1380;
  };

  const handleCreateMatch = async (event: FormEvent) => {
    event.preventDefault();

    alert("Kamp oprettet!");
    navigate("/makkerbørs");
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

  const availableSpotsArray = [0, 1, 2, 3];
  const courtBookedArray = [
    { label: "Nej", value: false },
    { label: "Ja", value: true },
  ];
  const playingTimeArray = [60, 90, 120];
  const matchTypeArray = ["Herre", "Dame", "Mix", "Blandet"];

  return (
    <div className="w-full bg-white rounded-xl p-4 text-gray-900 mt-10">
      <form className="space-y-10">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="font-semibold" htmlFor="center">
              Vælg center
            </label>
            <select
              className="w-full rounded-lg border-gray-900 h-12 pr-1 text-sm"
              id="center"
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
              className="w-full h-12 rounded-lg border-gray-900 text-sm pr-1"
              timeClassName={handleHiddenTimes}
            />
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
                        ? "bg-cyan-500 text-white hover:bg-cyan-600 transition duration-300"
                        : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                    }`}
                  >
                    {spot}
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

        <div className="grid grid-cols-4 gap-4">
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
                        ? "bg-cyan-500 text-white hover:bg-cyan-600 transition duration-300"
                        : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold" htmlFor="niveauinterval">
              Niveauinterval
            </label>
            <div className="flex h-12">
              <div className="flex justify-between items-center w-full rounded-lg gap-6 pr-1">
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
                  min="1.0"
                  max="7.0"
                  value={levelRange[1].toFixed(1)}
                  onChange={handleMaxChange}
                />
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
                    className={`w-20 p-2 text-sm rounded-xl transition duration-300 ${
                      selectedMatchType === option
                        ? "bg-cyan-500 hover:bg-cyan-600 transition duration-300 text-white"
                        : "bg-gray-300 hover:bg-gray-400 transition duration-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold" htmlFor="bemærkninger">
              Bemærkninger
            </label>
            <div className="pr-1">
              <textarea className="w-full rounded-lg h-12 resize-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateMatch}
          className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white"
        >
          Opret kamp
        </button>
      </form>
    </div>
  );
};

export default CreateMatchForm;
