import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Login = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  return (
    <div>
      {!isAuthenticated && (
        <>
          <h2>Login</h2>
          <button onClick={() => loginWithRedirect()}>Login</button>
        </>
      )}
    </div>
  );
};

export default Login;
