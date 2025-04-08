// Types
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  skillLevel: number;
  photo: string;
  position: "left" | "right" | "both";
  playingStyle: string;
  equipment: string;
  isAdmin: boolean;
}

interface Match {
  id: string;
  date: string;
  result: "win" | "loss";
  score: string;
  opponent: string;
}

// Mock Service
const mockApiService = {
  getCurrentUser: (): Promise<User> => {
    return Promise.resolve({
      id: "user123",
      name: "Alex Johnson",
      username: "alexj",
      email: "alex@example.com",
      phone: "+1 234 567 8901",
      skillLevel: 4.5,
      photo: "/api/placeholder/150/150",
      position: "right",
      playingStyle: "Aggressive baseliner",
      equipment: "Babolat Viper, Adidas shoes",
      isAdmin: true,
    });
  },

  getUserStats: (): Promise<{
    matches: number;
    wins: number;
    losses: number;
  }> => {
    return Promise.resolve({
      matches: 78,
      wins: 45,
      losses: 33,
    });
  },

  getMatchHistory: (): Promise<Match[]> => {
    return Promise.resolve([
      {
        id: "m1",
        date: "2025-04-02",
        result: "win",
        score: "6-3, 7-5",
        opponent: "Team Martinez/Rodriguez",
      },
      {
        id: "m2",
        date: "2025-03-28",
        result: "loss",
        score: "4-6, 5-7",
        opponent: "Team Smith/Brown",
      },
      {
        id: "m3",
        date: "2025-03-21",
        result: "win",
        score: "6-2, 6-4",
        opponent: "Team Garcia/Lopez",
      },
      {
        id: "m4",
        date: "2025-03-15",
        result: "win",
        score: "7-6, 6-4",
        opponent: "Team Wilson/Davis",
      },
    ]);
  },

  updateUserProfile: (userData: Partial<User>): Promise<User> => {
    // In a real app, this would send the data to a server
    return Promise.resolve({
      id: "user123",
      name: userData.name || "Alex Johnson",
      username: userData.username || "alexj",
      email: userData.email || "alex@example.com",
      phone: userData.phone || "+1 234 567 8901",
      skillLevel: userData.skillLevel || 4.5,
      photo: userData.photo || "/api/placeholder/150/150",
      position: userData.position || "right",
      playingStyle: userData.playingStyle || "Aggressive baseliner",
      equipment: userData.equipment || "Babolat Viper, Adidas shoes",
      isAdmin: true,
    });
  },
};

// Components
import React, { useState, useEffect } from "react";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    matches: number;
    wins: number;
    losses: number;
  } | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await mockApiService.getCurrentUser();
        setUser(userData);
        setFormData(userData);

        const statsData = await mockApiService.getUserStats();
        setStats(statsData);

        const matchesData = await mockApiService.getMatchHistory();
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle special case for skill level which needs to be a number
    if (name === "skillLevel") {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedUser = await mockApiService.updateUserProfile(formData);
      setUser(updatedUser);
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );
  }

  const winRate = stats ? Math.round((stats.wins / stats.matches) * 100) : 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-black">Player Profile</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center">
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-32 h-32 rounded-full mb-4"
                />
                <h2 className="text-xl font-semibold text-black">
                  {user.name}
                </h2>
                <p className="text-black">@{user.username}</p>
                <div className="mt-2 flex items-center">
                  <span className="bg-blue-100 text-black px-2 py-1 rounded text-sm font-medium">
                    Level {user.skillLevel}
                  </span>
                  {user.isAdmin && (
                    <span className="ml-2 bg-purple-100 text-black px-2 py-1 rounded text-sm font-medium">
                      Admin
                    </span>
                  )}
                </div>

                <div className="w-full mt-6">
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-black">Contact</h3>
                    <div className="mt-2">
                      <p className="text-sm text-black">{user.email}</p>
                      <p className="text-sm text-black">{user.phone}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <h3 className="text-sm font-medium text-black">
                      Player Details
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-black">
                        <span className="font-medium">Position:</span>{" "}
                        {user.position}
                      </p>
                      <p className="text-sm text-black">
                        <span className="font-medium">Style:</span>{" "}
                        {user.playingStyle}
                      </p>
                      <p className="text-sm text-black">
                        <span className="font-medium">Equipment:</span>{" "}
                        {user.equipment}
                      </p>
                    </div>
                  </div>

                  {stats && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <h3 className="text-sm font-medium text-black">
                        Playing Stats
                      </h3>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-black">
                            {stats.matches}
                          </p>
                          <p className="text-xs text-black">Matches</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-black">
                            {stats.wins}
                          </p>
                          <p className="text-xs text-black">Wins</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-black">
                            {stats.losses}
                          </p>
                          <p className="text-xs text-black">Losses</p>
                        </div>
                        <div className="col-span-3 mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${winRate}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center mt-1 text-black">
                            {winRate}% Win rate
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {["overview", "matches", "edit", "settings", "admin"].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? "border-blue-500 text-black"
                            : "border-transparent text-black hover:text-black hover:border-gray-300"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      Player Overview
                    </h2>
                    <p className="text-black mb-4">
                      Welcome to your player profile, {user.name}! Here you can
                      view your match history, stats, and manage your player
                      information.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-black">
                            Pro tip: Click on the "Edit" tab to update your
                            profile information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-black">
                      Recent Activity
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-black">
                        Your last match was on {matches[0]?.date || "N/A"}
                      </p>
                      <p className="text-black mt-2">
                        Result:{" "}
                        <span className="text-black font-medium">
                          {matches[0]?.result === "win" ? "Victory" : "Defeat"}
                        </span>{" "}
                        against {matches[0]?.opponent || "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "matches" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      Match History
                    </h2>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                              Opponent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                              Result
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {matches.map((match) => (
                            <tr key={match.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                {match.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                {match.opponent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                {match.score}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium text-black ${
                                    match.result === "win"
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  {match.result.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "edit" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      Edit Profile
                    </h2>
                    {successMessage && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-black">
                              {successMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-black"
                          >
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-black"
                          >
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-black"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-black"
                          >
                            Phone
                          </label>
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            value={formData.phone || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="skillLevel"
                            className="block text-sm font-medium text-black"
                          >
                            Skill Level (1-5)
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
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="position"
                            className="block text-sm font-medium text-black"
                          >
                            Position
                          </label>
                          <select
                            name="position"
                            id="position"
                            value={formData.position || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          >
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="both">Both</option>
                          </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label
                            htmlFor="playingStyle"
                            className="block text-sm font-medium text-black"
                          >
                            Playing Style
                          </label>
                          <input
                            type="text"
                            name="playingStyle"
                            id="playingStyle"
                            value={formData.playingStyle || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label
                            htmlFor="equipment"
                            className="block text-sm font-medium text-black"
                          >
                            Equipment
                          </label>
                          <textarea
                            name="equipment"
                            id="equipment"
                            rows={3}
                            value={formData.equipment || ""}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full md:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {isSubmitting ? "Saving..." : "Save Profile"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      Account Settings
                    </h2>
                    <p className="text-black mb-4">
                      Manage your account settings and preferences here.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-black">
                        You can change your password, manage notifications, and
                        more in this section.
                      </p>

                      <p className="text-black mt-2">
                        For any issues, please contact support at{" "}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button className="text-blue-600 hover:text-blue-900">
                        Change Password
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 ml-4">
                        Manage Notifications
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "admin" && user.isAdmin && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      Admin Panel
                    </h2>
                    <p className="text-black mb-4">
                      Manage users, matches, and other admin tasks here.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-black">
                        As an admin, you have the ability to manage user roles,
                        view reports, and more.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
