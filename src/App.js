import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { awsExports } from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from "aws-amplify";
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';

Amplify.configure({
  Auth: {
    region: awsExports.REGION,
    userPoolId: awsExports.USER_POOL_ID,
    userPoolWebClientId: awsExports.USER_POOL_APP_CLIENT_ID
  }
});


function App() {
  const dashboardRef = useRef([]);
  const [dashboardId, setDashboardId] = useState('b8957e77-0ede-45b9-9a7f-fa64b52edc66');
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [embeddingContext, setEmbeddingContext] = useState(null);

  const [jwtToken, setJwtToken] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch("https://wps9gicub5.execute-api.us-east-1.amazonaws.com/embed/anonymous-embed"
      ).then((response) => response.json()
      ).then((response) => {
        console.log(response)
        setDashboardUrl(response.EmbedUrl)
      })
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  const createContext = async () => {
    const context = await createEmbeddingContext();
    setEmbeddingContext(context);
  }

  useEffect(() => {
    if (dashboardUrl) { createContext() }
  }, [dashboardUrl])

  useEffect(() => {
    if (embeddingContext) { embed(); }
  }, [embeddingContext])

  const embed = async () => {

    const options = {
      url: dashboardUrl,
      container: dashboardRef.current,
      height: "500px",
      width: "600px",
    };

    const newEmbeddedDashboard = await embeddingContext.embedDashboard(options);
    setEmbeddedDashboard(newEmbeddedDashboard);
  };

  useEffect(() => {
    if (embeddedDashboard) {
      embeddedDashboard.navigateToDashboard(dashboardId, {})
    }
  }, [dashboardId])

  const changeDashboard = async (e) => {
    const dashboardId = e.target.value
    setDashboardId(dashboardId)
  }

  useEffect(() => {
    fetchJwtToken();
  }, []);

  const fetchJwtToken = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      setJwtToken(token);
    } catch (error) {
      console.log('Error fetching JWT token:', error);
    }
  };


  return (
    <Authenticator initialState='signIn'
    components={{
      SignUp: {
        FormFields() {

          return (
            <>
              <Authenticator.SignUp.FormFields />

              {/* Custom fields for given_name and family_name */}
              <div><label>First name</label></div>
              <input
                type="text"
                name="given_name"
                placeholder="Please enter your first name"
              />
              <div><label>Last name</label></div>
              <input
                type="text"
                name="family_name"
                placeholder="Please enter your last name"
              />
              <div><label>Email</label></div>
              <input
                type="text"
                name="email"
                placeholder="Please enter a valid email"
              />


            </>
          );
        },
      },
    }}
    services={{
      async validateCustomSignUp(formData) {
        if (!formData.given_name) {
          return {
            given_name: 'First Name is required',
          };
        }
        if (!formData.family_name) {
          return {
            family_name: 'Last Name is required',
          };
        }
        if (!formData.email) {
          return {
            email: 'Email is required',
          };
        }
      },
    }}
    >
      {({ signOut, user}) => (
        <div>
        <>
          <header>
            <h1>Nimblemind <i>inSight</i></h1>
          </header>
          <main>
            <p>{user.username}, welcome to the Nimblemind inSight</p>
            <p>Please pick a dashboard you want to render</p>
            <select id='dashboard' value={dashboardId} onChange={changeDashboard}>
              <option value="b8957e77-0ede-45b9-9a7f-fa64b52edc66">Health Data 1</option>
            </select>
          <div ref={dashboardRef} />
          </main>
        </>

        <button onClick={signOut}>Sign out</button>
        </div>
      )}
    </Authenticator>
  );
}

export default App;