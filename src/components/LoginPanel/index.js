// import { useEffect } from 'react'
// import { redirect } from 'react-router-dom'
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { login, sendCode, signUp } from '../../net'
import { showLoginAtom } from '../Header'
import { CSSTransition } from 'react-transition-group'
import style from './login.module.css'

function LoginPanel() {
	const setShowLogin = useSetRecoilState(showLoginAtom)
	const [loginStage, setLoginStage] = useState(0)
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [code, setCode] = useState('')
	const [invitation, setInvitation] = useState('')
	const [isRemember, setIsRemember] = useState(true)
	const [tips, setTips] = useState('')
	const showLogin = useRecoilValue(showLoginAtom)

	const handleClose = (ev) => {
		setShowLogin(false)
	}

	const handleSwitch = (stage) => (ev) => {
		setTips('')
		setPassword('')
		setIsRemember(true)
		setLoginStage(stage)
	}

	const handleLogin = async (ev) => {
		setTips('')
		if (!username) {
			setTips('Enter username')
			return
		}

		if (!password) {
			setTips('Enter a password')
			return
		}
		//执行login
		try {
			const res = await login({
				password,
				...(username ? { username } : null),
			})

			if (res.data.error) {
				throw new Error(res.data.error)
			} else {
				localStorage.setItem('user_uuid', res.data.user_uuid)
				localStorage.setItem('token', res.data.token)
				if (!isRemember) localStorage.setItem('remember', 1)
				window.location.reload(true)
			}
		} catch (e) {
			handleSwitch(loginStage)()
			setTips(e.message)
		}
	}

	const handleSendCode = async (ev) => {
		setTips('')
		if (!email) {
			setTips('Enter a email')
			return
		}

		try {
			const res = await sendCode({ email })

			if (res.data.error) {
				throw new Error(res.data.error)
			} else {
				handleSwitch(2)()
			}
		} catch (e) {
			handleSwitch(loginStage)()
			setTips(e.message)
		}
	}

	const handleSignup = async (ev) => {
		setTips('')
		if (!username) {
			setTips('Enter a user name')
			return
		}

		if (!email) {
			setTips('Enter a email')
			return
		}

		if (!code) {
			setTips('Enter vetification code')
			return
		}

		if (!password) {
			setTips('Enter a password')
			return
		}

		try {
			const res = await signUp({
				username,
				email,
				password,
				email_verification_code: code,
				...(invitation ? { invitation_code: invitation } : null),
			})

			if (res.data.error) {
				throw new Error(res.data.error)
			} else {
				localStorage.setItem('user_uuid', res.data.user_uuid)
				localStorage.setItem('token', res.data.token)
				if (!isRemember) localStorage.setItem('remember', 1)
				window.location.reload(true)
			}
		} catch (e) {
			handleSwitch(loginStage)()
			setTips(e.message)
		}
	}

	const renderCSSTransition = (condition, children) => (
		<CSSTransition
			in={condition}
			timeout={300}
			classNames={{
				enter: style.fadeInFadeOutEnter,
				enterActive: style.fadeInFadeOutEnterActive,
				exit: style.fadeInFadeOutExit,
				exitActive: style.fadeInFadeOutExitActive,
			}}
			unmountOnExit
		>
			{children}
		</CSSTransition>
	)

	return (
		//Sidebar整体Transition动效代码不Work，不确定原因，需要进一步排查。
		<div className={style.con}>
			<div className={style.mask} onPointerDown={handleClose}></div>
			<CSSTransition
				in={showLogin}
				timeout={100}
				classNames={{
					enter: style.loginConTransitionEnter,
					enterActive: style.loginConTransitionEnterActive,
					exit: style.loginConTransitionExit,
					exitActive: style.loginConTransitionExitActive,
				}}
				unmountOnExit
			>

				<div className={style.loginCon}>
					<div className={style.title}>ChatAvatar</div>
					<>
						<div className={`${style.btn} ${style.google}`}>Sign in With Google</div>
						<div className={style.splitCon}>
							<div className={style.split}></div>
							<div className={style.text}>OR</div>
						</div>
					</>

					{renderCSSTransition(loginStage === 2, (
						<>
							<div className={style.label}>
								Username
							</div>
							<input
								className={style.ipt}
								placeholder='Enter username'
								value={username}
								onChange={(ev) => setUsername(ev.currentTarget.value)}
							/>
						</>
					))}

					{renderCSSTransition(loginStage === 0, (
						<>
							<div className={style.label}>
								Username or Email Address
							</div>
							<input
								className={style.ipt}
								placeholder='Enter username or email address'
								value={username}
								onChange={(ev) => setUsername(ev.currentTarget.value)}
							/>
						</>
					))}

					{renderCSSTransition(loginStage !== 1, (
						<>
							<div className={style.label}>Password</div>
							<input
								className={style.ipt}
								placeholder='Enter a password'
								type='password'
								value={password}
								onChange={(ev) => setPassword(ev.currentTarget.value)}
							/>
						</>
					))}

					{renderCSSTransition(loginStage === 2, (
						<>
							<div className={style.label}>Vetification Code</div>
							<input
								className={style.ipt}
								placeholder='Enter vetification code'
								value={code}
								onChange={(ev) => setCode(ev.currentTarget.value)}
							/>
						</>
					))}

					{renderCSSTransition(loginStage === 2, (
						<>
							<div className={style.label}>Invitation Code(optional)</div>
							<input
								className={style.ipt}
								placeholder='Enter invitation code'
								value={invitation}
								onChange={(ev) => setInvitation(ev.currentTarget.value)}
							/>
						</>
					))}

					{renderCSSTransition(loginStage === 1, (
						<>
							<div className={style.label}>Email</div>
							<input
								className={style.ipt}
								placeholder='Enter email'
								value={email}
								onChange={(ev) => setEmail(ev.currentTarget.value)}
							/>
						</>
					))}

					{loginStage !== 1 ? (
						<div className={style.remCon}>
							<input
								type='checkbox'
								checked={isRemember}
								onPointerDown={(ev) => setIsRemember(!isRemember)}
							/>
							<span onPointerDown={(ev) => setIsRemember(!isRemember)}>Remember me</span>
							<span className={style.spaceholder}></span>
							<span>Forget password?</span>
						</div>
					) : null}

					{loginStage === 0 ? (
						<div className={`${style.btn} ${style.sign}`} onPointerDown={handleLogin}>
							Sign In
						</div>
					) : null}

					{loginStage === 1 ? (
						<div className={`${style.btn} ${style.sign}`} onPointerDown={handleSendCode}>
							Send Code
						</div>
					) : null}

					{loginStage === 2 ? (
						<div className={`${style.btn} ${style.sign}`} onPointerDown={handleSignup}>
							Sign Up
						</div>
					) : null}

					{tips ? <div className={style.tips}>{tips}</div> : null}

					<div className={style.spaceholder}></div>

					{renderCSSTransition(loginStage === 0, (
						<div className={style.foot}>
							<span onPointerDown={handleSwitch(1)} style={{ fontWeight: 'bold' }}>
								Sign Up
							</span>{' '}
							to create a new account!
						</div>
					))}


					{renderCSSTransition(loginStage !== 0, (
						<div className={style.foot}>
							Already have an account?{' '}
							<span onPointerDown={handleSwitch(0)} style={{ fontWeight: 'bold' }}>
								Sign In!
							</span>
						</div>
					))}
				</div>
			</CSSTransition>
		</div>
	)
}

export { LoginPanel }
