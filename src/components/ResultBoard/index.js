import style from './result.module.css'
import { taskInitAtom } from './store.js'

function ResultBoard() {
	return (
		<div className={style.con}>
			<div className={style.board}>
				<div>
					<div></div>
					<div>
						<div></div>
						<div></div>
					</div>
				</div>
				<div></div>
			</div>
		</div>
	)
}

export { ResultBoard, taskInitAtom }
