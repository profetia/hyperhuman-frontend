import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRecoilValue, useRecoilState } from 'recoil'
import './App.css'
import { Header, logInfoAtom, showLoginAtom, showUserAtom } from './components/Header'
import { LoginPanel } from './components/LoginPanel'
import { UserPanel } from './components/UserPanel'
import { Welcome } from './components/Welcome'
import { getUserInfo } from './net'

function App() {
	const showLogin = useRecoilValue(showLoginAtom)
	const showUser = useRecoilValue(showUserAtom)
	const [logInfo, setLogInfo] = useRecoilState(logInfoAtom)
	const navi = useNavigate()

	useEffect(() => {
		//页面加载完成，检查缓存，设置各种状态的初始值
		//检查localstorage有没有登录凭证
		if (localStorage.getItem('user_uuid')) {
			getUserInfo({ user_uuid: localStorage.getItem('user_uuid') })
				.then((data) => {
					if (data.data.error) return Promise.reject(data.data.error)
					setLogInfo(data.data.meta)
				})
				.catch((err) => {
					localStorage.clear()
					setLogInfo(false)
				})
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

	return (
		<div className='App'>
			<Header />
			{showLogin ? <LoginPanel /> : null}
			{showUser ? <UserPanel /> : null}
			<Welcome />
			{logInfo ? <Outlet /> : null}
		</div>
	)
}

export default App
