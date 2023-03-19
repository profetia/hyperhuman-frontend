import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

import { logInfoAtom } from '../Header'
import { chatTextAtom, taskInitAtom, chatDialogStartAtom, ResultBoard, promptAtom } from '../ResultBoard'
import style from './welcome.module.css'
import bgImg from '../../assets/background.png'
import aiLogo from '../../assets/ai-logo.png'

function Welcome() {
	const [description, setDescription] = useState('')

	const logInfo = useRecoilValue(logInfoAtom)
	const navi = useNavigate()
	const setChatText = useSetRecoilState(chatTextAtom)
	const [chatDialogStart, setChatDialogStart] = useRecoilState(chatDialogStartAtom)
	const [prompt, setPrompt] = useRecoilState(promptAtom)

	// useEffect(() => {
	// 	console.log('input description: ', description)
	// }, [description])
	// useEffect(() => console.log(logInfo), [logInfo])

	const handleInput = (ev) => {
		setDescription(ev.currentTarget.value)
	}

	const handleGenerate = (ev) => {
		// if (!logInfo) {
		// 	console.log('please login')
		// 	return
		// }
		// setChatText(description)
		setPrompt(description)
		setDescription('')
		setChatDialogStart(true)
	}
	return (
		<div className={style.con}>
			{
				!chatDialogStart ? <>
					<img alt='bg img' src={bgImg} />
					<div className={!chatDialogStart ? style.mainCon : ''}></div>					
				</> : <ResultBoard />
			}
			<div className={!chatDialogStart ? style.mainCon : ''}>
				<div className={style.title}>ChatAvatar</div>
				<div>
					Progressive Generation Of Animatable 3D Faces
					<br />
					Under Text Guidance
				</div>
			</div>
			<div className={style.ioCon}>				
				<div className={style.iptCon}>
					<input
						className={style.ipt}
						placeholder='Describe the model you want to generate'
						value={description}
						onChange={handleInput}
					/>
					<img alt='ai logo' src={aiLogo} />
				</div>
				<div className={style.btnCon}>
					<div
						className={`${style.btn}`}
						onPointerDown={handleGenerate}>
						Generate
					</div>
				</div>					
			</div>		
		</div>
	)
}
export { Welcome }
