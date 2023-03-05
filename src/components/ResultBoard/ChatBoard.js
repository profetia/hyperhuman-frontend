import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { closeWebsocket, restartWebsocket, startChat, wsSend } from "../../net";
import style from "./result.module.css";
import {
  assistantChatStatusAtom,
  chatGuessAtom,
  chatHistoryAtom,
  chatTextAtom,
  guessChatStatusAtom,
  isFinishedChatAtom,
  showDetailAtom,
  taskDetailAtom,
  taskInitAtom,
  chatLangAtom,
  promptAtom,
} from "./store";

function ChatBoard({ bindWSCallback }) {
  const [chatHistory, setChatHistory] = useRecoilState(chatHistoryAtom);
  const [chatGuess, setChatGuess] = useRecoilState(chatGuessAtom);
  const [_, setPrompt] = useRecoilState(promptAtom);
  const [showGuess, setShowGuess] = useState(true);
  const [taskInit, setTaskInit] = useRecoilState(taskInitAtom);
  const showDetail = useRecoilValue(showDetailAtom);
  const [chatText, setChatText] = useRecoilState(chatTextAtom);
  const taskDetail = useRecoilValue(taskDetailAtom);
  const guessChatStatus = useRecoilValue(guessChatStatusAtom);
  const [assistantChatStatus, setAssistantChatStatus] = useRecoilState(
    assistantChatStatusAtom
  );
  const isFinishedChat = useRecoilValue(isFinishedChatAtom);
  const [chatLang, setChatLang] = useRecoilState(chatLangAtom);

  const handleIpt = (ev) => {
    setChatText(ev.currentTarget.value);
  };

  const handleSend = (ev) => {
    if (!chatText || assistantChatStatus !== "[END]") return;
    wsSend({
      task_uuid: taskInit.task_uuid,
      content: chatText,
      language: chatLang,
    });

    setChatHistory({
      ...chatHistory,
      [Date.now()]: {
        chat_uuid: Date.now(),
        provider: "user",
        content: chatText,
        timeStamp: Date.now(),
      },
    });

    setChatText("");
    setShowGuess(false);
    setAssistantChatStatus(false);
  };

  const handleSelectTip = (value) => (ev) => {
    setChatText(value.substring(3));
  };

  useEffect(() => {
    // if (showDetail !== 2) return
    if (guessChatStatus === "[START]") setShowGuess(true);
  }, [guessChatStatus]);

  const handleChangeLang = async (lang) => {
    setChatLang(lang);
    await handleRestart();
  };

  const handleRestart = async (ev) => {
    closeWebsocket();
    setChatGuess([]);
    setPrompt("");
    let response = await startChat();
    let subscription = response.data.subscription;
    let task_uuid = response.data.task_uuid;

    setTaskInit({
      ...taskInit,
      task_uuid,
    });

    const ws = await restartWebsocket(subscription);
    bindWSCallback(ws);
    setChatHistory({});
    setChatText("");
    setShowGuess(true);
    setAssistantChatStatus("");
  };

  return (
    <div className={style.col}>
      <div className={style.colTitle}>
        <div>Chat</div>
        <button onClick={handleRestart}>Restart</button>
        <div>
          <button
            onClick={() => handleChangeLang("Chinese")}
            style={{
              backgroundColor: chatLang === "Chinese" ? "red" : "",
            }}
          >
            中文
          </button>
          <button
            onClick={() => handleChangeLang("English")}
            style={{
              backgroundColor: chatLang === "English" ? "red" : "",
            }}
          >
            English
          </button>
        </div>
        {taskDetail ? <div className={style.regene}>Regenerate</div> : null}
      </div>
      <div className={style.chatCon}>
        <div className={style.chatMsgCon}>
          {Object.values(chatHistory)
            .sort((a, b) => a.timeStamp - b.timeStamp)
            .map(
              (chat, idx, arr) =>
                (!isFinishedChat ||
                  chat.provider !== "assistant" ||
                  idx !== arr.length - 1) && (
                  <div
                    key={chat.chat_uuid}
                    className={`${style.chatMsgRow} ${
                      chat.provider === "user" ? style.user : ""
                    }`}
                  >
                    <div className={style.avatar}></div>
                    <div className={style.bubble}>{chat.content}</div>
                  </div>
                )
            )}
        </div>
        {!showDetail ? (
          <div className={style.chatIptCon}>
            <div className={style.chatTipsCon}>
              {chatGuess
                .filter((c) => c)
                .map(
                  (guess) =>
                    showGuess && (
                      <div
                        className={style.chatTips}
                        key={guess}
                        onPointerDown={handleSelectTip(guess)}
                      >
                        {guess.substring(3)}
                      </div>
                    )
                )}
            </div>
            <div className={style.chatRowCon}>
              <div className={style.iptLineCon}>
                <div className={style.iptSpaceholder}>{chatText || "X"}</div>
                <textarea
                  className={style.ipt}
                  onChange={handleIpt}
                  value={chatText}
                  placeholder="Describe the face"
                />
              </div>

              <div
                className={`${style.btn} ${
                  !chatText || assistantChatStatus !== "[END]"
                    ? style.disabled
                    : ""
                }`}
                onPointerDown={handleSend}
              >
                Send
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { ChatBoard };
