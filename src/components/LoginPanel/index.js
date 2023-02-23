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
		login({})
			.then()
			.catch()
			.finally(() => {
				//mock的数据,伪造登录态
				localStorage.setItem('userId', 'testId')
				window.location.reload(true)
			})
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
