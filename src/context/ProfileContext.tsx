import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  ChangeEvent,
  FormEvent,
} from "react";
import { User } from "../types/user";
import userProfileService from "../services/userProfileService";
import { useUser } from "./UserContext";

interface ProfileContextValue {
  profile: User | null;
  loading: boolean;
  error: string;
  formData: Partial<User>;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.username) return;
      try {
        setLoading(true);
        const profileData = await userProfileService.getOrCreateUserProfile(
          user.username
        );
        setProfile(profileData);
        setFormData(profileData);
      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError("Kunne ikke hente profil eller bookinger");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.username]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "skillLevel" ? parseFloat(value) : value,
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
    console.log("Submitting formData:", formData); // Debug log
    try {
      if (user?.username) {
        console.log("Updating profile for username:", user.username);
        await userProfileService.updateUserProfile(user.username, formData);
        const updated = await userProfileService.getOrCreateUserProfile(
          user.username
        );
        console.log("Updated profile:", updated);
        setProfile(updated);
        setFormData(updated);
      } else {
        console.error("No username available for update");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Fejl ved opdatering af profil");
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
