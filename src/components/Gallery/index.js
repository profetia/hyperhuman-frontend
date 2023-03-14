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
	const [cards, setCards] = useState([
		{
			task_uuid: 'string',
			image_url: 'string',
			video_url: 'string',
			prompt: 'string',
			num_like: 0,
			time: '2023-03-13T20:26:28.436Z',
			author: {
				user_uuid: 'string',
				username: 'string',
				avatar_url: 'string',
			},
		},
	])

	useEffect(() => {
		getCards(cardsType).then((data) => {
			console.log(data.data)
		})
	}, [cardsType])

	const handleClickCard = (task_uuid) => async (ev) => {
		console.log(task_uuid)
		// try {
		// 	const rep = await getTaskDetail(task_uuid)
		// 	setTaskDetail(rep.data)
		// 	navi('/result/detail')
		// } catch (e) {}
	}

	return (
		<div className={style.con}>
			<div className={style.menuCon}>
				<div
					onPointerDown={(ev) => setCardsType(cardsTypeConst.Recent)}
					className={`${style.menu} ${
						cardsType === cardsTypeConst.Recent ? style.selected : ''
					}`}>
					{cardsTypeConst.Recent}
				</div>
				<div
					onPointerDown={(ev) => setCardsType(cardsTypeConst.Featured)}
					className={`${style.menu} ${
						cardsType === cardsTypeConst.Featured ? style.selected : ''
					}`}>
					{cardsTypeConst.Featured}
				</div>
				{logInfo ? (
					<div
						onPointerDown={(ev) => setCardsType(cardsTypeConst.Mine)}
						className={`${style.menu} ${
							cardsType === cardsTypeConst.Mine ? style.selected : ''
						}`}>
						{cardsTypeConst.Mine}
					</div>
				) : null}
			</div>

			<div className={style.cardsCon}>
				{cards.map((card) => (
					<div
						className={`${style.card}`}
						key={card.task_uuid}
						onPointerDown={handleClickCard(card.task_uuid)}>
						{/* <div></div> */}
						<div className={style.coverImg}>
							<img alt='cover' src={card.image_url} />
						</div>
						<div className={style.prompt}>{card.prompt}</div>
						<div className={style.infoCon}>
							<div className={style.avatar}>
								<img alt='avatar' src={card.author.avatar_url} />
							</div>
							<div>{card.author.username}</div>
							<div className={style.spaceholder}></div>
							<div>{card.num_like}likes</div>
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
