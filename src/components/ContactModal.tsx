import { toast } from "sonner";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
    open: boolean;
    onClose: () => void;
};

export const ContactModal: React.FC<Props> = ({ open, onClose }) => {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    // ESC close + prevent background scroll
    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    // const submit = (e: React.FormEvent) => {
    //     e.preventDefault();

    //     const payload = { name, email, message };
    //     console.log("Contact form submitted:", payload);

    //     // show loading toast
    //     const toastId = toast.loading("Sending your message...");

    //     // simulate network delay (2 seconds)
    //     setTimeout(() => {
    //         toast.success("Thanks! We received your message.", {
    //             id: toastId,
    //         });

    //         setName("");
    //         setEmail("");
    //         setMessage("");
    //         onClose();
    //     }, 2000);
    // };


    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sending) return;

        const toastId = toast.loading("Sending your message...");
        setSending(true);

        try {
            const payload = {
                user_id: user?.id ?? null,
                name: name?.trim() || null,
                email: email.trim(),
                message: message.trim(),
                page_url: window.location.href,
                user_agent: navigator.userAgent,
            };

            const { error } = await supabase.from("contact_messages").insert(payload);

            // keep the "2 seconds feel" but don't delay if it actually errors
            await new Promise((r) => setTimeout(r, 2000));

            if (error) throw error;

            toast.success("Thanks! We received your message.", { id: toastId });

            setName("");
            setEmail("");
            setMessage("");
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to send. Please try again.", { id: toastId });
        } finally {
            setSending(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[9999]">
            {/* overlay */}
            <button
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-label="Close contact modal"
                type="button"
            />

            {/* modal */}
            <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
                {/* header */}
                <div className="relative bg-gradient-to-br from-teal-50 to-white px-6 sm:px-7 py-5 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Contact Us
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Questions, feedback, or help? Send us a message.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-xl px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-white/70 border border-transparent hover:border-gray-200 transition"
                            aria-label="Close"
                            type="button"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* body */}
                <div className="p-6 sm:p-7">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-900">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900">Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                                placeholder="you@email.com"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900">
                                Message
                            </label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                                placeholder="How can we help?"
                            />
                        </div>

                        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            {/* Custom cancel style (avoid faded outline variant) */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition"
                            >
                                Cancel
                            </button>

                            <Button type="submit" className="px-5">
                                Send Message
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 pt-2">
                            Tip: Press <span className="font-semibold">Esc</span> to close.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
