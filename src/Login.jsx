import React, { useState, useEffect } from 'react';
import { authorizeExternal } from './net';

const Login = () => {
  const [urlParams, setUrlParams] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log(params)
    if (params.toString()) {
      setUrlParams(Object.fromEntries(params));
    }
  }, []);

  useEffect(() => {
    if (urlParams) {
      handleOauthLogin();
    }
  }, [urlParams]);

  const handleOauthLogin = async () => {
    const provider = Object.values(urlParams).some((value) => value.includes('github')) ? 'github' : 'google';
    try {
      const { data } = await authorizeExternal(provider, urlParams);
      console.log(data)
      if (data.error) {
        throw new Error(data.error);
      } else {
        localStorage.setItem('user_uuid', data.user_uuid);
        localStorage.setItem('token', data.token);
        window.location.href = '/'; // Redirect to the main page after successful login
      }
    } catch (e) {
      console.log(e.message);
      setError(e.message);
    }
  };

  return error ? <pre>{JSON.stringify({ error }, null, 2)}</pre> : "";;
};

export default Login;