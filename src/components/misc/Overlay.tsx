import { createPortal } from "react-dom";

const Overlay = ({ children, isVisible }: { children: React.ReactNode, isVisible: boolean }) => {
    if (!isVisible) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
            {children}
        </div>,
        document.body
    );
};

export default Overlay;
