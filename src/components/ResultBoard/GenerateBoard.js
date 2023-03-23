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
	assistantChatStatusAtom,
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
	const [countdown, setCountdown] = useState(10);
	const [progress, setProgress] = useState(100);
	const [assistantChatStatus, setAssistantChatStatus] = useRecoilState(assistantChatStatusAtom)


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
		if (assistantChatStatus !== '[END]' || !prompt || stopChat) return;

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

		if (!stopChat) {
			setCountdown(10);
		}
	}

	useEffect(() => {
		if (countdown > 0 && stopChat) {
			const timer = setTimeout(() => {
				setCountdown(countdown - 1);
				setProgress((countdown - 1) * 10);
			}, 1000);
			return () => clearTimeout(timer);
		} else if (countdown === 0) {
			// 暂无需要执行的逻辑
		}
	}, [countdown, stopChat]);

	const handleIpt = (ev) => {
		setPrompt(ev.currentTarget.value)
	}

	const handleSelectCandidate = async (candidateIndex) => {
		// return null
		await selectCandidate(taskInit.task_uuid, candidateIndex)
		setCandidates([])
		navi(`/result/detail/${taskInit.task_uuid}`)
	}

	const handleMouseEnter = (event) => {
		event.currentTarget.classList.add(style.highlight);
	};

	const handleMouseLeave = (event) => {
		event.currentTarget.classList.remove(style.highlight);
	};
	return (
		<div className={style.col}>
			<div className={style.colTitle}>Prompt</div>
			<textarea
				className={style.iptArea}
				value={prompt}
				placeholder={'Prompt will be generated'}
				onChange={handleIpt}
			/>
			{/* {console.log(assistantChatStatus !== '[END]')} */}
			<div
				className={`${style.btn} ${style.generateBtn} ${assistantChatStatus !== '[END]' || !prompt || stopChat ? style.disabled : ''
					}`}
				onPointerDown={handleGenerate}>
				Generate
			</div>

			<div className={style.progressBarContainer}>
				<div className={style.progressBar} style={{ width: `${progress}%` }}></div>
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
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
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
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
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
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
							/>
						) : null
					)}
				</div>
			</div>
			{stopChat ? (
				<div className={`${stopChat && countdown > 0 && generateProgress.stage !== 'Waiting' ? style.modelInfoConWithBackground : style.modelInfoCon}`} >
					{stopChat && countdown > 0 && (generateProgress.stage !== 'Waiting') ? (
						<>
							<div className={style.progressInfo}>Default model generated if no choice made in {countdown}s</div>
							<div className={style.progressTrack}>
								<div
									className={style.progressThumb}
									style={{ width: `${countdown * 10}%` }}></div>
							</div>
						</>
					) : null}
					{generateProgress.stage === 'Waiting' ? (
						<div className={style.progressInfo}>
							Waiting in queue, {generateProgress.payload.waiting_num ? generateProgress.payload.waiting_num : 0} tasks remain...
						</div>
					) : null}
				</div>
			) : null}
		</div>
	)
}

export { GenerateBoard }
