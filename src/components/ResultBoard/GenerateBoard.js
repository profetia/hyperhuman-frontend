import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import { generateDetail } from '../../net'
import style from './result.module.css'
import { promptAtom, taskInitAtom } from './store'

function GenerateBoard() {
	const [prompt, setPrompt] = useRecoilState(promptAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const navi = useNavigate()

	const handleGenerate = (ev) => {
		if (!taskInit) return
		navi('/result/detail')
		generateDetail({ task_uuid: taskInit.task_uuid, prompt })
	}

	useEffect(() => {
		// console.log(prompt)
	}, [prompt])

	const handleIpt = (ev) => {
		setPrompt(ev.currentTarget.value)
	}
	return (
		<div className={style.col}>
			<div className={style.colTitle}>Prompt</div>
			<textarea
				className={style.iptArea}
				value={prompt}
				placeholder={'prompt......'}
				onChange={handleIpt}
			/>
			<div className={style.generateBtn} onPointerDown={handleGenerate}>
				Generate
			</div>
		</div>
	)
}

export { GenerateBoard }
