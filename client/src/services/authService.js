import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      };
    } else {
      // User document doesn't exist, create one
      const userData = {
        email: user.email,
        displayName: user.displayName || '',
        userType: 'mediator', // Default to mediator
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      };
    }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, displayName, userType = 'mediator') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Create user document in Firestore
    const userData = {
      email: user.email,
      displayName: displayName,
      userType: userType,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      ...userData
    };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update Firestore document
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date()
    });
    
    // Update Firebase Auth profile if display name changed
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            ...userDoc.data()
          };
          callback(userData);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

/**
 * Get current user's ID token
 */
export const getCurrentUserToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting user token:', error);
    throw error;
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = async (requiredRole) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    return user.userType === requiredRole;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = async () => {
  return await hasRole('admin');
};

/**
 * Check if user is mediator
 */
export const isMediator = async () => {
  return await hasRole('mediator');
};