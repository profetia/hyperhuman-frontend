import { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { wsSend } from '../../net'
import style from './result.module.css'
import { chatGuessAtom, chatHistoryAtom, taskInitAtom } from './store'

function ChatBoard() {
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)
	const [chatGuess, setChatGuess] = useRecoilState(chatGuessAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const [chatText, setChatText] = useState('')

	const handleIpt = (ev) => {
		setChatText(ev.currentTarget.value)
	}

	const handleSend = (ev) => {
		if (!chatText) return
		wsSend({
			task_uuid: taskInit.task_uuid,
			content: chatText,
		})

		setChatHistory({
			...chatHistory,
			[Date.now()]: {
				chat_uuid: Date.now(),
				provider: 'User',
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
		// console.log(chatGuess)
	}, [chatGuess])

	return (
		<div className={style.col}>
			<div className={style.colTitle}>
				<div>Dialog</div>
				<div className={style.regene}>Regenerate</div>
			</div>
			<div className={style.chatCon}>
				<div className={style.chatMsgCon}>
					{Object.values(chatHistory)
						.sort((a, b) => a.timeStamp - b.timeStamp)
						.map((chat) => (
							<div
								key={chat.chat_uuid}
								className={`${style.chatMsgRow} ${
									chat.provider === 'User' ? style.user : ''
								}`}>
								<div className={style.avatar}></div>
								<div className={style.bubble}>{chat.content}</div>
							</div>
						))}
				</div>
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
			</div>
		</div>
	)
}

export { ChatBoard }
