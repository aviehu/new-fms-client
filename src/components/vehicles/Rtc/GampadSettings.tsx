// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import useGamepad from './useGamepad'
import {useEffect, useState} from "react";
import {
    Box,
    Button,
    Modal,
    Paper,
    Tab,
    Tabs,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody, Typography, FormGroup, FormControlLabel, Checkbox, Card, Stack
} from "@mui/material"

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function GamepadSettingsTabs({ gamepad, setAssignButton } : {gamepad: any, setAssignButton: (index: number) => void}) {
    const [output, setOutput] = useState('Native Linux');
    const [input, setInput] = useState('')
    const [player, setPlayer] = useState(1)
    const [activeTab, setActiveTab] = useState<number>(0)

    useEffect(() => {
        const {output, input} = gamepad.translation()
        setOutput(output)
        setInput(input)
        setPlayer(gamepad.player())
    }, [gamepad.translation(), gamepad.player()])

    return <Box>
        <Tabs value={activeTab} onChange={(_event,newValue) => {setActiveTab(newValue)}}>
            <Tab label="buttons" />
            <Tab label="axes" />
            <Tab label="Configure Joystick" />
        </Tabs>
        <CustomTabPanel index={0} value={activeTab}>
            <Box margin={5} minWidth={850}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Output</TableCell>
                                <TableCell>Input</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gamepad?.buttons ? gamepad.buttons.map((row: any, index: number) => (
                                <TableRow style={{
                                    backgroundColor: row.pressed ? 'rgb(0, 191, 255)' : undefined,
                                    cursor: 'pointer'
                                }}  onClick={() => setAssignButton(index)}>
                                    <TableCell>{index}</TableCell>
                                    <TableCell>{row.override !== undefined ? row.override : index}</TableCell>
                                </TableRow>
                            )) : null}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </CustomTabPanel>
        <CustomTabPanel index={1} value={activeTab}>
            <Box margin={5} minWidth={850}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Output</TableCell>
                                <TableCell>Input</TableCell>
                                <TableCell style={{width: 300}}>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gamepad?.axes ? gamepad.axes.map((row: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{index}</TableCell>
                                    <TableCell>{row.override !== undefined ? row.override : index}</TableCell>
                                    <TableCell>{row}</TableCell>
                                </TableRow>
                            )) : null}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </CustomTabPanel>
        <CustomTabPanel index={2} value={activeTab}>
            <Typography>Input Layout: {input} </Typography>
            <Typography>Player: {player}</Typography>
            <Typography>Output:</Typography>
            <div style={{ marginLeft: 20}}>
                <FormGroup>
                    <FormControlLabel control={<Checkbox checked={output === 'Web'} onChange={() => {
                        gamepad.revertSetting()
                        setOutput('Web')
                        gamepad.setTranslation('Web')
                    }} />} label="Web"/>
                    <FormControlLabel control={<Checkbox checked={output === 'Native Linux'} onChange={() => {
                        gamepad.revertSetting()
                        setOutput('Native Linux')
                        gamepad.setTranslation('Native Linux')
                    }} />} label="Native Linux" />
                    <FormControlLabel disabled control={<Checkbox checked={output === 'Legacy'} onChange={() => {
                        gamepad.revertSetting()
                        setOutput('Legacy')
                        gamepad.setTranslation('Legacy')
                    }} />} label="Legacy" />
                </FormGroup>
            </div>
        </CustomTabPanel>
    </Box>
}

export default function GamepadSettings({open, onClose} : {open: boolean, onClose: () => void}) {
    const [assignButton, setAssignButton] = useState<number | null>(null)
    const gamepad = useGamepad(open ? 100 : 0)

    function getMessage() {
        if (!gamepad) {
            return 'Please connect gamepad';
        }
        if (assignButton !== null) {
            return `Press on overriding for button ${assignButton}`;
        }
        return null;
    }
    const message = getMessage();
    function handleClose() {
        setAssignButton(null);
        onClose();
    }
    if (assignButton !== null && gamepad) {
        const foundPressedButtonIndex = gamepad?.originalGamepad?.buttons.findIndex((button: number) => button.pressed);
        if (foundPressedButtonIndex !== -1) {
            gamepad.overrideButton(foundPressedButtonIndex, assignButton);
            setAssignButton(null);
        }
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
        >
            <Card style={{margin: 50}} >
                {!message &&
                    <Stack direction={'row'} justifyContent={"space-between"}>
                        <div/>
                        <Button variant={"contained"} onClick={gamepad?.revertSetting}>Revert</Button>
                    </Stack>
                }
                {message || <GamepadSettingsTabs gamepad={gamepad} setAssignButton={setAssignButton}/>}
            </Card>
        </Modal>
    )
}