import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { friendshipsApi } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { UserPlus, UserX, Check, X, Users, Search } from 'lucide-react';
import './FriendshipsPage.css';

const FriendshipCard = ({ friendship, onAccept, onReject, onRemove }) => {
  const { user } = useAuth();
  const isPending = friendship.status === 'pending';
  const isSentByMe = friendship.sender === user?._id;

  return (
    <div className="friendship-card">
      <div className="friend-info">
        <img src={friendship.friend?.profilePicture || '/default-avatar.png'} alt="Profile" className="friend-avatar" />
        <div className="friend-details">
          <h4>{friendship.friend?.firstName} {friendship.friend?.lastName}</h4>
          <p>{friendship.friend?.email}</p>
        </div>
      </div>
      <div className="friendship-status">
        {isPending ? (
          isSentByMe ? (
            <span className="status-pending">Request Sent</span>
          ) : (
            <div className="request-actions">
              <button onClick={() => onAccept(friendship._id)} className="icon-button accept-button">
                <Check size={18} /> Accept
              </button>
              <button onClick={() => onReject(friendship._id)} className="icon-button reject-button">
                <X size={18} /> Reject
              </button>
            </div>
          )
        ) : (
          <span className="status-friends">Friends</span>
        )}
      </div>
      {!isPending && (
        <button onClick={() => onRemove(friendship._id)} className="icon-button remove-button">
          <UserX size={18} /> Remove
        </button>
      )}
    </div>
  );
};

const FriendshipsPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { data: friendships, isLoading, error } = useQuery({
    queryKey: ['userFriendships', token],
    queryFn: () => friendshipsApi(token).getAll(),
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId) => friendshipsApi(token).acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userFriendships']);
      toast.success('Friend request accepted!');
    },
    onError: (err) => {
      toast.error(`Failed to accept request: ${err.message || 'Unknown error'}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => friendshipsApi(token).rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userFriendships']);
      toast.success('Friend request rejected!');
    },
    onError: (err) => {
      toast.error(`Failed to reject request: ${err.message || 'Unknown error'}`);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (friendshipId) => friendshipsApi(token).removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userFriendships']);
      toast.success('Friend removed successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to remove friend: ${err.message || 'Unknown error'}`);
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId) => friendshipsApi(token).sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userFriendships']);
      toast.success('Friend request sent!');
      setSearchEmail('');
      setSearchResults([]);
    },
    onError: (err) => {
      toast.error(`Failed to send request: ${err.message || 'Unknown error'}`);
    },
  });

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    // In a real app, you'd have a backend endpoint to search for users by email
    // For now, this is a mock search.
    // const response = await usersApi(token).searchByEmail(searchEmail);
    // For demo, let's just create a dummy user result

    // Mock search result - replace with actual API call
    const mockUser = {
      _id: 'mock-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: searchEmail,
      profilePicture: '/default-avatar.png',
    };

    setSearchResults([mockUser]); // Display mock user
    toast(`Searching for ${searchEmail}... (Mock search)`);
  };

  const getPendingRequests = () => friendships?.data?.filter(f => f.status === 'pending' && f.receiver === user?._id) || [];
  const getSentRequests = () => friendships?.data?.filter(f => f.status === 'pending' && f.sender === user?._id) || [];
  const getCurrentFriends = () => friendships?.data?.filter(f => f.status === 'accepted') || [];

  if (isLoading) {
    return <div className="friendships-page-loading">Loading friendships...</div>;
  }

  if (error) {
    return <div className="friendships-page-error">Error: {error.message}</div>;
  }

  return (
    <div className="friendships-page-container">
      <div className="friendships-header">
        <h1>Your Social Circle</h1>
        <div className="add-friend-section">
          <form onSubmit={handleSearchUsers} className="search-form">
            <input
              type="email"
              placeholder="Search user by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-primary">
              <Search size={20} /> Search User
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Search Results:</h4>
              {searchResults.map(result => (
                <div key={result._id} className="search-result-item">
                  <span>{result.firstName} {result.lastName} ({result.email})</span>
                  <button 
                    className="icon-button accept-button"
                    onClick={() => sendRequestMutation.mutate(result._id)}
                    disabled={sendRequestMutation.isLoading || getSentRequests().some(req => req.receiver === result._id)}
                  >
                    <UserPlus size={18} /> Send Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="friendships-sections">
        <div className="section-card">
          <h2><Users size={20} /> My Friends ({getCurrentFriends().length})</h2>
          <div className="friendship-list">
            {getCurrentFriends().length > 0 ? (
              getCurrentFriends().map(friendship => (
                <FriendshipCard 
                  key={friendship._id} 
                  friendship={friendship} 
                  onRemove={removeMutation.mutate} 
                />
              ))
            ) : (
              <p>You don't have any friends yet.</p>
            )}
          </div>
        </div>

        <div className="section-card">
          <h2><UserPlus size={20} /> Pending Requests ({getPendingRequests().length})</h2>
          <div className="friendship-list">
            {getPendingRequests().length > 0 ? (
              getPendingRequests().map(friendship => (
                <FriendshipCard 
                  key={friendship._id} 
                  friendship={friendship} 
                  onAccept={acceptMutation.mutate}
                  onReject={rejectMutation.mutate}
                />
              ))
            ) : (
              <p>No pending friend requests.</p>
            )}
          </div>
        </div>

        <div className="section-card">
          <h2><Users size={20} /> Requests Sent ({getSentRequests().length})</h2>
          <div className="friendship-list">
            {getSentRequests().length > 0 ? (
              getSentRequests().map(friendship => (
                <FriendshipCard 
                  key={friendship._id} 
                  friendship={friendship} 
                />
              ))
            ) : (
              <p>No friend requests sent.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendshipsPage; 