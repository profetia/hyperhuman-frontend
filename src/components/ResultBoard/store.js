import { atom } from 'recoil'

const taskInitAtom = atom({
	key: 'taskInitAtom',
	default: null,
})

const chatHistoryAtom = atom({
	key: 'chatHistoryAtom',
	default: [],
})

const promptAtom = atom({
	key: 'promptAtom',
	default: [],
})
export { taskInitAtom, chatHistoryAtom, promptAtom }
