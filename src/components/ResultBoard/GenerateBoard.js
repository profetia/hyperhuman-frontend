import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import style from './result.module.css'
import { promptAtom } from './store'

function GenerateBoard() {
	const [prompt, setPrompt] = useRecoilState(promptAtom)

	useEffect(() => {
		console.log(prompt)
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
				placeholder={'prompt……'}
				onChange={handleIpt}
			/>
			<div className={style.generateBtn}>Generate</div>
		</div>
	)
}

export { GenerateBoard }
