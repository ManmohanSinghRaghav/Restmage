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
import { useTheme } from '@mui/material/styles';
import { chatbotAPI } from '../../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const theme = useTheme();
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
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
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

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(currentInput, conversationId);
      
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      const botReply = response.botResponse;

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: botReply,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
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

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
          <BotIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Real Estate Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Always here to help with your property needs
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2, 
          bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          backgroundImage: isDark ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 100%)' : 'none'
        }}>
          <List sx={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%', maxWidth: '85%' }}
              >
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    px: 0,
                    py: 0.5
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      px: 2,
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                      color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: message.sender === 'user' 
                        ? `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 ${theme.shape.borderRadius}px` 
                        : `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0`,
                      border: message.sender === 'user' ? 'none' : `1px solid ${theme.palette.divider}`,
                      boxShadow: theme.shadows[1],
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {message.text}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.6, fontSize: '0.7rem', textAlign: 'right' }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </ListItem>
              </motion.div>
            ))}
            {loading && (
              <Box sx={{ alignSelf: 'flex-start', mt: 1 }}>
                <Paper elevation={0} sx={{ p: 1.5, px: 2, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, borderRadius: `12px 12px 12px 0` }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Typing...
                  </Typography>
                </Paper>
              </Box>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Suggested:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  size="small"
                  onClick={() => handleQuickQuestion(question)}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask anything about your project..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: `${theme.shape.borderRadius}px` }
            }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              borderRadius: `${theme.shape.borderRadius}px`,
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chatbot;
