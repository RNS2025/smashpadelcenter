import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import userProfileService from "../../../services/userProfileService";
import notificationApi from "../../../services/notificationService";
import { UserProfile } from "../../../types/UserProfile";
import { Outlet, useNavigate } from "react-router-dom";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import { friendService, Friend } from "../../../services/friendService";
import { MessageService, Message } from "../../../services/messageService";
import io, { Socket } from "socket.io-client";

// Import tab components
import OverviewTab from "../../../components/profile/tabs/OverviewTab";
import MatchesTab from "../../../components/profile/tabs/MatchesTab";
import EditTab from "../../../components/profile/tabs/EditTab";
import SettingsTab from "../../../components/profile/tabs/SettingsTab";
import NotificationsTab from "../../../components/profile/tabs/NotificationsTab";
import FriendsTab from "../../../components/profile/tabs/FriendsTab";
import MessagesTab from "../../../components/profile/tabs/MessagesTab";
import AdminTab from "../../../components/profile/tabs/AdminTab";
import TrainerTab from "../../../components/profile/tabs/TrainerTab";
import ProfileHeader from "../../../components/profile/ProfileHeader.tsx";
import ProfileTabMenu from "../../../components/profile/ProfileTabMenu.tsx";

interface Notification {
  notificationId: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

const ProfilePageOld: React.FC = () => {
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
  const [trainerAvailability, setTrainerAvailability] = useState<any[]>([]);
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
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.IO client
  useEffect(() => {
    if (username) {
      const socketInstance = io("https://localhost:3001", {
        path: "/socket.io/",
        auth: { username },
      });

      socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO server");
        socketInstance.emit("join", username);
      });

      socketInstance.on("newTrainerMessage", (message) => {
        setTrainerMessages((prev) => [...prev, message]);
      });

      socketInstance.on("newBooking", (booking) => {
        setTrainerBookings((prev) => [...prev, booking]);
        setBookings((prev) => [...prev, booking]);
      });

      socketInstance.on("updatedAvailability", (availability) => {
        setTrainerAvailability(availability);
      });

      socketInstance.on(
        "trainerData",
        ({ messages, bookings, availability }) => {
          setTrainerMessages(messages);
          setTrainerBookings(bookings);
          setTrainerAvailability(availability);
          setLoadingTrainerData(false);
        }
      );

      socketInstance.on("error", ({ message }) => {
        setErrorMessage(message);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [username]);

  useEffect(() => {
    if (
      profile?.role === "trainer" &&
      activeTab === "trainer" &&
      username &&
      socket
    ) {
      setLoadingTrainerData(true);
      socket.emit("fetchTrainerData", { username });
    }
  }, [username, profile, activeTab, socket]);

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
  }, [username, profile]);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!username) {
          console.log("No username available, waiting...");
          return;
        }

        const profileData = await userProfileService.getOrCreateUserProfile(
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

  const handleSaveAvailability = () => {
    if (!availabilityDate || availabilityTimeSlots.length === 0 || !username) {
      setErrorMessage("Please select a date and add at least one time slot");
      return;
    }

    if (!socket) {
      setErrorMessage("Socket connection not established");
      return;
    }

    setIsSubmitting(true);
    const timeSlots = availabilityTimeSlots.map((startTime) => ({
      startTime,
      isBooked: false,
    }));

    socket.emit("addTrainerAvailability", {
      username,
      availability: {
        date: availabilityDate,
        timeSlots,
      },
    });

    setSuccessMessage("Availability saved successfully!");
    setAvailabilityDate("");
    setAvailabilityTimeSlots([]);
    setTimeout(() => setSuccessMessage(""), 5000);
    setIsSubmitting(false);
  };

  const handleReplyToMessage = (messageId: string, content: string) => {
    if (!content.trim() || !username || !socket) return;

    const message = trainerMessages.find((msg) => msg._id === messageId);
    if (!message) return;

    socket.emit("sendTrainerMessage", {
      senderUsername: username,
      trainerUsername: message.trainerUsername,
      content,
    });

    setSuccessMessage("Reply sent!");
    setTimeout(() => setSuccessMessage(""), 5000);
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
      await userProfileService.updateUserProfile(username!, formData);
      const updatedProfileData =
        await userProfileService.getOrCreateUserProfile(username!);
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
        <ProfileHeader profile={profile} />

        {/* Tab Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <div className="mb-2">
            <ProfileTabMenu />
          </div>
          <Outlet />

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
              loggedInUsername={username || ""} // Add this prop
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

export default ProfilePageOld;
