import { useState } from "react";
import { motion } from "framer-motion";

export default function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hey! I’m your Real Estate AI Assistant. How can I help?" }
  ]);
  const [inputMsg, setInputMsg] = useState("");

  const sendMessage = async () => {
    if (!inputMsg.trim()) return;

    const userMessage = { sender: "user", text: inputMsg };
    setMessages([...messages, userMessage]);
    setInputMsg("");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": window.location.origin, // Recommended by OpenRouter
    "X-Title": "Real Estate Chatbot"
  },
  body: JSON.stringify({
    model: "meta-llama/llama-3.1-70b-instruct",
    messages: [
      { role: "system", content: "You are a smart and friendly real estate assistant. You answer clearly, understand casual chat, and give helpful property/location suggestions." },
      { role: "user", content: inputMsg }
    ],
    temperature: 0.7
  })
});

const data = await response.json();
const botReply = data.choices?.[0]?.message?.content || "Hmm, I'm thinking…";


      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error fetching response." }]);
      console.error(err);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={styles.chatBox}
      >
        <h2 style={styles.title}>🏡 Real Estate Chatbot</h2>

        <div style={styles.messages}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              style={{
                ...styles.message,
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                background: msg.sender === "user" ? "#0066ff" : "#e3e3e3",
                color: msg.sender === "user" ? "white" : "black"
              }}
            >
              {msg.text}
            </motion.div>
          ))}
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            placeholder="Ask about property / location..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={handleKey}
          />
          <button style={styles.btn} onClick={sendMessage}>Send</button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    background: "#101114",
    minHeight: "100vh",
    padding: "40px",
    display: "flex",
    justifyContent: "center"
  },
  chatBox: {
    background: "white",
    width: "380px",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 0 25px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column"
  },
  title: { margin: 0, textAlign: "center" },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px",
    height: "420px",
    overflowY: "auto",
    borderRadius: "10px",
    background: "#fafafa",
    marginTop: "10px"
  },
  message: {
    padding: "10px 14px",
    borderRadius: "18px",
    maxWidth: "75%",
    fontSize: "14px"
  },
  inputArea: { display: "flex", marginTop: "10px", gap: "10px" },
  input: { flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid gray" },
  btn: { padding: "10px 16px", borderRadius: "10px", border: "none", background: "#0066ff", color: "white" }
};
