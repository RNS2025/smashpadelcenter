import React from "react";
import { useNavigate } from "react-router-dom";

const BookCourtPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col">
      <button
        onClick={() => navigate("/home")} // Go to home page
        className="p-2 bg-gray-200 text-black w-fit rounded hover:bg-gray-300"
      >
        Home
      </button>
      <iframe
        src="https://book.smash.dk/newlook/default.asp?topmenu=12"
        title="Court Booking System"
        className="w-full h-full"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
      ></iframe>
    </div>
  );
};

export default BookCourtPage;
