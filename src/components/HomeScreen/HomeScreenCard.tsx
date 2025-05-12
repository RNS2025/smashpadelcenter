import { FC, ReactElement } from "react";
import { useNavigate } from "react-router-dom";

interface HomeScreenCardProps {
  icon: ReactElement<{ className: string; "aria-hidden": boolean }>;
  title: string;
  description: string;
  link: string;
  disabled?: boolean;
  onClick?: () => void;
  imageUrl?: string;
}

// Define glow color for the icon/text shadow based on card content (optional)
// You could pass a color prop to the card or derive it from the title/link
const getCardGlowColor = (link: string) => {
  if (link.includes("book") || link.includes("arrangement")) return "text-cyan-400"; // Booking items glow cyan
  if (
    link.includes("turneringer") ||
    link.includes("holdligaer")
  )
    return "text-brand-accent"; // Event/Competition items glow purple
  if (
    link.includes("admin") ||
    link.includes("rangliste") ||
    link.includes("feedback")
  )
    return "text-red-400"; // Admin/Stats glow red (example)
  return "text-cyan-400"; // Default glow color
};

const HomeScreenCard: FC<HomeScreenCardProps> = ({
  icon,
  title,
  description,
  link,
  disabled,
}) => {
  const navigate = useNavigate();
  const glowColorClass = getCardGlowColor(link); // Get glow color class

  const handleClick = () => {
    if (!disabled) {
      navigate(link);
    }
  };

  return (
    <div
      // Added 'group' for hover effects on children
      // Enhanced border, background, shadow, and hover animations
      // Added base glow animation and more aggressive hover states
      className={`
         group relative rounded-xl sm:p-8 p-2 sm:size-60 size-36 shadow-lg transition-all duration-300 ease-in-out bg-white/5 backdrop-blur-sm border border-cyan-700/30 cursor-pointer
         ${
           disabled
             ? "opacity-50 cursor-not-allowed pointer-events-none"
             :
               "hover:border-cyan-500/70 hover:shadow-multi-glow hover:scale-105 active:scale-[1.02]"
         } flex flex-col items-center text-center justify-center animate-pulseGlow
       `}
      onClick={handleClick} // Use the handleClick function
    >

      <div className="z-10 flex flex-col items-center text-center">

        <div
          className={`${glowColorClass} transition-colors duration-300 group-hover:text-white`}
        >

          <div
            className={`group-hover:text-shadow-md ${glowColorClass.replace(
              "text-",
              "shadow-"
            )}`}
          >
            {icon}
          </div>
        </div>

        {/* Title with white color, subtle hover color, and text shadow on hover */}
        {/* Applied dynamic glow color based on card type */}
        <h2
          className={`mt-4 sm:text-xl text-lg font-bold text-white transition-colors duration-300 group-hover:text-white group-hover:text-shadow-sm ${glowColorClass.replace(
            "text-",
            "shadow-"
          )}`}
        >
          {title}
        </h2>

        {/* Description with subtle color and hover effect */}
        <p className="max-sm:hidden mt-3 text-sm text-gray-300 italic transition-colors duration-300 group-hover:text-gray-100">
          {description}
        </p>
      </div>
    </div>
  );
};

export default HomeScreenCard;
