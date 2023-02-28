import style from './result.module.css'

function DetailBoard() {
	return (
		<div className={style.col}>
			<div>
				<div>avatar</div>
				<div>
					<div>name</div>
					<div>info</div>
				</div>
			</div>
			<div>three</div>
			<div>
				<div>
					<div>progress</div>
					<div>progress ui</div>
				</div>
				<div>prompt</div>
			</div>
		</div>
	)
}

export { DetailBoard }
