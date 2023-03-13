import { useState } from 'react'
import style from './gallery.module.css'

const cardsTypeConst = {
	Latest: 'Latest',
	Featured: 'Featured',
	Mine: 'Mine',
}
function Gallery() {
	const [cardsType, setCardsType] = useState(cardsTypeConst.Latest)

	return (
		<div className={style.con}>
			<div>
				<div>{cardsTypeConst.Latest}</div>
				<div>{cardsTypeConst.Featured}</div>
				<div>{cardsTypeConst.Mine}</div>
			</div>
			{cardsType === cardsTypeConst.Latest ? <div>cardsType</div> : null}
			{cardsType === cardsTypeConst.Featured ? <div>cardsType</div> : null}
			{cardsType === cardsTypeConst.Mine ? <div>cardsType</div> : null}
		</div>
	)
}

export { Gallery }
