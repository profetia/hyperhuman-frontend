import { useEffect, useState } from 'react'
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

	useEffect(() => {
		getCards({ type: cardsType, page_num: 0 }).then((data) => {
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

	return (
		<div className={style.con}>
			<div className={style.menuCon}>
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

			<div className={style.cardsCon}>
				{cards.map((card) => (
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
