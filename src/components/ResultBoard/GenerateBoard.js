import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { getGenerateProgress, getTaskDetail, generateDetail, selectCandidate } from '../../net'
import style from './result.module.css'
import {
	chatGuessAtom,
	generateProgressAtom,
	promptAtom,
	stopChatAtom,
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
	const [stopChat, setStopChat] = useRecoilState(stopChatAtom)

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
		if (taskDetail || !stopChat) {
			clearInterval(intervalRef.current)
			return
		}

		clearInterval(intervalRef.current) //TODO 退出再重进请求2x
		intervalRef.current = setInterval(async () => {
			const { data } = await getGenerateProgress(taskInit.task_uuid)
			if (data.candidates) setCandidates(data.candidates)

			if (data.stage === 'Done' || data.stage === 'Preview') {
				setGenerateProgress({ stage: 'Downloading', percent: 100, payload: data })
				clearInterval(intervalRef.current)
				const response = await getTaskDetail(taskInit.task_uuid)
				// console.log(taskDetail)
				setTaskDetail(response.data)
			} else {
				setGenerateProgress({
					stage: data.stage,
					percent: data.percentage || 0,
					payload: data,
				})
			}
		}, 1000)
		// eslint-disable-next-line
	}, [taskDetail, stopChat])

	const handleGenerate = async (ev) => {
		if (!prompt) return

		// setChatGuess([])
		setStopChat(true)
		// navi('/result/detail')
		try {
			const rep = await generateDetail({ task_uuid: taskInit.task_uuid, prompt })
			if (rep.data.error) {
				throw new Error(rep.data.error)
			}
			// throw new Error('test err')
		} catch (e) {
			console.log(e.message)
			setStopChat(false)
		}
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
					!prompt || stopChat ? style.disabled : ''
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
			{stopChat ? (
				<div className={style.modelInfoCon}>
					{generateProgress.stage === 'Waiting' ? (
						<div className={style.progressInfo}>
							Waiting in queue, {generateProgress.payload.waiting_num} tasks remain...
						</div>
					) : null}
				</div>
			) : null}
		</div>
	)
}

export { GenerateBoard }
