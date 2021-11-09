import { GoogleLoginResponse } from 'react-google-login';

export interface IAppState {
    auth: GoogleLoginResponse | null;
    selectedFeedId: string | null;
}
