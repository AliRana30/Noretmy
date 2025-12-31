import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReplyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { rowData } = state || {}; // Use default empty object if state is undefined

  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Make the API call to submit the reply message
      await axios.post('https://noretmy-backend.vercel.app/api/contact/reply', {
        messageId:rowData._id,
        email: rowData.email,
        message: replyMessage,
        // Additional data can be included here if needed
      });
      // Navigate back or to another page after successful submission
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reply">
      <div className="replyContainer">
        <div className="replyForm">
          <h2>Reply to Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="formGroup">
              <label>Email:</label>
              <input type="text" value={rowData?.email || ''} readOnly />
            </div>
            <div className="formGroup">
              <label>Message:</label>
              <textarea value={rowData?.message || ''} readOnly />
            </div>
            <div className="formGroup">
              <label>Your Reply:</label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reply'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyEmail;
