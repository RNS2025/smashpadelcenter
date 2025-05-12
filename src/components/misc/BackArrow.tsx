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
      className="h-8 w-8 shrink-0 rounded-full p-1 border-2 border-[#06a8c6] cursor-pointer flex items-center justify-center hover:bg-[#06a8c6] transition-colors duration-200"
    >
      <ArrowLongLeftIcon className="h-full w-full text-white font-bold stroke-2" />
    </div>
  );
};
export default BackArrow;
