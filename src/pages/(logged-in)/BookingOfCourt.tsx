import { useRef, useState, useEffect } from "react";
import LoadingSpinner from "../../components/misc/LoadingSpinner";

const BookCourtPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [topOffset, setTopOffset] = useState<number>(3.1); // Default offset for larger screens in rem

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Adjust top offset based on screen width (in rem)
      if (width <= 768) {
        // iPad Mini / iPad Air (portrait or smaller screens)
        setTopOffset(0); // Adjust offset for smaller devices
      } else {
        // Larger screens (PC, etc.)
        setTopOffset(4.8); // Adjust offset for larger screens
      }
    };

    // Listen for resize events
    window.addEventListener("resize", handleResize);

    // Call once to initialize on page load
    handleResize();

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoad = () => {
    try {
      // Apply margin top offset in rem for responsive layout
      if (iframeRef.current) {
        iframeRef.current.style.marginTop = `-${topOffset}rem`; // Set the dynamic top offset in rem
        iframeRef.current.style.height = "100%"; // Keep iframe full height
      }

      setTimeout(() => {
        setShowIframe(true);
      }, 500);
    } catch (error) {
      console.error("Error adjusting iframe: ", error);
      setShowIframe(true);
    }
  };

  return (
    <>
      <div
        className="iframe-container"
        style={{
          backgroundColor: "#252c36",
          overflow: "hidden",
          width: "100%",
          height: "100vh", // Full viewport height
          maxHeight: "100%",
          left: "-0rem", // Shift left to center visible content
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {!showIframe && (
          <div
            className="loading-container"
            style={{
              width: "95%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              inset: 0,
              backgroundColor: "#252c36",
              zIndex: 1,
              color: "white",
            }}
          >
            <LoadingSpinner />
          </div>
        )}

        <iframe
          ref={iframeRef}
          src="https://book.smash.dk/newlook/default.asp?topmenu=12"
          onLoad={handleLoad}
          title="External booking system"
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            border: "none",
            opacity: showIframe ? 1 : 0,
            transition: "opacity 1s ease-in",
            zIndex: 0,
          }}
        />
      </div>
    </>
  );
};

export default BookCourtPage;
