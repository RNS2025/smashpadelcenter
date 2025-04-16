import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import userProfileApi from "../../services/userProfileService";
import { UserProfile } from "../../types/userProfile";
import { useNavigate } from "react-router-dom";
import HomeBar from "../../components/misc/HomeBar";
import Animation from "../../components/misc/Animation";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const ProfilePage: React.FC = () => {
  const { username, loading: authLoading } = useUser();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();

  // Placeholder notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    // TODO: Replace with actual data fetching
    {
      id: "1",
      message: "Din profil blev opdateret med succes!",
      createdAt: new Date().toISOString(),
      isRead: false,
    },
    {
      id: "2",
      message: "Ny kamp tilgængelig i nærheden af dig.",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      isRead: true,
    },
  ]);

  useEffect(() => {
    if (authLoading) return; // Wait for session restoration

    if (!username) {
      setErrorMessage("User not authenticated");
      navigate("/", {
        state: { message: "Log venligst ind for at få adgang til denne side" },
      });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const profileData = await userProfileApi.getOrCreateUserProfile(
          username
        );
        setProfile({
          ...profileData,
          pastMatches: profileData.pastMatches.map((match) => ({
            ...match,
            result: ["win", "loss", "pending", "unknown"].includes(match.result)
              ? (match.result as "win" | "loss" | "pending" | "unknown")
              : "unknown",
          })),
        });
        setFormData({
          fullName: profileData.fullName,
          username: profileData.username,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          skillLevel: profileData.skillLevel,
          position: profileData.position,
          playingStyle: profileData.playingStyle,
          equipment: profileData.equipment,
        });

        // TODO: Fetch notifications for the user
        // Example: const notificationData = await notificationApi.getUserNotifications(username);
        // setNotifications(notificationData);
      } catch (error: any) {
        console.error("Error fetching profile data:", error);
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (
      formData.skillLevel &&
      (formData.skillLevel < 1 || formData.skillLevel > 5)
    ) {
      setErrorMessage("Skill level must be between 1 and 5.");
      setIsSubmitting(false);
      return;
    }

    try {
      await userProfileApi.updateUserProfile(username!, formData);
      // Refetch profile data to ensure UI is up-to-date
      const updatedProfileData = await userProfileApi.getOrCreateUserProfile(
        username!
      );
      setProfile({
        ...updatedProfileData,
        pastMatches: updatedProfileData.pastMatches.map((match) => ({
          ...match,
          result: ["win", "loss", "pending", "unknown"].includes(match.result)
            ? (match.result as "win" | "loss" | "pending" | "unknown")
            : "unknown",
        })),
      });
      setFormData({
        fullName: updatedProfileData.fullName,
        username: updatedProfileData.username,
        email: updatedProfileData.email,
        phoneNumber: updatedProfileData.phoneNumber,
        skillLevel: updatedProfileData.skillLevel,
        position: updatedProfileData.position,
        playingStyle: updatedProfileData.playingStyle,
        equipment: updatedProfileData.equipment,
      });
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "skillLevel" ? parseFloat(value) : value,
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    // TODO: Implement marking notification as read
    // Example: await notificationApi.markNotificationAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  if (authLoading || loading) {
    return (
      <Animation>
        <HomeBar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Indlæser profil...</p>
        </div>
      </Animation>
    );
  }

  if (errorMessage && !profile) {
    return (
      <Animation>
        <HomeBar />
        <div className="flex justify-center items-center h-screen">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      </Animation>
    );
  }

  if (!profile) {
    return (
      <Animation>
        <HomeBar />
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg text-gray-700">Profil ikke fundet</p>
        </div>
      </Animation>
    );
  }

  const winRate = profile.stats.matches
    ? Math.round((profile.stats.wins / profile.stats.matches) * 100)
    : 0;

  const isAdmin = profile.role === "admin";
  const tabs = ["overview", "matches", "edit", "settings", "notifications"];
  if (isAdmin) tabs.push("admin");

  return (
    <Animation>
      <HomeBar />
      <div className="mx-auto p-6 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <img
              src={profile.profilePictureUrl}
              alt={profile.fullName}
              className="w-32 h-32 rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {profile.fullName}
              </h1>
              <p className="text-gray-600">@{profile.username}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-sm font-medium">
                  Niveau {profile.skillLevel}
                </span>
                {isAdmin && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <nav className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-cyan-500 text-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Spilleroversigt
              </h2>
              <p className="text-gray-600 mb-4">
                Velkommen til din spillerprofil, {profile.fullName}! Her kan du
                se din kamphistorik, statistik og administrere dine
                spilleroplysninger.
              </p>
              <div className="bg-cyan-50 border-l-4 border-cyan-400 p-4 mb-6 rounded-lg">
                <p className="text-sm text-gray-600">
                  Tip: Klik på "Rediger" fanen for at opdatere dine
                  profiloplysninger.
                </p>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Seneste aktivitet
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Din sidste kamp var{" "}
                  {profile.pastMatches[0]?.date
                    ? new Date(profile.pastMatches[0].date).toLocaleDateString(
                        "da-DK"
                      )
                    : "N/A"}
                </p>
                <p className="text-gray-600 mt-2">
                  Resultat:{" "}
                  <span className="font-medium text-gray-800">
                    {profile.pastMatches[0]?.result === "win"
                      ? "Sejr"
                      : profile.pastMatches[0]?.result === "loss"
                      ? "Nederlag"
                      : profile.pastMatches[0]?.result || "N/A"}
                  </span>{" "}
                  mod {profile.pastMatches[0]?.opponent || "N/A"}
                </p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Kontakt
                </h3>
                <p className="text-gray-600">
                  <strong>Email:</strong> {profile.email}
                </p>
                <p className="text-gray-600">
                  <strong>Telefon:</strong> {profile.phoneNumber || "N/A"}
                </p>
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                  Spilleroplysninger
                </h3>
                <p className="text-gray-600">
                  <strong>Position:</strong> {profile.position}
                </p>
                <p className="text-gray-600">
                  <strong>Spillestil:</strong> {profile.playingStyle || "N/A"}
                </p>
                <p className="text-gray-600">
                  <strong>Udstyr:</strong> {profile.equipment || "N/A"}
                </p>
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                  Statistik
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.stats.matches}
                    </p>
                    <p className="text-xs text-gray-600">Kampe</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.stats.wins}
                    </p>
                    <p className="text-xs text-gray-600">Sejre</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.stats.losses}
                    </p>
                    <p className="text-xs text-gray-600">Nederlag</p>
                  </div>
                  <div className="col-span-3 mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-cyan-500 h-2.5 rounded-full"
                        style={{ width: `${winRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-600">
                      {winRate}% Sejrsprocent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "matches" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Kamphistorik
              </h2>
              <div className="overflow-hidden shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Dato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Modstander
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Resultat
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profile.pastMatches.length ? (
                      profile.pastMatches.map((match) => (
                        <tr
                          key={match.id}
                          className="hover:bg-gray-50 transition duration-300"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(match.date).toLocaleDateString("da-DK")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {match.opponent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {match.score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                match.result === "win"
                                  ? "bg-green-100 text-green-800"
                                  : match.result === "loss"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {match.result === "win"
                                ? "SEJR"
                                : match.result === "loss"
                                ? "NEDERLAG"
                                : match.result.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-center text-sm text-gray-600"
                        >
                          Ingen kampe fundet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "edit" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Rediger Profil
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Fulde navn
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={formData.fullName || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Brugernavn
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-800 bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Telefon
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="skillLevel"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Niveau (1-5)
                    </label>
                    <input
                      type="number"
                      name="skillLevel"
                      id="skillLevel"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.skillLevel || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Position
                    </label>
                    <select
                      name="position"
                      id="position"
                      value={formData.position || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    >
                      <option value="left">Venstre</option>
                      <option value="right">Højre</option>
                      <option value="both">Begge</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label
                      htmlFor="playingStyle"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Spillestil
                    </label>
                    <input
                      type="text"
                      name="playingStyle"
                      id="playingStyle"
                      value={formData.playingStyle || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label
                      htmlFor="equipment"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Udstyr
                    </label>
                    <textarea
                      name="equipment"
                      id="equipment"
                      rows={3}
                      value={formData.equipment || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Gemmer..." : "Gem profil"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Kontoindstillinger
              </h2>
              <p className="text-gray-600 mb-4">
                Administrer dine kontoindstillinger og præferencer her.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-600">
                  Du kan ændre dit kodeord, administrere notifikationer og mere
                  i denne sektion.
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button className="text-cyan-500 hover:text-cyan-600 transition duration-300">
                  Skift kodeord
                </button>
                <button className="text-cyan-500 hover:text-cyan-600 transition duration-300">
                  Administrer notifikationer
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Notifikationer
              </h2>
              <p className="text-gray-600 mb-4">
                Se dine notifikationer her. Klik på en notifikation for at
                markere den som læst.
              </p>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-gray-50 rounded-lg p-4 border ${
                        notification.isRead
                          ? "border-gray-200"
                          : "border-cyan-500"
                      } hover:shadow-md transition duration-300`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-center">
                        <p
                          className={`text-sm ${
                            notification.isRead
                              ? "text-gray-600"
                              : "text-gray-800 font-medium"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <span
                          className={`text-xs ${
                            notification.isRead
                              ? "text-gray-500"
                              : "text-cyan-500"
                          }`}
                        >
                          {new Date(notification.createdAt).toLocaleDateString(
                            "da-DK"
                          )}{" "}
                          {new Date(notification.createdAt).toLocaleTimeString(
                            "da-DK",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Ingen notifikationer at vise.</p>
              )}
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Admin Panel
              </h2>
              <p className="text-gray-600 mb-4">
                Administrer brugere, kampe og andre admin-opgaver her.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-600">
                  Som admin kan du administrere brugerroller, se rapporter og
                  mere.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Animation>
  );
};

export default ProfilePage;
