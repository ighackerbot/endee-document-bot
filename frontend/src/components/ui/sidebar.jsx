"use strict";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}) => {
    const [openState, setOpenState] = useState(false);

    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...props} />
        </>
    );
};

export const DesktopSidebar = ({ className, children, ...props }) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "h-full px-4 py-4 hidden md:flex md:flex-col bg-zinc-900 flex-shrink-0 border-r border-white/10",
                className
            )}
            animate={{
                width: animate ? (open ? "300px" : "80px") : "300px",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const MobileSidebar = ({ className, children, ...props }) => {
    const { open, setOpen } = useSidebar();
    return (
        <div
            className={cn(
                "h-14 flex flex-row md:hidden items-center justify-between bg-black/40 backdrop-blur-xl w-full border-b border-white/10 px-4 z-50",
                className
            )}
            {...props}
        >
            <div className="flex justify-between items-center w-full z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    </div>
                    <span className="text-lg font-bold text-white">DocChat AI</span>
                </div>
                <IconMenu2
                    className="text-neutral-200 cursor-pointer hover:text-white transition"
                    onClick={() => setOpen(!open)}
                />
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        className={cn(
                            "fixed inset-0 bg-black/60 backdrop-blur-3xl z-[100] flex flex-col p-4 sm:p-6",
                            className
                        )}
                    >
                        <div
                            className="absolute right-4 top-4 z-50 text-neutral-400 p-2 hover:bg-white/10 rounded-full cursor-pointer transition"
                            onClick={() => setOpen(!open)}
                        >
                            <IconX />
                        </div>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const SidebarLink = ({ link, className, ...props }) => {
    const { open, animate } = useSidebar();
    return (
        <div
            className={cn(
                "flex items-center justify-start gap-3 group/sidebar py-2 cursor-pointer",
                className
            )}
            {...props}
        >
            {link.icon}
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-neutral-200 text-sm font-medium transition duration-150 relative z-20"
            >
                {link.label}
            </motion.span>
        </div>
    );
};
