// import { useEffect } from 'react'
// import { redirect } from 'react-router-dom'
import { useSetRecoilState } from 'recoil'
import { login } from '../../net'
import { showLoginAtom } from '../Header'
import style from './login.module.css'

function LoginPanel() {
	const setShowLogin = useSetRecoilState(showLoginAtom)

	const handleClose = (ev) => {
		setShowLogin(false)
	}
	const handleLogin = async (ev) => {
		//执行login
		login({
			username: 'test',
			password: '12345678',
		})
			.then((data) => {
				// setLogInfo(data.data)
				localStorage.setItem('user_uuid', data.data.user_uuid)
				localStorage.setItem('token', data.data.token)
				window.location.reload(true)
				// handleClose()
			})
			.catch()
		// .finally(() => {
		// 	//mock的数据,伪造登录态
		// 	localStorage.setItem(
		// 		'userId',
		// 		'eyJhbGciOiJIUzI1NiJ9.NiAxMw.qOWdZFc1SElqsq9f0OknBlmdTXh4GMkKSV7wzaUQhhc'
		// 	)
		// 	window.location.reload(true)
		// })
	}

	return (
		<div className={style.con}>
			<div className={style.close} onPointerDown={handleClose}>
				X
			</div>
			<h1 onPointerDown={handleLogin}>Login</h1>
		</div>
	)
}

export { LoginPanel }