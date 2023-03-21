import { atom } from 'recoil'

const cardsTypeConst = {
	Recent: 'Recent',
	Featured: 'Featured',
	Mine: 'Mine',
	Search: 'Search  ',
}

const cardsAtom = atom({
	default: [],
	key: 'cardsAtom',
})

const cardsTypeAtom = atom({
	default: cardsTypeConst.Recent,
	key: 'cardsTypeAtom',
})

const searchKeyWordAtom = atom({
	default: '',
	key: 'searchKeyWordAtom',
})
export { cardsAtom, cardsTypeAtom, cardsTypeConst, searchKeyWordAtom }
