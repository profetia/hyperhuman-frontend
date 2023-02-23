import { atom } from 'recoil'

const logInfoAtom = atom({
	key: 'logInfoAtom',
	default: false,
})

const showLoginAtom = atom({
	key: 'showLoginAtom',
	default: false,
})

const showUserAtom = atom({
	key: 'showUserAtom',
	default: false,
})

export { logInfoAtom, showLoginAtom, showUserAtom }
