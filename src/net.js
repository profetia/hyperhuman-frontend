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
// const wsGetAI = async () => {
// 	if (!ws || ws.disconnected) return Promise.reject('not connected')

// 	return new Promise((res, rej) => {
// 		ws.on('AI Assistant', (ev) => {
// 			res(ev)
// 		})
// 	})
// }
// const wsGetGuess = async () => {
// 	if (!ws || ws.disconnected) return Promise.reject('not connected')

// 	return new Promise((res, rej) => {
// 		ws.on('guess', (ev) => {
// 			console.log(ev)
// 		})
// 	})
// }
// const wsGetSummary = async () => {
// 	if (!ws || ws.disconnected) return Promise.reject('not connected')

// 	return new Promise((res, rej) => {
// 		ws.on('summary', (ev) => {
// 			console.log(ev)
// 		})
// 	})
// }

const closeWebsocket = () => {
	if (ws && ws.connected) ws.close()
	ws = null
}

export {
	login,
	getUserInfo,
	startChat,
	startWebsocket,
	wsSend,
	// wsGetAI,
	// wsGetGuess,
	// wsGetSummary,
	closeWebsocket,
}
