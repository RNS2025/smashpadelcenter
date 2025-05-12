import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "../../context/useNavigationHistory";

const BackArrow = ({ backPage }: { backPage?: string }) => {
  const navigate = useNavigate();
  const { getClosestHomePage } = useNavigationHistory();

  const handleNavigateBack = () => {
    // If a specific back page is provided, use it
    if (backPage) {
      navigate(backPage);
      return;
    }

    // Try to find the closest home page from navigation history
    const closestHomePage = getClosestHomePage();

    // If we have a valid home page in history, navigate to it
    if (closestHomePage) {
      navigate(closestHomePage);
      return;
    }

    // Fallback to browser history or homepage
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/hjem");
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
