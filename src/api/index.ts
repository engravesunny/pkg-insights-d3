import request from "../utils/request";

export const getDepGraph = (name:string, depth:number)=>{
    return request({
        url: `/depgraph/${name}/${depth}`,
        method: 'get'
    })
}

export const getNodeDetail= (name:string)=>{
    return request({
        // 第二个参数depth没影响, 默认10
        url: `/depgraph-simple/${name}/10`,
        method: 'get'
    })
}