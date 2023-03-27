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

	const [showDownload, setShowDownload] = useState(false)
	const [downloadStage, setDownloadStage] = useState(0)
	const [downloadOpt0, setDownloadOpt0] = useState(0)
	const [downloadOpt1, setDownloadOpt1] = useState([])
	const [downloadOpt2, setDownloadOpt2] = useState(0)
	const [isPaid, setIsPaid] = useState(false)
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

	const handleDownloadBack = (ev) => {
		if (downloadStage === 1) setDownloadStage(0)
		else if (downloadStage === 2 && downloadOpt0 === 0) {
			setDownloadStage(1)
		} else if (downloadStage === 2 && downloadOpt0 === 1) {
			setDownloadStage(0)
		}
	}

	const handleDownloadAndPay = async (ev) => {
		//TODO
		setIsPaid(true)
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
		if (window.last_uuidtime === meshProfile.task_uuid + meshProfile.time) return

		if (window.static_project) window.static_project.hide_scene()

		console.log('xxxxx')
		console.log('ss' + meshProfile)
		console.log(meshProfile)
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

			load_profile(urls, () => {
				console.log('loaded profile')
				window.last_uuidtime = meshProfile.task_uuid + meshProfile.time
				if (window.static_project) window.static_project.show_scene()
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
						<div
							className={`${style.titleBtn} ${showDownload ? style.download : ''}`}
							onPointerDown={(ev) => setShowDownload(!showDownload)}>
							D
						</div>
						<div
							className={`${style.titleBtn} ${isLike ? style.like : ''}`}
							onPointerDown={handleLike}>
							❤
						</div>
						{showDownload ? (
							<div className={style.downloadCon}>
								{!isPaid ? (
									<div className={style.downloadTitle}>
										<div>Export Options</div>
										{downloadStage !== 0 ? (
											<div onPointerDown={handleDownloadBack}>{'< '}Back</div>
										) : null}
									</div>
								) : null}
								{!isPaid && downloadStage === 0 ? (
									<>
										<div
											className={`${style.row} ${
												downloadOpt0 === 0 ? style.selected : ''
											}`}
											onPointerDown={(ev) => setDownloadOpt0(0)}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>USC-ICT</div>
											<div className={`${style.corner} ${style.sec}`}>
												More options
											</div>
										</div>
										<div
											className={`${style.row} ${
												downloadOpt0 === 1 ? style.selected : ''
											}`}
											onPointerDown={(ev) => setDownloadOpt0(1)}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>MetaHuman</div>
											<div className={style.corner}>Default 2K</div>
										</div>
										<div
											className={style.downloadBtn}
											onPointerDown={(ev) =>
												downloadOpt0 === 0
													? setDownloadStage(1)
													: setDownloadStage(2)
											}>
											NEXT
										</div>
									</>
								) : null}
								{!isPaid && downloadStage === 1 ? (
									<>
										<div className={`${style.row} ${style.disabled}`}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>Add A Body</div>
										</div>
										<div className={`${style.row} ${style.disabled}`}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>
												Add A Facial Component
											</div>
										</div>
										<div className={`${style.row} ${style.disabled}`}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>Add A Standard BS</div>
										</div>
										<div
											className={`${style.row} ${
												downloadOpt1.includes(3) ? style.selected : ''
											}`}
											onPointerDown={(ev) =>
												downloadOpt1.includes(3)
													? setDownloadOpt1(
															downloadOpt1.filter((cur) => cur !== 3)
													  )
													: setDownloadOpt1([...downloadOpt1, 3])
											}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>
												Need A Second Quadrant
											</div>
										</div>
										<div
											className={style.downloadBtn}
											onPointerDown={(ev) => setDownloadStage(2)}>
											NEXT
										</div>
									</>
								) : null}
								{!isPaid && downloadStage === 2 ? (
									<>
										<div
											className={`${style.row} ${
												downloadOpt2 === 0 ? style.selected : ''
											}`}
											onPointerDown={(ev) => setDownloadOpt2(0)}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>2 K</div>
										</div>
										<div
											className={`${style.row} ${
												downloadOpt2 === 1 ? style.selected : ''
											}`}
											onPointerDown={(ev) => setDownloadOpt2(1)}>
											<div className={style.priceCon}>
												<div className={style.icon}>$</div>
												<div className={style.price}>15</div>
											</div>
											<div className={style.option}>4 K</div>
										</div>
										<div
											className={style.downloadBtn}
											onPointerDown={handleDownloadAndPay}>
											PAY
										</div>
									</>
								) : null}
								{isPaid ? (
									<div className={style.paidCon}>
										<div className={style.paidIcon}>√</div>
										<div className={style.paidTitle}>Payment Successful!</div>
										<div className={style.paidSubtitle}>
											View in the list of mine
										</div>
										<div className={style.paidProgress}>
											Estimated waiting time is 20 minutes...
										</div>
									</div>
								) : null}
							</div>
						) : null}
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
