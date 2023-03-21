import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { search, startChat } from '../../net'
import { logInfoAtom, showLoginAtom } from '../Header'
import { chatTextAtom, needStartWsAtom, taskDetailAtom, taskInitAtom } from '../ResultBoard'
import style from './welcome.module.css'
import bgImg from '../../assets/background.png'
import aiLogo from '../../assets/ai-logo.png'
import { cardsAtom, cardsTypeAtom, cardsTypeConst, searchKeyWordAtom } from '../Gallery'
import { AiOutlineSearch } from 'react-icons/ai'
import { HiOutlineCursorArrowRays } from 'react-icons/hi2'



function Welcome({ scrollPercentage }) {
	const [description, setDescription] = useState('')
	const [taskInit, setTaskInit] = useRecoilState(taskInitAtom)
	const setTaskDetail = useSetRecoilState(taskDetailAtom)
	const setNeedStartWs = useSetRecoilState(needStartWsAtom)
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

		if (!taskInit) {
			setTaskDetail(false)
			setNeedStartWs(true)
		}

		startChat()
			.then((data) => {
				if (data) {
					const init = data.data
					setTaskInit(init)
					setChatText(description)
					setDescription('')
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
			setCardsType(cardsTypeConst.Search)
			setSearchKeyWord(description)
		}
	}
	return (
		<div className={`${style.con}`}>
			<img alt='bg img' src={bgImg} />
			<div className={style.title}>ChatAvatar</div>
			<div
				style={{
					transform: `translateY(${scrollPercentage * -100}px)`,
					opacity: 1 - scrollPercentage
				}}
			>
				Progressive Generation Of Animatable 3D Faces
				<br />
				Under Text Guidance
			</div>
			<div className={style.iptCon} style={{ marginTop: `${3 - scrollPercentage * 6}rem` }}>
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
					<AiOutlineSearch size="1.2em" />&nbsp;
					Search
				</div>
				<div
					className={`${style.btn} ${logInfo ? '' : style.disabled}`}
					onPointerDown={handleGenerate}
				>
					<HiOutlineCursorArrowRays size="1.2em" />&nbsp;
					Generate
				</div>
			</div>
		</div>
	)
}
export { Welcome }
