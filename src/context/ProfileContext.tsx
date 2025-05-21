import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  ChangeEvent,
  FormEvent,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { User } from "../types/user";
import userProfileService from "../services/userProfileService";
import communityApi from "../services/makkerborsService";
import { PadelMatch } from "../types/PadelMatch";
import { useUser } from "./UserContext";

interface MatchesData {
  upcoming: PadelMatch[];
  former: PadelMatch[];
}

interface ProfileContextValue {
  profile: User | null;
  loading: boolean;
  error: string;
  formData: Partial<User>;
  matches: MatchesData;
  setMatches: Dispatch<SetStateAction<MatchesData>>;
  matchesLoading: boolean;
  refreshMatches: () => Promise<void>;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({
  children,
  username,
}: {
  children: ReactNode;
  username: string;
}) {
  const { refreshUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matches, setMatches] = useState<MatchesData>({
    upcoming: [],
    former: [],
  });
  const [matchesLoading, setMatchesLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!username) return;
    setMatchesLoading(true);
    try {
      const userMatches = await communityApi.getMatchesByUser(username);
      const now = new Date();

      const upcomingMatches = userMatches
        .filter((match) => new Date(match.matchDateTime) > now)
        .sort(
          (a, b) =>
            new Date(a.matchDateTime).getTime() -
            new Date(b.matchDateTime).getTime()
        );

      const formerMatches = userMatches
        .filter((match) => new Date(match.endTime) <= now)
        .filter(
          (match) =>
            match.participants.length + match.reservedSpots.length ===
            match.totalSpots
        )
        .sort(
          (a, b) =>
            new Date(b.matchDateTime).getTime() -
            new Date(a.matchDateTime).getTime()
        );

      setMatches({
        upcoming: upcomingMatches,
        former: formerMatches,
      });
    } catch (err) {
      console.error("Error fetching match data:", err);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      try {
        setLoading(true);

        const localData = localStorage.getItem("userProfile");
        if (localData) {
          const parsed = JSON.parse(localData);
          setProfile(parsed);
          setFormData(parsed);
        }

        const profileData = await userProfileService.getOrCreateUserProfile(
          username
        );
        setProfile(profileData);
        setFormData(profileData);
        localStorage.setItem("userProfile", JSON.stringify(profileData));
      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError("Kunne ikke hente profil eller bookinger");
      } finally {
        setLoading(false);
      }
    };
    if (!username) return;
    fetchData().then();
  }, [username]);

  useEffect(() => {
    if (username && profile) {
      fetchMatches().then();
    }
  }, [username, profile, fetchMatches]);

  const refreshMatches = async () => {
    await fetchMatches();
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Clear any previous errors when the user makes changes
    if (error) setError("");

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "skillLevel"
          ? parseFloat(value)
          : name === "phoneNumber"
          ? value.toString()
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (
      formData.skillLevel &&
      (formData.skillLevel < 1 || formData.skillLevel > 5)
    ) {
      console.error("Invalid skillLevel:", formData.skillLevel);
      setIsSubmitting(false);
      return;
    }
    try {
      if (username) {
        await userProfileService.updateUserProfile(username, formData);
        const updated = await userProfileService.getOrCreateUserProfile(
          username
        );
        console.log(updated);
        setProfile(updated);
        setFormData(updated);
        localStorage.setItem("userProfile", JSON.stringify(updated));
        // Hard refresh userData
        await refreshUser(true);
      } else {
        console.error("No username available for update");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      // Check if the error has a message property from the server response
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Fejl ved opdatering af profil";

      // More specific error message for common issues
      if (errorMessage.includes("RankedIn ID is already in use")) {
        setError("Dette RankedIn ID er allerede i brug af en anden spiller");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        formData,
        matches,
        setMatches,
        matchesLoading,
        refreshMatches,
        handleInputChange,
        handleSubmit,
        isSubmitting,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
}
