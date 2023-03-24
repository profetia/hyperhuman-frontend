import React, { useState, useEffect } from 'react';
import { authorizeExternal } from './net';

const Login = () => {
  const [urlParams, setUrlParams] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log(params)
    const provider = params.get('oauth');
    setProvider(provider)
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
    
    try {
      const { data } = await authorizeExternal(provider, urlParams);
      if (data.error) {
        throw new Error(data.error);
      } else {
        localStorage.setItem('user_uuid', data.user_uuid);
        localStorage.setItem('token', data.token);
        window.location.href = '/';
      }
    } catch (e) {
      console.log(e.message);
      setError(e.message);
    }
  };

  return error ? <pre>{JSON.stringify({ error }, null, 2)}</pre> : "";;
};

export default Login;