import axios from 'axios'
import { io } from 'socket.io-client'

const BASE_URL = 'https://hyperhuman.deemos.com/api'
const isMock = false
const suffix = isMock ? '.json' : ''

//user
const login = ({ username, email, password }) =>
	axios.post(`${BASE_URL}/user/login`, { username, email, password })

const register = ({ username, email, emailVerificationCode, invitationCode, password }) =>
	axios.post(`${BASE_URL}/user/register`, {
		username,
		email,
		email_verification_code: emailVerificationCode,
		invitation_code: invitationCode,
		password,
	})

const reset_password = ({ email, emailVerificationCode, newPassword }) =>
	axios.post(`${BASE_URL}/user/reset_password`, {
		email,
		email_verification_code: emailVerificationCode,
		new_password: newPassword,
	})

const send_email_verification_code = ({ email, type }) =>
	axios.post(`${BASE_URL}/user/send_email_verification_code`, { email, type })

const getUserInfo = ({ user_uuid, username }) =>
	axios.post(`${BASE_URL}/user/get_info`, { user_uuid, username })

//chat
let ws
const startChat = async () => {
	if (ws) return false
	console.log('start chat')
	return axios.get(`${BASE_URL}/chat${suffix}`)
}

const wsSend = async ({ task_uuid, content, language }) => {
	if (!ws || ws.disconnected) return Promise.reject('not connected')

	console.log('ws send')

	return ws.emit('message', {
		content,
		task_uuid,
		provider: 'user',
		language: language,
	})
}
const startWebsocket = async (subscription, task_uuid, language) => {
	if (ws) return ws

	console.log('start ws')

	ws = io(`${BASE_URL}/chat_socket`, {
		query: {
			subscription,
		},
		path: '',
		transports: ['websocket', 'polling'],
	})
	await new Promise((res, rej) => {
		ws.on('connect', async () => {
			await wsSend({
				task_uuid,
				content: '[KICKOFF]',
				language,
			})
			res()
		})
	})

	return ws
}

const reconnectWebsocket = () => {
	if (ws && ws.disconnected) {
		ws.connect()
	}
}

const getWs = () => ws

const closeWebsocket = () => {
	if (ws && ws.connected) {
		console.log('close ws')
		ws.close()
		console.log(ws)
	}
}

const disposeWebsocket = () => {
	if (ws) {
		console.log('dispose ws')
		ws = null
	}
}

//task
const generateDetail = ({ task_uuid, prompt }) =>
	axios.post(`${BASE_URL}/task/generate`, { task_uuid, prompt })

const getGenerateProgress = (task_uuid) =>
	axios.post(`${BASE_URL}/task/check_progress/${task_uuid}`)

const getCards = ({ type, page_num }) => axios.post(`${BASE_URL}/task/cards`, { type, page_num })
const getTaskDetail = (task_uuid) => axios.post(`${BASE_URL}/task/card/${task_uuid}`)

const getTaskDownload = ({ task_uuid, type, name, token }) =>
	axios
		.post(
			`${BASE_URL}/task/get_download`,
			{ task_uuid, type, name },
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)
		.then((data) => {
			// console.log(file_uuid, data.data.url)
			return data.data.url
		})

const selectCandidate = (task_uuid, candidateIndex) =>
	axios.post(`${BASE_URL}/task/select_candidate`, {
		uuid: task_uuid,
		selected_id: candidateIndex,
	})

export {
	login,
	register,
	reset_password,
	send_email_verification_code,
	getUserInfo,
	startChat,
	startWebsocket,
	getWs,
	wsSend,
	reconnectWebsocket,
	closeWebsocket,
	disposeWebsocket,
	generateDetail,
	getGenerateProgress,
	getTaskDetail,
	getCards,
	getTaskDownload,
	selectCandidate,
}
