import querystring from 'query-string';
import { ReturnVideoPipeline, VideoPipeline} from "./types";

export async function fmsCreatePipeline(body:  Record<string, string | number>, token: string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
        body: JSON.stringify(body)
    })
    return res.json()
}

export async function fmsAssignPipeline(vin: string, native_node: 'true' | 'false', node_set: string | null, token: string): Promise<ReturnVideoPipeline> {
    const url = `${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/${vin}/assign?native_node=${native_node}${node_set ? `&node_set=${node_set}` : ''}`
    const res = await fetch(url, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
    })
    return res.json()
}

export async function fmsUpdateOverrides(relay_uuid: string, static_allocation: boolean | undefined, planned_downtime: boolean | undefined, token: string): Promise<VideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/${relay_uuid}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'PATCH',
        body: JSON.stringify({static_allocation, planned_downtime})
    })
    return res.json()
}

export async function fmsGetVideoPipelines(machine_identifier: string | null, assigned: 'false' | null, token: string): Promise<ReturnVideoPipeline[]> {
    const query = querystring.stringify({machine_identifier, assigned})
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline?${query}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function fmsGetVideoPipeline(vin: string, token: string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/${vin}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function fmsReleasePipeline(vin: string, token: string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/${vin}/release`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
    })
    return res.json()
}

export async function fmsGetRelayStatus(relay_uuid: string, token: string): Promise<any> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/relayStatus/${relay_uuid}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function fmsDeletePipeline(relay_uuid: string, token: string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/${relay_uuid}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'DELETE',
    })
    return res.json()
}

export async function fmsReleaseByRelayUuid(relay_uuid: string, token:string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/byrelayuuid/${relay_uuid}/release`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
    })
    return res.json()
}

export async function fmsReleaseAndAssign(vin: string, relay_uuid: string, streamer_uuid: string, token: string): Promise<ReturnVideoPipeline> {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/videopipeline/releaseandassign`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
        body: JSON.stringify({vin, relay_uuid, streamer_uuid})
    })
    return res.json()
}


export async function fmsCreatePriority(group: string | null, node_set: string | null, relay_sets: string[] | null, token: string) {
    const body: Record<string, null | string | string[]> = {group, node_set, relay_sets}
    Object.keys(body).forEach((key) => {
        if(!body[key]) {
            delete body[key]
        }
    })
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/fmspriorities`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'POST',
        body: JSON.stringify(body)
    })
    return res.json()
}

export async function fmsGetPriorities(token: string) {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/fmspriorities`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function fmsGetPriority(node_set: string, token: string) {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/fmspriorities/${node_set}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function fmsUpdatePriority(node_set: string, group: string | null, relay_sets: string[] | null, token: string) {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/fmspriorities/${node_set}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'PUT',
        body: JSON.stringify({group, relay_sets})
    })
    return res.json()
}

export async function fmsDeletePriority(node_set: string, token: string) {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/fmspriorities/${node_set}`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'DELETE',
    })
    return res.json()
}


export async function fmsGetAllVehicles(token: string) {
    const res = await fetch(`${import.meta.env.VITE_DLC_BASE_URL}/vehicle`, {
        headers: {
            'x-driveu-api-token': token,
            'Content-Type': "application/json"
        },
        method: 'GET',
    })
    return res.json()
}

export async function statusServiceGetStatus(uuid: string) {
    const res = await fetch(`http://localhost:4020/streamer?uuids=${uuid}`)
    return res.json()
}
