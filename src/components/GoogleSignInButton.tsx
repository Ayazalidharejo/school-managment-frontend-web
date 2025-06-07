// import React, { useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';

// interface GoogleSignInButtonProps {
//   text?: string;
//   className?: string;
// }

// const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
//   text = "Continue with Google",
//   className = ""
// }) => {
//   const { googleLogin } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Initialize Google Sign-In
//     if (window.google) {
//       window.google.accounts.id.initialize({
//         client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id",
//         callback: handleCredentialResponse,
//         auto_select: false,
//         cancel_on_tap_outside: true,
//       });
//     }
//   }, []);

//   const handleCredentialResponse = async (response: any) => {
//     try {
//       await googleLogin(response.credential);
//       navigate('/dashboard');
//     } catch (error: any) {
//       toast.error(error.message || 'Google sign-in failed');
//     }
//   };

//   const handleGoogleSignIn = () => {
//     if (window.google) {
//       window.google.accounts.id.prompt();
//     } else {
//       toast.error('Google Sign-In not available');
//     }
//   };

//   return (
//     <button
//       type="button"
//       onClick={handleGoogleSignIn}
//       className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
//     >
//       <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
//         <path
//           fill="#4285F4"
//           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//         />
//         <path
//           fill="#34A853"
//           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//         />
//         <path
//           fill="#FBBC05"
//           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//         />
//         <path
//           fill="#EA4335"
//           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//         />
//       </svg>
//       {text}
//     </button>
//   );
// };

// // Extend the Window interface to include Google Sign-In
// declare global {
//   interface Window {
//     google: any;
//   }
// }

// export default GoogleSignInButton;



import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Aapka custom auth context
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = "Continue with Google",
  className = ""
}) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const clientId = "1066353132066-lj47amt2dbdpd29fje0iv6dkgddlb11n.apps.googleusercontent.com";

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => initializeGoogleSignIn();
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const initializeGoogleSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log("Prompt not displayed:", notification.getNotDisplayedReason());
          toast.error("Sign-in prompt not displayed: " + notification.getNotDisplayedReason());
        }
        if (notification.isSkippedMoment()) {
          console.log("Prompt skipped:", notification.getSkippedReason());
          toast.error("Sign-in prompt skipped: " + notification.getSkippedReason());
        }
      });
    } else {
      toast.error('Google Sign-In not available');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {text}
    </button>
  );
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

export default GoogleSignInButton;
