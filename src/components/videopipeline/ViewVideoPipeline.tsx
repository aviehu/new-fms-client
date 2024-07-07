import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    TextField
} from "@mui/material";
import {ReturnVideoPipeline} from "../../types";

const template: Record<string, {type: string, required: boolean}> = {
    vin: {type: 'string', required: false},
    state: {type: 'string', required: false},
    streamer_uuid: {type: 'string', required: false},
    relay_uuid: {type: 'string', required: true},
    node_uuid: {type: 'string', required: false},
    error: {type: 'string', required: false},
    server_ip: {type: 'string', required: false},
    data_listen_port: {type: 'number', required: false},
    data_connection_port: {type: 'number', required: false},
    control_listen_port: {type: 'number', required: false},
    control_connection_port: {type: 'number', required: false},
    trampoline_listen_port: {type: 'number', required: false},
    trampoline_connection_port: {type: 'number', required: false},
    rtc_https_url: {type: 'string', required: false},
    node_https_url: {type: 'string', required: false},
    node_wss_url: {type: 'string', required: false},
    rtp_connection_url: {type: 'string', required: false},
    control_password: {type: 'string', required: false},
    trampoline_password: {type: 'string', required: false},
    streamer_status: {type: 'string', required: false},
    streamer_version: {type: 'string', required: false},
    relay_version: {type: 'string', required: false},
    node_version: {type: 'string', required: false},
    group: {type: 'string', required: false},
    allowAutomaticDeallocate: {type: 'string', required: false},
    allowAutomaticAllocate: {type: 'string', required: false},
    machine_identifier: {type: 'string', required: false},
    relay_set: {type: 'string', required: false},
    reservedForStreamerUuid: {type: 'string', required: false},
    picassoWsUrl: {type: 'string', required: false},
    compatible_node_versions: {type: 'string', required: false},

}


export default function ViewVideoPipeline({ viewingPipeline, clearPipeline } : { viewingPipeline: ReturnVideoPipeline | null, clearPipeline: () => void}) {
    return (
        <Dialog
            open={!!viewingPipeline}
            onClose={clearPipeline}
            PaperProps={{sx: {
                    minWidth: "850px",
                }}}
        >
            <DialogTitle>View VideoPipeline</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You can not edit the pipeline's info
                </DialogContentText>
                <Grid container spacing={2}>
                    {Object.keys(template).map((key) => {
                        return (
                            <Grid key={key} item xs={4}>
                                <TextField
                                    key={key}
                                    required={template[key].required}
                                    margin="dense"
                                    id={key}
                                    name={key}
                                    label={key}
                                    type={template[key].type}
                                    fullWidth
                                    variant={'outlined'}
                                    value={viewingPipeline ? (viewingPipeline[key as keyof ReturnVideoPipeline] || '') : ''}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={clearPipeline}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}