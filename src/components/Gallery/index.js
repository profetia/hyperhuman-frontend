import { useEffect, useRef, useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import style from './gallery.module.css'
import { logInfoAtom } from '../Header'
import { getCards, getTaskDetail } from '../../net'
import { taskDetailAtom } from '../ResultBoard/store'
import { useNavigate } from 'react-router-dom'

const cardsTypeConst = {
	Recent: 'Recent',
	Featured: 'Featured',
	Mine: 'Mine',
}
function Gallery() {
	const navi = useNavigate()
	const logInfo = useRecoilValue(logInfoAtom)
	const setTaskDetail = useSetRecoilState(taskDetailAtom)
	const [cardsType, setCardsType] = useState(cardsTypeConst.Recent)
	const [cards, setCards] = useState([])
	const [hoverCard, setHoverCard] = useState(null)
	const pageRef = useRef(0)
	const timeStampRef = useRef(0)
	const scrollTopRef = useRef(0)
	const elRef = useRef(null)

	useEffect(() => {
		pageRef.current = 0
		timeStampRef.current = 0
		scrollTopRef.current = 0
		getCards({ type: cardsType, page_num: pageRef.current }).then((data) => {
			setCards(data.data)
		})
	}, [cardsType])

	const handleClickCard = (task_uuid) => async (ev) => {
		// console.log(task_uuid)
		try {
			const rep = await getTaskDetail(task_uuid)
			// console.log(rep.data)
			setTaskDetail(rep.data)
			// navi('/result/detail')
		} catch (e) {}
	}

	const handleWheel = async (ev) => {
		if (ev.deltaY <= 0) return
		const el = elRef.current
		if (el.scrollTop === scrollTopRef.current) {
			if (Date.now() - timeStampRef.current >= 1000) {
				timeStampRef.current = Date.now()
				const rep = await getCards({ type: cardsType, page_num: pageRef.current + 1 })
				pageRef.current += 1
				setCards([...cards, ...rep.data])
			}
		} else {
			scrollTopRef.current = el.scrollTop
		}
	}

	return (
		<div className={style.con}>

			<div className={style.cardsCon} ref={elRef} onWheel={handleWheel}>
				{cards.slice(0, 9).map((card) => (
					<div
						className={`${style.card}`}
						key={card.task_uuid}
						onPointerDown={handleClickCard(card.task_uuid)}
						onMouseEnter={() => setHoverCard(card.task_uuid)}
						onMouseLeave={(ev) => setHoverCard(false)}>
						{/* <div></div> */}
						<div className={style.coverImg}>
							<img alt='cover' src={card.image_url} />
						</div>

						<div
							className={`${style.prompt} ${
								hoverCard === card.task_uuid ? style.show : ''
							}`}>
							{card.prompt}
						</div>
					</div>
				))}
			</div>
			{/* {cardsType === cardsTypeConst.Featured ? (
				<div className={style.cardsCon}>2</div>
			) : null}
			{cardsType === cardsTypeConst.Mine ? (
				<div className={style.cardsCon}>3</div>
			) : null} */}
		</div>
	)
}

export { Gallery }
