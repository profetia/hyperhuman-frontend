import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { getGenerateProgress, getTaskDetail, generateDetail, selectCandidate } from '../../net'
import style from './result.module.css'
import {
	chatGuessAtom,
	generateProgressAtom,
	promptAtom,
	showDetailAtom,
	taskDetailAtom,
	taskInitAtom,
} from './store'

function GenerateBoard() {
	const [prompt, setPrompt] = useRecoilState(promptAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const setChatGuess = useSetRecoilState(chatGuessAtom)
	const navi = useNavigate()
	const intervalRef = useRef(null)
	const [candidates, setCandidates] = useState([])
	const [generateProgress, setGenerateProgress] = useRecoilState(generateProgressAtom)
	const [showDetail, setShowDetail] = useRecoilState(showDetailAtom)

	// useEffect(() => () => clearInterval(intervalRef.current), [])

	useEffect(() => {
		// console.log(prompt)
		if (!taskInit) {
			navi('/', { replace: true })
		}
		// eslint-disable-next-line
	}, [taskInit])

	useEffect(() => {
		// console.log(taskDetail)
		if (taskDetail || !showDetail) {
			clearInterval(intervalRef.current)
			return
		}

		clearInterval(intervalRef.current) //TODO 退出再重进请求2x
		intervalRef.current = setInterval(async () => {
			const { data } = await getGenerateProgress(taskInit.task_uuid)
			if (data.candidates) setCandidates(data.candidates)

			switch (data.stage) {
				case 'Created':
					setGenerateProgress({ stage: data.stage, percent: 5 })
					break
				case 'ModelStage':
					setGenerateProgress({ stage: data.stage, percent: 10 })
					break
				case 'AppearanceStage':
					setGenerateProgress({ stage: data.stage, percent: 20 })
					break
				case 'DetailStage':
					setGenerateProgress({ stage: data.stage, percent: 30 })
					break
				case 'UpscaleStage':
					setGenerateProgress({ stage: data.stage, percent: 40 })
					break
				case 'ExportStage':
					setGenerateProgress({ stage: data.stage, percent: 50 })
					break
				case 'Done':
					setGenerateProgress({ stage: 'Waiting', percent: 100 })
					clearInterval(intervalRef.current)
					const taskDetail = await getTaskDetail(taskInit.task_uuid)
					console.log(taskDetail)
					setTaskDetail(taskDetail.data)
					break
				default:
				// console.log(data)
				// setGenerateProgress({ ...generateProgress, percent:0})
			}
		}, 1000)
		// eslint-disable-next-line
	}, [taskDetail, showDetail])

	const handleGenerate = (ev) => {
		if (!prompt) return

		setChatGuess([])
		setShowDetail(true)
		// navi('/result/detail')
		generateDetail({ task_uuid: taskInit.task_uuid, prompt })
	}

	const handleIpt = (ev) => {
		setPrompt(ev.currentTarget.value)
	}

	const handleSelectCandidate = async (candidateIndex) => {
		// return null
		await selectCandidate(taskInit.task_uuid, candidateIndex)
		setCandidates([])
		navi('/result/detail')
	}
	return (
		<div className={style.col}>
			<div className={style.colTitle}>Prompt</div>
			<textarea
				className={style.iptArea}
				value={prompt}
				placeholder={'Prompt will be generated'}
				onChange={handleIpt}
			/>
			<div
				className={`${style.btn} ${style.generateBtn} ${
					!prompt || showDetail ? style.disabled : ''
				}`}
				onPointerDown={handleGenerate}>
				Generate
			</div>
			<div className={style.candidateCon}>
				<div className={style.candidateCol}>
					{candidates.map((item, index) =>
						index >= 0 && index < 3 ? (
							<img
								key={index}
								src={`data:image/png;base64,${item}`}
								alt={item}
								onClick={() => handleSelectCandidate(index)}
							/>
						) : null
					)}
				</div>
				<div className={style.candidateCol}>
					<div style={{ height: '4rem', marginBottom: '1rem' }}></div>
					{candidates.map((item, index) =>
						index >= 3 && index < 6 ? (
							<img
								key={index}
								src={`data:image/png;base64,${item}`}
								alt={item}
								onClick={() => handleSelectCandidate(index)}
							/>
						) : null
					)}
				</div>
				<div className={style.candidateCol}>
					{candidates.map((item, index) =>
						index >= 6 && index < 9 ? (
							<img
								key={index}
								src={`data:image/png;base64,${item}`}
								alt={item}
								onClick={() => handleSelectCandidate(index)}
							/>
						) : null
					)}
				</div>
			</div>
		</div>
	)
}

export { GenerateBoard }
