import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Video, Share, Bell, Eye, Edit3, Clock } from 'lucide-react';

const CollaborationHub = ({ alertId, currentUser, onlineUsers }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeViewers, setActiveViewers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Mock active viewers
      setActiveViewers([
        { id: 1, name: 'Sarah Johnson', avatar: '👩‍🏫', role: 'Academic Advisor', lastSeen: new Date() },
        { id: 2, name: 'Mike Chen', avatar: '👨‍💼', role: 'Student Services', lastSeen: new Date() },
        { id: 3, name: 'Dr. Rodriguez', avatar: '👩‍⚕️', role: 'Counselor', lastSeen: new Date() }
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: currentUser,
      content: newComment,
      timestamp: new Date(),
      type: 'comment',
      mentions: extractMentions(newComment)
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');

    // Simulate notification to mentioned users
    comment.mentions.forEach(mention => {
      sendNotification(mention, `${currentUser.name} mentioned you in alert #${alertId}`);
    });
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  const sendNotification = (username, message) => {
    // In real implementation, this would send actual notifications
    console.log(`Notification to ${username}: ${message}`);
  };

  const startVideoCall = () => {
    // Integrate with video calling service (Teams, Zoom, etc.)
    console.log('Starting video call for case collaboration...');
  };

  const startScreenRecording = () => {
    if (!isRecording) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(stream => {
          setIsRecording(true);
          // Implement screen recording logic
          console.log('Screen recording started for case documentation');
        })
        .catch(err => console.error('Error starting screen recording:', err));
    } else {
      setIsRecording(false);
      console.log('Screen recording stopped');
    }
  };

  const shareCase = () => {
    const shareData = {
      title: `Student Alert Case #${alertId}`,
      text: 'Requesting collaboration on student support case',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Case link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Case Collaboration
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={startVideoCall}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1 text-sm transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Video Call</span>
          </button>
          
          <button
            onClick={startScreenRecording}
            className={`px-3 py-2 rounded-lg flex items-center space-x-1 text-sm transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-1 ${isRecording ? 'bg-white' : 'bg-red-400'}`}></div>
            <span>{isRecording ? 'Recording...' : 'Record'}</span>
          </button>
          
          <button
            onClick={shareCase}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1 text-sm transition-colors"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Active Viewers */}
      <div className="border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-green-800 flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            Currently Viewing ({activeViewers.length})
          </span>
          <div className="flex -space-x-2">
            {activeViewers.map((viewer) => (
              <div
                key={viewer.id}
                className="relative"
                title={`${viewer.name} - ${viewer.role}`}
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white text-sm">
                  {viewer.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-sm text-green-700">
          Real-time collaboration active • Auto-saves every 30 seconds
        </div>
      </div>

      {/* Comments Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Case Discussion ({comments.length})
          </h4>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View History
          </button>
        </div>

        {/* Comments List */}
        <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-50 rounded-lg p-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                    {comment.user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">{comment.user.role}</span>
                      <span className="text-xs text-gray-400">
                        {comment.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-800 text-sm">{comment.content}</div>
                    {comment.mentions.length > 0 && (
                      <div className="mt-2 flex items-center space-x-1">
                        <Bell className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          Mentioned: {comment.mentions.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Comment Input */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addComment())}
              placeholder="Add a comment... Use @username to mention colleagues"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 Tip: Use @username to notify team members
            </div>
          </div>
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors self-start"
          >
            Post
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
        <button className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Edit3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm">Take Notes</span>
        </button>
        
        <button className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="text-sm">Schedule Follow-up</span>
        </button>
        
        <button className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm">Assign Team</span>
        </button>
      </div>
    </div>
  );
};

export default CollaborationHub;
