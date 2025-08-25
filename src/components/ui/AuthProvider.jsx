'use client'
import { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [cred, setCred] = useState(null);
  const [authorized, setAuthorized] = useState(false)
  const login = async (pwd) => {
    const credentials = `admin:${pwd}`;
    const encodedCredentials = btoa(credentials);
    const authorizationHeader = `Basic ${encodedCredentials}`;
    setCred(authorizationHeader);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth`, {
      method: 'GET',
      headers: {
        'Authorization': authorizationHeader,
      }
    });
    setAuthorized(res.ok);
    return res.ok;
  };


  return (
    <AuthContext.Provider value={{ cred, setCred, login, authorized }}>
      {children}
    </AuthContext.Provider>
  );
}

