import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from './net'

export default function Login() {

    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    const onLogin = async (e) => {
        e.preventDefault()
        if (!username) {
            setLoginError('Username is required')
            return
        }
        if (!password) {
            setLoginError('Password is required')
            return
        }
        
        setLoginError('')
        const response = await login({
            username,
            email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(username) ? username : undefined,
            password,
        })
        navigate('/')
    }

    return (
        <>
            <h1>Login</h1>
            <form style={{display: 'flex', flexDirection: 'column'}}
                onSubmit={onLogin}
            >
                <label htmlFor="username">Username</label>
                <input type="text" id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <label htmlFor="password">Password</label>
                <input type="password" id="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                {
                    loginError && <p style={{color: 'red'}}>{loginError}</p>
                }
            </form>
        </>
    )
}