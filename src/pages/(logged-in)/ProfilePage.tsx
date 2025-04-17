import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import userProfileApi from "../../services/userProfileService";
import notificationApi from "../../services/notificationService";
import { UserProfile } from "../../types/UserProfile";
import { useNavigate } from "react-router-dom";
import HomeBar from "../../components/misc/HomeBar";
import Animation from "../../components/misc/Animation";
import { friendService, Friend } from "../../services/friendService";
import { MessageService, Message } from "../../services/messageService";

interface Notification {
  notificationId: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] =
    useState<boolean>(false);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<{ [friendId: string]: Message[] }>(
    {}
  );
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [messageService, setMessageService] = useState<MessageService | null>(
    null
  );
  const [onlineStatus, setOnlineStatus] = useState<{
    [userId: string]: "online" | "offline";
  }>({});

  useEffect(() => {
    if (username) {
      const service = new MessageService(username);
      setMessageService(service);

      service.onNewMessage((message) => {
        setMessages((prev) => {
          const friendId =
            message.senderId._id === username
              ? message.receiverId._id
              : message.senderId._id;
          return {
            ...prev,
            [friendId]: [...(prev[friendId] || []), message],
          };
        });
      });

      service.onMessageRead(({ messageId, friendId }) => {
        setMessages((prev) => {
          const updatedMessages = { ...prev };
          if (updatedMessages[friendId]) {
            updatedMessages[friendId] = updatedMessages[friendId].map((msg) =>
              msg._id === messageId ? { ...msg, isRead: true } : msg
            );
          }
          return updatedMessages;
        });
      });

      service.onUserStatus(({ userId, status }) => {
        setOnlineStatus((prev) => ({ ...prev, [userId]: status }));
      });

      service.onFriendRequestSent((request) => {
        if (profile && request.friendId._id === profile.id) {
          setPendingRequests((prev) => [...prev, request]);
        }
        if (request.notification) {
          if (request.notification) {
            setNotifications((prev) =>
              request.notification ? [...prev, request.notification] : prev
            );
          }
        }
      });

      service.onFriendRequestResponded(async ({ userId, friendId, status }) => {
        const { friends: updatedFriends, pendingRequests: updatedRequests } =
          await friendService.getFriends();
        setFriends(updatedFriends);
        setPendingRequests(updatedRequests);
        if (status === "accepted") {
          setSuccessMessage(`Ven ${userId.username} tilføjet!`);
          setTimeout(() => setSuccessMessage(""), 5000);
        }
      });

      return () => service.disconnect();
    }
  }, [username, profile]);

  useEffect(() => {
    if (authLoading) return;

    if (!username) {
      setErrorMessage("Bruger ikke autentificeret");
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

        setNotificationLoading(true);
        const notificationData = await notificationApi.getUserNotifications(
          username
        );
        setNotifications(notificationData);

        const { friends, pendingRequests } = await friendService.getFriends();
        setFriends(friends);
        setPendingRequests(pendingRequests);
      } catch (error: any) {
        console.error("Fejl ved hentning af data:", error);
        setErrorMessage(
          error.response?.data?.message ||
            "Kunne ikke indlæse profil, notifikationer eller venner. Prøv igen."
        );
      } finally {
        setLoading(false);
        setNotificationLoading(false);
      }
    };

    fetchData();
  }, [username, authLoading, navigate]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Fejl ved markering af notifikation som læst:", error);
      setErrorMessage("Kunne ikke markere notifikation som læst.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (
      formData.skillLevel &&
      (formData.skillLevel < 1 || formData.skillLevel > 5)
    ) {
      setErrorMessage("Niveau skal være mellem 1 og 5.");
      setIsSubmitting(false);
      return;
    }

    try {
      await userProfileApi.updateUserProfile(username!, formData);
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
      setSuccessMessage("Profil opdateret succesfuldt!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error("Fejl ved opdatering af profil:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Kunne ikke opdatere profil. Prøv igen."
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

  const handleAddFriend = async () => {
    if (!newFriendUsername.trim()) return;
    try {
      await friendService.addFriend(newFriendUsername);
      setNewFriendUsername("");
      setErrorMessage("");
      setSuccessMessage("Venanmodning sendt!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || "Kunne ikke tilføje ven.");
    }
  };

  const handleRespondToFriendRequest = async (
    friendId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      await friendService.respondToFriendRequest(friendId, status);
      setSuccessMessage(
        `Venanmodning ${status === "accepted" ? "accepteret" : "afvist"}!`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || "Kunne ikke behandle anmodning."
      );
    }
  };

  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriend(friendId);
    setActiveTab("messages"); // Auto-switch to messages tab when selecting a friend

    if (!messages[friendId] && messageService && profile) {
      try {
        const friendMessages = await messageService.getMessages(friendId);
        // Update messages with read status
        setMessages((prev) => ({
          ...prev,
          [friendId]: friendMessages || [],
        }));

        // Scroll to bottom of messages when they load
        setTimeout(() => {
          const messageContainer = document.querySelector(
            ".messages-container"
          );
          if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error("Error loading messages:", error);
        setErrorMessage("Kunne ikke indlæse beskeder.");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !messageService || !profile)
      return;

    try {
      const sentMessage = await messageService.sendMessage(
        profile.id,
        selectedFriend,
        newMessage
      );

      // Update local messages state
      setMessages((prev) => ({
        ...prev,
        [selectedFriend]: [...(prev[selectedFriend] || []), sentMessage],
      }));

      setNewMessage("");

      // Scroll to bottom after sending
      setTimeout(() => {
        const messageContainer = document.querySelector(".messages-container");
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage("Kunne ikke sende besked.");
    }
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
  const tabs = [
    "overview",
    "matches",
    "edit",
    "settings",
    "notifications",
    "friends",
    "messages",
  ];
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
                aria-selected={activeTab === tab}
              >
                {tab === "friends"
                  ? "Venner"
                  : tab === "messages"
                  ? "Beskeder"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              {notificationLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="ml-4 text-gray-700">
                    Indlæser notifikationer...
                  </p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.notificationId}
                      className={`bg-gray-50 rounded-lg p-4 border ${
                        notification.isRead
                          ? "border-gray-200"
                          : "border-cyan-500"
                      } hover:shadow-md transition duration-300 cursor-pointer`}
                      onClick={() =>
                        handleMarkAsRead(notification.notificationId)
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              notification.isRead
                                ? "text-gray-600"
                                : "text-gray-800"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-sm ${
                              notification.isRead
                                ? "text-gray-500"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.body}
                          </p>
                          {notification.category && (
                            <p className="text-xs text-gray-500 mt-1">
                              Kategori: {notification.category}
                            </p>
                          )}
                        </div>
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

          {activeTab === "friends" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Venner</h2>
              <div className="mb-6">
                <label
                  htmlFor="newFriend"
                  className="block text-sm font-medium text-gray-600"
                >
                  Tilføj en ven
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    id="newFriend"
                    value={newFriendUsername}
                    onChange={(e) => setNewFriendUsername(e.target.value)}
                    placeholder="Indtast brugernavn"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    aria-label="Indtast vens brugernavn"
                  />
                  <button
                    onClick={handleAddFriend}
                    disabled={!newFriendUsername.trim()}
                    className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Tilføj
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Afventende anmodninger
              </h3>
              {pendingRequests.length ? (
                <div className="space-y-2 mb-6">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm text-gray-800">
                        {request.userId.username}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleRespondToFriendRequest(
                              request.userId._id,
                              "accepted"
                            )
                          }
                          className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() =>
                            handleRespondToFriendRequest(
                              request.userId._id,
                              "rejected"
                            )
                          }
                          className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
                        >
                          Afvis
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-6">
                  Ingen afventende anmodninger.
                </p>
              )}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Dine venner
              </h3>
              {friends.length ? (
                <div className="space-y-2">
                  {friends.map((friend) => {
                    const friendId =
                      friend.userId._id.toString() === profile.id
                        ? friend.friendId._id
                        : friend.userId._id;
                    const friendUsername =
                      friend.userId._id.toString() === profile.id
                        ? friend.friendId.username
                        : friend.userId.username;

                    if (friendUsername === profile.username) {
                      return null; // Skip rendering if the username matches the logged-in user
                    }
                    return (
                      <div
                        key={friend._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-sm text-gray-800">
                          {friendUsername}{" "}
                        </span>
                        <button
                          onClick={() => handleSelectFriend(friendId)}
                          className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300"
                        >
                          Chat
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">Ingen venner endnu.</p>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Beskeder
              </h2>
              {friends.length ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Samtaler
                    </h3>
                    {friends.map((friend) => {
                      const friendId =
                        friend.userId._id.toString() === profile.id
                          ? friend.friendId._id
                          : friend.userId._id;
                      const friendUsername =
                        friend.userId._id.toString() === profile.id
                          ? friend.friendId.username
                          : friend.userId.username;
                      const lastMessage = messages[friendId]?.slice(-1)[0];
                      if (friendUsername === profile.username) {
                        return null;
                      }
                      return (
                        <div
                          key={friend._id}
                          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition duration-300 ${
                            selectedFriend === friendId ? "bg-gray-100" : ""
                          }`}
                          onClick={() => handleSelectFriend(friendId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              handleSelectFriend(friendId);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {friendUsername}
                            <span
                              className={`text-xs ml-2 ${
                                onlineStatus[friendId] === "online"
                                  ? "text-green-500"
                                  : "text-gray-500"
                              }`}
                            >
                              ({onlineStatus[friendId] || "offline"})
                            </span>
                          </p>
                          {lastMessage && (
                            <p className="text-xs text-gray-600 truncate">
                              {lastMessage.content}{" "}
                              {lastMessage.isRead ? (
                                <span className="text-blue-500">✓✓</span>
                              ) : (
                                <span className="text-gray-500">✓</span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="md:w-2/3">
                    {selectedFriend ? (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Chat med{" "}
                          {(() => {
                            const friend = friends.find(
                              (f) => f.userId._id.toString() === selectedFriend
                            );
                            if (!friend) return "";
                            return friend.userId._id.toString() === profile.id
                              ? friend.friendId.username
                              : friend.userId.username;
                          })()}
                        </h3>
                        <div className="h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 messages-container">
                          {messages[selectedFriend]?.map((msg) => (
                            <div
                              key={msg._id}
                              className={`mb-2 ${
                                msg.senderId._id.toString() === profile.id
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              <p
                                className={`inline-block px-3 py-1 rounded-lg text-sm ${
                                  msg.senderId._id.toString() === profile.id
                                    ? "bg-cyan-100 text-cyan-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {msg.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  "da-DK",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}{" "}
                                {msg.senderId._id.toString() === profile.id &&
                                  (msg.isRead ? (
                                    <span className="text-blue-500">✓✓</span>
                                  ) : (
                                    <span className="text-gray-500">✓</span>
                                  ))}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && newMessage.trim()) {
                                handleSendMessage();
                              }
                            }}
                            placeholder="Skriv en besked..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                            aria-label="Skriv en besked"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Vælg en ven for at starte en samtale.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  Tilføj venner for at begynde at sende beskeder.
                </p>
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
