import {ReactNode, useState} from "react";
import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem, ListItemButton, ListItemIcon, ListItemText,
    Stack,
    Toolbar, Tooltip,
    Typography
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from "@mui/icons-material/Settings";
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useNavigate } from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";
import LogoutIcon from '@mui/icons-material/Logout';
function CustomDrawer({setOpen} : {setOpen: (open: boolean) => void }) {
    const navigate = useNavigate()

    function handleNavigate(url: string) {
        navigate(url)
        setOpen(false)
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300 },
            }}
            open
        >
            <Toolbar style={{ paddingLeft:16 }}>
                <img src={'/images/logo-medium.png'} width={50} height={50}/>
            </Toolbar>
            <Divider />
            <List>
                <ListItem key={'vehicles'} disablePadding>
                    <ListItemButton onClick={() => { handleNavigate('/') }}>
                        <ListItemIcon>
                            <DirectionsCarIcon/>
                        </ListItemIcon>
                        <ListItemText primary={'Vehicles'} />
                    </ListItemButton>
                </ListItem>
                <ListItem key={'settings'} disablePadding>
                    <ListItemButton onClick={() => { handleNavigate('/settings') }}>
                        <ListItemIcon>
                            <SettingsIcon/>
                        </ListItemIcon>
                        <ListItemText primary={'Settings'} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    )
}

export default function CustomAppBar({children}: {children : ReactNode}) {
    const [open, setOpen] = useState<boolean>(false)

    const { logout } = useAuth0()

    const drawerWidth = 300

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                    ml: { lg: `${drawerWidth}px` },
                }}
            >
                <Toolbar style={{ paddingLeft:16 }} >
                    <Stack direction={'row'} justifyContent={'space-between'} width={'100%'}>
                        <Box alignItems={'center'} height={50} display={'flex'} flexDirection={'row'}>
                            <Box height={50} sx={{display: {lg: 'none'}}}>
                                <img src={'/images/logo-medium.png'} width={50} height={50} style={{marginRight: 20}}/>
                            </Box>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                sx={{display: { lg: 'none' } }}
                                onClick={() => setOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" noWrap component="div">
                                FMS Client
                            </Typography>
                        </Box>
                        <Tooltip title={'Logout'}>
                            <IconButton style={{color: "white"}} onClick={() => {logout({logoutParams: {returnTo: window.location.origin}})}}>
                                <LogoutIcon/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Toolbar>

            </AppBar>
            <Box
                component="nav"
                sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'none', lg: 'block' },
                    }}
                    open
                >
                    <CustomDrawer setOpen={setOpen}/>
                </Drawer>
                <Drawer
                    variant="temporary"
                    open={open}
                    onClose={() => setOpen(false)}
                    sx={{
                        display: { xs: 'block', sm: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    <CustomDrawer setOpen={setOpen}/>
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, width: { lg: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
                { children }
            </Box>
        </Box>
    )
}