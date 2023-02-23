import style from './result.module.css'

function ChatBoard() {
	return (
		<div className={style.col}>
			<div className={style.colTitle}>
				<div>Dialog</div>
				<div>Regenerate</div>
			</div>
			<div className={style.chatCon}>
				<div></div>
				<div></div>
			</div>
		</div>
	)
}

export { ChatBoard }
