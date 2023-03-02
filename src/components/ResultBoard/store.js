import { atom } from 'recoil'

const taskInitAtom = atom({
	key: 'taskInitAtom',
	default: false,
})

const taskDetailAtom = atom({
	key: 'taskDetailAtom',
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

const showDetailAtom = atom({
	key: 'showDetailAtom',
	default: false,
})
export { taskInitAtom, taskDetailAtom, chatHistoryAtom, chatGuessAtom, promptAtom, showDetailAtom }
