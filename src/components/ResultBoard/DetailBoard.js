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
} from './store'
import { getTaskDownload, likeCard } from '../../net'
import {
	global_render_target_injector,
	build_project,
	load_profile,
} from '../../render/sssss_rendering'
// import {
// 	global_render_target_injector,
// 	build_project,
// 	load_profile,
// } from '../../render/rendering_new'
import { logInfoAtom } from '../Header'
import { exportToImage } from './utils'
import { cardsAtom } from '../Gallery'
import { useParams } from 'react-router'
// import { async } from 'q'

function DetailBoard() {
	const setStopChat = useSetRecoilState(stopChatAtom)
	const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom)
	const taskInit = useRecoilValue(taskInitAtom)
	const prompt = useRecoilValue(promptAtom)
	const [meshProfile, setMeshProfile] = useRecoilState(meshProfileAtom)
	const logInfo = useRecoilValue(logInfoAtom)
	const [showProgress, setShowProgress] = useState(false)
	const [isLike, setIsLike] = useState(false)
	const [isShared, setIsShared] = useState(false)
	const [cards, setCards] = useRecoilState(cardsAtom)

	const [generateProgress, setGenerateProgress] = useRecoilState(generateProgressAtom)
	// const [stage, setStage] = useState('')
	// const [percent, setPercent] = useState(0)

	const modelRef = useRef(null)
	const promptRef = useRef(null)

	window.exportModelView = async () => {
		await exportToImage(modelRef.current, 'model')
	}

	window.exportPrompt = async () => {
		await exportToImage(promptRef.current, 'prompt')
	}

	const handleLike = async (ev) => {
		// console.log(logInfo)
		if (!logInfo) return

		// if (taskDetail.isLike) return

		try {
			const res = await likeCard(taskDetail.task_uuid)
			if (res.data.message === 'SUCCESS_LIKE') {
				setIsLike(true)
			} else if (res.data.message === 'SUCCESS_DELIKE') {
				setIsLike(false)
			} else {
				throw new Error(res.data.message)
			}
		} catch {}
	}

	const handleShare = async (ev) => {
		try {
			await navigator.clipboard.writeText(window.location.href)
			setIsShared(true)

			setTimeout(() => {
				setIsShared(false)
			}, 3000)
		} catch (e) {
			console.log(e.message)
		}
	}
	useEffect(() => {
		setStopChat(true)

		return () => {
			// 	setStopChat(false)
			setMeshProfile(false)
		}
		// eslint-disable-next-line
	}, [])

	useEffect(() => {
		if (!taskDetail) return

		const tempCards = cards.map((card) => {
			if (card.task_uuid === taskDetail.task_uuid) {
				return { ...card, is_like: isLike }
			} else {
				return card
			}
		})

		setCards(tempCards)
	}, [isLike])

	useEffect(() => {
		if (!taskDetail) {
			setShowProgress(true)
		} else {
			setIsLike(taskDetail.is_like)
		}
	}, [taskDetail])

	//阻止MacOS使用触摸板缩放
	/*
	useEffect(() => {
		const container = modelRef.current
		const onWheel = (event) => {
			event.preventDefault()
			const deltaY = event.deltaY
			const rect = container.getBoundingClientRect()
			const scale = 1 - deltaY * 0.001
			const dx = (event.clientX - rect.left) * (1 - scale)
			const dy = (event.clientY - rect.top) * (1 - scale)
			container.style.transformOrigin = `${dx}px ${dy}px 0px`
			container.style.transform = `scale3d(${scale}, ${scale}, ${scale})`
		}
		container.addEventListener('wheel', onWheel, { passive: false })
		return () => container.removeEventListener('wheel', onWheel)
	}, [])
	*/

	useEffect(() => {
		if (!meshProfile) return

		// console.log(meshProfile)
		const urlPromise = {
			model: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'model',
			}),
			diffuse: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_diffuse',
			}),
			normal: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_normal',
			}),
			spectular: getTaskDownload({
				type: 'PreviewPack',
				task_uuid: meshProfile.task_uuid,
				name: 'texture_specular',
			}),
		}
		;(async (urlP) => ({
			model: await urlP['model'],
			diffuse: await urlP['diffuse'],
			normal: await urlP['normal'],
			roughness_ao_thickness: await urlP['spectular'],
		}))(urlPromise).then((urls) => {
			setShowProgress(false)
			global_render_target_injector.enabled = false
			// load_profile(urls)

			let same_urls =
				window.last_urls &&
				window.last_urls.model === urls.model &&
				window.last_urls.diffuse === urls.diffuse &&
				window.last_urls.normal === urls.normal &&
				window.last_urls.roughness_ao_thickness === urls.roughness_ao_thickness
			if (window.static_project) {
				if (!same_urls) window.static_project.clean_scene()
				document
					.querySelector('#webglcontainer')
					.replaceWith(window.static_project.container)
			}
			if (!same_urls)
				load_profile(urls, () => {
					window.last_urls = urls
					console.log('loaded profile')
				})
		})
	}, [meshProfile])

	return (
		<div className={style.col}>
			<div className={style.creatorCon}>
				<div className={style.avatar}>
					{taskDetail ? <img alt='avatar' src={taskDetail?.author?.avatar_url} /> : null}
				</div>

				<div className={style.creatorInfoCon}>
					<div className={style.creatorName}>{taskDetail?.author?.username}</div>
					<div className={style.creatorInfo}>{taskDetail?.author?.username}</div>
				</div>
				<div className={style.spaceholder}></div>
				{/* <div className={style.shareCon}>Share</div> */}
				{taskDetail ? (
					<>
						{isShared ? (
							<div className={`${style.titleBtn} ${style.shareCon}`}>
								<span>√</span>Copied
							</div>
						) : (
							<div
								className={`${style.titleBtn} ${style.shareCon}`}
								onPointerDown={handleShare}>
								<span>O</span>share
							</div>
						)}
						<div className={style.titleBtn}>D</div>
						<div
							className={`${style.titleBtn} ${isLike ? style.like : ''}`}
							onPointerDown={handleLike}>
							❤
						</div>
					</>
				) : null}
			</div>
			<div className={style.modelView} id='webglcontainer' ref={modelRef}></div>
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
				{showProgress ? (
					<>
						<div className={style.progressInfo}>{generateProgress.stage}</div>
						<div className={style.progressTrack}>
							<div className={style.progressAnimation}></div>
							<div
								className={style.progressThumb}
								style={{ width: `${generateProgress.percent}%` }}></div>
						</div>
					</>
				) : null}

				<div className={style.modelPrompt} ref={promptRef}>
					{prompt}
				</div>
			</div>
		</div>
	)
}

export { DetailBoard }
