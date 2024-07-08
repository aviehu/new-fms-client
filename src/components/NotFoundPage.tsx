
import {Card, Container, Typography} from "@mui/material";

export default function NotFoundPage() {

    return (
        <Container style={{ minHeight: '100vh', alignContent: 'center'}}>
            <Card style={{padding: '60px 120px'}}>
                <div style={{textAlign: 'center', width: '100%'}}>
                    <img src="driveu-logo-bar.png" width={300}
                         style={{marginRight: 10 + 'px', marginLeft: 5 + 'px', marginTop: 5 + 'px'}} alt={'logo'}/>
                </div>
                <Typography variant='h2' marginTop={8}>
                    404
                </Typography>
                <Typography variant='h4' marginTop={2}>
                    Could not find the requested path
                </Typography >
            </Card>
        </Container>
    )
}