import {ArrowLongLeftIcon} from "@heroicons/react/24/outline";
import {useNavigate} from "react-router-dom";

const BackArrow = ({backPage}: {
    backPage?: string
}) => {
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
                className="h-8 w-8 shrink-0 rounded-full p-1 border bg-[#4e4e4e] cursor-pointer flex items-center justify-center"
            >
                <ArrowLongLeftIcon className="h-full w-full text-white" />
            </div>

    )
}
export default BackArrow