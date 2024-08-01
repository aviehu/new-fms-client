import {Chip, Fab, Stack, Tooltip} from "@mui/material";
import {SOCKET_STATES} from "./controller/RtcSocket.ts";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WidthNormalIcon from "@mui/icons-material/WidthNormal";
import WidthFullIcon from "@mui/icons-material/WidthFull";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

function BottomLeftControls({ api } : { api: any }) {
    return(
           <Stack style={{position: 'absolute', left: 35, bottom: 35}} spacing={4} direction={'row'}>
                <Tooltip placement={'top'} title={'Resume'}>
                    <Fab size="small" onClick={api.resumeVideo}>
                        <PlayArrowIcon/>
                    </Fab>
                </Tooltip>
                <Tooltip placement={'top'} title={'Pause'}>
                    <Fab size="small" onClick={api.pauseVideo}>
                        <PauseIcon/>
                    </Fab>
                </Tooltip>
                <Tooltip placement={'top'} title={'IDR'}>
                    <Fab size="small" onClick={api.forceIdr}>
                        <AutoFixHighIcon/>
                    </Fab>
                </Tooltip>
            </Stack>
    )
}

function BottomRightControls({ api } : { api: any }) {
    return(
        <Stack style={{position: 'absolute', right: 35, bottom: 35}} spacing={4} direction={'row'}>
            <Stack spacing={2}>
                <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Saturation'}></Chip>
                <Stack spacing={2} direction={'row'}>
                    <Tooltip placement={'top'} title={'Saturation Up'}>
                        <Fab size="small" onClick={api.increaseSaturation}>
                            <ArrowUpwardIcon/>
                        </Fab>
                    </Tooltip>
                    <Tooltip placement={'top'} title={'Saturation Down'}>
                        <Fab size="small" onClick={api.decreaseSaturation}>
                            <ArrowDownwardIcon/>
                        </Fab>
                    </Tooltip>
                </Stack>
            </Stack>
            <Stack spacing={2}>
                <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Contrast'}></Chip>
                <Stack spacing={2} direction={'row'}>
                    <Tooltip placement={'top'} title={'Contrast Up'}>
                        <Fab size="small" onClick={api.increaseContrast}>
                            <ArrowUpwardIcon/>
                        </Fab>
                    </Tooltip>
                    <Tooltip placement={'top'} title={'Contrast Down'}>
                        <Fab size="small" onClick={api.decreaseContrast}>
                            <ArrowDownwardIcon/>
                        </Fab>
                    </Tooltip>
                </Stack>
            </Stack>
            <Stack spacing={2}>
                <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Brightness'}></Chip>
                <Stack spacing={2} direction={'row'}>
                    <Tooltip placement={'top'} title={'Brightness Up'}>
                        <Fab size="small" onClick={api.increaseBrightness}>
                            <ArrowUpwardIcon/>
                        </Fab>
                    </Tooltip>
                    <Tooltip placement={'top'} title={'Brightness Down'}>
                        <Fab size="small" onClick={api.decreaseBrightness}>
                            <ArrowDownwardIcon/>
                        </Fab>
                    </Tooltip>
                </Stack>
            </Stack>
            <Stack spacing={2}>
                <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Latency'}></Chip>
                <Stack direction={'row'} spacing={2}>
                    <Tooltip placement={'top'} title={'Latency Low'}>
                        <Fab size="small" onClick={api.resumeVideo} style={{textTransform: 'none'}}>
                            Low
                        </Fab>
                    </Tooltip>
                    <Tooltip placement={'top'} title={'Latency High'}>
                        <Fab size="small" onClick={api.pauseVideo} style={{textTransform: 'none'}}>
                            High
                        </Fab>
                    </Tooltip>
                </Stack>
            </Stack>
        </Stack>
    )
}

function TopCenterControls({ nodeConnected, socketState } : { nodeConnected: boolean, socketState: string }) {
    return(
        <Stack direction={'row'} style={{position: 'absolute', left: 35, right: 35, top: 35}}
               justifyContent={'space-evenly'}>
            <Stack direction={'row'} spacing={4}>
                <Stack spacing={1}>
                    <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={'Node API'}/>
                    <Chip size={'small'} color={nodeConnected ? 'success' : 'error'}
                          label={nodeConnected ? 'Online' : 'Offline'}/>
                </Stack>
                <Stack spacing={1}>
                    <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={'Node Socket'}/>
                    <Chip size={'small'} color={socketState === SOCKET_STATES.conncted ? 'success' : 'error'}
                          label={socketState}/>
                </Stack>
            </Stack>
        </Stack>
    )
}

function TopRightControls({ api } : { api: any }) {
    return(
        <Stack style={{position: 'absolute', right: 35, top: 35}} spacing={4} direction={'column'}>
            <Tooltip title={'Overlay 1'}>
                <Fab size="small" onClick={api.overlayOne}>
                    1
                </Fab>
            </Tooltip>
            <Tooltip title={'Overlay 2'}>
                <Fab size="small" onClick={api.overlayTwo}>
                    2
                </Fab>
            </Tooltip>
            <Tooltip title={'Overlay 3'}>
                <Fab size="small" onClick={api.overlayThree}>
                    3
                </Fab>
            </Tooltip>
            <Tooltip title={'Overlay 4'}>
                <Fab size="small" onClick={api.overlayFour}>
                    4
                </Fab>
            </Tooltip>
            <Tooltip title={'Overlay 5'}>
                <Fab size="small" onClick={api.overlayFive}>
                    5
                </Fab>
            </Tooltip>
        </Stack>
    )
}

function TopLeftControls({ api, hostId } : { api: any, hostId: string }) {
    return(
        <Stack style={{position: 'absolute', left: 35, top: 35}} spacing={4} direction={'column'}>
            <Chip style={{backgroundColor: "#e0e2e0"}} label={`In Control - ${hostId}`}/>
            <Tooltip title={'Cycle Left'}>
                <Fab size="small" onClick={api.cycleLayoutLeft}>
                    <ArrowBackIcon/>
                </Fab>
            </Tooltip>
            <Tooltip title={'Cycle Right'}>
                <Fab size="small" onClick={api.cycleLayoutRight}>
                    <ArrowForwardIcon/>
                </Fab>
            </Tooltip>
            <Tooltip title={'Max BW 1000'}>
                <Fab size="small" onClick={() => api.setBandwidth(1000)}>
                    <WidthNormalIcon/>
                </Fab>
            </Tooltip>
            <Tooltip title={'Max BW 2500'}>
                <Fab size="small" onClick={() => api.setBandwidth(2500)}>
                    <WidthFullIcon/>
                </Fab>
            </Tooltip>
        </Stack>
    )
}

export default function UiControls({api, nodeConnected, socketState, hostId} : {api: any, nodeConnected: boolean, socketState: string, hostId: string}) {
    return (
        <div>
            <TopCenterControls nodeConnected={nodeConnected} socketState={socketState}/>
            <BottomLeftControls api={ api } />
            <BottomRightControls api={ api } />
            <TopRightControls api={ api } />
            <TopLeftControls api={ api } hostId={hostId} />
        </div>
    )
}