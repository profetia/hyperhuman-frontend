import { atom } from 'recoil'

const taskInitAtom = atom({
	key: 'taskInitAtom',
	default: false,
})

const chatHistoryAtom = atom({
	key: 'chatHistoryAtom',
	default: {},
})

const chatGuessAtom = atom({
	key: 'chatGuessAtom',
	default: [],
})

const promptAtom = atom({
	key: 'promptAtom',
	default: '',
})
export { taskInitAtom, chatHistoryAtom, chatGuessAtom, promptAtom }
