import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const BackArrow = ({ backPage }: { backPage?: string }) => {
  const navigate = useNavigate();

  const handleNavigateBack = () => {
    if (backPage) {
      navigate(backPage);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      onClick={handleNavigateBack}
      className="size-10 shrink-0 rounded-full p-1 cursor-pointer flex items-center justify-center transition-colors duration-200"
    >
      <ArrowLongLeftIcon className="h-full w-full text-cyan-500 font-bold stroke-2" />
    </div>
  );
};
export default BackArrow;
