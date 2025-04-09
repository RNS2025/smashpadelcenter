import {FC} from "react";

type AlertMessageProps = {
  type: "error" | "success";
  message: string;
  onClose: () => void;
};

const AlertMessage: FC<AlertMessageProps> = ({
  type,
  message,
  onClose,
}) => {
  const bgColor = type === "error" ? "bg-red-100" : "bg-green-100";
  const borderColor = type === "error" ? "border-red-400" : "border-green-400";
  const textColor = type === "error" ? "text-red-700" : "text-green-700";

  return (
    <div
      className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded mb-4 flex justify-between`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="font-bold">
        ×
      </button>
    </div>
  );
};

export default AlertMessage;
