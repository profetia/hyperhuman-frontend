import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { generateDetail } from '../../net'
import style from './result.module.css'
import { chatGuessAtom, isFinishedChatAtom, promptAtom, taskInitAtom } from './store'

function GenerateBoard() {
	const [prompt, setPrompt] = useRecoilState(promptAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const setChatGuess = useSetRecoilState(chatGuessAtom)
	const setIsFinishedChat = useSetRecoilState(isFinishedChatAtom)
	const navi = useNavigate()

	const handleGenerate = (ev) => {
		if (!prompt) return

		setChatGuess([])
		setIsFinishedChat(true)
		navi('/result/detail')
		generateDetail({ task_uuid: taskInit.task_uuid, prompt })
	}

	useEffect(() => {
		// console.log(prompt)
		if (!taskInit) {
			navi('/', { replace: true })
		}
		// eslint-disable-next-line
	}, [taskInit])

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
				className={`${style.btn} ${style.generateBtn} ${!prompt ? style.disabled : ''}`}
				onPointerDown={handleGenerate}>
				Generate
			</div>
		</div>
	)
}

export { GenerateBoard }
