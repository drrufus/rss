import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { IAppState } from './types/app-state';
import styled from 'styled-components';
import { FeedsList } from './components/FeedsList';
import { FeedContent } from './components/FeedContent';
import { Layout } from 'antd';
import { HeaderPanel } from './components/HeaderPanel';
import { GoogleLoginResponse } from 'react-google-login';
import { FireOutlined } from '@ant-design/icons';

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
`;

interface IState {
    auth: GoogleLoginResponse | null;
    selectedFeedId: string | null;
}

export const AppContext = React.createContext<IAppState>({
    auth: null,
    selectedFeedId: null,
    logout: () => {},
});

function App() {

    const [state, setState] = useState<IState>({
        auth: null,
        selectedFeedId: null,
    });
    const [siderCollapsed, setSiderCollapseState] = useState(false);
    // const [auth, setAuth] = useState(null as GoogleLoginResponse | null);

    const logout = () => {
        localStorage.removeItem('rss-cached-auth');
        // setAuth(null);
        setState(_state => ({ ..._state, auth: null }));
    };

    return <AppContext.Provider value={{ ...state, logout }}>

        <Layout style={{ height: '100vh' }}>
            <Sider collapsible collapsed={siderCollapsed} onCollapse={setSiderCollapseState}>
                <Logo><FireOutlined /> RSS</Logo>
                <FeedsList onFeedSelected={(selectedFeedId) => setState(_state => ({ ...state, selectedFeedId }))} />
            </Sider>
            <Layout>
                <HeaderPanel />
                <Content style={{ margin: '0 16px', overflow: 'auto' }}>
                    <FeedContent />
                </Content>
            </Layout>
        </Layout>

        <AuthModal open={state.auth === null} onAuthenticated={(auth) => setState(_state => ({ ..._state, auth }))} />

    </AppContext.Provider>;

}

export default App;
