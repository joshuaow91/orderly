import React, { createContext } from "react";
import { useQuery } from 'react-query';
import { authenticateUser } from '../services/authenticationAPIcalls';

export const AuthContext = createContext({
  toggleLogin: () => {},
  isLoggedIn: false,
});

export const AuthProvider = ({ children }) => {

  const {
    data: isLoggedIn,
    refetch
  } = useQuery('validateToken', authenticateUser, {
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const toggleLogin = () => {
    refetch();
  };
  


  return (
    <AuthContext.Provider value={{ isLoggedIn, toggleLogin}}>
      {children}
    </AuthContext.Provider>
  );
};
