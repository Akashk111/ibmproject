import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">
          Transit Helpdesk & Community Feedback
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          Have an updated bus route, a timetable correction, or feedback for Mangaluru Bus Connect? We’d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact info column */}
        <div className="lg:col-span-5 bg-navy-950 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">
              Mangaluru Transit Information
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              We collaborate with commuters and local transport authorities to keep bus information verified and accessible.
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-300 pt-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">City Transit Desk</span>
                <span>Near State Bank Bus Stand, Hampankatta, Mangaluru, Karnataka - 575001</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white block">Email Inquiries</span>
                <span>helpdesk@mangaluru-busconnect.in</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white block">Commuter Helpline</span>
                <span>+91 824 222 0000 (Mon - Sat, 8 AM - 8 PM)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-800 text-xs text-slate-400">
            Dakshina Kannada Bus Operators’ Association & KSRTC Mangaluru Division reference network.
          </div>
        </div>

        {/* Contact form column */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Thank You!</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Your message has been received by our transit team. Thank you for helping keep Mangaluru’s public transport information accurate!
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Send Us a Message or Timetable Update
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramesh Bhat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Route Code
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Route 1A timing update or new stop suggestion"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Message / Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your feedback, suggestion, or updated schedule info..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Feedback</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
