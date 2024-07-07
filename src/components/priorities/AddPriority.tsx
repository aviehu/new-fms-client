import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid, IconButton, Stack,
    TextField, Typography
} from "@mui/material";
import {useState} from "react";
import {useApi} from "../../hooks/useApi.ts";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from '@mui/icons-material/Remove';

export default function AddPriority({ open, handleClose } : { open: boolean, handleClose: () => void}) {
    const [group, setGroup] = useState<string>('')
    const [nodeSet, setNodeSet] = useState<string>('')
    const [relaySets, setRelaySets] = useState<string[]>([''])
    const {addPriority} = useApi()

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{sx: {
                    minWidth: "850px",
                }}}
        >
            <DialogTitle>Add Priority</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Enter the Priority details below
                </DialogContentText>
                <Grid container spacing={2}>
                    <Grid key={'Group'} item xs={6}>
                        <TextField
                            key={'group'}
                            required
                            label={'group'}
                            type={"text"}
                            fullWidth
                            variant={'outlined'}
                            onChange={(e) => {setGroup(e.target.value)}}
                        />
                    </Grid>
                    <Grid key={'Node Set'} item xs={6}>
                        <TextField
                            key={'Node Set'}
                            required
                            label={'Node Set'}
                            type={"text"}
                            fullWidth
                            variant={'outlined'}
                            onChange={(e) => {setNodeSet(e.target.value)}}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>
                            Relay sets
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid alignItems={'center'} container spacing={2}>
                            {relaySets.map((_relaySet, index) => {
                                return (
                                    <Grid key={index} item xs={6}>
                                        <TextField
                                            key={`Relay Set ${index+1}`}
                                            required={index === 0}
                                            label={`Relay Set ${index+1}`}
                                            type={"text"}
                                            fullWidth
                                            variant={'outlined'}
                                            onChange={(e) => {
                                                const newRelaySets = [...relaySets]
                                                newRelaySets[index] = e.target.value
                                                setRelaySets(newRelaySets)}
                                            }
                                        />
                                    </Grid>
                                )
                            })}
                            <Grid item xs={12}>
                                <Stack direction={'row'}>
                                    <IconButton onClick={() => {
                                        const newRelaySets = [...relaySets]
                                        newRelaySets.push('')
                                        setRelaySets(newRelaySets)}
                                    }>
                                        <AddIcon />
                                    </IconButton>
                                    <IconButton onClick={() => {
                                        if(relaySets.length === 1) {
                                            return
                                        }
                                        const newRelaySets = [...relaySets]
                                        newRelaySets.pop()
                                        setRelaySets(newRelaySets)}
                                    }>
                                        <RemoveIcon />
                                    </IconButton>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button variant={'outlined'} key={'cancel'} onClick={handleClose}>Cancel</Button>
                <Button variant={'contained'} key={'create'} onClick={async () => {
                    const filteredRelaySets = relaySets.filter((relaySet) => !! relaySet)
                    await addPriority(group, nodeSet, filteredRelaySets)
                    handleClose()
                }} >Create</Button>
            </DialogActions>
        </Dialog>
    )
}