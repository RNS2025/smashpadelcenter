import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    ChangeEvent,
    FormEvent,
} from "react";
import { UserProfile } from "../types/UserProfile";
import userProfileApi from "../services/userProfileService";
import { useUser } from "./UserContext";

interface ProfileContextValue {
    profile: UserProfile | null;
    loading: boolean;
    error: string;

    formData: Partial<UserProfile>;
    handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    isSubmitting: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const { username } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!username) return;
            try {
                setLoading(true);
                const profileData = await userProfileApi.getOrCreateUserProfile(username);
                setProfile(profileData);
                setFormData(profileData);
            } catch (err: any) {
                console.error("Error fetching profile data:", err);
                setError("Kunne ikke hente profil eller bookinger");
            } finally {
                setLoading(false);
            }
        };

        fetchData().then();
    }, [username]);

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
        if (formData.skillLevel && (formData.skillLevel < 1 || formData.skillLevel > 5)) {
            setIsSubmitting(false);
            return;
        }

        try {
            await userProfileApi.updateUserProfile(username!, formData);
            const updated = await userProfileApi.getOrCreateUserProfile(username!);
            setProfile(updated);
            setFormData(updated);
        } catch (err: any) {
            console.error("Fejl ved opdatering:", err);
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
                isSubmitting
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error("useProfileContext must be used within a ProfileProvider");
    }
    return context;
};
