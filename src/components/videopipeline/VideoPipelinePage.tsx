import {useApi} from "../../hooks/useApi.ts";
import {
    Box,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Tooltip
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import {useEffect, useState} from "react";
import ViewVideoPipeline from "./ViewVideoPipeline.tsx";
import {ReturnVideoPipeline} from "../../types";

export function VideoPipelinePage() {
    const {  videoPipelines } = useApi()
    const [viewingPipeline, setViewingPipeline] = useState<ReturnVideoPipeline | null>(null)

    useEffect(() => {
        if(!viewingPipeline) {
            return
        }
        const videoPipeline = videoPipelines.find((pipeline) => pipeline.relay_uuid === viewingPipeline.relay_uuid)
        if(!videoPipeline) {
            return
        }
        setViewingPipeline(videoPipeline)
    }, [videoPipelines, viewingPipeline]);

    return (
        <Box margin={5} minWidth={850}>
            <ViewVideoPipeline viewingPipeline={viewingPipeline} clearPipeline={() => setViewingPipeline(null)}></ViewVideoPipeline>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Relay UUID</TableCell>
                            <TableCell align="right">VIN</TableCell>
                            <TableCell align="right">Node UUID</TableCell>
                            <TableCell align="right">Version</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {videoPipelines.map((row) => (
                            <TableRow
                                key={row.relay_uuid}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">{row.relay_uuid}</TableCell>
                                <TableCell align="right">{row.vin}</TableCell>
                                <TableCell align="right">{row.node_uuid}</TableCell>
                                <TableCell align="right">{row.relay_version}</TableCell>
                                <TableCell style={{paddingTop: 0, paddingBottom: 0}} align="right">
                                    <Stack direction={'row-reverse'}>
                                        <Tooltip title={`View ${row.relay_uuid}`}>
                                            <IconButton onClick={() => setViewingPipeline(row)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}