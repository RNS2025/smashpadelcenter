import React, { useState, useEffect } from "react";
import HomeBar from "../../components/misc/HomeBar";

const ArrangementPage: React.FC = () => {
  const [topOffset, setTopOffset] = useState<number>(160);

  useEffect(() => {
    const handleResize = () => {
      // Get the width of the viewport
      const width = window.innerWidth;

      // Adjust offset based on screen size
      if (width <= 768) {
        // iPad Mini / iPad Air (portrait or small screens)
        setTopOffset(0);
      } else {
        // PC and larger screens
        setTopOffset(155);
      }
    };

    // Listen for resize events
    window.addEventListener("resize", handleResize);

    // Call it once on initial load to set the correct offset
    handleResize();

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
      <>
      <HomeBar/>
    <div
      style={{
        height: "100vh", // Locks the outer container to viewport height
        overflow: "hidden", // Prevents page scrolling
        background: "rgb(37, 44, 54)", // Page background
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          overflowY: "auto", // Allows scrolling inside container
          overflowX: "hidden", // Prevents horizontal scroll
          border: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {/* TODO: Linkets default overskriver linket */}
        <iframe
          src="https://book.smash.dk/newlook/proc_liste.asp"
          title="Smash Padel Events"
          style={{
            width: "calc(100% + 20px)", // Widen iframe to hide right scrollbar visually
            height: "100vh",
            border: "none",
            position: "relative",
            top: `-${topOffset}px`, // Dynamically set the top offset
            left: "-0rem", // Shift left to center visible content
            background: "rgb(37, 44, 54)",
            overflow: "hidden", // Hide outer overflow (not inner iframe)
          }}
        />
      </div>
    </div>
      </>
  );
};

export default ArrangementPage;
