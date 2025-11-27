import { useState, useEffect } from "react";

interface TypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
    cursor?: boolean;
    onComplete?: () => void;
}

export const Typewriter = ({
    text,
    speed = 100,
    delay = 0,
    className = "",
    cursor = true,
    onComplete
}: TypewriterProps) => {
    const [displayedText, setDisplayedText] = useState("");
    const [started, setStarted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [delay]);

    useEffect(() => {
        if (!started) return;

        let i = 0;
        setDisplayedText(""); // Reset text when starting

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, started]); // Removed onComplete from dependency to avoid loop if it changes

    return (
        <span className={className}>
            {displayedText}
            {cursor && !isComplete && (
                <span className="animate-pulse border-r-2 border-current ml-1 h-[0.8em] inline-block align-middle" />
            )}
        </span>
    );
};
