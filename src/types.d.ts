import 'vite/client'

export type BaseStreamer = {
    uuid: string,
    name?: string,
    status?: string,
    host?: {
        hostId?: string
    },
    license?: {
        state?: string,
        info?: string,
        timestamp?: Date | number,
        expirationDate?: Date | number,
        licenseKey?: string
    },
    version?: string,
    group?: string,
    nodePriority?: number
    id?: string
}

export type StreamerRecord = BaseStreamer & {
    _id: string
    _doc: BaseStreamer & { _id: string }
}

export type BaseRelay = {
    name?: string
    uuid: string
    group?: string
    version?: string
    control_connection_port?: number
    control_password?: string
    control_port?: number
    data_connection_port?: number
    data_port?: number
    node_socket_url?: string
    node_url?: string
    rtc_url?: string
    rtp_connection_url?: string
    server_ip?: string
    trampoline_connection_port?: number
    trampoline_password?: string
    trampoline_port?: number
    machine_identifier?: string
    picassoWsListeningPort?: number
    picassoWsUrl?: string
    relay_set?: string,
}

export type RelayRecord = BaseRelay & {
    _id: string
    _doc: BaseRelay & { _id: string }
}


export type VideoPipeline =  {
    vin?: string
    state?: string
    streamer_uuid?: string
    relay_uuid: string
    node_uuid?: string
    error?: string
    server_ip?: string
    data_listen_port?: number
    data_connection_port?: number
    control_listen_port?: number
    control_connection_port?: number
    trampoline_listen_port?: number
    trampoline_connection_port?: number
    rtc_https_url?: string
    node_https_url?: string
    node_wss_url?: string
    rtp_connection_url?: string
    control_password?: string
    trampoline_password?: string
    streamer_status?: string
    streamer_version?: string
    relay_version?: string
    node_version?: string
    group?: string
    allowAutomaticDeallocate?: boolean
    allowAutomaticAllocate?: boolean
    machine_identifier?: string
    relay_set?: string
    unitConfigurationInfo?: Record<string, { T_CM: number; H_CM: number }>
    reservedForStreamerUuid?: string
    picassoWsUrl?: string
    preset_id?: string
    _id?: string
}


export type ReturnVideoPipeline = VideoPipeline & { compatible_node_versions?: string[] | null }

export type GlobalConfig = {
    configName: string
    streamerGatekeeperMode: string
}

export type Vehicle = {
    vin: string,
    streamer_uuid: string,
    streamer_status: string,
    streamer_version: string,
    group: string
}

export type Group = {
    group: string
}

export type BaseNode = {
    uuid: string
    name?: string
    controlState?: string
    headless?: boolean
    version?: string
    id?: string
    status?: string
    host?: { type: string; id: string; description: string }
}

export type NodeRecord = BaseNode & { _id: string,  _doc: NodeRecord }

export type BaseHost = {
    hostId: string
    identityType: string
    description?: string
    model?: string
    meta?: { battery: string; temp: string; speed: string }
}

export type HostRecord = BaseHost & { _doc: BaseHost; _id: string }

export type BasePreset = {
    ref?: string
    streamer?: string
    nodes?: string[]
    relay?: string
    allowAutomaticAllocate?: boolean
    allowAutomaticDeallocate?: boolean
    id?: string
}

export type PopulatedPreset = {
    ref?: string
    streamer?: StreamerRecord
    nodes?: NodeRecord[]
    relay?: RelayRecord
    allowAutomaticAllocate?: boolean
    allowAutomaticDeallocate?: boolean
    id?: string
}

export type BasePriority = {
    group?: string
    node_set: string
    relay_sets: string[]
}

export type PriorityRecord = BasePriority & { _doc: BasePriority }

export type BasePriorityConfiguration = {
    role: string,
    priority: string
}

export type CreateVideoPipelineBody = BaseRelay  & {node_uuid?: string, node_name?: string}

export type WsStatusMessage = {
    group: string,
    id: string,
    status: string,
    type: 'streamer' | 'relay' | 'node',
    uuid: string
}

export type WsStreamerPipelineMessage = {
    group: string,
    relay_uuid: string | undefined,
    uuid: string
}

export type WsHostMessage = {
    type: 'streamer' | 'relay' | 'node',
    id: string,
    uuid: string,
    host: {identityType: string, hostId: string, description: string, group: string}
    group: string
}