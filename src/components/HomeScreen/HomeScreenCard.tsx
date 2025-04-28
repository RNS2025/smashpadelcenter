import { FC, ReactElement } from "react";

interface HomeScreenCardProps {
  icon: ReactElement<{ className: string; "aria-hidden": boolean }>;
  title: string;
  description: string;
  link: string;
  disabled?: boolean;
  onClick?: () => void;
  imageUrl?: string;
}

const HomeScreenCard: FC<HomeScreenCardProps> = ({icon, title, description, link, disabled}) => {
  return (
    <div
            className={`rounded-xl border border-gray-800 p-8 shadow-xl transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/10 hover:shadow-cyan-500/10'} h-60 w-60`}
    >
      <a
                className={`${disabled ? 'pointer-events-none' : ''}`}
        href={disabled ? undefined : link}
      >
                <div className="text-cyan-500">
                    {icon}
                </div>

        <h2 className="mt-4 text-xl font-bold">{title}</h2>

        <p className="mt-4 text-sm text-gray-300 italic">
          {description}
        </p>
      </a>
    </div>
  );
};

export default HomeScreenCard;
