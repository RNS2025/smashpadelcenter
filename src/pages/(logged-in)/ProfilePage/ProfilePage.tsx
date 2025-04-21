import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import userProfileApi from "../../../services/userProfileService";
import notificationApi from "../../../services/notificationService";
import { UserProfile } from "../../../types/UserProfile";
import { useNavigate } from "react-router-dom";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import { friendService, Friend } from "../../../services/friendService";
import { MessageService, Message } from "../../../services/messageService";
import { getUserBookings } from "../../../services/trainingService";
import api from "../../../api/api";

// Import tab components
import OverviewTab from "./tabs/OverviewTab";
import MatchesTab from "./tabs/MatchesTab";
import EditTab from "./tabs/EditTab";
import SettingsTab from "./tabs/SettingsTab";
import NotificationsTab from "./tabs/NotificationsTab";
import FriendsTab from "./tabs/FriendsTab";
import MessagesTab from "./tabs/MessagesTab";
import AdminTab from "./tabs/AdminTab";
import TrainerTab from "./tabs/TrainerTab";

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
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [trainerMessages, setTrainerMessages] = useState<any[]>([]);
  const [availabilityDate, setAvailabilityDate] = useState<string>("");
  const [availabilityTimeSlots, setAvailabilityTimeSlots] = useState<string[]>(
    []
  );
  const [newTimeSlot, setNewTimeSlot] = useState<string>("");
  const [trainerBookings, setTrainerBookings] = useState<any[]>([]);
  const [loadingTrainerData, setLoadingTrainerData] = useState<boolean>(false);
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
    if (profile?.role === "trainer" && activeTab === "trainer" && username) {
      const fetchTrainerData = async () => {
        try {
          setLoadingTrainerData(true);
          const response = await api.get(`/trainer-messages/${username}`);
          setTrainerMessages(response.data);
          const trainerResponse = await api.get(
            `/trainers/by-username/${username}`
          );
          const trainerData = trainerResponse.data;
          const bookingsResponse = await api.get(`/bookings/${username}`);
          setTrainerBookings(bookingsResponse.data);
        } catch (error) {
          console.error("Error fetching trainer data:", error);
          setErrorMessage("Could not load trainer data");
        } finally {
          setLoadingTrainerData(false);
        }
      };

      fetchTrainerData();
    }
  }, [username, profile, activeTab]);

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
          setNotifications((prev) => [...prev, request.notification]);
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

    const fetchBookings = async () => {
      try {
        if (username) {
          const userBookings = await getUserBookings(username);
          setBookings(userBookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, [username, profile]);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Add a small delay to ensure auth state is properly initialized
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Only proceed with data fetching if we have a username
        if (!username) {
          console.log("No username available, waiting...");
          return;
        }

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
        // Only navigate away if we're certain there's no authentication
        if (!username && !authLoading) {
          navigate("/", {
            state: {
              message: "Log venligst ind for at få adgang til denne side",
            },
          });
        } else {
          setErrorMessage(
            error.response?.data?.message ||
              "Kunne ikke indlæse profil, notifikationer eller venner. Prøv igen."
          );
        }
      } finally {
        setLoading(false);
        setNotificationLoading(false);
      }
    };

    fetchData();
  }, [username, authLoading, navigate]);

  const handleAddTimeSlot = () => {
    if (newTimeSlot.trim()) {
      setAvailabilityTimeSlots((prev) => [...prev, newTimeSlot]);
      setNewTimeSlot("");
    }
  };

  const handleRemoveTimeSlot = (index: number) => {
    setAvailabilityTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    if (!availabilityDate || availabilityTimeSlots.length === 0 || !username) {
      setErrorMessage("Please select a date and add at least one time slot");
      return;
    }

    try {
      setIsSubmitting(true);
      const timeSlots = availabilityTimeSlots.map((startTime) => ({
        startTime,
        isBooked: false,
      }));

      await api.post(`/trainers/availability/${username}`, {
        availability: {
          date: availabilityDate,
          timeSlots,
        },
      });

      setSuccessMessage("Availability saved successfully!");
      setAvailabilityDate("");
      setAvailabilityTimeSlots([]);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error saving availability:", error);
      setErrorMessage("Failed to save availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToMessage = async (messageId: string, content: string) => {
    if (!content.trim() || !username) return;

    try {
      const message = trainerMessages.find((msg) => msg._id === messageId);
      if (!message) return;

      await api.post("trainer/message", {
        senderUsername: message.senderUsername,
        trainerUsername: username,
        content,
      });

      const response = await api.get(`/messages/${username}`);
      setTrainerMessages(response.data);

      setSuccessMessage("Reply sent!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error sending reply:", error);
      setErrorMessage("Failed to send reply");
    }
  };

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
    setActiveTab("messages");

    if (!messages[friendId] && messageService && profile) {
      try {
        const friendMessages = await messageService.getMessages(friendId);
        setMessages((prev) => ({
          ...prev,
          [friendId]: friendMessages || [],
        }));

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

      setMessages((prev) => ({
        ...prev,
        [selectedFriend]: [...(prev[selectedFriend] || []), sentMessage],
      }));

      setNewMessage("");

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

  const isAdmin = profile.role === "admin";
  const isTrainer = profile?.role === "trainer";
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
  if (isTrainer) tabs.push("trainer");

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
          <nav className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
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
                  : tab === "trainer"
                  ? "Træner Dashboard"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          {activeTab === "overview" && (
            <OverviewTab
              profile={profile}
              bookings={bookings}
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "matches" && <MatchesTab profile={profile} />}
          {activeTab === "edit" && (
            <EditTab
              formData={formData}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              handleInputChange={handleInputChange}
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              notificationLoading={notificationLoading}
              handleMarkAsRead={handleMarkAsRead}
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "friends" && (
            <FriendsTab
              friends={friends}
              pendingRequests={pendingRequests}
              newFriendUsername={newFriendUsername}
              profile={profile}
              setNewFriendUsername={setNewFriendUsername}
              handleAddFriend={handleAddFriend}
              handleRespondToFriendRequest={handleRespondToFriendRequest}
              handleSelectFriend={handleSelectFriend}
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "messages" && (
            <MessagesTab
              friends={friends}
              messages={messages}
              selectedFriend={selectedFriend}
              newMessage={newMessage}
              onlineStatus={onlineStatus}
              profile={profile}
              setNewMessage={setNewMessage}
              handleSelectFriend={handleSelectFriend}
              handleSendMessage={handleSendMessage}
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "admin" && isAdmin && (
            <AdminTab
              successMessage={successMessage}
              errorMessage={errorMessage}
            />
          )}
          {activeTab === "trainer" && isTrainer && (
            <TrainerTab
              loadingTrainerData={loadingTrainerData}
              trainerBookings={trainerBookings}
              trainerMessages={trainerMessages}
              availabilityDate={availabilityDate}
              availabilityTimeSlots={availabilityTimeSlots}
              newTimeSlot={newTimeSlot}
              isSubmitting={isSubmitting}
              successMessage={successMessage}
              errorMessage={errorMessage}
              setAvailabilityDate={setAvailabilityDate}
              setNewTimeSlot={setNewTimeSlot}
              handleAddTimeSlot={handleAddTimeSlot}
              handleRemoveTimeSlot={handleRemoveTimeSlot}
              handleSaveAvailability={handleSaveAvailability}
              handleReplyToMessage={handleReplyToMessage}
            />
          )}
        </div>
      </div>
    </Animation>
  );
};

export default ProfilePage;
