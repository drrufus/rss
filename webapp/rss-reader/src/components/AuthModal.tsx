import React, { useContext, useEffect, useState } from 'react';
import { GoogleLogin, GoogleLoginResponse } from 'react-google-login';
import { AppContext } from '../App';
import { Alert, Modal } from 'antd';
import { config } from '../config';

interface IProps {
    open: boolean;
    onAuthenticated: (auth: GoogleLoginResponse) => void;
}

export const AuthModal = (props: IProps) => {

    const { onAuthenticated, open } = props;

    const context = useContext(AppContext);
    const { logout } = context;
    const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null)
    const [errMsg, setErrMsg] = useState<string | null>(null);

    useEffect(() => {
        const cachedAuthStr = localStorage.getItem('rss-cached-auth');
        if (cachedAuthStr && (JSON.parse(cachedAuthStr) as GoogleLoginResponse).tokenObj.expires_at > (new Date()).getTime()) {
            console.log(`Cached authentication info found, restoring...`);
            onAuthenticated(JSON.parse(cachedAuthStr));
        }
    }, []);

    const onSuccess = (response: GoogleLoginResponse) => {
        setErrMsg(null);
        console.log(response);
        localStorage.setItem('rss-cached-auth', JSON.stringify(response));

        if (authTimeout) {
            clearTimeout(authTimeout);
        }
        const timeLeftMs = response.tokenObj.expires_at - (new Date()).getTime();
        console.log(`Before session expiration: ${Math.round(timeLeftMs / 1000)}sec.`);
        const timeout = setTimeout(logout, timeLeftMs);
        setAuthTimeout(timeout);

        onAuthenticated(response);
    };

    const onAuthFailure = (err: any) => {
        console.warn('auth failure');
        console.warn(err);
        setErrMsg(JSON.stringify(err));
    };

    return <Modal visible={open} title="Authentication required" closable={false} footer={<></>}>
        <div style={{ textAlign: 'center' }}>
            <p>To create and edit RSS feeds you must be logged in:</p>

            {errMsg && <Alert type="error" message={errMsg} />}

            <GoogleLogin
                clientId={config.googleAuthClientId}
                buttonText="Login with Google"
                onSuccess={(response) => onSuccess(response as GoogleLoginResponse)}
                onFailure={onAuthFailure}
            />
        </div>
    </Modal>;

};
