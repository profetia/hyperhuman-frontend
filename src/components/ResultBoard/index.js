import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { closeWebsocket, startWebsocket } from '../../net'
import { ChatBoard } from './ChatBoard'
import { DetailBoard } from './DetailBoard'
import { GenerateBoard } from './GenerateBoard'
import style from './result.module.css'
import { chatGuessAtom, chatHistoryAtom, taskInitAtom } from './store.js'

function ResultBoard() {
	const navi = useNavigate()
	const taskInit = useRecoilValue(taskInitAtom)
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const setChatGuess = useSetRecoilState(chatGuessAtom)
	const isListenRef = useRef(false)
	const chatHistoryRef = useRef({})
	const chatGuessRef = useRef('')

	const handleClose = (ev) => {
		isListenRef.current = false
		closeWebsocket()
		navi('/')
	}

	const reset = () => {
		setChatHistory({})
		setChatGuess([])
	}

	useEffect(
		() => () => {
			reset()
		},
		[]
	)

	useEffect(() => {
		chatHistoryRef.current = { ...chatHistory }
	}, [chatHistory])

	useEffect(() => {
		if (!taskInit) return
		;(async () => {
			// console.log(isListenRef.current);
			if (isListenRef.current) return
			isListenRef.current = true

			const ws = await startWebsocket(taskInit.subscription)

			ws.on('AI Assistant', (ev) => {
				const currentChat = { ...(chatHistoryRef.current[ev.chat_uuid] || {}) }

				if (ev.content === '[START]') {
					currentChat.chat_uuid = ev.chat_uuid
					currentChat.provider = ev.provider
					currentChat.timeStamp = new Date(ev.submit_time).getTime()
					currentChat.content = ''
				} else if (ev.content !== '[END]') {
					currentChat.content += ev.content
				}
				setChatHistory({ ...chatHistoryRef.current, [ev.chat_uuid]: currentChat })
			})

			ws.on('guess', (ev) => {
				if (ev.content === '[START]') {
					chatGuessRef.current = '1. '
				} else if (ev.content !== '[END]') {
					chatGuessRef.current += ev.content
					setChatGuess(chatGuessRef.current.split('\n'))
				}
			})
			ws.on('summary', (ev) => {
				console.log('summary: ', ev)
			})
		})()
		// eslint-disable-next-line
	}, [taskInit])

	return (
		<div className={style.con} onPointerDown={handleClose}>
			<div className={style.board} onPointerDown={(ev) => ev.stopPropagation()}>
				<Outlet />
				<ChatBoard />
			</div>
		</div>
	)
}

export { ResultBoard, GenerateBoard, DetailBoard, taskInitAtom }
