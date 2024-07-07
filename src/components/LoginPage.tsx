import {useAuth0} from "@auth0/auth0-react";
import {Button, Card, Container, Typography} from "@mui/material";

export default function LoginPage() {
    const {loginWithRedirect} = useAuth0()

    return (
        <Container style={{minHeight: '100vh', alignContent: 'center'}}>
            <Card style={{padding: '60px 120px'}}>
                <div style={{textAlign: 'center', width: '100%'}}>
                    <img src="driveu-logo-bar.png" width={300}
                         style={{marginRight: 10 + 'px', marginLeft: 5 + 'px', marginTop: 5 + 'px'}} alt={'logo'}/>
                </div>
                <Typography variant='h5' marginTop={14}>
                    You are not logged in to DLC
                </Typography>
                <Typography variant='h5' marginTop={2}>
                    Click below to redirect to login screen
                </Typography>
                <div style={{textAlign: 'center', width: '100%'}}>
                    <Button variant={'contained'} style={{width: 300,  marginTop: 112}} onClick={() => loginWithRedirect()}>
                        <Typography variant={'h6'}>Login</Typography>
                    </Button>
                </div>
            </Card>
        </Container>
    )
}