import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser, checkFollowStatus } from '../services/followService.js';
import { useAuth } from '../context/AuthContext';

const FollowButton = ({ username }) => {
  //console.log("username del perfil a seguir:", username);
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await checkFollowStatus(user.username, username);
        setIsFollowing(response.isFollowing); // Asegúrate de que `response.isFollowing` sea booleano
      } catch (error) {
        console.error("Error al verificar estado de seguimiento:", error);
      }
    };
  
    if (user.username !== username) {
      fetchFollowStatus();
    }
  }, [user.username, username]);
  

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(user.username, username);
        setIsFollowing(false);
      } else {
        await followUser(user.username, username);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error al realizar la acción de seguimiento:", error);
    }
  };
  

  if (user.username === username) return null; // No mostrar el botón en el perfil propio

  return (
    <button
      onClick={handleFollow}
      className={`btn ${isFollowing ? 'unfollow-button' : 'follow-button'}`}
    >
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  );
};

export default FollowButton;
