import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  getGenerateProgress,
  getTaskDetail,
  generateDetail,
  selectCandidate,
  login,
  initNet,
} from "../../net";
import style from "./result.module.css";
import {
  chatGuessAtom,
  generateProgressAtom,
  promptAtom,
  stopChatAtom,
  taskDetailAtom,
  taskInitAtom,
  generateStageAtom,
  chatDialogStartAtom,
  taskCandidateAtom,
  meshProfileAtom,
  modelHideAtom,
} from "./store";
import { startChat } from "../../net";
import { logInfoAtom } from "../Header";

function LoginBoard() {
  const [prompt, setPrompt] = useRecoilState(promptAtom);
  const taskInit = useRecoilValue(taskInitAtom);
  const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom);
  const setChatGuess = useSetRecoilState(chatGuessAtom);
  const navi = useNavigate();
  const intervalRef = useRef(null);
  const [taskCandidates, setTaskCandidates] = useRecoilState(taskCandidateAtom);
  const [generateProgress, setGenerateProgress] =
    useRecoilState(generateProgressAtom);
  const [stopChat, setStopChat] = useRecoilState(stopChatAtom);
  const [generateStage, setGenerateStage] = useRecoilState(generateStageAtom);
  const setChatDialogStart = useSetRecoilState(chatDialogStartAtom);
  const setTaskInit = useSetRecoilState(taskInitAtom);
  const setMeshProfile = useSetRecoilState(meshProfileAtom);
  const [logInfo, setLogInfo] = useRecoilState(logInfoAtom);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isEmailError, setIsEmailError] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);

  const [modelHide, setModelHide] = useRecoilState(modelHideAtom);

  // useEffect(() => () => clearInterval(intervalRef.current), [])

  useEffect(() => {
    // console.log(prompt)
    if (!taskInit) {
      // setChatDialogStart(false)
      // navi('/', { replace: true })
    } else {
      // setChatGuess([])
      setStopChat(true);
      // navi('/result/detail')
      // setGenerateStage('detail')
      generateDetail({ task_uuid: taskInit.task_uuid, prompt });
    }
    // eslint-disable-next-line
  }, [taskInit]);

  useEffect(() => {
    // console.log(taskDetail)
    if (taskDetail || !stopChat) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    clearInterval(intervalRef.current); //TODO 退出再重进请求2x
    intervalRef.current = setInterval(async () => {
      const { data } = await getGenerateProgress(taskInit.task_uuid);
      if (data.candidates) setTaskCandidates(data.candidates);

      if (data.stage === "Done") {
        setGenerateProgress({
          stage: "Downloading",
          percent: 100,
          payload: data,
        });
        setTaskCandidates([]);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        const response = await getTaskDetail(taskInit.task_uuid);
        // console.log(taskDetail)
        setTaskDetail(response.data);
      } else {
        setGenerateProgress({
          stage: data.stage,
          percent: data.percentage || 0,
          payload: data,
        });
      }
    }, 1000);
    // eslint-disable-next-line
  }, [taskDetail, stopChat]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setIsEmailError(false);
    setIsPasswordError(false);
    if (!email) {
      setIsEmailError(true);
      return;
    }
    if (!password) {
      setIsPasswordError(true);
      return;
    }

    const response = await login({
      email,
      password,
    });

    if (response.data) {
      if (response.data.error) {
        setIsEmailError(true);
        setIsPasswordError(true);
      } else {
        setLogInfo(response.data);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_uuid", response.data.user_uuid);
        localStorage.setItem("avatar_url", response.data.avatar_url);
        initNet(response.data.token)
      }
    } else {
      setIsEmailError(true);
      setIsPasswordError(true);
    }
  };

  const handleClear = (ev) => {
    setIsEmailError(false);
    setIsPasswordError(false);
    setEmail("");
    setPassword("");
    if (window.static_project) {
      console.log("hide scene");
      window.static_project.hide_scene();
      setModelHide(true);
    }
  };

  const handleEmail = (ev) => {
    setEmail(ev.currentTarget.value);
  };

  const handlePassword = (ev) => {
    setPassword(ev.currentTarget.value);
  };

  return (
    <>
      <div>
        <h2>Deemos Technology - Hyperhuman Demo</h2>
        <p className={style.descriptionLogin}>
          You need to login with your deemos account to use this demo. For more
          features, please visit our main site{" "}
          <a href="https://hyperhuman.deemos.com">hyperhuman.deemos.com</a>.
        </p>
      </div>
      <form className={style.colHead} onSubmit={handleSubmit}>
        <div className={style.colInner}>
          <div className={style.emailCon}>
            <div className={style.colTitle}>Email Address</div>
            <input
              className={`${style.iptArea} ${
                isEmailError ? style.inputError : ""
              }`}
              value={email}
              placeholder={"Your email address here."}
              onChange={handleEmail}
              type="email"
            ></input>
          </div>
          <div className={style.passwordCon}>
            <div className={style.colTitle}>Password</div>
            <input
              type="password"
              className={`${style.iptArea} ${
                isPasswordError ? style.inputError : ""
              }`}
              value={password}
              placeholder={"Your password here."}
              onChange={handlePassword}
            ></input>
          </div>
        </div>
        <div className={style.btnCon}>
          <button
            className={`${style.clearBtnLogin} ${
              intervalRef.current ? style.disabled : ""
            }`}
            onPointerDown={handleClear}
            type="button"
          >
            Clear
          </button>
          <button
            type="submit"
            className={`${style.generateBtnLogin} ${
              intervalRef.current ? style.disabled : ""
            }`}
          >
            Submit
          </button>
        </div>
      </form>
    </>
  );
}

export { LoginBoard };
