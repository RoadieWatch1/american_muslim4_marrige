import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const { user } = useAuth();

  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  
  useEffect(() => {    
    if ((user as any)?.email) setEmail((user as any).email);    
  }, []);

  const business = useMemo(
    () => ({
      legalName: "American Muslim 4 Marriage LLC",
      addressLine1: "3750 Lenora Church Rd",
      cityStateZip: "Snellville, GA 30039, USA",
      supportEmail: "support@americanmuslim4marriage.com",
    }),
    []
  );

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

      // Basic validation (UI already requires email/message, but keep this safe)
      if (!payload.email || !payload.message) {
        toast.error("Email and message are required.", { id: toastId });
        return;
      }

      // 1) Save to DB first
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert(payload);

      if (dbError) throw dbError;

      // 2) Trigger email via Edge Function (Resend)
      const { error: fnError } = await supabase.functions.invoke(
        "send-contact-email",
        {
          body: payload,
        }
      );

      if (fnError) throw fnError;

      // keep the "feel"
      await new Promise((r) => setTimeout(r, 800));

      toast.success("Thanks! We received your message.", { id: toastId });

      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message
          ? `Failed to send: ${err.message}`
          : "Failed to send. Please try again.",
        { id: toastId }
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-2 text-sm text-gray-600">
          Questions, feedback, or help? Send us a message.
        </p>

        {/* ✅ Compliance block (CCBill will look for this) */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Contact
          </h2>

          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p className="font-medium">{business.legalName}</p>
            <p>{business.addressLine1}</p>
            <p>{business.cityStateZip}</p>
            <p className="pt-2">
              Email:{" "}
              <a
                className="text-teal-700 hover:underline"
                href={`mailto:${business.supportEmail}`}
              >
                {business.supportEmail}
              </a>
            </p>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Note: We respond as quickly as possible, usually within 24–48 hours.
          </p>
        </div>

        {/* Form */}
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-50 to-white px-6 sm:px-7 py-5 border-b border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Send a Message
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Fill out the form below and we’ll get back to you.
            </p>
          </div>

          <div className="p-6 sm:p-7">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Email
                </label>
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
                  rows={6}
                  className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                  placeholder="How can we help?"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="px-5" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                By submitting, you confirm the information is accurate.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
