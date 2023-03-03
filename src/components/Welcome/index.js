import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { startChat } from '../../net'
import { logInfoAtom } from '../Header'
import { chatTextAtom, taskInitAtom } from '../ResultBoard'
import style from './welcome.module.css'
import bgImg from '../../assets/background.png'
import aiLogo from '../../assets/ai-logo.png'

function Welcome() {
	const [description, setDescription] = useState('')
	const setTaskInit = useSetRecoilState(taskInitAtom)
	const logInfo = useRecoilValue(logInfoAtom)
	const navi = useNavigate()
	const setChatText = useSetRecoilState(chatTextAtom)

	// useEffect(() => {
	// 	console.log('input description: ', description)
	// }, [description])
	// useEffect(() => console.log(logInfo), [logInfo])

	const handleInput = (ev) => {
		setDescription(ev.currentTarget.value)
	}

	const handleGenerate = (ev) => {
		if (!logInfo) {
			console.log('please login')
			return
		}
		setChatText(description)
		setDescription('')
		startChat()
			.then((data) => {
				if (data) {
					const taskInit = data.data
					setTaskInit(taskInit)
				}
				navi('/result/generate')
			})
			.catch((err) => {
				console.log(err.message)
			})
			.finally()
	}
	return (
		<div className={style.con}>
			<img alt='bg img' src={bgImg} />
			<div className={style.title}>ChatAvatar</div>
			<div>
				Progressive Generation Of Animatable 3D Faces
				<br />
				Under Text Guidance
			</div>
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
				<div className={style.btn}>Search</div>
				<div
					className={`${style.btn} ${logInfo ? '' : style.disabled}`}
					onPointerDown={handleGenerate}>
					Generate
				</div>
			</div>
		</div>
	)
}
export { Welcome }
