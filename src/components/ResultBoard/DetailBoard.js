import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import style from './result.module.css'
import { promptAtom, showDetailAtom, taskDetailAtom, taskInitAtom } from './store'
import { getGenerateProgress, getTaskDetail } from '../../net'

function DetailBoard() {
	const setShowDetail = useSetRecoilState(showDetailAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const prompt = useRecoilValue(promptAtom)
	const inteRef = useRef(null)
	const [stage, setStage] = useState('')
	const [percent, setPercent] = useState(0)

	// const
	useEffect(() => {
		setShowDetail(true)

		return () => {
			setShowDetail(false)
		}
		// eslint-disable-next-line
	}, [])

	// useEffect

	useEffect(() => {
		// console.log(taskDetail)
		if (taskDetail) return

		if (inteRef.current) clearInterval(inteRef.current)

		inteRef.current = setInterval(async () => {
			const { data } = await getGenerateProgress(taskInit.task_uuid)
			setStage(data.stage)

			switch (data.stage) {
				case 'Created':
					setPercent(5)
					break
				case 'ModelStage':
					setPercent(10)
					break
				case 'AppearanceStage':
					setPercent(20)
					break
				case 'DetailStage':
					setPercent(30)
					break
				case 'UpscaleStage':
					setPercent(40)
					break
				case 'ExportStage':
					setPercent(50)
					break
				case 'Done':
					setPercent(100)
					clearInterval(inteRef.current)
					const taskDetail = await getTaskDetail(taskInit.task_uuid)
					setTaskDetail(taskDetail.data)
					break
				default:
					console.log(data)
					setPercent(0)
			}
		}, 1000)
		// eslint-disable-next-line
	}, [taskDetail])
	return (
		<div className={style.col}>
			<div className={style.creatorCon}>
				<div className={style.avatar}>
					{taskDetail ? <img alt='avatar' src={taskDetail?.author?.avatar} /> : null}
				</div>

				<div className={style.creatorInfoCon}>
					<div className={style.creatorName}>{taskDetail?.author?.name}</div>
					<div className={style.creatorInfo}>{taskDetail?.author?.name}</div>
				</div>
			</div>
			<div className={style.modelView}></div>
			<div className={style.modelInfoCon}>
				{taskDetail ? null : (
					<>
						<div className={style.progressInfo}>{stage}</div>
						<div className={style.progressTrack}>
							<div
								className={style.progressThumb}
								style={{ width: `${percent}%` }}></div>
						</div>
					</>
				)}

				<div className={style.modelPrompt}>{prompt}</div>
			</div>
		</div>
	)
}

export { DetailBoard }
