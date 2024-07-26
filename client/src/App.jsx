import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from 'react-query';
import './App.css'

const fetchMessages = async () => {
  const response = await fetch('http://localhost:3001/messages');
  return response.json();
};

const postMessage = async (message) => {
  await fetch('http://localhost:3001/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};

const App = () => {
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState('');

  const { data: messages, refetch } = useQuery('messages', fetchMessages);

  const mutation = useMutation(postMessage, {
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'MESSAGE') {
        queryClient.setQueryData('messages', data.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  const handleSendMessage = () => {
    if (!messageContent) {
      return;
    }
    mutation.mutate({ content: messageContent });
    setMessageContent('');
  };

  return (
    <>
      <div className="chat">
        <div className="chat-name">Chat</div>
        <div className="chat-messages">
          {messages?.map((msg, index) => (
            <div key={index} className="chat-message">{msg.content}</div>
          ))}
        </div>
        <form className="chat-input">
          <input
            className='input' 
            type="text" 
            name='message'
            placeholder='Enter your message'
            onChange={(e) => setMessageContent(e.target.value)}
            autoComplete='off'
            value={messageContent}
          />
          <button className='button' onClick={handleSendMessage}>Send</button>
        </form>
      </div>
    </>
  )
};

const queryClient = new QueryClient();

const WrappedApp = () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

export default WrappedApp;