import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { IAppState } from './types/app-state';
import styled from 'styled-components';
import { FeedsList } from './components/FeedsList';
import { FeedContent } from './components/FeedContent';
import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

const LogoutButton = styled.button`
    height: 26px;
    background-color: transparent;
    border: none;
`;

const Logo = styled.h1`
    color: whitesmoke;
    font-weight: 600;
    display: block;
    height: 64px;
    line-height: 64px;
    box-sizing: border-box;
    text-align: center;
    text-decoration: underline;
`;

const initialState: IAppState = {
    auth: null,
    selectedFeedId: null,
};

export const AppContext = React.createContext(initialState);

function App() {

    const [state, setState] = useState(initialState);
    const [siderCollapsed, setSiderCollapseState] = useState(false);
    // const [auth, setAuth] = useState(null as GoogleLoginResponse | null);

    const logout = () => {
        localStorage.removeItem('rss-cached-auth');
        // setAuth(null);
        setState(_state => ({ ..._state, auth: null }));
    };

    return <AppContext.Provider value={state}>

        <Layout style={{ height: '100vh' }}>
            <Sider collapsible collapsed={siderCollapsed} onCollapse={setSiderCollapseState}>
                <Logo>💬 RSS</Logo>
                <FeedsList onFeedSelected={(selectedFeedId) => setState(_state => ({ ...state, selectedFeedId }))} />
            </Sider>
            <Layout>
                <Header style={{ padding: 0 }}>
                    
                </Header>
                <Content style={{ margin: '0 16px', overflow: 'auto' }}>
                    <FeedContent />
                </Content>
            </Layout>
        </Layout>

        {(state.auth === null) && <AuthModal onAuthenticated={(auth) => setState(_state => ({ ..._state, auth }))} />}

    </AppContext.Provider>;

}

export default App;
