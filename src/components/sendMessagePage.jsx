import React, { useState, useEffect, useRef } from "react";

// Mock wallet hook for demo purposes
const useWallet = () => ({
  publicKey: { toString: () => "DemoWallet123456789" }
});

// --- SVG Icon Components ---
const PaperPlaneIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>);
const MicrophoneIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>);
const StopCircleIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>);
const InboxIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z"/></svg>);
const HeartIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>);
const SendPlaneIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>);
const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const PlayIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>);
const PauseIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>);
const ReplyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>); // New Reply Icon

// --- Main Component Styles ---
const styles = {
  page: { minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Poppins', sans-serif", padding: '2rem', background: 'linear-gradient(rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.9)), url(background-send-a-message.gif) center/cover no-repeat fixed', overflow: 'hidden' },  panel: { background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' },
  tabContainer: { display: 'flex', borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem', position: 'relative' },
  tabButton: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', fontWeight: '600', fontSize: '0.875rem', color: '#94a3b8', border: 'none', cursor: 'pointer', background: 'none', transition: 'color 0.3s ease' },
  tabButtonHover: { color: '#f8fafc' },
  activeTabIndicator: { position: 'absolute', bottom: 0, height: '2px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'left 0.4s cubic-bezier(0.25, 1, 0.5, 1), width 0.4s cubic-bezier(0.25, 1, 0.5, 1)', borderRadius: '2px', boxShadow: '0 0 8px #38bdf8' },
  tabBadge: { marginLeft: '0.5rem', background: '#ef4444', color: 'white', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.1rem 0.4rem', minWidth: '1.25rem', textAlign: 'center', transition: 'opacity 0.3s ease, transform 0.3s ease', },
  contentContainer: { padding: '2rem', borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' },
  h2: { fontSize: '1.75rem', fontWeight: 'bold', background: 'linear-gradient(90deg, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '1.5rem' },
  input: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', borderRadius: '0.375rem', color: '#cbd5e1', marginBottom: '1rem', fontFamily: 'monospace', boxSizing: 'border-box', transition: 'all 0.3s ease' },
  textarea: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', borderRadius: '0.375rem', color: '#cbd5e1', resize: 'none', minHeight: '80px', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box', transition: 'all 0.3s ease' },
  buttonRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
  recordButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: '600', borderRadius: '0.375rem', color: '#ffffff', background: 'linear-gradient(90deg, #10b981, #34d399)', border: 'none', cursor: 'pointer', minWidth: '180px', justifyContent: 'center', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' },
  recordButtonHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)' },
  recordingButton: { background: 'linear-gradient(90deg, #ef4444, #f87171)', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)', animation: 'pulse 1.5s infinite' },
  recordingButtonHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3)' },
  sendButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', fontWeight: 'bold', color: '#ffffff', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)' },
  sendButtonHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)' },
  sendButtonDisabled: { background: '#334155', cursor: 'not-allowed', boxShadow: 'none', transform: 'none' },
  emptyInbox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', textAlign: 'center', background: 'rgba(2, 6, 23, 0.3)', borderRadius: '0.5rem' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  messageCard: { padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s ease-out forwards' },
  messageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' },
  messageSender: { fontFamily: 'monospace', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' },
  messageId: { fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.875rem' },
  messageActions: { borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', gap: '1.5rem' }, // Updated styles for actions
  actionButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }, // Base button style for actions
  actionButtonHover: { color: '#f8fafc', transform: 'scale(1.1)' }, // Generic hover for non-special actions
  reactButtonHover: { color: '#f87171', transform: 'scale(1.1)' },
  reactButtonDisabled: { color: '#ef4444', cursor: 'not-allowed' },
  textareaFooter: { display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }
};

// --- Custom Hooks ---
const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) };
  return [isHovered, hoverProps];
};

// --- NEW Audio Visualizer Component ---
const AudioVisualizer = ({ src, onRemove }) => {
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const draw = (audioData) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            const data = audioData.getChannelData(0);
            const step = Math.ceil(data.length / width);
            const amp = height / 2;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
            ctx.beginPath();
            for (let i = 0; i < width; i++) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[(i * step) + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                ctx.moveTo(i + 0.5, (1 + min) * amp);
                ctx.lineTo(i + 0.5, (1 + max) * amp);
            }
            ctx.stroke();
        };
        if (src) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            fetch(src).then(res => res.arrayBuffer()).then(buffer => {
                audioContext.decodeAudioData(buffer).then(draw).catch(e => console.error("Error decoding audio data", e));
            });
        }
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        isPlaying ? audioRef.current.pause() : audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
        const onEnded = () => { setIsPlaying(false); setProgress(0); };
        if (audio) {
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('ended', onEnded);
            return () => {
                audio.removeEventListener('timeupdate', updateProgress);
                audio.removeEventListener('ended', onEnded);
            };
        }
    }, []);

    const vizStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155' };
    const playBtnStyle = { background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%' };
    const canvasContainer = { flexGrow: 1, position: 'relative', height: '50px' };
    const progressBarStyle = { position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress || 0}%`, background: 'rgba(96, 165, 250, 0.2)', pointerEvents: 'none', borderRadius: '2px' };
    
    return (
        <div style={vizStyle}>
            <audio ref={audioRef} src={src} hidden onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
            <button onClick={togglePlay} style={playBtnStyle}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
            <div style={canvasContainer}>
                <canvas ref={canvasRef} width="300" height="50" style={{ width: '100%', height: '50px' }} />
                <div style={progressBarStyle} />
            </div>
            {onRemove && <button onClick={onRemove} style={{...styles.recordButton, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', minWidth: 'auto', padding: '0.5rem', boxShadow: 'none' }} title="Remove audio"><TrashIcon /></button>}
        </div>
    );
};

// --- Sub-Components ---
const SendForm = ({ recipient, setRecipient, message, setMessage, onSendMessage }) => {
  const [audioURL, setAudioURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const [recordBtnHover, recordBtnProps] = useHover();
  const [sendBtnHover, sendBtnProps] = useHover();
  const MAX_MESSAGE_LENGTH = 280;

  const handleStartRecording = async () => {
    setAudioURL(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRecordingTime(0);
      };
      recorder.start();
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is required. Please grant permission.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    onSendMessage({ text: message, audio: audioURL, recipient });
    setAudioURL(null); // Clear local audio state
  };

  const formatTime = (time) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
  const isSendDisabled = (!message.trim() && !audioURL) || !recipient.trim();

  return (
    <div>
      <h2 style={styles.h2}>Send a Message</h2>
      <input style={styles.input} type="text" placeholder="Recipient Wallet Address..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      <textarea style={styles.textarea} placeholder="Type your message or record audio..." value={message} onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))} />
      <div style={styles.textareaFooter}>{message.length} / {MAX_MESSAGE_LENGTH}</div>
      {audioURL && <AudioVisualizer src={audioURL} onRemove={() => setAudioURL(null)} />}
      <div style={styles.buttonRow}>
        <button {...recordBtnProps} onClick={isRecording ? handleStopRecording : handleStartRecording} style={{ ...styles.recordButton, ...(isRecording ? styles.recordingButton : {}), ...(recordBtnHover && (isRecording ? styles.recordingButtonHover : styles.recordButtonHover)) }}>
          {isRecording ? <StopCircleIcon /> : <MicrophoneIcon />}
          {isRecording ? `Recording... (${formatTime(recordingTime)})` : "Record Audio"}
        </button>
        <button {...sendBtnProps} onClick={handleSubmit} disabled={isSendDisabled} style={{ ...styles.sendButton, ...(isSendDisabled ? styles.sendButtonDisabled : {}), ...(sendBtnHover && !isSendDisabled ? styles.sendButtonHover : {}) }}>
          Send <SendPlaneIcon />
        </button>
      </div>
    </div>
  );
};

const MessageCard = ({ msg, onReact, onReply }) => {
  const { publicKey } = useWallet();
  const hasReacted = msg.reactions.some(r => r.user === publicKey?.toString());
  const [reactBtnHover, reactBtnProps] = useHover();
  const [replyBtnHover, replyBtnProps] = useHover();
  const truncate = (str) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : '';

  return (
    <div style={{...styles.panel, ...styles.messageCard}}>
      <div style={styles.messageHeader}>
        <div style={styles.messageId}>{msg.idString}</div>
        <div>From: <span style={styles.messageSender}>{truncate(msg.sender)}</span></div>
        <div>To: <span style={styles.messageSender}>{truncate(msg.recipient)}</span></div>
        <div>{msg.timeSent}</div>
      </div>
      {msg.message && <p style={{ wordBreak: 'break-word', color: '#e2e8f0'}}>{msg.message}</p>}
      {msg.audioMessage && <AudioVisualizer src={msg.audioMessage} />}
      <div style={styles.messageActions}>
        <button {...reactBtnProps} onClick={() => onReact(msg.id)} disabled={hasReacted} style={{ ...styles.actionButton, ...(hasReacted ? styles.reactButtonDisabled : {}), ...(reactBtnHover && !hasReacted ? styles.reactButtonHover : {}) }}>
          <HeartIcon style={hasReacted ? { color: '#ef4444' } : {}} /> <span>{msg.reactions.length}</span>
        </button>
        <button {...replyBtnProps} onClick={() => onReply({ sender: msg.sender, idString: msg.idString })} style={{ ...styles.actionButton, ...(replyBtnHover ? styles.actionButtonHover : {}) }}>
          <ReplyIcon /> <span>Reply</span>
        </button>
      </div>
    </div>
  );
};

const Inbox = ({ messages, onReact, onReply }) => {
  if (messages.length === 0) {
    return (
      <div style={styles.emptyInbox}>
        <InboxIcon style={{ fontSize: '2.5rem', color: '#64748b', marginBottom: '1rem' }} />
        <h3 style={{...styles.h2, fontSize: '1.25rem'}}>Your Inbox is Empty</h3>
        <p style={{color: '#94a3b8'}}>Messages you receive will appear here.</p>
      </div>
    );
  }
  return <div style={styles.messageList}>{messages.map(msg => <MessageCard key={msg.id} msg={msg} onReact={onReact} onReply={onReply} />)}</div>;
};

// --- Main Page Component ---
export default function SendMessagePage() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("send");
  const tabRefs = { send: useRef(null), inbox: useRef(null) };
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
        const { innerWidth: width, innerHeight: height } = window;
        const x = (e.clientX - width / 2) / width * 20;
        const y = (e.clientY - height / 2) / height * 20;
        setParallaxOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update tab indicator position
  useEffect(() => {
    const activeTabRef = tabRefs[activeTab]?.current;
    if (activeTabRef) {
      setIndicatorStyle({
        left: activeTabRef.offsetLeft,
        width: activeTabRef.offsetWidth,
      });
    }
  }, [activeTab]);

  // Load from localStorage on initial render
  useEffect(() => {
    try {
        const savedMessages = JSON.parse(localStorage.getItem('secure_messages') || '[]');
        const savedCounter = parseInt(localStorage.getItem('message_counter') || '0', 10);
        setMessages(savedMessages);
        setCounter(Number.isFinite(savedCounter) ? savedCounter : 0);
    } catch {
        console.error("Failed to parse data from localStorage.");
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
        localStorage.setItem('secure_messages', JSON.stringify(messages));
        localStorage.setItem('message_counter', String(counter));
    } catch {
        console.error("Failed to save data to localStorage.");
    }
  }, [messages, counter]);

  // Calculate unread messages count
  useEffect(() => {
    const count = messages.filter(msg => !msg.isRead).length;
    setUnreadCount(count);
  }, [messages]);

  const handleSendMessage = ({ text, audio, recipient }) => {
    const nextId = counter + 1;
    const newMessage = {
      id: Date.now(),
      idString: `#${String(nextId).padStart(4, "0")}`,
      message: text,
      audioMessage: audio,
      recipient,
      sender: publicKey?.toString() || "Anonymous",
      timeSent: new Date().toLocaleString(),
      reactions: [],
      isRead: false,
    };
    setMessages(prev => [newMessage, ...prev]);
    setCounter(nextId);
    setMessage("");
    setRecipient("");

    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:linear-gradient(90deg,#10b981,#34d399); color:#fff; padding:12px 20px; border-radius:8px; box-shadow:0 10px 20px rgba(0,0,0,.3); z-index:1000; transition: all 0.5s ease; opacity: 0; font-family: 'Poppins', sans-serif;";
    toast.textContent = `Message ${newMessage.idString} Sent!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  const handleReact = (id) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === id && !msg.reactions.some(r => r.user === publicKey?.toString())) {
          return { ...msg, reactions: [...msg.reactions, { reaction: "❤️", user: publicKey?.toString() }] };
        }
        return msg;
      })
    );
  };

  const handleReply = ({ sender }) => {
    setRecipient(sender);
    setMessage(`Replying to message from ${sender.substring(0,4)}...${sender.substring(sender.length - 4)}:\n\n`);
    setActiveTab('send');
  };

  const handleTabClick = (tabName) => {
      setActiveTab(tabName);
      if (tabName === 'inbox') {
          setTimeout(() => setMessages(prev => prev.map(msg => ({ ...msg, isRead: true }))), 200);
      }
  };

  const TabButton = ({ tabName, label, icon, onActivate, count, tabRef }) => {
    const [isHovered, hoverProps] = useHover();
    const isActive = activeTab === tabName;
    return (
      <button ref={tabRef} {...hoverProps} onClick={onActivate} style={{ ...styles.tabButton, ...(isHovered && !isActive ? styles.tabButtonHover : {}), color: isActive ? '#f8fafc' : '#94a3b8' }}>
        {icon} <span>{label}</span>
        {count > 0 && <span style={styles.tabBadge}>{count}</span>}
      </button>
    );
  };
  
  const containerStyle = { ...styles.container, transform: `translateX(${parallaxOffset.x}px) translateY(${parallaxOffset.y}px)`};

  return (
    <div style={styles.page}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
          @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.02); } } 
          @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={containerStyle}>
        <div style={{...styles.panel, ...styles.tabContainer}}>
          <TabButton tabName="send" label="Send a Message" icon={<PaperPlaneIcon />} onActivate={() => handleTabClick('send')} tabRef={tabRefs.send} />
          <TabButton tabName="inbox" label="Inbox" icon={<InboxIcon />} onActivate={() => handleTabClick('inbox')} count={unreadCount} tabRef={tabRefs.inbox} />
          <div style={{...styles.activeTabIndicator, ...indicatorStyle}}/>
        </div>
        <div style={{...styles.panel, ...styles.contentContainer}}>
          {activeTab === "send" && <SendForm recipient={recipient} setRecipient={setRecipient} message={message} setMessage={setMessage} onSendMessage={handleSendMessage} />}
          {activeTab === "inbox" && <Inbox messages={messages} onReact={handleReact} onReply={handleReply} />}
        </div>
      </div>
    </div>
  );
}