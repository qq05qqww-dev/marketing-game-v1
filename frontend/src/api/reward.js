import http from './http'

export const getMyRewardsApi = () => http.get('/rewards/mine')