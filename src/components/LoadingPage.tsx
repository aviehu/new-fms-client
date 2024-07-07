
import {Card, CircularProgress, Container, Typography} from "@mui/material";

export default function LoadingPage() {

    return (
        <Container style={{ minHeight: '100vh', alignContent: 'center'}}>
            <Card style={{padding: '60px 120px'}}>
                <div style={{textAlign: 'center', width: '100%'}}>
                    <img src="driveu-logo-bar.png" width={300}
                         style={{marginRight: 10 + 'px', marginLeft: 5 + 'px', marginTop: 5 + 'px'}} alt={'logo'}/>
                </div>
                <Typography visibility={'hidden'} variant='h5' marginTop={14}>
                    You are not logged in to DLC
                </Typography>
                <Typography visibility={'hidden'} variant='h5' marginTop={2}>
                    Click below to redirect to login screen
                </Typography >
                <div style={{textAlign: 'center', width: '100%'}}>
                    <CircularProgress/>
                </div>
            </Card>
        </Container>
    )
}