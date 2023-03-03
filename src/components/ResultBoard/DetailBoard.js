import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import style from './result.module.css'
import { meshProfileAtom, promptAtom, showDetailAtom, taskDetailAtom, taskInitAtom } from './store'
import { getGenerateProgress, getTaskDetail, getTaskDownload } from '../../net'
import { global_render_target_injector, startUp } from '../../render/rendering'
// import { async } from 'q'

function DetailBoard() {
	const setShowDetail = useSetRecoilState(showDetailAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const prompt = useRecoilValue(promptAtom)
	const [meshProfile, setMeshProfile] = useRecoilState(meshProfileAtom)
	const inteRef = useRef(null)
	const [stage, setStage] = useState('')
	const [percent, setPercent] = useState(0)

	// const
	useEffect(() => {
		setShowDetail(true)

		return () => {
			setShowDetail(false)
			setMeshProfile(false)
		}
		// eslint-disable-next-line
	}, [])

	useEffect(() => {
		if (!meshProfile) return

		// console.log(meshProfile)
		const urlPromise = {
			model: getTaskDownload(meshProfile['preview_resource']['model']),
			diffuse: getTaskDownload(meshProfile['preview_resource']['texture_diff']),
			normal: getTaskDownload(meshProfile['preview_resource']['texture_norm']),
			spectular: getTaskDownload(meshProfile['preview_resource']['texture_specd']),
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
			startUp(urls)
			global_render_target_injector.enabled = false
		})
	}, [meshProfile])

	useEffect(() => {
		// console.log(taskDetail)
		if (taskDetail) return

		if (inteRef.current) clearInterval(inteRef.current)

		inteRef.current = setInterval(async () => {
			const { data } = await getGenerateProgress(taskInit.task_uuid)
			setStage(data.stage)

			switch (data.stage) {
				case 'Created':
					setPercent(5)
					break
				case 'ModelStage':
					setPercent(10)
					break
				case 'AppearanceStage':
					setPercent(20)
					break
				case 'DetailStage':
					setPercent(30)
					break
				case 'UpscaleStage':
					setPercent(40)
					break
				case 'ExportStage':
					setPercent(50)
					break
				case 'Done':
					setPercent(100)
					clearInterval(inteRef.current)
					const taskDetail = await getTaskDetail(taskInit.task_uuid)
					setTaskDetail(taskDetail.data)
					break
				default:
					// console.log(data)
					// setPercent(0)
			}
		}, 1000)
		// eslint-disable-next-line
	}, [taskDetail])
	return (
		<div className={style.col}>
			<div className={style.creatorCon}>
				<div className={style.avatar}>
					{taskDetail ? <img alt='avatar' src={taskDetail?.author?.avatar} /> : null}
				</div>

				<div className={style.creatorInfoCon}>
					<div className={style.creatorName}>{taskDetail?.author?.username}</div>
					<div className={style.creatorInfo}>{taskDetail?.author?.username}</div>
				</div>
			</div>
			<div className={style.modelView} id='webglcontainer'></div>
			<div style={{ position: 'absolute', zIndex: -100 }}>
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
				{taskDetail ? null : (
					<>
						<div className={style.progressInfo}>{stage}</div>
						<div className={style.progressTrack}>
							<div
								className={style.progressThumb}
								style={{ width: `${percent}%` }}></div>
						</div>
					</>
				)}

				<div className={style.modelPrompt}>{prompt}</div>
			</div>
		</div>
	)
}

export { DetailBoard }
