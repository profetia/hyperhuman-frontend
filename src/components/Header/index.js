import style from './header.module.css'
import logo from '../../assets/deemos.png'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { logInfoAtom, showLoginAtom, showUserAtom } from './store'

function Header() {
	const logInfo = useRecoilValue(logInfoAtom)
	const setShowLogin = useSetRecoilState(showLoginAtom)
	const setShowUser = useSetRecoilState(showUserAtom)

	const handleAvatarClick = (ev) => {
		if (logInfo) setShowUser(true)
		else setShowLogin(true)
	}

	return (
		<header className={style.con}>
			<div className={style.header}>
				<div className={style.logoCon}>
					<img className={style.logo} src={logo} alt='deemos logo' />
					<div>HYPERHUMAN</div>
				</div>

				<div className={style.avatar} onPointerUp={handleAvatarClick}>
					{logInfo ? <img src={logInfo.avatar_url} alt='avatar' /> : <div>Login/Register</div>}
				</div>
			</div>
		</header>
	)
}

export { Header, logInfoAtom, showLoginAtom, showUserAtom }
