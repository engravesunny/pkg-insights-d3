import axios from 'axios';

const request = axios.create({
    // baseURL: 'http://127.0.0.1:50000',
    baseURL: '/api',
    // baseURL: "https://www.fastmock.site/mock/ecf8883ff9dc69f1a831283178b60acd/test/",
})

// 请求拦截器
request.interceptors.request.use((config) => {
    return config;
}, err => {
    return Promise.reject(new Error(err))
})

request.interceptors.response.use((response) => {
    return response.data;
}, (error) => {
    return Promise.reject(error);
})


export default request
