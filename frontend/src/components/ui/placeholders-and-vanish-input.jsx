"use strict";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export function PlaceholdersAndVanishInput({
    placeholders,
    onChange,
    onSubmit,
    disabled
}) {
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
    const [value, setValue] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        let interval;
        if (anyActive) {
            interval = setInterval(() => {
                setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [placeholders]);

    const anyActive = !disabled && placeholders && placeholders.length > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (disabled || !value.trim()) return;
        onSubmit && onSubmit(value);
        setValue("");
    };

    return (
        <form
            className={cn(
                "w-full relative max-w-xl mx-auto bg-zinc-900 overflow-hidden h-12 rounded-full border border-white/20 transition duration-200",
                value && "bg-zinc-800"
            )}
            onSubmit={handleSubmit}
        >
            <input
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange && onChange(e);
                }}
                value={value}
                ref={inputRef}
                type="text"
                disabled={disabled}
                className={cn(
                    "w-full relative text-sm sm:text-base z-50 border-none text-white bg-transparent h-full rounded-full focus:outline-none focus:ring-0 pl-6 pr-12",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            />

            <AnimatePresence mode="wait">
                {!value && anyActive && (
                    <motion.p
                        initial={{ y: 5, opacity: 0 }}
                        key={`current-placeholder-${currentPlaceholder}`}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "linear" }}
                        className="text-zinc-500 text-sm sm:text-base font-normal absolute left-6 top-3 pointer-events-none"
                    >
                        {placeholders[currentPlaceholder]}
                    </motion.p>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={disabled || !value.trim()}
                className="absolute right-2 top-1.5 z-50 h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center disabled:opacity-50 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </svg>
            </button>
        </form>
    );
}
