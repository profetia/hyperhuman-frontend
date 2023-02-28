import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import style from './result.module.css'
import { chatHistoryAtom } from './store'

function ChatBoard() {
	const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom)

	useEffect(() => {
		setChatHistory([
			{
				chat_uuid: '4f1b3319-48ef-44a7-a01b-66cb7289f6fa',
				content:
					" Hi there! I'm H, your AI assistant. I'm here to help you create a character. What would you like to describe about the character?",
				provider: 'AI Assistant',
				time: '2023-02-22T07:41:12.323Z',
			},
			{
				chat_uuid: '5b6dd0ee-0b29-4710-a7f3-ae3fce2adb83',
				content: " I'd like to create a character with dark skin and brown eyes.",
				provider: 'User',
				time: '2023-02-22T07:43:52.264Z',
			},
		])
	}, [setChatHistory])

	return (
		<div className={style.col}>
			<div className={style.colTitle}>
				<div>Dialog</div>
				<div>Regenerate</div>
			</div>
			<div className={style.chatCon}>
				<div className={style.chatMsgCon}>
					{chatHistory.map((chat) => (
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
					<div className={style.chatTipsCon}></div>
					<div className={style.chatRowCon}>
						<input placeholder='Please describe the model you want' />
						<div className={style.chatSendBtn}>Send</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { ChatBoard }
