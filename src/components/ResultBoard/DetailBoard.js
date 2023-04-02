import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import style from "./result.module.css";
import {
  generateProgressAtom,
  meshProfileAtom,
  promptAtom,
  stopChatAtom,
  taskDetailAtom,
  taskInitAtom,
  taskCandidateAtom,
  generateStageAtom,
  modelSelectedAtom,
  modelHideAtom,
} from "./store";
import { getTaskDownload, selectCandidate } from "../../net";
import {
  global_render_target_injector,
  build_project,
  load_profile,
} from "../../render/sssss_rendering";
import { logInfoAtom } from "../Header";
import { exportToImage } from "./utils";

// import { async } from 'q'

function DetailBoard() {
  const setStopChat = useSetRecoilState(stopChatAtom);
  const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom);
  const taskInit = useRecoilValue(taskInitAtom);
  const prompt = useRecoilValue(promptAtom);
  const [meshProfile, setMeshProfile] = useRecoilState(meshProfileAtom);
  const logInfo = useRecoilValue(logInfoAtom);
  const [showProgress, setShowProgress] = useState(false);
  const [taskCandidates, setTaskCandidates] = useRecoilState(taskCandidateAtom);
  const [generateStage, setGenerateStage] = useRecoilState(generateStageAtom);
  const [generateProgress, setGenerateProgress] =
    useRecoilState(generateProgressAtom);
  // const [stage, setStage] = useState('')
  // const [percent, setPercent] = useState(0)
  const [modelSelected, setModelSelected] = useRecoilState(modelSelectedAtom);
  const [enteredMeshProfile, setEnteredMeshProfile] = useState(false);
  const [modelHide, setModelHide] = useRecoilState(modelHideAtom);

  const modelRef = useRef(null);
  const promptRef = useRef(null);

  // const
  useEffect(() => {
    // setStopChat(true)

    return () => {
      setStopChat(false);
      setMeshProfile(false);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!taskDetail) {
      setShowProgress(true);
    }
    // else {
    // 	setTimeout(() => {
    // 		console.log('set false')
    // 		setShowProgress(false)
    // 	}, 1000) //TODO when download finished, then set false
    // }
  }, [taskDetail]);

  useEffect(() => {
    const handleMouseDown = () => {
      window.isDraggingModel = true;
    };

    const handleMouseUp = () => {
      window.isDraggingModel = false;
    };

    const modelElement = modelRef.current;
    if (modelElement) {
      modelElement.addEventListener("mousedown", handleMouseDown);
      modelElement.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      if (modelElement) {
        modelElement.removeEventListener("mousedown", handleMouseDown);
        modelElement.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [modelRef]);

  useEffect(() => {
    const updateBodyClass = () => {
      if (window.isDraggingModel) {
        setModelSelected(true);
      } else {
        setModelSelected(false);
      }
    };

    window.addEventListener("mousedown", updateBodyClass);
    window.addEventListener("mouseup", updateBodyClass);

    return () => {
      window.removeEventListener("mousedown", updateBodyClass);
      window.removeEventListener("mouseup", updateBodyClass);
    };
  }, []);

  useEffect(() => {
    console.log(
      "Triggered meshProfile",
      window.last_uuidtime,
      meshProfile.task_uuid + meshProfile.time,
      meshProfile
    );

    if (
      window.static_project &&
      window.last_uuidtime === meshProfile.task_uuid + meshProfile.time
    ) {
      console.log("same profile");
      window.static_project.show_scene();
      if (modelHide) {
        console.log(modelHide);
        return;
      }
      document
        .querySelector("#webglcontainer")
        .replaceWith(window.static_project.content.container);
      return;
    }
    if (window.static_project) {
      console.log("hide scene");
      window.static_project.hide_scene();
      setModelHide(true);
    }
    if (!meshProfile) {
      console.log("no profile");
      return;
    }
    setModelHide(false);
    console.log("Enter meshProfile");
    if (window.static_project) {
      document
        .querySelector("#webglcontainer")
        .replaceWith(window.static_project.content.container);
    }
    setEnteredMeshProfile(true);

    const urlPromise = {
      model: getTaskDownload({
        type: "PreviewPack",
        task_uuid: meshProfile.task_uuid,
        name: "model",
      }),
      diffuse: getTaskDownload({
        type: "PreviewPack",
        task_uuid: meshProfile.task_uuid,
        name: "texture_diffuse",
      }),
      normal: getTaskDownload({
        type: "PreviewPack",
        task_uuid: meshProfile.task_uuid,
        name: "texture_normal",
      }),
      spectular: getTaskDownload({
        type: "PreviewPack",
        task_uuid: meshProfile.task_uuid,
        name: "texture_specular",
      }),
    };
    (async (urlP) => ({
      model: await urlP["model"],
      diffuse: await urlP["diffuse"],
      normal: await urlP["normal"],
      roughness: await urlP["spectular"],
    }))(urlPromise).then((urls) => {
      setTimeout(() => {
        setShowProgress(false);
        setGenerateProgress(false);
        global_render_target_injector.enabled = false;
  
        console.log("load_profile", urls);
        load_profile(urls, () => {
          console.log("load_profile done");
          window.last_uuidtime = meshProfile.task_uuid + meshProfile.time;
          if (window.static_project) window.static_project.show_scene();
        });
      }, 1000)
    });
  }, [meshProfile]);

  //阻止MacOS使用触摸板缩放
  // useEffect(() => {
  // 	const container = modelRef.current
  // 	const onWheel = (event) => {
  // 		event.preventDefault()
  // 		const deltaY = event.deltaY
  // 		const rect = container.getBoundingClientRect()
  // 		const scale = 1 - deltaY * 0.001
  // 		const dx = (event.clientX - rect.left) * (1 - scale)
  // 		const dy = (event.clientY - rect.top) * (1 - scale)
  // 		container.style.transformOrigin = `${dx}px ${dy}px 0px`
  // 		container.style.transform = `scale3d(${scale}, ${scale}, ${scale})`
  // 	}
  // 	container.addEventListener('wheel', onWheel, { passive: false })
  // 	return () => container.removeEventListener('wheel', onWheel)
  // }, [])

  const handleSelectCandidate = async (candidateIndex) => {
    // return null
    await selectCandidate(taskInit.task_uuid, candidateIndex);
    setTaskCandidates([]);

    // navi('/result/detail')
    setGenerateStage("detail");
  };

  window.exportModelView = async () => {
    await exportToImage(modelRef.current, "model");
  };

  window.exportPrompt = async () => {
    await exportToImage(promptRef.current, "prompt");
  };

  return (
    <div className={style.colDetail}>
      <div className={style.colContent}>
        {/* <div className={style.creatorCon}>
					<div>
						Model
					</div>
				</div> */}
        {taskCandidates.length ? (
          <>
            <div className={style.candidateCon}>
              <div className={style.candidateCol}>
                {taskCandidates.map((item, index) =>
                  index >= 0 && index < 3 ? (
                    <img
                      key={index}
                      src={`data:image/png;base64,${item}`}
                      alt={item}
                      onClick={() => handleSelectCandidate(index)}
                    />
                  ) : null
                )}
              </div>
              <div className={style.candidateCol}>
                <div style={{ height: "0rem", marginBottom: "1rem" }}></div>
                {taskCandidates.map((item, index) =>
                  index >= 3 && index < 6 ? (
                    <img
                      key={index}
                      src={`data:image/png;base64,${item}`}
                      alt={item}
                      onClick={() => handleSelectCandidate(index)}
                    />
                  ) : null
                )}
              </div>
              <div className={style.candidateCol}>
                {taskCandidates.map((item, index) =>
                  index >= 6 && index < 9 ? (
                    <img
                      key={index}
                      src={`data:image/png;base64,${item}`}
                      alt={item}
                      onClick={() => handleSelectCandidate(index)}
                    />
                  ) : null
                )}
              </div>
            </div>
          </>
        ) : null}
        <div
          className={`${style.modelView} ${modelHide ? style.hideModel : ""}`}
          id="webglcontainer"
          ref={modelRef}
        ></div>
        <div
          style={{ position: "absolute", zIndex: -100 }}
          className={style.loadingCon}
        >
          <div id="info"></div>
          <div id="preloader" className="preloader">
            <div id="preloaderBar" className="vAligned">
              Loading...
              <div className="preloaderBorder">
                <div
                  id="preloaderProgress"
                  className="preloaderProgress"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className={style.modelInfoCon}>
          {showProgress ? (
            generateProgress.stage ? (
              !taskCandidates.length ? (
                <div className={style.progressCon}>
                  <div className={style.progressInfo}>
                    {generateProgress.stage + "..."}
                  </div>
                  <div className={style.progressTrack}>
                    <div
                      className={style.progressThumb}
                      style={{ width: `${generateProgress.percent}%` }}
                    ></div>
                  </div>
                </div>
              ) : null
            ) : modelHide ? (
              <div className={style.icon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-image"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { DetailBoard };
