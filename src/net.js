import axios from 'axios'
import { io } from 'socket.io-client'

const BASE_URL = 'http://10.19.93.33:3000'
const isMock = false
const suffix = isMock ? '.json' : ''

//user
const login = ({ username, email, password }) =>
	axios.post(`${BASE_URL}/user/login`, { username, email, password })

const getUserInfo = ({ userId }) => axios.get(`${BASE_URL}/user/${userId}${suffix}`)

//chat
const startChat = () => axios.get(`${BASE_URL}/chat${suffix}`)

let ws
const startWebsocket = async (subscription) => {
	if (ws) return ws

	ws = io(`${BASE_URL}/chat_socket`, {
		query: {
			subscription,
		},
		path: '',
		transports: ['websocket', 'polling'],
	})
	await new Promise((res, rej) => {
		ws.on('connect', () => {
			res()
		})
	})

	return ws
}
const wsSend = async ({ task_uuid, content }) => {
	if (!ws || ws.disconnected) return Promise.reject('not connected')

	return ws.emit('message', {
		content,
		task_uuid,
		provider: 'User',
	})
}

const closeWebsocket = () => {
	if (ws && ws.connected) ws.close()
}

const disposeWebsocket = () => {
	ws = null
}

//task
const generateDetail = ({ task_uuid, prompt }) =>
	axios.post(`${BASE_URL}/task/generate`, { task_uuid, prompt })

const getGenerateProgress = (task_uuid) =>
	axios.post(`${BASE_URL}/task/check_progress/${task_uuid}`)

const getTaskDetail = (task_uuid) => axios.post(`${BASE_URL}/task/card/${task_uuid}`)

const getTaskDownload = (file_uuid) =>
	axios.post(`${BASE_URL}/task/get_download`, { file_uuid }).then((data) => {
		// console.log(file_uuid, data.data.url)
		return data.data.url
	})

export {
	login,
	getUserInfo,
	startChat,
	startWebsocket,
	wsSend,
	closeWebsocket,
	disposeWebsocket,
	generateDetail,
	getGenerateProgress,
	getTaskDetail,
	getTaskDownload,
}
