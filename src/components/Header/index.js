import style from './header.module.css'
import logo from '../../assets/deemos.png'
import walletIcon from '../../assets/wallet.png'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { logInfoAtom, showLoginAtom, showUserAtom } from './store'
import { AiOutlineUser } from 'react-icons/ai'
import { useEffect } from 'react'

function Header() {
	const logInfo = useRecoilValue(logInfoAtom)
	const setShowLogin = useSetRecoilState(showLoginAtom)
	const setShowUser = useSetRecoilState(showUserAtom)

	const handleAvatarClick = (ev) => {
		if (logInfo) setShowUser(true)
		else setShowLogin(true)
	}

	useEffect(() => {
		console.log(logInfo)
	}, [logInfo])

	return (
		<header className={style.con}>
			<div className={style.header}>
				<div className={style.logoCon}>
					<img className={style.logo} src={logo} alt='deemos logo' />
					<div>HYPERHUMAN</div>
				</div>
				<div className={style.spaceholder}></div>

				{logInfo ? (
					<div className={style.balance}>
						<img src={walletIcon} alt='wallet' />
						<div>{logInfo.balance}</div>
					</div>
				) : null}

				<div className={style.avatar} onPointerUp={handleAvatarClick}>
					{logInfo ? (
						<img src={logInfo.avatar_url} alt='avatar' />
					) : (
						<div>
							<AiOutlineUser size='1em' /> &nbsp; Login
						</div>
					)}
				</div>
			</div>
		</header>
	)
}

export { Header, logInfoAtom, showLoginAtom, showUserAtom }
