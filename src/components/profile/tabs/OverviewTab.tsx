import { Helmet } from "react-helmet-async";
import { useProfileContext } from "../../../context/ProfileContext";
import LoadingSpinner from "../../misc/LoadingSpinner";

const OverviewTab = () => {
  const { profile, matches, matchesLoading } = useProfileContext();

  if (!profile) return <LoadingSpinner />;

  const winRate =
    profile.stats && profile.stats.matches
      ? Math.round((profile.stats.wins / profile.stats.matches) * 100)
      : 0;

  return (
      <>
          <Helmet>
              <title>Overblik</title>
          </Helmet>


          <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                  Statistik
              </h3>
              <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                          {profile.stats?.matches || 0}
                      </p>
                      <p className="text-xs text-gray-600">Kampe</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                          {profile.stats?.wins || 0}
                      </p>
                      <p className="text-xs text-gray-600">Sejre</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                          {profile.stats?.losses || 0}
                      </p>
                      <p className="text-xs text-gray-600">Nederlag</p>
                  </div>
                  <div className="col-span-3 mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                              className="bg-cyan-500 h-2.5 rounded-full"
                              style={{width: `${winRate}%`}}
                          ></div>
                      </div>
                      <p className="text-xs text-center mt-1 text-gray-600">
                          {winRate}% Sejrsprocent
                      </p>
                  </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                  Spilleroplysninger
              </h3>
              <p className="text-gray-600">
                  <strong>Position:</strong> {profile.position}
              </p>
              <p className="text-gray-600">
                  <strong>Spillestil:</strong> {profile.playingStyle}
              </p>
              <p className="text-gray-600">
                  <strong>Udstyr:</strong> {profile.equipment}
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Kontakt</h3>
              <p className="text-gray-600">
                  <strong>Email:</strong> {profile.email}
              </p>
              <p className={`text-gray-600 ${profile.phoneNumber ? "" : "hidden"}`}>
                  <strong>Telefon:</strong> {profile.phoneNumber}
              </p>


              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Kommende Kampe</h3>

              {matchesLoading ? (
                  <div className="py-4">
                      <LoadingSpinner/>
                  </div>
              ) : matches.upcoming.length > 0 ? (
                  <ul className="space-y-2">
                      {matches.upcoming.map((match) => (
                          <li key={match.id} className="border py-2 rounded-lg text-gray-800">
                              <p>
                                  <strong>Dato:</strong>{" "}
                                  {new Date(match.matchDateTime).toLocaleString("da-DK")}
                              </p>
                              <p>
                                  <strong>Sted:</strong> {match.location}
                              </p>
                              <p>
                                  <strong>Kamptype:</strong> {match.matchType}
                              </p>
                              <p>
                                  <strong>Niveau:</strong> {match.level}
                              </p>
                              <p>
                                  <strong>Deltagere:</strong>{" "}
                                  {match.participants.join(", ") || "Ingen"}
                              </p>
                              {match.description && (
                                  <p>
                                      <strong>Beskrivelse:</strong> {match.description}
                                  </p>
                              )}
                              <p>
                                  <strong>Bane booket:</strong> {match.courtBooked ? "Ja" : "Nej"}
                              </p>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-gray-600">Ingen kommende kampe.</p>
              )}


              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                  Tidligere Kampe
              </h3>


              {matchesLoading ? (
                  <div className="py-4">
                      <LoadingSpinner/>
                  </div>
              ) : matches.former.length > 0 ? (
                  <ul className="space-y-2">
                      {matches.former.map((match) => (
                          <li key={match.id} className="border py-2 rounded-lg text-gray-800">
                              <p>
                                  <strong>Dato:</strong>{" "}
                                  {new Date(match.matchDateTime).toLocaleString("da-DK")}
                              </p>
                              <p>
                                  <strong>Sted:</strong> {match.location}
                              </p>
                              <p>
                                  <strong>Kamptype:</strong> {match.matchType}
                              </p>
                              <p>
                                  <strong>Niveau:</strong> {match.level}
                              </p>
                              <p>
                                  <strong>Deltagere:</strong>{" "}
                                  {match.participants.join(", ") || "Ingen"}
                              </p>
                              {match.score && (
                                  <p>
                                      <strong>Score:</strong> {match.score}
                                  </p>
                              )}
                              {match.result && (
                                  <p>
                                      <strong>Resultat:</strong> {match.result}
                                  </p>
                              )}
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-gray-600">Ingen tidligere kampe.</p>
              )}


          </div>
      </>
  );
};

export default OverviewTab;
