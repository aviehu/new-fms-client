import {useApi} from "../../hooks/useApi.ts";
import {
    Box, Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead, TablePagination,
    TableRow, TextField,
    Tooltip, Typography
} from "@mui/material";
import {ReturnVideoPipeline, Vehicle} from "../../types";
import MonitorIcon from '@mui/icons-material/Monitor';
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";


function StreamerStatus({status}: {status: string}) {
    if(status === 'connectedToNode') {
        return (
            <Chip size={'small'} label="Connected To Node" color="primary" />
        )
    }
    return (
        <Chip size={'small'} label={status} variant={'outlined'}/>
    )
}

export default function VehiclesPage() {
    const {getIdTokenClaims} = useAuth0()
    const { vehicles, videoPipelines, releaseVehicle, assignVehicle } = useApi()
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles)
    const [search, setSearch] = useState<string>('')
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    const [rowsPerPage, setRowsPerPage] = useState<number>(20)
    const [page, setPage] = useState<number>(0)

    function filterVehicles(search: string): Vehicle[] {
        return vehicles.filter((vehicle) => {
            return !search || vehicle.vin.includes(search)
        })
    }

    useEffect(() => {
        async function isAdmin() {
            if(!getIdTokenClaims) {
                return false
            }
            const claims = await getIdTokenClaims()
            if(!claims) {
                return false
            }
            setIsAdmin(claims[import.meta.env.VITE_ROLES_KEY].includes('Admin'))
        }
        isAdmin()
    }, [getIdTokenClaims]);

    useEffect(() => {
        setFilteredVehicles(filterVehicles(search))
    }, [vehicles, search]);

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
        const params = {
            rtc_https_url: `${rtc_https_url}`,
            vin: `${vin}`,
            node_https_url: `${node_https_url}`,
            node_wss_url: `${node_wss_url}`,
            control: `${control}`,
            picassoWsUrl: `${picassoWsUrl}`,
            node_uuid: `${node_uuid}`
        }

        window.open(`/stream?${new URLSearchParams(params).toString()}`, "_blank")
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
            <Stack direction={'row'} justifyContent={'space-between'}>
                <Typography paddingBottom={3} variant={'h5'}>Vehicles</Typography>
                <TextField label={'Search By Vin'} size={'small'} value={search} onChange={event => {
                    setSearch(event.target.value)
                    setPage(0)
                }}/>
            </Stack>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Vin</TableCell>
                            <TableCell align="left">Streamer Uuid</TableCell>
                            <TableCell align="left">Status</TableCell>
                            <TableCell align="left">Version</TableCell>
                            <TableCell align="left">VideoPipeline Uuid</TableCell>
                            <TableCell align="left">Rtc</TableCell>
                            <TableCell align="left">Node</TableCell>
                            {isAdmin ? <TableCell align="left"></TableCell> : null}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVehicles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                            const videoPipeline = videoPipelines.find((pipeline) => pipeline.vin === row.vin)
                            return (
                            <TableRow
                                key={row.vin}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row"><Typography fontWeight={'bold'} variant={'body2'}>{row.vin}</Typography></TableCell>
                                <TableCell align="left">{row.streamer_uuid}</TableCell>
                                <TableCell align="left"><StreamerStatus status={row.streamer_status}/></TableCell>
                                <TableCell align="left">{row.streamer_version}</TableCell>
                                <TableCell align="left">{videoPipeline ? <Chip size={'small'} variant={'outlined'}  label={videoPipeline?.relay_uuid}/> : null}</TableCell>
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
                                {isAdmin ? <TableCell style={{paddingTop: 0, paddingBottom: 0}} align="left">
                                    <Stack direction={'row'}>
                                        <Tooltip title={`Release ${row.vin}`}>
                                            <span>
                                                <IconButton disabled={!videoPipeline} onClick={() => {releaseVehicle(row.vin)}}>
                                                    <LinkOffIcon/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </TableCell> : null }
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={filteredVehicles.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value));
                    setPage(0);
                }}
            />
        </Box>
    )
}