import React, { useEffect } from 'react';
import styled from 'styled-components';
import { GoogleLogin, GoogleLoginResponse } from 'react-google-login';

const ModalBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    box-sizing: border-box;
    background-color: rgba(0, 0, 0, 0.2);
`;

const Modal = styled.div`
    position: absolute;
    background-color: whitesmoke;
    min-width: 400px;
    width: fit-content;
    min-height: 100px;
    height: fit-content;
    box-sizing: border-box;
    padding: 16px;
    border-radius: 16px;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    text-align: center;
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
`;

interface IProps {
    onAuthenticated: (auth: GoogleLoginResponse) => void,
}

export const AuthModal = (props: IProps) => {

    useEffect(() => {
        const cachedAuthStr = localStorage.getItem('rss-cached-auth');
        if (cachedAuthStr && (JSON.parse(cachedAuthStr) as GoogleLoginResponse).tokenObj.expires_at > (new Date()).getTime()) {
            console.log(`Cached authentication info found, restoring...`);
            props.onAuthenticated(JSON.parse(cachedAuthStr));
        }
    });

    const onAuthenticated = (response: GoogleLoginResponse) => {
        console.log(response);
        props.onAuthenticated(response);
        localStorage.setItem('rss-cached-auth', JSON.stringify(response));
    };

    const onAuthFailure = (err: any) => {

    };

    return <ModalBackground>
        <Modal>

            <h1>Authentication required</h1>

            <p>Authenticate with Google account</p>

            <GoogleLogin
                clientId="138978874183-lqls6tcc8ejeb4bgv0jqho75tgisnkef.apps.googleusercontent.com"
                buttonText="Fucking Login"
                onSuccess={(response) => onAuthenticated(response as GoogleLoginResponse)}
                onFailure={onAuthFailure}
            />

        </Modal>
    </ModalBackground>;

};
