import style from './result.module.css'

function GenerateBoard() {
	return (
		<div className={style.col}>
			<div className={style.colTitle}>Prompt</div>
            <div contentEditable={true} className={style.iptArea}></div>
            <div className={style.generateBtn}>Generate</div>
		</div>
	)
}

export { GenerateBoard }
