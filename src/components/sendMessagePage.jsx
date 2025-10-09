import React, { useState, useEffect, useRef } from "react";

// Mock wallet hook for demo purposes
const useWallet = () => ({
  publicKey: { toString: () => "DemoWallet123456789" }
});

// SVG Icon Components for a self-contained solution
const PaperPlaneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const MicrophoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const StopCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
);


const InboxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const SendPlaneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    color: '#cbd5e1',
    fontFamily: 'sans-serif',
    padding: '2rem',
  },
  container: {
    maxWidth: '50rem',
    margin: '0 auto',
  },
  tabContainer: {
    display: 'flex',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
    border: '1px solid #334155',
    borderBottom: 'none',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    backdropFilter: 'blur(10px)',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem 1rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#94a3b8',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    borderWidth: '0 0 2px 0',
    transition: 'all 0.3s ease',
  },
  tabButtonHover: {
    color: '#e2e8f0',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05))',
  },
  tabButtonActive: {
    color: '#60a5fa',
    borderBottom: '2px solid #60a5fa',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1))',
  },
  contentContainer: {
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.8))',
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
    border: '1px solid #334155',
    borderTop: 'none',
    backdropFilter: 'blur(10px)',
  },
  sendForm: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.6), rgba(71, 85, 105, 0.4))',
    border: '1px solid #475569',
    borderRadius: '0.375rem',
    color: '#cbd5e1',
    marginBottom: '1rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.6), rgba(71, 85, 105, 0.4))',
    border: '1px solid #475569',
    borderRadius: '0.375rem',
    color: '#cbd5e1',
    resize: 'none',
    minHeight: '80px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  recordButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontWeight: '600',
    borderRadius: '0.375rem',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    cursor: 'pointer',
    minWidth: '180px',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
  },
  recordButtonHover: { 
    background: 'linear-gradient(135deg, #059669, #047857)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(16, 185, 129, 0.4)',
  },
  recordingButton: { 
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
    animation: 'pulse 1.5s infinite',
  },
  recordingButtonHover: { 
    background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(220, 38, 38, 0.4)',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)',
  },
  sendButtonHover: { 
    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(37, 99, 235, 0.4)',
  },
  sendButtonDisabled: { 
    background: 'linear-gradient(135deg, #475569, #334155)',
    cursor: 'not-allowed',
    boxShadow: 'none',
    transform: 'none',
  },
  emptyInbox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '16rem',
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.4))',
    borderRadius: '0.5rem',
  },
  messageList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  messageCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  messageSender: { fontFamily: 'monospace', color: '#e2e8f0' },
  messageActions: { borderTop: '1px solid #334155', paddingTop: '0.75rem' },
  reactButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.3s ease',
  },
  reactButtonHover: { color: '#f87171', transform: 'scale(1.1)' },
  reactButtonDisabled: { color: '#ef4444', cursor: 'not-allowed' },
  audioPlayer: { width: '100%', height: '2.5rem', borderRadius: '0.375rem' },
};

const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
  return [isHovered, hoverProps];
};

const SendForm = ({ onSendMessage }) => {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const [recordBtnHover, recordBtnProps] = useHover();
  const [sendBtnHover, sendBtnProps] = useHover();

  const handleStartRecording = async () => {
    setAudioURL(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setRecordingTime(0);
      };

      recorder.start();
      setIsRecording(true);
      
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

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
    if ((!message.trim() && !audioURL) || !recipient.trim()) {
      alert("A recipient and a message or audio are required.");
      return;
    }
    onSendMessage({ text: message, audio: audioURL, recipient });
    setMessage("");
    setRecipient("");
    setAudioURL(null);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const isSendDisabled = (!message.trim() && !audioURL) || !recipient.trim();

  return (
    <div style={styles.sendForm}>
      <h2 style={styles.h2}>Send Message</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Recipient Wallet Address..."
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <textarea 
        style={styles.textarea} 
        placeholder="Type your message..." 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
      {audioURL && <audio src={audioURL} controls style={{...styles.audioPlayer, marginTop: '1rem'}} />}
      <div style={styles.buttonRow}>
        <button
          {...recordBtnProps}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          style={{
            ...styles.recordButton,
            ...(isRecording ? styles.recordingButton : {}),
            ...(recordBtnHover && (isRecording ? styles.recordingButtonHover : styles.recordButtonHover)),
          }}
        >
          {isRecording ? <StopCircleIcon /> : <MicrophoneIcon />}
          {isRecording ? `Recording... (${formatTime(recordingTime)})` : "Record Audio"}
        </button>
        <button
          {...sendBtnProps}
          onClick={handleSubmit}
          disabled={isSendDisabled}
          style={{
            ...styles.sendButton,
            ...(isSendDisabled ? styles.sendButtonDisabled : {}),
            ...(sendBtnHover && !isSendDisabled ? styles.sendButtonHover : {}),
          }}
        >
          Send <SendPlaneIcon />
        </button>
      </div>
    </div>
  );
};

const MessageCard = ({ msg, onReact }) => {
  const { publicKey } = useWallet();
  const hasReacted = msg.reactions.some(r => r.user === publicKey?.toString());
  const [reactBtnHover, reactBtnProps] = useHover();
  const truncate = (str) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : '';

  return (
    <div style={styles.messageCard}>
      <div style={styles.messageHeader}>
        <div>From: <span style={styles.messageSender}>{truncate(msg.sender)}</span></div>
        <div>To: <span style={styles.messageSender}>{truncate(msg.recipient)}</span></div>
        <div>{msg.timeSent}</div>
      </div>
      {msg.message && <p>{msg.message}</p>}
      {msg.audioMessage && <audio controls src={msg.audioMessage} style={styles.audioPlayer} />}
      <div style={styles.messageActions}>
        <button
          {...reactBtnProps}
          onClick={() => onReact(msg.id)}
          disabled={hasReacted}
          style={{
            ...styles.reactButton,
            ...(hasReacted ? styles.reactButtonDisabled : {}),
            ...(reactBtnHover && !hasReacted ? styles.reactButtonHover : {})
          }}
        >
          <HeartIcon style={hasReacted ? { color: '#ef4444' } : {}} />
          <span>{msg.reactions.length}</span>
        </button>
      </div>
    </div>
  );
};

const Inbox = ({ messages, onReact }) => {
  if (messages.length === 0) {
    return (
      <div style={styles.emptyInbox}>
        <InboxIcon style={{ fontSize: '2.5rem', color: '#64748b', marginBottom: '1rem' }} />
        <h3 style={{...styles.h2, fontSize: '1.25rem'}}>Your Inbox is Empty</h3>
        <p style={{color: '#94a3b8'}}>Messages you receive will appear here.</p>
      </div>
    );
  }
  return <div style={styles.messageList}>{messages.map(msg => <MessageCard key={msg.id} msg={msg} onReact={onReact} />)}</div>;
};

export default function SendMessagePage() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("send");
  const [messages, setMessages] = useState([]);

  const handleSendMessage = ({ text, audio, recipient }) => {
    const newMessage = {
      id: messages.length + 1,
      message: text,
      audioMessage: audio,
      recipient,
      sender: publicKey?.toString() || "Anonymous",
      timeSent: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setMessages(prev => [newMessage, ...prev]);
    setActiveTab("inbox");
  };

  const handleReact = (id) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === id && !msg.reactions.some(r => r.user === publicKey?.toString())) {
          return {
            ...msg,
            reactions: [...msg.reactions, { reaction: "❤️", user: publicKey?.toString() }]
          };
        }
        return msg;
      })
    );
  };

  const TabButton = ({ tabName, label, icon }) => {
    const [isHovered, hoverProps] = useHover();
    const isActive = activeTab === tabName;
    return (
      <button
        {...hoverProps}
        onClick={() => setActiveTab(tabName)}
        style={{
          ...styles.tabButton,
          ...(isActive ? styles.tabButtonActive : {}),
          ...(isHovered && !isActive ? styles.tabButtonHover : {}),
        }}
      >
        {icon} <span>{label}</span>
      </button>
    );
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              opacity: 1;
              transform: scale(1);
            }
            50% { 
              opacity: 0.8;
              transform: scale(1.02);
            }
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.tabContainer}>
          <TabButton tabName="send" label="Send a Message" icon={<PaperPlaneIcon />} />
          <TabButton tabName="inbox" label="Inbox" icon={<InboxIcon />} />
        </div>
        <div style={styles.contentContainer}>
          {activeTab === "send" && <SendForm onSendMessage={handleSendMessage} />}
          {activeTab === "inbox" && <Inbox messages={messages} onReact={handleReact} />}
        </div>
      </div>
    </div>
  );
}