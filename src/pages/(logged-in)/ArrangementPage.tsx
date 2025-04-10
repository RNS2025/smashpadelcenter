import React from "react";

const ArrangementPage: React.FC = () => {
  return (
    <div
      className="p-4"
      style={{
        height: "100vh", // Locks the outer container to viewport height
        overflow: "hidden", // Prevents page scrolling
        background: "rgb(37, 44, 54)", // Added background color
      }}
    >
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 4rem - 1rem)", // Adjusts for header and padding
          overflowY: "auto", // Allows scrolling within this container
          overflowX: "hidden", // Prevents horizontal overflow
          border: "none", // No border on container
          margin: 0, // No extra spacing
          padding: 0, // No padding
        }}
      >
        <iframe
          src="https://book.smash.dk/newlook/proc_liste.asp"
          title="Smash Padel Events"
          style={{
            width: "100%",
            height: "20000px", // Ensures all events load
            border: "none", // No border on iframe
            position: "absolute",
            top: "-160px", // Hides navbar/header (adjust as needed)
            left: "0",
            background: "rgb(37, 44, 54)", // Matches outer background
          }}
          scrolling="no" // Scrolling handled by container
        />
      </div>
    </div>
  );
};

export default ArrangementPage;
