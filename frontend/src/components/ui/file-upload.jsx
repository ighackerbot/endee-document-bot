"use strict";
import { cn } from "../../lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";

export const FileUpload = ({ onChange, className }) => {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            onChange && onChange(f);
        }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div
            className={cn(
                "w-full p-4 border border-dashed border-zinc-700 bg-zinc-900/50 rounded-xl cursor-pointer overflow-hidden relative transition hover:border-zinc-500",
                className
            )}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center space-y-2">
                {!file ? (
                    <>
                        <motion.div
                            layoutId="file-upload"
                            className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-white transition"
                        >
                            <IconUpload />
                        </motion.div>
                        <p className="text-zinc-300 text-sm font-medium">Click to upload document</p>
                        <p className="text-zinc-500 text-xs">PDF, DOCX, TXT</p>
                    </>
                ) : (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-400 truncate max-w-[150px]">{file.name}</span>
                        <button
                            onClick={clearFile}
                            className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
