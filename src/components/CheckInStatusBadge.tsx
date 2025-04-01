import React from "react";

type CheckInStatusBadgeProps = {
  isCheckedIn: boolean;
};

const CheckInStatusBadge: React.FC<CheckInStatusBadgeProps> = ({
  isCheckedIn,
}) => {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isCheckedIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isCheckedIn ? "Checked In" : "Not Checked In"}
    </span>
  );
};

export default CheckInStatusBadge;
