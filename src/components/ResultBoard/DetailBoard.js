import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import style from './result.module.css'
import {
	generateProgressAtom,
	meshProfileAtom,
	promptAtom,
	stopChatAtom,
	taskDetailAtom,
	taskInitAtom,
	taskCandidateAtom,
	generateStageAtom
} from './store'
import { getTaskDownload, selectCandidate } from '../../net'
import { global_render_target_injector, startUp } from '../../render/rendering'
import { logInfoAtom } from '../Header'
import { exportToImage } from "./utils";

// import { async } from 'q'

function DetailBoard() {
	const setStopChat = useSetRecoilState(stopChatAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const prompt = useRecoilValue(promptAtom)
	const [meshProfile, setMeshProfile] = useRecoilState(meshProfileAtom)
	const logInfo = useRecoilValue(logInfoAtom)
	const [showProgress, setShowProgress] = useState(false)
	const [taskCandidates, setTaskCandidates] = useRecoilState(taskCandidateAtom)
	const [generateStage, setGenerateStage] = useRecoilState(generateStageAtom)
	const [generateProgress, setGenerateProgress] = useRecoilState(generateProgressAtom)
	// const [stage, setStage] = useState('')
	// const [percent, setPercent] = useState(0)

	// const
	useEffect(() => {
		// setStopChat(true)

		return () => {
			setStopChat(false)
			setMeshProfile(false)
		}
		// eslint-disable-next-line
	}, [])

	useEffect(() => {
		if (!taskDetail) {
			setShowProgress(true)
        }
        // else {
		// 	setTimeout(() => {
		// 		console.log('set false')
		// 		setShowProgress(false)
		// 	}, 1000) //TODO when download finished, then set false
		// }
	}, [taskDetail])

	useEffect(() => {
		if (!meshProfile) {
			if (document.getElementById('webglcontainer')) {
				if (document.getElementById('webglcontainer').getElementsByTagName('canvas').length > 0) {
					document.getElementById('webglcontainer').getElementsByTagName('canvas')[0].remove()
				}
			}
			return
		}

		// console.log(meshProfile)
		const urlPromise = {
			model: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'model',
				token: logInfo.token,
			}),
			diffuse: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_diffuse',
				token: logInfo.token,
			}),
			normal: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_normal',
				token: logInfo.token,
			}),
			spectular: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_specular',
				token: logInfo.token,
			}),
		}
		;(async (urlP) => ({
			model: await urlP['model'],
			diffuse: await urlP['diffuse'],
			normal: await urlP['normal'],
			roughness_ao_thickness: await urlP['spectular'],
			roughness_detail: '/assets/juanfu/roughness-detail.jpg',
			env_irradiance: '/assets/env/lapa_4k_panorama_irradiance.hdr',
			env_specular: '/assets/env/lapa_4k_panorama_specular.hdr',
		}))(urlPromise).then((urls) => {
			// console.log(urls)
            setShowProgress(false)
			startUp(urls)
			global_render_target_injector.enabled = false
		})
	}, [meshProfile])

	const handleSelectCandidate = async (candidateIndex) => {
		// return null
		await selectCandidate(taskInit.task_uuid, candidateIndex)
		setTaskCandidates([])

		// navi('/result/detail')
		setGenerateStage('detail')
	}	

	const modelRef = useRef(null);
	const promptRef = useRef(null);
  
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
				{
					taskCandidates.length ?
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
								<div style={{ height: '4rem', marginBottom: '1rem' }}></div>
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
					</> : null
				}		
				<div className={style.modelView} id="webglcontainer" ref={modelRef}></div>
				<div style={{ position: 'absolute', zIndex: -100}} className={style.loadingCon}>
					<div id='info'></div>
					<div id='preloader' className='preloader'>
						<div id='preloaderBar' className='vAligned'>
							Loading...
							<div className='preloaderBorder'>
								<div
									id='preloaderProgress'
									className='preloaderProgress'
									style={{ width: '85%' }}></div>
							</div>
						</div>
					</div>
				</div>
				<div className={style.modelInfoCon}>
					{showProgress ? (
						generateProgress.stage ?
						<div className={style.progressCon}>
							<div className={style.progressInfo}>{generateProgress.stage + "..."}</div>
							<div className={style.progressTrack}>
								<div
									className={style.progressThumb}
									style={{ width: `${generateProgress.percent}%` }}></div>
							</div>
						</div> : <div className={style.icon}>
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
					) : null}
				</div>				
			</div>
		</div>
	)
}

export { DetailBoard }
