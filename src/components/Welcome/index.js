import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { startChat } from '../../net'
import { logInfoAtom } from '../Header'
import { taskInitAtom } from '../ResultBoard'
import style from './welcome.module.css'

function Welcome() {
	const [description, setDescription] = useState('')
	const setTaskInit = useSetRecoilState(taskInitAtom)
	const logInfo = useRecoilValue(logInfoAtom)
	const navi = useNavigate()

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
		startChat()
			.then((data) => {
				const taskInit = data.data
				setTaskInit(taskInit)
				navi('/result')
			})
			.catch((err) => {
				console.log(err.message)
			})
			.finally()
	}
	return (
		<div className={style.con}>
			<div className={style.title}>DreamFace</div>
			<div>
				Progressive Generation Of Animatable 3D Faces
				<br />
				Under Text Guidance
			</div>
			<input
				className={style.ipt}
				placeholder='Describe the model you want to generate'
				value={description}
				onChange={handleInput}
			/>
			<div className={style.btnCon}>
				<div className={style.btn}>Search</div>
				<div className={style.btn} onPointerDown={handleGenerate}>
					Generate
				</div>
			</div>
		</div>
	)
}
export { Welcome }
