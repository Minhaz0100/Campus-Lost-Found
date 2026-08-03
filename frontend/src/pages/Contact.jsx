import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto card p-8 text-center">
        <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
        <p className="text-gray-600 dark:text-gray-400">An admin will get back to you soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Contact Admin</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Have a question or issue? Reach out to the campus admin team.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <input className="input-field" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input-field" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        <textarea className="input-field" rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
          <Mail className="h-4 w-4" /> Send Message
        </button>
      </form>
    </div>
  );
}
