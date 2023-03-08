import { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { closeWebsocket, disposeWebsocket, startChat, wsSend } from '../../net'
import style from './result.module.css'
import {
	assistantChatStatusAtom,
	chatGuessAtom,
	chatHistoryAtom,
	chatTextAtom,
	guessChatStatusAtom,
	showDetailAtom,
	taskDetailAtom,
	taskInitAtom,
	chatLangAtom,
	needStartWsAtom,
} from './store'

function ChatBoard() {
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const [chatGuess, setChatGuess] = useRecoilState(chatGuessAtom)
	// const setPrompt = useSetRecoilState(promptAtom)
	const [showGuess, setShowGuess] = useState(true)
	const [taskInit, setTaskInit] = useRecoilState(taskInitAtom)
	const showDetail = useRecoilValue(showDetailAtom)
	const [chatText, setChatText] = useRecoilState(chatTextAtom)
	const taskDetail = useRecoilValue(taskDetailAtom)
	const guessChatStatus = useRecoilValue(guessChatStatusAtom)
	const [assistantChatStatus, setAssistantChatStatus] = useRecoilState(assistantChatStatusAtom)
	const [chatLang, setChatLang] = useRecoilState(chatLangAtom)
	const setNeedStartWs = useSetRecoilState(needStartWsAtom)

	const handleIpt = (ev) => {
		setChatText(ev.currentTarget.value)
	}

	const handleSend = (ev) => {
		if (!chatText || assistantChatStatus !== '[END]') return

		// if()
		wsSend({
			task_uuid: taskInit.task_uuid,
			content: chatText,
			language: chatLang,
		})

		setChatHistory({
			...chatHistory,
			[Date.now()]: {
				chat_uuid: Date.now(),
				provider: 'user',
				content: chatText,
				timeStamp: Date.now(),
			},
		})

		setChatText('')
		setShowGuess(false)
		setAssistantChatStatus(false)
	}

	const handleSelectTip = (value) => (ev) => {
		setChatText(value.substring(3))
	}

	useEffect(() => {
		// if (showDetail !== 2) return
		if (guessChatStatus === '[START]') setShowGuess(true)
	}, [guessChatStatus])

	const handleChangeLang = (lang) => {
		setChatLang(lang)
		handleRestart()
	}

	const handleRestart = async (ev) => {
		closeWebsocket()
		disposeWebsocket()
		const response = await startChat()

		setTaskInit(response.data)
		setNeedStartWs(true)
	}

	return (
		<div className={style.col}>
			<div className={style.colTitle}>
				<div>Chat</div>
				{taskDetail ? null : (
					<div className={style.restart} onPointerDown={handleRestart}>
						Restart
					</div>
				)}
				<div className={style.spaceholder}></div>

				{taskDetail ? null : (
					<>
						<div
							onPointerDown={() => handleChangeLang('Chinese')}
							className={`${style.lang} ${
								chatLang === 'Chinese' ? style.selected : ''
							}`}>
							中文
						</div>
						<div>|</div>
						<div
							onPointerDown={() => handleChangeLang('English')}
							className={`${style.lang} ${style.en} ${
								chatLang === 'English' ? style.selected : ''
							}`}>
							English
						</div>
					</>
				)}

				{taskDetail ? <div className={style.regene}>Regenerate</div> : null}
			</div>
			<div className={style.chatCon}>
				<div className={style.chatMsgCon}>
					{Object.values(chatHistory)
						.sort((a, b) => a.timeStamp - b.timeStamp)
						.map(
							(chat, idx, arr) =>
								(!showDetail ||
									chat.provider !== 'assistant' ||
									idx !== arr.length - 1) && (
									<div
										key={chat.chat_uuid}
										className={`${style.chatMsgRow} ${
											chat.provider === 'user' ? style.user : ''
										}`}>
										<div className={style.avatar}></div>
										<div className={style.bubble}>{chat.content}</div>
									</div>
								)
						)}
				</div>
				{!showDetail ? (
					<div className={style.chatIptCon}>
						<div className={style.chatTipsCon}>
							{chatGuess
								.filter((c) => c)
								.map(
									(guess) =>
										showGuess && (
											<div
												className={style.chatTips}
												key={guess}
												onPointerDown={handleSelectTip(guess)}>
												{guess.substring(3)}
											</div>
										)
								)}
						</div>
						<div className={style.chatRowCon}>
							<div className={style.iptLineCon}>
								<div className={style.iptSpaceholder}>{chatText || 'X'}</div>
								<textarea
									className={style.ipt}
									onChange={handleIpt}
									value={chatText}
									placeholder='Describe the face'
								/>
							</div>

							<div
								className={`${style.btn} ${
									!chatText || assistantChatStatus !== '[END]'
										? style.disabled
										: ''
								}`}
								onPointerDown={handleSend}>
								Send
							</div>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}

export { ChatBoard }
