import { Outlet, useNavigate } from 'react-router-dom'
import { ChatBoard } from './ChatBoard'
import { DetailBoard } from './DetailBoard'
import { GenerateBoard } from './GenerateBoard'
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
				<ChatBoard />
			</div>
		</div>
	)
}

export { ResultBoard, GenerateBoard, DetailBoard, taskInitAtom }
