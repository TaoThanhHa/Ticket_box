"use client";

import { useEffect, useState } from "react";
import { useContract } from "../hooks/useContract";
import { QRCodeSVG } from "qrcode.react";

export default function SampleBooking() {
  const { actions, state, ticketBoxId, claimId, data } = useContract() as any;

  const DEFAULT_EVENT = {
    eventName: "Music Festival 2025",
    date: "2025-12-01",
    seat: "A12",
    price: 50,
  };

  // buyer form
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any | null>(null);

  // when ticketBoxId changes (created), load booking info from localStorage
  useEffect(() => {
    if (!ticketBoxId) return;
    setCreatedTicketId(ticketBoxId);
    try {
      const raw = localStorage.getItem(`booking_${ticketBoxId}`);
      if (raw) setBookingData(JSON.parse(raw));
    } catch {}
  }, [ticketBoxId]);

  // when claimId set, try to assemble QR payload
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  useEffect(() => {
    if (!claimId) return;
    // find ticket id mapped to this claim if any
    try {
      const ticketForClaim = localStorage.getItem(`claim_to_ticket_${claimId}`);
      const bookingRaw = ticketForClaim ? localStorage.getItem(`booking_${ticketForClaim}`) : null;
      const booking = bookingRaw ? JSON.parse(bookingRaw) : bookingData;

      const payload = {
        claimId,
        ticketBoxId: ticketForClaim ?? ticketBoxId,
        buyer: booking?.buyer ?? { name: "", email: "", phone: "" },
        event: booking?.event ?? DEFAULT_EVENT,
      };
      setQrPayload(JSON.stringify(payload));
    } catch {
      setQrPayload(JSON.stringify({ claimId, ticketBoxId, buyer: bookingData?.buyer ?? buyer }));
    }
  }, [claimId, bookingData, ticketBoxId, buyer]);

  const validateBuyer = () => {
    if (!buyer.name.trim()) return "Vui lòng nhập tên.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(buyer.email)) return "Email không hợp lệ.";
    const phoneDigits = buyer.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7) return "Số điện thoại ngắn quá.";
    return null;
  };

  const handleCreate = async () => {
    setError(null);
    const v = validateBuyer();
    if (v) {
      setError(v);
      return;
    }
    try {
      await actions.createTicket(buyer.name, buyer.email, buyer.phone);
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const handleClaim = async () => {
    try {
      await actions.claimTicket();
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-neutral-900/90 rounded-[50px] p-8 shadow-2xl border border-neutral-800">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">🎫 Booking Ticket</h1>

        <div className="mb-6 bg-neutral-800 p-5 rounded-3xl border border-neutral-700">
          <h2 className="text-xl font-semibold mb-2">Event Details</h2>
          <p><b>Event:</b> {DEFAULT_EVENT.eventName}</p>
          <p><b>Date:</b> {DEFAULT_EVENT.date}</p>
          <p><b>Seat:</b> {DEFAULT_EVENT.seat}</p>
          <p><b>Price:</b> {DEFAULT_EVENT.price} MIOTA</p>
        </div>

        <div className="bg-neutral-800 p-5 rounded-3xl border border-neutral-700 mb-4">
          <h2 className="text-xl font-semibold mb-4">Buyer Information</h2>
          <div className="space-y-4">
            <input className="w-full bg-neutral-700 p-3 rounded-2xl text-white focus:ring focus:ring-blue-500 outline-none"
              placeholder="Name" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
            <input className="w-full bg-neutral-700 p-3 rounded-2xl text-white focus:ring focus:ring-blue-500 outline-none"
              placeholder="Email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
            <input className="w-full bg-neutral-700 p-3 rounded-2xl text-white focus:ring focus:ring-blue-500 outline-none"
              placeholder="Phone" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />

            <button onClick={handleCreate}
              disabled={state?.isLoading || state?.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-500">
              {state?.isPending ? "Processing..." : "Create Ticket"}
            </button>

            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>

        {/* After creation show ticketBoxId and allow claim */}
        {createdTicketId && (
          <div className="mb-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
            <p className="text-sm text-gray-300">TicketBox ID:</p>
            <p className="font-mono break-words">{createdTicketId}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={handleClaim}
                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700">Claim Ticket</button>
              <button onClick={() => {
                try { navigator.clipboard.writeText(createdTicketId); } catch {}
              }} className="px-4 py-2 bg-gray-700 rounded-lg">Copy ID</button>
            </div>
          </div>
        )}

        {/* After claim show QR */}
        {claimId && qrPayload && (
          <div className="mt-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700 text-center">
            <p className="mb-2 text-sm text-gray-300">Claim ID</p>
            <p className="font-mono break-words mb-3">{claimId}</p>
            <div className="mx-auto w-48 h-48 bg-white p-2 inline-block rounded-lg">
              <QRCodeSVG value={qrPayload} size={180} />
            </div>
            <p className="mt-3 text-sm text-gray-300">Scan this QR at the event.</p>
          </div>
        )}
      </div>
    </div>
  );
}
