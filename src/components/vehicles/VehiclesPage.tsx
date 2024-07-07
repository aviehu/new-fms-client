import {useApi} from "../../hooks/useApi.ts";
import {
    Box, Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from "@mui/material";
import {ReturnVideoPipeline, Vehicle} from "../../types";
import MonitorIcon from '@mui/icons-material/Monitor';
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {useNavigate} from "react-router-dom";
import GamepadSettings from "./Rtc/GampadSettings.tsx";
import {useState} from "react";

export default function VehiclesPage() {
    const [openGamepadSettings, setOpenGamepadSettings] = useState<boolean>(false)
    const { vehicles, videoPipelines, releaseVehicle, assignVehicle } = useApi()
    const navigate = useNavigate()

     function assignIfNeeded(vin: string, videoPipeline: ReturnVideoPipeline | undefined, nativeNode: boolean){
        if(videoPipeline) {
            return videoPipeline
        }
        const nodeSet = localStorage.getItem('nodeSet') || ''
        return assignVehicle(vin, nativeNode, nodeSet)
    }

    async function handleRtc(vehicle: Vehicle, videoPipeline: ReturnVideoPipeline | undefined, control: boolean) {
        const {vin} = vehicle
        const assignedPipeline = await assignIfNeeded(vin, videoPipeline, false)
        if(!assignedPipeline) {
            return
        }
        const {rtc_https_url, node_https_url, node_wss_url, picassoWsUrl, node_uuid} = assignedPipeline
        navigate(`/stream/${rtc_https_url}/${vin}/${node_https_url}/${node_wss_url}/descriptionPlaceHolder/${control}/false/${picassoWsUrl}/${node_uuid}`)
    }

    async function handleNode(vehicle: Vehicle, videoPipeline: ReturnVideoPipeline | undefined, control: boolean) {
        const {vin} = vehicle
        const assignedPipeline = await assignIfNeeded(vin, videoPipeline, true)
        if(!assignedPipeline) {
            return
        }
        const {server_ip, trampoline_connection_port, control_connection_port, trampoline_password, control_password, compatible_node_versions} = assignedPipeline
        const nodeUrl = `driveunode://?${server_ip}?${trampoline_connection_port}?${control_connection_port}?${trampoline_password}?${control_password}?${compatible_node_versions?.join(',')}?${control ? 5 : 50}?1?1`
        window.open(nodeUrl, "_blank")
    }

    return (
        <Box margin={5} minWidth={850}>
            <Button variant={'contained'} size={'small'} onClick={() => setOpenGamepadSettings(true)}>Gamepad Settings</Button>
            <GamepadSettings open={openGamepadSettings} onClose={() => setOpenGamepadSettings(false)}/>
            <Stack visibility='hidden' direction={'row-reverse'}>
                <Tooltip title="Add VideoPipeline">
                    <IconButton>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>VIN</TableCell>
                            <TableCell align="left">UUID</TableCell>
                            <TableCell align="left">Status</TableCell>
                            <TableCell align="left">Version</TableCell>
                            <TableCell align="left">VideoPipeline</TableCell>
                            <TableCell align="left">RTC</TableCell>
                            <TableCell align="left">Node</TableCell>
                            <TableCell align="left"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.map((row) => {
                            const videoPipeline = videoPipelines.find((pipeline) => pipeline.vin === row.vin)
                            return (
                            <TableRow
                                key={row.vin}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">{row.vin}</TableCell>
                                <TableCell align="left">{row.streamer_uuid}</TableCell>
                                <TableCell align="left">{row.streamer_status}</TableCell>
                                <TableCell align="left">{row.streamer_version}</TableCell>
                                <TableCell align="left">{ videoPipeline?.relay_uuid}</TableCell>
                                <TableCell style={{paddingTop: 0, paddingBottom: 0}} align="left">
                                    <Stack direction={'row'}>
                                        <Tooltip title={`Monitor ${row.vin}`}>
                                            <span>
                                                <IconButton disabled={videoPipeline && !videoPipeline.node_uuid} onClick={() => {handleRtc(row, videoPipeline, false)}}>
                                                    <MonitorIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={`Control ${row.vin}`}>
                                            <span>
                                                <IconButton disabled={videoPipeline && !videoPipeline.node_uuid} onClick={() => {handleRtc(row, videoPipeline, true)}}>
                                                    <DirectionsCarIcon/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                                <TableCell style={{paddingTop: 0, paddingBottom: 0}} align="left">
                                    <Stack direction={'row'}>
                                        <Tooltip title={`Monitor ${row.vin}`}>
                                            <IconButton onClick={() => {handleNode(row, videoPipeline, false)}}>
                                                <MonitorIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={`Control ${row.vin}`}>
                                            <IconButton onClick={() => {handleNode(row, videoPipeline, true)}}>
                                                <DirectionsCarIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                                <TableCell style={{paddingTop: 0, paddingBottom: 0}} align="left">
                                    <Stack direction={'row'}>
                                        <Tooltip title={`Release ${row.vin}`}>
                                            <span>
                                                <IconButton disabled={!videoPipeline} onClick={() => {releaseVehicle(row.vin)}}>
                                                    <LinkOffIcon/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}