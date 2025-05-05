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

const HomeScreenCard: FC<HomeScreenCardProps> = ({
  icon,
  title,
  description,
  link,
  disabled,
}) => {
  const navigate = useNavigate();
  return (
    <div
      className={`rounded-xl border border-gray-800 sm:p-8 p-4 shadow-xl transition sm:size-60 size-36 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-cyan-500/10 hover:shadow-cyan-500/10"}`}
    >
      <div
        className={`${disabled ? "pointer-events-none" : ""}`}
        onClick={() => navigate(`${link}`)}
      >
        <div className="text-cyan-500">{icon}</div>

        <h2 className="mt-4 sm:text-xl font-bold">{title}</h2>

        <p className="max-sm:hidden mt-4 text-sm text-gray-300 italic">{description}</p>
      </div>
    </div>
  );
};

export default HomeScreenCard;
