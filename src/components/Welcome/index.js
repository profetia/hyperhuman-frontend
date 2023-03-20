import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { search, startChat } from '../../net'
import { logInfoAtom, showLoginAtom } from '../Header'
import { chatTextAtom, taskInitAtom } from '../ResultBoard'
import style from './welcome.module.css'
import bgImg from '../../assets/background.png'
import aiLogo from '../../assets/ai-logo.png'
import { cardsAtom, cardsTypeAtom, cardsTypeConst, searchKeyWordAtom } from '../Gallery'

function Welcome() {
	const [description, setDescription] = useState('')
	const setTaskInit = useSetRecoilState(taskInitAtom)
	const logInfo = useRecoilValue(logInfoAtom)
	const navi = useNavigate()
	const setChatText = useSetRecoilState(chatTextAtom)
	const setCards = useSetRecoilState(cardsAtom)
	const setCardsType = useSetRecoilState(cardsTypeAtom)
	const setSearchKeyWord = useSetRecoilState(searchKeyWordAtom)
	const setShowLogin = useSetRecoilState(showLoginAtom)
	const timeStampRef = useRef(0)

	// useEffect(() => {
	// 	console.log('input description: ', description)
	// }, [description])
	// useEffect(() => console.log(logInfo), [logInfo])

	const handleInput = (ev) => {
		setDescription(ev.currentTarget.value)
	}

	const handleGenerate = (ev) => {
		if (!logInfo) {
			setShowLogin(true)
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

	const handleSearch = async (ev) => {
		if (Date.now() - timeStampRef.current >= 1000) {
			// timeStampRef.current = Date.now()
			// const rep = await search({ keyword: description })
			// setCards(rep.data)
			setCardsType(cardsTypeConst.Search)
			setSearchKeyWord(description)
		}
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
				<img onPointerDown={handleGenerate} alt='ai logo' src={aiLogo} />
			</div>

			<div className={style.btnCon}>
				<div className={style.btn} onPointerDown={handleSearch}>
					Search
				</div>
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
