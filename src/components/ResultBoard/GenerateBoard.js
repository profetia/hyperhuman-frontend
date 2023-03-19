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
	generateStageAtom,
	chatDialogStartAtom,
	taskCandidateAtom,
	meshProfileAtom
} from './store'
import { startChat } from '../../net'

function GenerateBoard() {
	const [prompt, setPrompt] = useRecoilState(promptAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const setChatGuess = useSetRecoilState(chatGuessAtom)
	const navi = useNavigate()
	const intervalRef = useRef(null)
	const [taskCandidates, setTaskCandidates] = useRecoilState(taskCandidateAtom)
	const [generateProgress, setGenerateProgress] = useRecoilState(generateProgressAtom)
	const [stopChat, setStopChat] = useRecoilState(stopChatAtom)
	const [generateStage, setGenerateStage] = useRecoilState(generateStageAtom)
	const setChatDialogStart = useSetRecoilState(chatDialogStartAtom)
	const setTaskInit = useSetRecoilState(taskInitAtom)
	const setMeshProfile = useSetRecoilState(meshProfileAtom)

	// useEffect(() => () => clearInterval(intervalRef.current), [])

	useEffect(() => {
		// console.log(prompt)
		if (!taskInit) {
			// setChatDialogStart(false)
			// navi('/', { replace: true })
		} else {
			// setChatGuess([])
			setStopChat(true)
			// navi('/result/detail')
			// setGenerateStage('detail')
			generateDetail({ task_uuid: taskInit.task_uuid, prompt })	
		}
		// eslint-disable-next-line
	}, [taskInit])

	useEffect(() => {
		// console.log(taskDetail)
		if (taskDetail || !stopChat) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
			return
		}

		clearInterval(intervalRef.current) //TODO 退出再重进请求2x
		intervalRef.current = setInterval(async () => {
			const { data } = await getGenerateProgress(taskInit.task_uuid)
			if (data.candidates) setTaskCandidates(data.candidates)

			if (data.stage === 'Done') {
				setGenerateProgress({ stage: 'Downloading', percent: 100, payload: data })
				setTaskCandidates([])
				clearInterval(intervalRef.current)
				intervalRef.current = null
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

	const handleGenerate = (ev) => {
		if (!prompt) return

		setTaskDetail(false)
		setStopChat(false)
		setMeshProfile(false)
		setGenerateStage('generate')

		startChat()
			.then((data) => {
				if (data) {
					const taskInit = data.data
					setTaskInit(taskInit)
				}
				// navi('/result/generate')			
			})
			.catch((err) => {
				console.log(err.message)
			})
			.finally()
	}

	const handleIpt = (ev) => {
		setPrompt(ev.currentTarget.value)
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
					!prompt || intervalRef.current ? style.disabled : ''
				}`}
				onPointerDown={handleGenerate}>
				Generate
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
