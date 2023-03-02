import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { closeWebsocket, disposeWebsocket, startWebsocket } from '../../net'
import { ChatBoard } from './ChatBoard'
import { DetailBoard } from './DetailBoard'
import { GenerateBoard } from './GenerateBoard'
import style from './result.module.css'
import {
	chatGuessAtom,
	chatHistoryAtom,
	promptAtom,
	showDetailAtom,
	taskInitAtom,
	taskDetailAtom,
} from './store.js'

function ResultBoard() {
	const navi = useNavigate()
	const taskInit = useRecoilValue(taskInitAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const setChatGuess = useSetRecoilState(chatGuessAtom)
	const [prompt, setPrompt] = useRecoilState(promptAtom)
	const showDetail = useRecoilValue(showDetailAtom)
	const isListenRef = useRef(false)
	const chatHistoryRef = useRef({})
	const chatGuessRef = useRef('')
	const promptRef = useRef('')

	const handleClose = (ev) => {
		isListenRef.current = false
		closeWebsocket()
		disposeWebsocket()
		navi('/')
	}

	const reset = () => {
		// setTaskInit(false)
		setTaskDetail(false)
		setChatHistory({})
		setChatGuess([])
		setPrompt('')
	}

	useEffect(
		() => () => {
			reset()
		},
		// eslint-disable-next-line
		[]
	)

	useEffect(() => {
		chatHistoryRef.current = { ...chatHistory }
	}, [chatHistory])

	useEffect(() => {
		promptRef.current = prompt
	}, [prompt])

	useEffect(() => {
		if (showDetail) {
			closeWebsocket()
		}
	}, [showDetail])

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
				if (ev.content === '[START]') {
					promptRef.current = ''
				} else if (ev.content !== '[END]') {
					promptRef.current += ev.content
					setPrompt(promptRef.current)
				}
			})
		})()
		// eslint-disable-next-line
	}, [taskInit])

	useEffect(() => {
		if (!taskDetail) return
		setChatHistory(
			taskDetail.chat_history.reduce(
				(res, cur) => ({
					...res,
					[cur.chat_uuid]: { ...cur, timeStamp: new Date(cur.time).getTime() },
				}),
				{}
			)
		)
		setPrompt(taskDetail.prompt)
		// eslint-disable-next-line
	}, [taskDetail])

	return (
		<div className={style.con} onPointerDown={handleClose}>
			<div className={style.board} onPointerDown={(ev) => ev.stopPropagation()}>
				<Outlet />
				<ChatBoard />
			</div>
		</div>
	)
}

export { ResultBoard, GenerateBoard, DetailBoard, taskInitAtom, taskDetailAtom }
