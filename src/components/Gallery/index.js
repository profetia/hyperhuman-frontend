import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import style from './gallery.module.css'
import { logInfoAtom, showLoginAtom } from '../Header'
import { getCards, getTaskDetail, search } from '../../net'
import { taskDetailAtom, taskInitAtom } from '../ResultBoard/store'
import { useNavigate } from 'react-router-dom'
import { cardsAtom, cardsTypeAtom, cardsTypeConst, searchKeyWordAtom } from './store'
import { likeCard } from '../../net'

function Gallery() {
	const navi = useNavigate()
	const logInfo = useRecoilValue(logInfoAtom)
	const setTaskDetail = useSetRecoilState(taskDetailAtom)
	const setTaskInit = useSetRecoilState(taskInitAtom)
	const [cardsType, setCardsType] = useRecoilState(cardsTypeAtom)
	const [cards, setCards] = useRecoilState(cardsAtom)
	const [hoverCard, setHoverCard] = useState(null)
	const [canMore, setCanMore] = useState(false)
	const searchKeyWord = useRecoilValue(searchKeyWordAtom)
	const [showSearch, setShowSearch] = useState(false)
	const pageRef = useRef(0)
	const timeStampRef = useRef(0)
	const setShowLogin = useSetRecoilState(showLoginAtom)
	const elRef = useRef(null)
	const [isAnimating, setIsAnimating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [suggestionCards, setSuggestionCards] = useState([])
	const [windowWidth, setWindowWidth] = useState(window.innerWidth)
	const skeletonCardWidth = 250
	const numberOfSkeletonCards = Math.min(8, Math.floor(windowWidth / skeletonCardWidth))

	useEffect(() => {
		setCards([])
		setLoading(true)
		pageRef.current = 0
		timeStampRef.current = 0
		setIsAnimating(true)

		const fetchData = async () => {
			if (cardsType === cardsTypeConst.Search) {
				setShowSearch(true)
				const data = await search({ keyword: searchKeyWord, page_num: pageRef.current })
				setCards(data.data)
				setLoading(false)
			} else {
				const data = await getCards({ type: cardsType, page_num: pageRef.current })
				setCards(data.data)
				if (data.data.length === 0) {
					const suggestionData = await getCards({
						type: 'Recent',
						page_num: 0,
					})
					setSuggestionCards(suggestionData.data.slice(0, numberOfSkeletonCards))
					console.log(suggestionData)
				}
				setLoading(false)
			}
			setIsAnimating(false)
		}

		fetchData()
	}, [cardsType, searchKeyWord])

	useEffect(() => {
		const handleResize = () => {
			setWindowWidth(window.innerWidth)
		}

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	useEffect(() => {
		if (cards.length >= 24) {
			setCanMore(true)
		} else {
			setCanMore(false)
		}
	}, [cards])

	const handleClickCard = (task_uuid) => async (ev) => {
		// console.log(task_uuid)
		if (!logInfo) {
            setShowLogin(true)
            return
		}
		try {
			const rep = await getTaskDetail(task_uuid)
			// console.log(rep.data)
			setTaskDetail(rep.data)
			setTaskInit(false)
			navi(`/result/detail/${task_uuid}`)
		} catch (e) {
			console.log(e)
		}
	}

	const handleCloseSearch = (ev) => {
		ev.stopPropagation()
		setShowSearch(false)
		setCardsType(cardsTypeConst.Recent)
	}

	const loadMore = async (ev) => {
		if (Date.now() - timeStampRef.current >= 1000) {
			timeStampRef.current = Date.now()

			let rep
			if (cardsType === cardsTypeConst.Search) {
				rep = await search({ keyword: searchKeyWord, page_num: pageRef.current + 1 })
			} else {
				rep = await getCards({ type: cardsType, page_num: pageRef.current + 1 })
			}
			pageRef.current += 1

			setCards([...cards, ...rep.data])
		}
	}

	const handleLikeClick = async (event, task_uuid) => {
		if (!logInfo) setShowLogin(true)
		console.log('uuid' + task_uuid)

		try {
			const res = await likeCard(task_uuid)
			if (res.data.message === 'SUCCESS_LIKE' || res.data.message === 'SUCCESS_DELIKE') {
				setCards((prevCards) => {
					return prevCards.map((card) => {
						if (card.task_uuid === task_uuid) {
							return {
								...card,
								is_like: res.data.message === 'SUCCESS_LIKE',
							}
						}
						return card
					})
				})
			} else {
				throw new Error(res.data.message)
			}
		} catch (error) {
			console.error('Error in handleLikeClick:', error.message)
		}
	}

	return (
		<div className={style.con}>
			<div className={style.menuCon}>
				{showSearch ? (
					<div
						onPointerDown={(ev) => setCardsType(cardsTypeConst.Search)}
						className={`${style.menu} ${
							cardsType === cardsTypeConst.Search ? style.selected : ''
						}`}>
						{cardsTypeConst.Search}
						<div className={style.close} onPointerDown={handleCloseSearch}>
							×
						</div>
					</div>
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
				{loading &&
					Array.from({ length: numberOfSkeletonCards }).map((_, index) => (
						<div key={index} className={style.skeleton}></div>
					))}

				{cards.length === 0 && !loading && (
					<div className={style.emptyContainer}>
						<div className={style.emptyList}>
							We currently do not have any results in this tab, however, we would like
							to offer some suggestions for you.
						</div>
					</div>
				)}

				{cards.length > 0
					? cards.map((card) => (
							<div
								className={`${style.card}`}
								key={card.task_uuid}
								style={{ opacity: isAnimating ? 0 : 1 }}
								//onPointerDown={handleClickCard(card.task_uuid)}
								onMouseEnter={() => setHoverCard(card.task_uuid)}
								onMouseLeave={(ev) => setHoverCard(false)}>
								{/* <div></div> */}
								<div
									className={style.coverImg}
									onPointerDown={handleClickCard(card.task_uuid)}>
									{hoverCard === card.task_uuid ? (
										<img alt='cover' src={card.video_url} />
									) : (
										<img alt='cover' src={card.image_url} />
									)}
								</div>

								<div
									className={`${style.likeCon} ${card.is_like ? style.like : ''}`}
									onClick={(event) => handleLikeClick(event, card.task_uuid)}>
									❤
								</div>

								{hoverCard === card.task_uuid ? null : (
									<div className={style.infoCon}>
										<div className={style.avatar}>
											<img alt='avatar' src={card.author.avatar_url} />
										</div>
										<div>{card.author.username}</div>
										<div className={style.spaceholder}></div>
										<div>{card.num_like} likes</div>
									</div>
								)}
								<div
									className={`${style.prompt} ${
										hoverCard === card.task_uuid ? style.show : ''
									}`}>
									{card.prompt}
								</div>
							</div>
					  ))
					: suggestionCards.map((card) => (
							<div
								className={`${style.card}`}
								key={card.task_uuid}
								style={{ opacity: isAnimating ? 0 : 1 }}
								onMouseEnter={() => setHoverCard(card.task_uuid)}
								onMouseLeave={(ev) => setHoverCard(false)}>
								<div
									className={style.coverImg}
									onPointerDown={handleClickCard(card.task_uuid)}>
									{hoverCard === card.task_uuid ? (
										<img alt='cover' src={card.video_url} />
									) : (
										<img alt='cover' src={card.image_url} />
									)}
								</div>

								<div
									className={`${style.likeCon} ${card.is_like ? style.like : ''}`}
									onClick={(event) => handleLikeClick(event, card.task_uuid)}>
									❤
								</div>

								{hoverCard === card.task_uuid ? null : (
									<div className={style.infoCon}>
										<div className={style.avatar}>
											<img alt='avatar' src={card.author.avatar_url} />
										</div>
										<div>{card.author.username}</div>
										<div className={style.spaceholder}></div>
										<div>{card.num_like} likes</div>
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

				{cards.length !== 0 && canMore && cardsType !== cardsTypeConst.Search ? (
					<div className={style.more} onPointerDown={loadMore}>
						More
					</div>
				) : (
					cards.length !== 0 && <div className={style.more}>That's all</div>
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

export { Gallery, cardsAtom, cardsTypeAtom, cardsTypeConst, searchKeyWordAtom }
