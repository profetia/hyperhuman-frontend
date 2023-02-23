import axios from 'axios'

const BASE_URL = ''
const isMock = true
const suffix = isMock ? '.json' : ''

//user
const login = ({ username, email, password }) =>
	axios.post(`${BASE_URL}/user/login`, { username, email, password })

const getUserInfo = ({ userId }) => axios.get(`${BASE_URL}/user/${userId}${suffix}`)

//chat
const startChat = () => axios.get(`${BASE_URL}/chat${suffix}`)

export { login, getUserInfo, startChat }
