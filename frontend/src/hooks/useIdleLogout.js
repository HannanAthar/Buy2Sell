import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 30 * 60 * 1000;

export const useIdleLogout = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    // Double check role prevents race conditions if role changed
    const role = localStorage.getItem('role');
    if (role === 'admin') return;

    console.log('User inactive for timeout period. Logging out...');
    
    // Clear all local storage items we identified
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('designer');
    localStorage.removeItem('reseller');
    localStorage.removeItem('buyer');
    
    // Redirect to login
    navigate('/Login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Check if user is actually logged in (has token)
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Admin check: do not set timer if user is admin
    if (token && role !== 'admin') {
        timerRef.current = setTimeout(logout, TIMEOUT_MS);
    }
  }, [logout]);

  useEffect(() => {
    // Events to listen for
    const events = [
      'load',
      'mousemove',
      'mousedown',
      'click',
      'scroll',
      'keypress'
    ];

    const handleEvent = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [resetTimer]);
};
