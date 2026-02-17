import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/**
 * Hook to check if user is authenticated
 * Returns a function that checks login status and handles redirects
 */
export const useAuthCheck = () => {
  const navigate = useNavigate();
  
  const checkAuth = (action = 'perform this action') => {
    try {
      // Check for token (primary auth indicator)
      const token = localStorage.getItem('token');
      
      // Check for user profile (can be userProfile, userInfo, or role-specific keys)
      const _userProfile = localStorage.getItem('userProfile');
      const _userInfo = localStorage.getItem('userInfo');
      const _role = localStorage.getItem('role');
      
      // User is authenticated if they have a token
      // Some components may only need token, others need profile data
      if (!token) {
        toast.error(`Please login to ${action}`, {
          duration: 3000,
          position: 'top-center',
        });
        
        // Store current location for redirect after login
        const currentPath = window.location.pathname;
        localStorage.setItem('redirectAfterLogin', currentPath);
        
        // Redirect to login after short delay
        setTimeout(() => {
          navigate('/Login');
        }, 1500);
        
        return false;
      }
      
      // Token exists, user is authenticated
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };
  
  return { checkAuth };
};

