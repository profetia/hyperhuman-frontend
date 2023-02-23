import { useSetRecoilState } from 'recoil'
import { showUserAtom } from '../Header'

function UserPanel() {
	const setShowUser = useSetRecoilState(showUserAtom)
	const handleClose = (ev) => setShowUser(false)
	return <h1 onPointerDown={handleClose}>UserPanel</h1>
}

export { UserPanel }
