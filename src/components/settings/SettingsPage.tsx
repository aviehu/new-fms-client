import {Card, IconButton, Stack, TextField, Tooltip, Typography} from "@mui/material";
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import {useEffect, useState} from "react";
export default function SettingsPage() {
    const [nodeSet, setNodeSet] = useState<string>('')

    useEffect(() => {
        const nodeSet = localStorage.getItem('nodeSet') || ''
        setNodeSet(nodeSet)
    }, []);

    return (
        <Card style={{margin: '60px 120px', padding: '20px 20px' }}>
            <Typography variant={'h5'}>Settings</Typography>
            <Stack paddingTop={5} alignItems={'center'} direction={'row'} justifyContent={'space-between'}>
                <Typography variant={'h6'}>Node Set</Typography>
                <Stack alignItems={'center'} direction={'row'}>
                    <TextField
                        value={nodeSet}
                        onChange={(event) => {
                            setNodeSet(event.target.value)
                            localStorage.setItem('nodeSet', event.target.value)
                        }}
                        size={'small'}
                        label={'Node Set'}
                    />
                    <Tooltip title={`Clear Node Set`}>
                        <IconButton onClick={() => {
                            localStorage.removeItem('nodeSet')
                            setNodeSet('')
                        }}>
                            <NotInterestedIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

        </Card>
    )
}