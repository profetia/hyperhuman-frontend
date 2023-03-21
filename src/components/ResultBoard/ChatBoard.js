import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { closeWebsocket, disposeWebsocket, reconnectWebsocket, startChat, wsSend } from '../../net'
import style from './result.module.css'
import {
	assistantChatStatusAtom,
	chatGuessAtom,
	chatHistoryAtom,
	chatTextAtom,
	guessChatStatusAtom,
	stopChatAtom,
	taskDetailAtom,
	taskInitAtom,
	chatLangAtom,
	needStartWsAtom,
	meshProfileAtom,
} from './store'
import { exportToImage } from "./utils";

function ChatBoard() {
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const [chatGuess, setChatGuess] = useRecoilState(chatGuessAtom)
	// const setPrompt = useSetRecoilState(promptAtom)
	const [showGuess, setShowGuess] = useState(true)
	const [taskInit, setTaskInit] = useRecoilState(taskInitAtom)
	const setTaskDetail = useSetRecoilState(taskDetailAtom)
	const setMeshProfile = useSetRecoilState(meshProfileAtom)
	const [stopChat, setStopChat] = useRecoilState(stopChatAtom)
	const [chatText, setChatText] = useRecoilState(chatTextAtom)
	const taskDetail = useRecoilValue(taskDetailAtom)
	const guessChatStatus = useRecoilValue(guessChatStatusAtom)
	const [assistantChatStatus, setAssistantChatStatus] = useRecoilState(assistantChatStatusAtom)
	const [chatLang, setChatLang] = useRecoilState(chatLangAtom)
	const setNeedStartWs = useSetRecoilState(needStartWsAtom)
	const navi = useNavigate()

	const handleIpt = (ev) => {
		setChatText(ev.currentTarget.value)
	}

	const handleSend = (ev) => {
		if (!chatText || assistantChatStatus !== '[END]') return
		console.log("?" + assistantChatStatus)
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
		// if (stopChat !== 2) return
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

	const handleRegenerate = () => {
		navi('/result/generate')
		setTaskDetail(false)
		setStopChat(false)
		setMeshProfile(false)
		reconnectWebsocket()
	}

	const chatRef = useRef();
	window.exportChat = async () => {
		await exportToImage(chatRef.current, "chat");
	};

	const allAssistantMessages = Object.values(chatHistory).every(
		(chat) => chat.provider === "assistant"
	);



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
							className={`${style.lang} ${chatLang === 'Chinese' ? style.selected : ''
								}`}>
							中文
						</div>
						<div>|</div>
						<div
							onPointerDown={() => handleChangeLang('English')}
							className={`${style.lang} ${style.en} ${chatLang === 'English' ? style.selected : ''
								}`}>
							English
						</div>
					</>
				)}

				{taskDetail && taskInit ? (
					<div className={style.regene} onPointerDown={handleRegenerate}>
						Regenerate
					</div>
				) : null}
			</div>
			{console.log(chatHistory)}
			<div className={style.chatCon} ref={chatRef}>
				<div className={style.chatMsgCon}>
				{console.log (!allAssistantMessages || !stopChat )}
				{(!allAssistantMessages || !stopChat) &&
					Object.values(chatHistory)
						.sort((a, b) => a.timeStamp - b.timeStamp)
						.filter((chat, idx, arr) => {
							return !(chat.provider === "assistant" && idx === arr.length - 1) || !stopChat;
						})
						.map((chat) => (
							<div
								key={chat.chat_uuid}
								className={`${style.chatMsgRow} ${chat.provider === "user" ? style.user : ""
									}`}
							>
								<div className={`${style.bubble} ${stopChat ? style.unactive : ""}`}>
									{chat.content}
								</div>
							</div>
						))}

					{stopChat && (
						<div className={`${style.assistant}`}>
							<div className={`${style.bubble} ${style.unactive}`}>
								{Object.keys(chatHistory).length <= 1 || allAssistantMessages
									? "Seems like we don't have any conversations here"
									: "End of the conversation"}
							</div>
						</div>
					)}

					{!assistantChatStatus && !stopChat && (
						<div className={`${style.chatMsgRow} ${style.assistant}`}>
							<div className={`${style.bubble}`}>
								<span className={style.dot} style={{ animationDelay: "0s" }}>.</span>
								<span className={style.dot} style={{ animationDelay: "0.33s" }}>.</span>
								<span className={style.dot} style={{ animationDelay: "0.66s" }}>.</span>
							</div>
						</div>
					)}

				</div>

				{!stopChat ? (
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
								className={`${style.btn} ${!chatText || assistantChatStatus !== '[END]'
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
