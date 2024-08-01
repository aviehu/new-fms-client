import {createContext, useEffect, useState , ReactNode} from "react";
import {
    BasePriority,
    ReturnVideoPipeline,
    Vehicle,
    WsHostMessage,
    WsStatusMessage,
    WsStreamerPipelineMessage
} from "../types";
import {
    fmsAssignPipeline,
    fmsCreatePipeline, fmsCreatePriority,
    fmsDeletePipeline, fmsDeletePriority,
    fmsGetAllVehicles, fmsGetPriorities,
    fmsGetVideoPipelines, fmsReleasePipeline,
    fmsUpdateOverrides, fmsUpdatePriority
} from "../api.ts";
import {useWebSocket} from "./useWebSocket.ts";
import {useAlerts} from "./useAlerts.ts";
import {useAuth0} from "@auth0/auth0-react";

export const ApiContext = createContext<{
    videoPipelines: ReturnVideoPipeline[],
    vehicles: Vehicle[],
    priorities: BasePriority[],
    addVideoPipeline: (body: Record<string, string | number>) => Promise<void>,
    deleteVideoPipeline: (relay_uuid: string) => Promise<void>,
    updateOverrides: (relay_uuid: string, static_allocation: boolean | undefined, planned_downtime: boolean | undefined) => Promise<void>
    addPriority: (group: string, node_set: string, relay_set: string[]) => Promise<void>,
    deletePriority: (node_set: string) => Promise<void>
    editPriority: (node_set: string, group: string, relay_sets: string[]) => Promise<void>,
    assignVehicle: (vin: string, nativeNode: boolean, node_set: string) => Promise<ReturnVideoPipeline | null>
    releaseVehicle: (vin: string) => Promise<void>
}>({
    priorities: [],
    videoPipelines: [],
    vehicles: [],
    addVideoPipeline: async () => {},
    deleteVideoPipeline: async () => {},
    updateOverrides: async () => {},
    addPriority: async () => {},
    deletePriority: async () => {},
    editPriority: async () => {},
    assignVehicle: async () => {return null},
    releaseVehicle: async () => {}
});

export function ApiContextProvider({children}: {children: ReactNode}) {
    const [videoPipelines, setVideoPipelines] = useState<ReturnVideoPipeline[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [priorities, setPriorities] = useState<BasePriority[]>([])
    const socket = useWebSocket()
    const {setAlert} = useAlerts()
    const {getAccessTokenSilently} = useAuth0()
    useEffect(() => {
        if(!socket) {
            return
        }

        socket.removeListener('status')
        socket.removeListener('streamerPipeline')
        socket.removeListener('host')
        socket.removeListener('version')

        socket.on('status', (data: WsStatusMessage) => {
            if(data.type === "streamer") {
                const newVehicles = [...vehicles]
                const newPipelines = [...videoPipelines]
                const vehiclesIndex = newVehicles.findIndex((vehicle) => vehicle.streamer_uuid === data.uuid)
                if(vehiclesIndex >= 0) {
                    newVehicles[vehiclesIndex] = {...newVehicles[vehiclesIndex], streamer_status: data.status}
                    setVehicles(newVehicles)
                }
                const pipelinesIndex = newPipelines.findIndex((pipeline) => pipeline.streamer_uuid === data.uuid)
                if(pipelinesIndex >= 0) {
                    newPipelines[pipelinesIndex] = {...newPipelines[pipelinesIndex], streamer_status: data.status}
                    setVideoPipelines(newPipelines)
                }
            }
        })

        socket.on('streamerPipeline', (data: WsStreamerPipelineMessage) => {
            if(!data.relay_uuid) {
                const index = videoPipelines.findIndex((pipeline) => pipeline.streamer_uuid === data.uuid)
                if(index < 0) {
                    return
                }
                const updatedPipelines = [...videoPipelines]
                updatedPipelines[index] = {...updatedPipelines[index], streamer_uuid: undefined, streamer_status: undefined, streamer_version: undefined, vin: undefined}
                setVideoPipelines(updatedPipelines)
                return
            }
            const vehicle = vehicles.find((vehicle) => vehicle.streamer_uuid === data.uuid)
            const pipelineIndex = videoPipelines.findIndex((pipeline) => pipeline.relay_uuid === data.relay_uuid)
            if(!vehicle || pipelineIndex < 0) {
                return
            }
            const updatedPipelines = [...videoPipelines]
            updatedPipelines[pipelineIndex] = {...updatedPipelines[pipelineIndex], streamer_uuid: data.uuid, streamer_status: vehicle.streamer_status, streamer_version: vehicle.streamer_version, vin: vehicle.vin}
            setVideoPipelines(updatedPipelines)
        })

        socket.on('host', (data: WsHostMessage) => {
            const newVehicle: Vehicle = {vin: data.host.hostId, group: data.group, streamer_status: 'offline', streamer_uuid: data.uuid, streamer_version: '' }
            setVehicles([...vehicles, newVehicle])
        })

    }, [socket, vehicles, videoPipelines]);

    useEffect(() => {
        async function getData() {
            const token = await getAccessTokenSilently()
            const [videoPipelines, vehicles, priorities] = await Promise.all([
                fmsGetVideoPipelines(null, 'false', token),
                fmsGetAllVehicles(token),
                fmsGetPriorities(token)
            ])
            setVideoPipelines(videoPipelines)
            setVehicles(vehicles)
            setPriorities(priorities)
        }
        getData().then(() => {})
    }, []);

    async function addVideoPipeline(body: Record<string, string | number>) {
        const token = await getAccessTokenSilently()
        const response = await fmsCreatePipeline(body, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setVideoPipelines([...videoPipelines, response])
    }

    async function deleteVideoPipeline(relay_uuid: string) {
        const token = await getAccessTokenSilently()
        const response = await fmsDeletePipeline(relay_uuid, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setVideoPipelines(await fmsGetVideoPipelines(null, 'false', token))
    }

    async function updateOverrides(relay_uuid: string, static_allocation: boolean | undefined, planned_downtime: boolean | undefined) {
        const token = await getAccessTokenSilently()
        const response = await fmsUpdateOverrides(relay_uuid, static_allocation, planned_downtime, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setVideoPipelines(await fmsGetVideoPipelines(null, 'false', token))
    }

    async function addPriority(group: string, node_set: string, relay_set: string[]) {
        const token = await getAccessTokenSilently()
        const response = await fmsCreatePriority(group, node_set, relay_set, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setPriorities(await fmsGetPriorities(token))
    }

    async function deletePriority(node_set: string) {
        const token = await getAccessTokenSilently()
        const response = await fmsDeletePriority(node_set, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setPriorities(await fmsGetPriorities(token))
    }

    async function editPriority(node_set: string, group: string, relay_sets: string[]) {
        const token = await getAccessTokenSilently()
        const response = await fmsUpdatePriority(node_set, group, relay_sets, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
        setPriorities(await fmsGetPriorities(token))
    }

    async function assignVehicle(vin: string, nativeNode: boolean, node_set: string): Promise<ReturnVideoPipeline | null>  {
        const token = await getAccessTokenSilently()
        const native_node = nativeNode ? 'true' : 'false'
        const response = await fmsAssignPipeline(vin, native_node, node_set, token)
        if(response.error) {
            setAlert(response.error)
            return null
        }
        return response
    }

    async function releaseVehicle(vin: string) {
        const token = await getAccessTokenSilently()
        const response = await fmsReleasePipeline(vin, token)
        if(response.error) {
            setAlert(response.error)
            return
        }
    }

    return (
        <ApiContext.Provider value={{
            videoPipelines,
            vehicles,
            priorities,
            addVideoPipeline,
            deleteVideoPipeline,
            updateOverrides,
            addPriority,
            deletePriority,
            editPriority,
            assignVehicle,
            releaseVehicle
        }}> {children} </ApiContext.Provider>
    )
}