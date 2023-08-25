import request from "../utils/request";

export const getDepGraph = (name:string, depth:number)=>{
    return request({
        url: `/depgraph/${encodeURIComponent(name)}/${depth}`,
        method: 'get'
    })
}

export const getNodeDetail= (name:string)=>{
    return request({
        url: `/depgraph-simple/${encodeURIComponent(name)}`,
        method: 'get'
    })
}