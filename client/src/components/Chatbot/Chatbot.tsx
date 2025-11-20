import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! I\'m your Real Estate AI Assistant. How can I help?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      // Call OpenAI Chat Completions API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a smart and friendly real estate assistant. You answer clearly, understand casual chat, and give helpful property/location, pricing, floor plan, and design suggestions with concise explanations.'
            },
            {
              role: 'user',
              content: currentInput
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content?.trim() || 'Hmm, I\'m thinking…';

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: botReply,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'I ran into an issue. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'Generate a floor plan for 3 bedroom house',
    'What is the price of a 2000 sq ft house?',
    'What are the best materials for sustainable construction?',
    'Give me design tips for modern homes'
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
          <BotIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box>
            <Typography variant="h6">
              Real Estate Assistant
            </Typography>
            <Typography variant="caption">
              Always here to help with your property needs
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
          <List>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
              >
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      maxWidth: '75%',
                      bgcolor: message.sender === 'user' ? '#0066ff' : '#e3e3e3',
                      color: message.sender === 'user' ? 'white' : 'black',
                      borderRadius: '18px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontSize: '14px' }}>
                      {message.text}
                    </Typography>
                  </Paper>
                </ListItem>
              </motion.div>
            ))}
            {loading && (
              <ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#e3e3e3', borderRadius: '18px' }}>
                  <Typography variant="body1" color="text.secondary">
                    Typing...
                  </Typography>
                </Paper>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Quick questions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  size="small"
                  onClick={() => handleQuickQuestion(question)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chatbot;
