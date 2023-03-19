import { atom } from 'recoil'

const taskInitAtom = atom({
	key: 'taskInitAtom',
	default: false,
})

const taskDetailAtom = atom({
	key: 'taskDetailAtom',
	default: false,
})

const meshProfileAtom = atom({
	key: 'meshProfileAtom',
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

const stopChatAtom = atom({
	key: 'stopChatAtom',
	default: false,
})

const assistantChatStatusAtom = atom({
	key: 'assistantChatStatusAtom',
	default: '',
})
const guessChatStatusAtom = atom({
	key: 'guessChatStatusAtom',
	default: '',
})

const chatTextAtom = atom({
	key: 'chatTextAtom',
	default: '',
})

const chatLangAtom = atom({
	key: 'chatLangAtom',
	default: 'Chinese',
})

const generateProgressAtom = atom({
	key: 'generateProgressAtom',
	default: {},
})


const needStartWsAtom = atom({
	key: 'needStartWsAtom',
	default: false,
})

const chatDialogStartAtom = atom({
	key: 'chatDialogStartAtom',
	default: false,
})

const generateStageAtom = atom({
	key: 'generateStageAtom',
	default: 'generate',
})

const taskCandidateAtom = atom({
	key: 'taskCandidateAtom',
	default: [],
})

export {
	taskInitAtom,
	taskDetailAtom,
	chatHistoryAtom,
	chatGuessAtom,
	promptAtom,
	stopChatAtom,
	meshProfileAtom,
	assistantChatStatusAtom,
	guessChatStatusAtom,
	chatTextAtom,
	chatLangAtom,
	generateProgressAtom,
	needStartWsAtom,
	chatDialogStartAtom,
	generateStageAtom,
	taskCandidateAtom
}
