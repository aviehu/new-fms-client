import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {Auth0Provider} from "@auth0/auth0-react";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Auth0Provider domain={'https://driveu-dev.eu.auth0.com'} clientId={'dc22hDS2MtdSo3907cprNH79ovlPzIlf'} authorizationParams={{
        redirect_uri: window.location.origin
    }}>
        <App />
    </Auth0Provider>
)
