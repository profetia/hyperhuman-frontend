import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import style from './gallery.module.css'
import { logInfoAtom } from '../Header'
import { getCards, getTaskDetail } from '../../net'
import { taskDetailAtom } from '../ResultBoard/store'
import { useNavigate } from 'react-router-dom'
import { cardsAtom, cardsTypeAtom, cardsTypeConst } from './store'

function Gallery() {
	const navi = useNavigate()
	const logInfo = useRecoilValue(logInfoAtom)
	const setTaskDetail = useSetRecoilState(taskDetailAtom)
	const [cardsType, setCardsType] = useRecoilState(cardsTypeAtom)
	const [cards, setCards] = useRecoilState(cardsAtom)
	const [hoverCard, setHoverCard] = useState(null)
	const [canMore, setCanMore] = useState(false)
	const pageRef = useRef(0)
	const timeStampRef = useRef(0)
	const elRef = useRef(null)

	useEffect(() => {
		if (cardsType === cardsTypeConst.Search) return

		pageRef.current = 0
		timeStampRef.current = 0
		getCards({ type: cardsType, page_num: pageRef.current }).then((data) => {
			if (data.data.length >= 8) {
				setCanMore(true)
			} else {
				setCanMore(false)
			}
			// console.log(data.data);
			setCards(data.data)
		})
	}, [cardsType])

	const handleClickCard = (task_uuid) => async (ev) => {
		// console.log(task_uuid)
		try {
			const rep = await getTaskDetail(task_uuid)
			console.log(rep.data)
			setTaskDetail(rep.data)
			navi('/result/detail')
		} catch (e) {}
	}

	const loadMore = async (ev) => {
		if (Date.now() - timeStampRef.current >= 1000) {
			timeStampRef.current = Date.now()
			let length = 0,
				i = 0,
				waitCards = []

			do {
				const rep = await getCards({ type: cardsType, page_num: pageRef.current + 1 })
				pageRef.current += 1
				waitCards.push(...rep.data)
				// setCards([...cards, ...rep.data])
				++i
				length = rep.data.length
			} while (length >= 8 && i < 5)

			setCards([...cards, ...waitCards])
			if (length >= 8) {
				setCanMore(true)
			} else {
				setCanMore(false)
			}
		}
	}

	return (
		<div className={style.con}>
			<div className={style.menuCon}>
				{cardsType === cardsTypeConst.Search ? (
					<div className={`${style.menu} ${style.selected}`}>{cardsTypeConst.Search}</div>
				) : null}
				{logInfo ? (
					<div
						onPointerDown={(ev) => setCardsType(cardsTypeConst.Mine)}
						className={`${style.menu} ${
							cardsType === cardsTypeConst.Mine ? style.selected : ''
						}`}>
						{cardsTypeConst.Mine}
					</div>
				) : null}

				<div
					onPointerDown={(ev) => setCardsType(cardsTypeConst.Featured)}
					className={`${style.menu} ${
						cardsType === cardsTypeConst.Featured ? style.selected : ''
					}`}>
					{cardsTypeConst.Featured}
				</div>
				<div
					onPointerDown={(ev) => setCardsType(cardsTypeConst.Recent)}
					className={`${style.menu} ${
						cardsType === cardsTypeConst.Recent ? style.selected : ''
					}`}>
					{cardsTypeConst.Recent}
				</div>
			</div>

			<div className={style.cardsCon} ref={elRef}>
				{cards.map((card) => (
					<div
						className={`${style.card}`}
						key={card.task_uuid}
						onPointerDown={handleClickCard(card.task_uuid)}
						onMouseEnter={() => setHoverCard(card.task_uuid)}
						onMouseLeave={(ev) => setHoverCard(false)}>
						{/* <div></div> */}
						<div className={style.coverImg}>
							{hoverCard === card.task_uuid ? (
								<img alt='cover' src={card.video_url} />
							) : (
								<img alt='cover' src={card.image_url} />
							)}
						</div>

						<div className={`${style.likeCon} ${card.isLike ? style.like : ''}`}>❤</div>

						{hoverCard === card.task_uuid ? null : (
							<div className={style.infoCon}>
								<div className={style.avatar}>
									<img alt='avatar' src={card.author.avatar_url} />
								</div>
								<div>{card.author.username}</div>
								<div className={style.spaceholder}></div>
								<div>{card.num_like}likes</div>
							</div>
						)}
						<div
							className={`${style.prompt} ${
								hoverCard === card.task_uuid ? style.show : ''
							}`}>
							{card.prompt}
						</div>
					</div>
				))}
				{canMore && cardsType !== cardsTypeConst.Search ? (
					<div className={style.more} onPointerDown={loadMore}>
						More
					</div>
				) : (
					<div className={style.more}>That's all</div>
				)}
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

export { Gallery, cardsAtom, cardsTypeAtom, cardsTypeConst }
