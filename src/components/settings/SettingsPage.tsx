import {Box, Card, IconButton, Stack, TextField, Tooltip, Typography} from "@mui/material";
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import {useEffect, useState} from "react";
import InfoIcon from '@mui/icons-material/Info';
import GamepadSettings from "./GampadSettings.tsx";
export default function SettingsPage() {
    const [nodeSet, setNodeSet] = useState<string>('')

    useEffect(() => {
        const nodeSet = localStorage.getItem('nodeSet') || ''
        setNodeSet(nodeSet)
    }, []);

    return (
        <Box margin={5} minWidth={850}>
        <Stack spacing={2} >
            <Typography variant={'h5'}>Settings</Typography>
            <Card style={{ padding: '20px' }}>
                <Stack paddingLeft={3} spacing={1}>
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
                        <Tooltip title={`When assigning a pipeline add this node set, if it exists, to the request `}>
                            <InfoIcon />
                        </Tooltip>
                    </Stack>
                </Stack>
            </Card>
            <Card style={{ padding: '20px' }}>
                <Stack paddingLeft={3}spacing={1}>
                    <Typography variant={'h6'}>Gamepad</Typography>
                    <GamepadSettings />
                </Stack>
            </Card>
        </Stack>
        </Box>
    )
}