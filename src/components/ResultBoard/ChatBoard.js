import { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { wsSend } from '../../net'
import style from './result.module.css'
import {
	chatGuessAtom,
	chatHistoryAtom,
	showDetailAtom,
	taskDetailAtom,
	taskInitAtom,
} from './store'

function ChatBoard() {
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const [chatGuess, setChatGuess] = useRecoilState(chatGuessAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const showDetail = useRecoilValue(showDetailAtom)
	const [chatText, setChatText] = useState('')
	const taskDetail = useRecoilValue(taskDetailAtom)

	const handleIpt = (ev) => {
		setChatText(ev.currentTarget.value)
	}

	const handleSend = (ev) => {
		if (!chatText || !taskInit) return
		wsSend({
			task_uuid: taskInit.task_uuid,
			content: chatText,
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
		setChatGuess([])
	}

	const handleSelectTip = (value) => (ev) => {
		setChatText(value.substring(3))
	}

	useEffect(() => {
		// if (showDetail !== 2) return
	}, [showDetail])

	return (
		<div className={style.col}>
			<div className={style.colTitle}>
				<div>Dialog</div>
				{taskDetail ? <div className={style.regene}>Regenerate</div> : null}
			</div>
			<div className={style.chatCon}>
				<div className={style.chatMsgCon}>
					{Object.values(chatHistory)
						.sort((a, b) => a.timeStamp - b.timeStamp)
						.map((chat) => (
							<div
								key={chat.chat_uuid}
								className={`${style.chatMsgRow} ${
									chat.provider === 'user' ? style.user : ''
								}`}>
								<div className={style.avatar}></div>
								<div className={style.bubble}>{chat.content}</div>
							</div>
						))}
				</div>
				{!showDetail ? (
					<div className={style.chatIptCon}>
						<div className={style.chatTipsCon}>
							{chatGuess.map((guess) => (
								<div
									className={style.chatTips}
									key={guess}
									onPointerDown={handleSelectTip(guess)}>
									{guess}
								</div>
							))}
						</div>
						<div className={style.chatRowCon}>
							<div className={style.iptLineCon}>
								<div className={style.iptSpaceholder}>{chatText || 'X'}</div>
								<textarea
									className={style.ipt}
									onChange={handleIpt}
									value={chatText}
									placeholder='Please describe the model you want'
								/>
							</div>

							<div className={style.chatSendBtn} onPointerDown={handleSend}>
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
