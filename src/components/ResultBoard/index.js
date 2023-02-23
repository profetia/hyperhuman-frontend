import { Outlet, useNavigate } from 'react-router-dom'
import style from './result.module.css'
import { taskInitAtom } from './store.js'

function ResultBoard() {
	const navi = useNavigate()

	const handleClose = (ev) => {
		navi('/')
	}
	return (
		<div className={style.con} onPointerDown={handleClose}>
			<div className={style.board} onPointerDown={(ev) => ev.stopPropagation()}>
				<Outlet />
				<div>
					<div></div>
					<div>
						<div></div>
						<div></div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { ResultBoard, taskInitAtom }
