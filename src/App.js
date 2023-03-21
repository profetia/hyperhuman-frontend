import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRecoilValue, useRecoilState } from 'recoil'
import './App.css'
import { Gallery } from './components/Gallery'
import { Header, logInfoAtom, showLoginAtom, showUserAtom } from './components/Header'
import { LoginPanel } from './components/LoginPanel'
import { UserPanel } from './components/UserPanel'
import { Welcome } from './components/Welcome'
import { getUserInfo, initNet } from './net'

function App() {
	const showLogin = useRecoilValue(showLoginAtom)
	const showUser = useRecoilValue(showUserAtom)
	const [logInfo, setLogInfo] = useRecoilState(logInfoAtom)
	const [showGallery, setShowGallery] = useState(false)
	const navi = useNavigate()
	const [isFixed, setIsFixed] = useState(false);

	useEffect(() => {
		//页面加载完成，检查缓存，设置各种状态的初始值
		//检查localstorage有没有登录凭证
		if (localStorage.getItem('user_uuid')) {
			getUserInfo({ user_uuid: localStorage.getItem('user_uuid') })
				.then((data) => {
					if (data.data.error) return Promise.reject(data.data.error)
					setLogInfo({ ...data.data.meta, token: localStorage.getItem('token') })
					initNet(localStorage.getItem('token'))

					if (localStorage.getItem('remember')) localStorage.clear()
				})
				.catch((err) => {
					localStorage.clear()
					setLogInfo(false)
				})
				.finally(() => {
					setShowGallery(true)
				})
		} else {
			setShowGallery(true)
		}
		// eslint-disable-next-line
	}, [])

	//路由守卫
	useEffect(() => {
		if (!logInfo && window.location.pathname !== '/') {
			navi('/', { replace: true })
		}
		// eslint-disable-next-line
	}, [logInfo])

	useEffect(() => {
		const handleScroll = () => {
			const maxScrollDistance = 300; // 请根据您的需求设置最大滚动距离
			const scrollPercentage = Math.min(window.scrollY / maxScrollDistance, 1);
			setIsFixed(scrollPercentage);
		};
	
		window.addEventListener("scroll", handleScroll);
	
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);
	

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
