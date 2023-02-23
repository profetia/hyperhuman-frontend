import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import './App.css'
import { Header, logInfoAtom, showLoginAtom, showUserAtom } from './components/Header'
import { LoginPanel } from './components/LoginPanel'
import { UserPanel } from './components/UserPanel'
import { Welcome } from './components/Welcome'
import { getUserInfo } from './net'

function App() {
	const showLogin = useRecoilValue(showLoginAtom)
	const showUser = useRecoilValue(showUserAtom)
	const setLogInfo = useSetRecoilState(logInfoAtom)

	useEffect(() => {
		//页面加载完成，检查缓存，设置各种状态的初始值
		//检查localstorage有没有登录凭证
		if (localStorage.getItem('userId')) {
			getUserInfo({ userId: localStorage.getItem('userId') })
				.then((data) => {
					setLogInfo(data.data)
				})
				.catch((err) => {
					localStorage.clear()
				})
		}
		// eslint-disable-next-line
	}, [])

	return (
		<div className='App'>
			<Header />
			{showLogin ? <LoginPanel /> : null}
			{showUser ? <UserPanel /> : null}
			<Welcome />
			<Outlet />
		</div>
	)
}

export default App
