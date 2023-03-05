import { atom } from "recoil";

const taskInitAtom = atom({
  key: "taskInitAtom",
  default: false,
});

const taskDetailAtom = atom({
  key: "taskDetailAtom",
  default: false,
});

const meshProfileAtom = atom({
  key: "meshProfileAtom",
  default: false,
});

const chatHistoryAtom = atom({
  key: "chatHistoryAtom",
  default: {},
});

const chatGuessAtom = atom({
  key: "chatGuessAtom",
  default: [],
});

const promptAtom = atom({
  key: "promptAtom",
  default: "",
});

const showDetailAtom = atom({
  key: "showDetailAtom",
  default: false,
});

const assistantChatStatusAtom = atom({
  key: "assistantChatStatusAtom",
  default: "",
});
const guessChatStatusAtom = atom({
  key: "guessChatStatusAtom",
  default: "",
});

const isFinishedChatAtom = atom({
  key: "isFinishedChatAtom",
  default: false,
});

const chatTextAtom = atom({
  key: "chatTextAtom",
  default: "",
});

const chatLangAtom = atom({
  key: "chatLangAtom",
  default: "Chinese",
});

export {
  taskInitAtom,
  taskDetailAtom,
  chatHistoryAtom,
  chatGuessAtom,
  promptAtom,
  showDetailAtom,
  meshProfileAtom,
  assistantChatStatusAtom,
  guessChatStatusAtom,
  isFinishedChatAtom,
  chatTextAtom,
  chatLangAtom,
};
