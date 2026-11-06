import React, { useState, useMemo } from "react";
import { Search, Filter, MessageSquare, Shield, Clock, CheckCircle2, X, Send, Paperclip, ChevronRight } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { SupportTicket, TicketMessage, TicketStatus } from "../types.js";
import { motion, AnimatePresence } from "motion/react";

export const TicketCenter: React.FC = () => {
  const { user } = useAppState();
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const allTickets = useMemo(() => {
    let list = db.supportTickets.getAll();
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      list = list.filter(t => t.subject.toLowerCase().includes(q) || t.ticketNumber.includes(q) || t.id.toLowerCase().includes(q) || t.username.toLowerCase().includes(q));
    }
    if (ticketStatusFilter !== "ALL") {
      list = list.filter(t => t.status === ticketStatusFilter);
    }
    return list;
  }, [ticketSearch, ticketStatusFilter, db.supportTickets.getAll()]);

  const handleUpdateStatus = (ticketId: string, status: TicketStatus) => {
    if (!user) return;
    db.supportTickets.updateStatus(ticketId, status, user.id, user.username);
    setActiveTicket(db.supportTickets.getById(ticketId));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !user || !replyMessage.trim()) return;

    db.supportTickets.addMessage(
      activeTicket.id,
      user.id,
      user.username,
      user.role,
      replyMessage.trim()
    );

    setReplyMessage("");
    setActiveTicket(db.supportTickets.getById(activeTicket.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold font-space text-white">Ticket Management</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search tickets..."
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-48"
          />
          <select
            value={ticketStatusFilter}
            onChange={(e) => setTicketStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {allTickets.map(ticket => (
          <div key={ticket.id} onClick={() => setActiveTicket(ticket)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-purple-500/50">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-purple-400">#{ticket.ticketNumber} - {ticket.username}</span>
                <h4 className="text-sm font-bold text-white">{ticket.subject}</h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ticket.status === "OPEN" ? "bg-blue-900 text-blue-200" : "bg-slate-800 text-slate-300"}`}>
                {ticket.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Conversation Modal */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="font-bold text-white">{activeTicket.subject}</h3>
                <button onClick={() => setActiveTicket(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="h-64 overflow-y-auto space-y-2 p-2">
                {db.supportTickets.getMessages(activeTicket.id).map(msg => (
                  <div key={msg.id} className={`p-3 rounded-xl max-w-[80%] ${msg.senderRole === "USER" ? "bg-purple-900 text-white self-end ml-auto" : "bg-slate-800 text-slate-200"}`}>
                    <p className="text-xs">{msg.message}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs" placeholder="Reply..." />
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Send</button>
              </form>
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleUpdateStatus(activeTicket.id, "IN_PROGRESS")} className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">Set In Progress</button>
                <button onClick={() => handleUpdateStatus(activeTicket.id, "RESOLVED")} className="text-[10px] bg-emerald-900 text-emerald-200 px-3 py-1 rounded-lg">Mark Resolved</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
