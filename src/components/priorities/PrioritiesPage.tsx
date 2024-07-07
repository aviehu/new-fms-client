import {useApi} from "../../hooks/useApi.ts";
import {
    Box, IconButton,
    Paper, Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {useState} from "react";
import AddPriority from "./AddPriority.tsx";
import EditIcon from '@mui/icons-material/Edit';
import EditPriority from "./EditPriority.tsx";
import {BasePriority} from "../../types";

export default function PrioritiesPage() {
    const [openAddDialog, setOpenAddDialog] = useState<boolean>(false)
    const [openEditDialog, setOpenEditDialog] = useState<BasePriority | null>(null)
    const { priorities, deletePriority } = useApi()

    return (
        <Box margin={5} minWidth={850}>
            <AddPriority open={openAddDialog} handleClose={() => {setOpenAddDialog(false)}}/>
            <EditPriority row={openEditDialog} open={!!openEditDialog} handleClose={() => {setOpenEditDialog(null)}}/>
            <Stack  direction={'row-reverse'}>
                <Tooltip title={`Add Priority`}>
                    <IconButton onClick={() => {setOpenAddDialog(true)}}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Node Set</TableCell>
                            <TableCell align="right">Relay Set</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {priorities.map((row) => (
                            <TableRow
                                key={row.node_set}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">{row.node_set}</TableCell>
                                <TableCell align="right">{row.relay_sets}</TableCell>
                                <TableCell  style={{paddingTop: 0, paddingBottom: 0}} align="right">
                                    <Stack direction={'row-reverse'}>
                                        <Tooltip title={`Delete Priority for ${row.node_set}`}>
                                            <IconButton onClick={() => {deletePriority(row.node_set)}}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={`Edit Priority for ${row.node_set}`}>
                                            <IconButton onClick={() => setOpenEditDialog(row)}>
                                                <EditIcon />
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