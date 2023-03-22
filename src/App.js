import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil'
import './App.css'
import { Gallery } from './components/Gallery'
import { Header, logInfoAtom, showLoginAtom, showUserAtom } from './components/Header'
import { LoginPanel } from './components/LoginPanel'
import { taskDetailAtom } from './components/ResultBoard'
import { UserPanel } from './components/UserPanel'
import { Welcome } from './components/Welcome'
import { getTaskDetail, getUserInfo, initNet } from './net'

function App() {
	const showLogin = useRecoilValue(showLoginAtom)
	const showUser = useRecoilValue(showUserAtom)
	const [logInfo, setLogInfo] = useRecoilState(logInfoAtom)
	const [showGallery, setShowGallery] = useState(false)
	const navi = useNavigate()
	const [isFixed, setIsFixed] = useState(false)
	const urlRef = useRef('/')
	const setTaskDetail = useSetRecoilState(taskDetailAtom)

	//路由守卫
	useEffect(() => {
		if (!logInfo && localStorage.getItem('user_uuid')) {
			getUserInfo({ user_uuid: localStorage.getItem('user_uuid') })
				.then(async (data) => {
					if (data.data.error) return Promise.reject(data.data.error)

					setLogInfo({ ...data.data.meta, token: localStorage.getItem('token') })
					if (localStorage.getItem('unremember')) localStorage.clear()
					initNet(localStorage.getItem('token'))

					if (window.location.pathname.includes('/detail/')) {
						const task_uuid = window.location.pathname.split('/').pop()
						try {
							const rep = await getTaskDetail(task_uuid)
							// console.log(rep.data)
							setTaskDetail(rep.data)
							navi(`/result/detail/${task_uuid}`)
						} catch (e) {
							console.log(e)
						}
						// console.log(1);
					} else if (window.location.pathname !== '/') {
						navi('/')
					}
				})
				.catch((err) => {
					localStorage.clear()
					setLogInfo(false)
				})
				.finally(() => {
					setShowGallery(true)
				})
		} else {
			if (window.location.pathname !== '/') {
				navi('/')
			}
			setShowGallery(true)
		}
		// eslint-disable-next-line
	}, [logInfo])

	// useEffect(() => {
	// 	//页面加载完成，检查缓存，设置各种状态的初始值
	// 	//检查localstorage有没有登录凭证
	// 	if (localStorage.getItem('user_uuid')) {
	// 		getUserInfo({ user_uuid: localStorage.getItem('user_uuid') })
	// 			.then(async (data) => {
	// 				if (data.data.error) return Promise.reject(data.data.error)
	// 				setLogInfo({ ...data.data.meta, token: localStorage.getItem('token') })
	// 				initNet(localStorage.getItem('token'))

	// 				if (urlRef.current.includes('/detail/')) {
	// 					const task_uuid = urlRef.current.split('/').pop()
	// 					try {
	// 						const rep = await getTaskDetail(task_uuid)
	// 						// console.log(rep.data)
	// 						setTaskDetail(rep.data)
	// 						navi(`/result/detail/${task_uuid}`)
	// 					} catch (e) {
	// 						console.log(e)
	// 					}
	// 					// console.log(1);
	// 				}

	// 				if (localStorage.getItem('remember')) localStorage.clear()
	// 			})
	// 			.catch((err) => {
	// 				localStorage.clear()
	// 				setLogInfo(false)
	// 			})
	// 			.finally(() => {
	// 				setShowGallery(true)
	// 			})
	// 	} else {
	// 		setShowGallery(true)
	// 	}
	// 	// eslint-disable-next-line
	// }, [])

	useEffect(() => {
		const handleScroll = () => {
			const maxScrollDistance = 300 // 请根据您的需求设置最大滚动距离
			const scrollPercentage = Math.min(window.scrollY / maxScrollDistance, 1)
			setIsFixed(scrollPercentage)
		}

		window.addEventListener('scroll', handleScroll)

		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [])

	return (
		<div className='App'>
			<Header />
			{showLogin ? <LoginPanel /> : null}
			{showUser ? <UserPanel /> : null}
			<Welcome scrollPercentage={isFixed} />
			{showGallery ? <Gallery /> : null}
			{logInfo ? <Outlet /> : null}
		</div>
	)
}

export default App
