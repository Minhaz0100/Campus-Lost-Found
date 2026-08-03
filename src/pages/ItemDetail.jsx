import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, User, MessageCircle, Flag, QrCode, Brain, AlertTriangle,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { itemAPI, claimAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageGallery from '../components/ImageGallery';
import StatusBadge from '../components/StatusBadge';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [claimForm, setClaimForm] = useState({ proofDescription: '', quizAnswers: [] });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    Promise.all([itemAPI.getById(id), itemAPI.getMatches(id)])
      .then(([itemRes, matchRes]) => {
        setItem(itemRes.data.item);
        setMatches(matchRes.data.matches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (showChat && user) {
      chatAPI.getMessages(id).then((res) => setMessages(res.data.messages)).catch(console.error);

      const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || '', { transports: ['websocket'] });
      socket.emit('join-chat', id);
      socket.on('new-message', (msg) => setMessages((prev) => [...prev, msg]));
      socketRef.current = socket;

      return () => {
        socket.emit('leave-chat', id);
        socket.disconnect();
      };
    }
  }, [showChat, id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimLoading(true);
    try {
      const formData = new FormData();
      formData.append('proofDescription', claimForm.proofDescription);
      formData.append('quizAnswers', JSON.stringify(claimForm.quizAnswers));
      await claimAPI.create(id, formData);
      setShowClaim(false);
      alert('Claim submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Claim failed');
    } finally {
      setClaimLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !item?.postedBy) return;
    try {
      await chatAPI.sendMessage(id, {
        content: newMessage,
        receiverId: item.postedBy._id || item.postedBy,
      });
      setNewMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!item) return <div className="text-center py-16">Item not found</div>;

  const isOwner = user && (item.postedBy?._id === user._id || item.postedBy === user._id);
  const canClaim = user && !isOwner && ['lost', 'found'].includes(item.status);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <ImageGallery photos={item.photos} alt={item.name} />
          {item.qrCodeDataUrl && (
            <div className="mt-4 card p-4 text-center">
              <QrCode className="h-5 w-5 mx-auto mb-2 text-primary-600" />
              <p className="text-sm font-medium mb-2">Scan to view this item</p>
              <img src={item.qrCodeDataUrl} alt="QR Code" className="mx-auto w-32 h-32" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start gap-2 mb-2">
            <span className={`badge ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {item.type}
            </span>
            <StatusBadge status={item.status} />
            {item.isEmergency && (
              <span className="badge bg-orange-100 text-orange-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Emergency
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>

          <div className="space-y-2 text-sm mb-6">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {item.location?.name}</p>
            <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /> {new Date(item.dateTime).toLocaleString()}</p>
            <p>Category: <strong>{item.category}</strong></p>
            {item.reward > 0 && <p className="text-yellow-600 font-semibold">Reward: ${item.reward} {item.rewardPaid && '(Paid)'}</p>}
            {item.serialNumber && <p>Serial: <strong>{item.serialNumber}</strong></p>}
            {item.ocrText && <p className="text-xs text-gray-500">OCR: {item.ocrText.slice(0, 100)}...</p>}
            {item.duplicateWarning && (
              <p className="text-orange-600 text-sm">⚠ Possible duplicate post detected</p>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {item.postedBy?.profilePicture ? (
              <img src={item.postedBy.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
            )}
            <div>
              <p className="font-medium">{item.postedBy?.name || 'Anonymous'}</p>
              {item.postedBy?.department && <p className="text-xs text-gray-500">{item.postedBy.department}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canClaim && (
              <button onClick={() => setShowClaim(true)} className="btn-primary">Claim This Item</button>
            )}
            {user && !isOwner && (
              <button onClick={() => setShowChat(true)} className="btn-secondary flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> Chat
              </button>
            )}
            {user && (
              <button
                onClick={() => {
                  const reason = prompt('Report reason (fake/duplicate/inappropriate/spam/other):');
                  if (reason) itemAPI.report(id, { reason }).then(() => alert('Report submitted'));
                }}
                className="btn-secondary flex items-center gap-1"
              >
                <Flag className="h-4 w-4" /> Report
              </button>
            )}
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold">AI Matches ({matches.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(({ item: matchItem, score }) => (
              <div key={matchItem._id} className="relative">
                <ItemCard item={matchItem} />
                <span className="absolute top-2 right-2 badge bg-primary-100 text-primary-800">{score}% match</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showClaim && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Claim Item</h2>
            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Proof of Ownership *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={claimForm.proofDescription}
                  onChange={(e) => setClaimForm({ ...claimForm, proofDescription: e.target.value })}
                  required
                  placeholder="Describe unique features, contents, or identifying marks..."
                />
              </div>

              {item.verificationQuestions?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Verification Quiz</p>
                  {item.verificationQuestions.map((q, i) => (
                    <div key={i}>
                      <label className="block text-sm mb-1">{q.question}</label>
                      <input
                        className="input-field"
                        value={claimForm.quizAnswers[i]?.answer || ''}
                        onChange={(e) => {
                          const answers = [...claimForm.quizAnswers];
                          answers[i] = { question: q.question, answer: e.target.value };
                          setClaimForm({ ...claimForm, quizAnswers: answers });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={claimLoading}>
                  {claimLoading ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button type="button" onClick={() => setShowClaim(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold">Chat about "{item.name}"</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    msg.sender?._id === user?._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <p className="text-xs opacity-70 mb-0.5">{msg.sender?.name}</p>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <input
                className="input-field flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" className="btn-primary">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
